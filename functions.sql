-- TimescaleDB Exchange Application Functions and Triggers
-- Update timestamp trigger for tables that need updated_at management

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the updated_at trigger to relevant tables
CREATE TRIGGER set_updated_at_users
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at();

CREATE TRIGGER set_updated_at_instruments
BEFORE UPDATE ON instruments
FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at();

CREATE TRIGGER set_updated_at_orders
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at();

CREATE TRIGGER set_updated_at_balances
BEFORE UPDATE ON balances
FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at();

-- Function to place a limit order
CREATE OR REPLACE FUNCTION place_limit_order(
    p_user_id INTEGER,
    p_instrument_id INTEGER,
    p_side order_side,
    p_price NUMERIC(30, 15),
    p_quantity NUMERIC(30, 15)
) RETURNS INTEGER AS $$
DECLARE
    v_order_id INTEGER;
    v_balance NUMERIC(30, 15);
    v_instrument_symbol VARCHAR(20);
BEGIN
    -- Get the instrument symbol for reference
    SELECT symbol INTO v_instrument_symbol FROM instruments 
    WHERE instrument_id = p_instrument_id;
    
    -- Check user balance for this order
    IF p_side = 'buy' THEN
        -- For buy orders, check if user has enough balance in the quote currency
        -- This is simplified - in a real system you'd check against the quote currency
        SELECT amount INTO v_balance FROM balances 
        WHERE user_id = p_user_id AND instrument_id = p_instrument_id;
        
        IF v_balance < (p_price * p_quantity) THEN
            RAISE EXCEPTION 'Insufficient balance for buy order in %', v_instrument_symbol;
        END IF;
        
        -- Place hold on the funds
        UPDATE balances 
        SET hold_amount = hold_amount + (p_price * p_quantity),
            amount = amount - (p_price * p_quantity)
        WHERE user_id = p_user_id AND instrument_id = p_instrument_id;
    ELSE
        -- For sell orders, check if user has enough of the instrument
        SELECT amount INTO v_balance FROM balances 
        WHERE user_id = p_user_id AND instrument_id = p_instrument_id;
        
        IF v_balance < p_quantity THEN
            RAISE EXCEPTION 'Insufficient balance for sell order in %', v_instrument_symbol;
        END IF;
        
        -- Place hold on the asset
        UPDATE balances
        SET hold_amount = hold_amount + p_quantity,
            amount = amount - p_quantity
        WHERE user_id = p_user_id AND instrument_id = p_instrument_id;
    END IF;
    
    -- Insert the order
    INSERT INTO orders (
        user_id, 
        instrument_id,
        order_type,
        side,
        price,
        quantity,
        status,
        created_at
    ) VALUES (
        p_user_id,
        p_instrument_id,
        'limit',
        p_side,
        p_price,
        p_quantity,
        'open',
        NOW()
    ) RETURNING order_id INTO v_order_id;
    
    -- In a real system, this function would also trigger order matching
    -- and potentially execute trades if there are matching orders
    
    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

-- Function to cancel an order
CREATE OR REPLACE FUNCTION cancel_order(
    p_order_id INTEGER,
    p_user_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_order RECORD;
BEGIN
    -- Get the order details
    SELECT * INTO v_order FROM orders WHERE order_id = p_order_id AND user_id = p_user_id;
    
    -- Check if order exists and belongs to user
    IF v_order IS NULL THEN
        RAISE EXCEPTION 'Order not found or does not belong to user';
    END IF;
    
    -- Check if order can be cancelled
    IF v_order.status NOT IN ('open', 'pending') THEN
        RAISE EXCEPTION 'Cannot cancel order with status %', v_order.status;
    END IF;
    
    -- Calculate unfilled quantity
    DECLARE
        v_unfilled NUMERIC(30, 15) := v_order.quantity - v_order.filled_quantity;
    BEGIN
        -- Update order status
        UPDATE orders 
        SET status = 'cancelled', 
            updated_at = NOW()
        WHERE order_id = p_order_id;
        
        -- Release held funds or assets
        IF v_order.side = 'buy' THEN
            -- Release held quote currency (price * unfilled quantity)
            UPDATE balances
            SET hold_amount = hold_amount - (v_order.price * v_unfilled),
                amount = amount + (v_order.price * v_unfilled)
            WHERE user_id = p_user_id AND instrument_id = v_order.instrument_id;
        ELSE
            -- Release held base currency
            UPDATE balances
            SET hold_amount = hold_amount - v_unfilled,
                amount = amount + v_unfilled
            WHERE user_id = p_user_id AND instrument_id = v_order.instrument_id;
        END IF;
    END;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to generate OHLCV candles from trade data
CREATE OR REPLACE FUNCTION generate_candles(
    p_instrument_id INTEGER,
    p_interval VARCHAR,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ
) RETURNS VOID AS $$
DECLARE
    v_bucket_interval INTERVAL;
BEGIN
    -- Convert string interval to INTERVAL type
    CASE p_interval
        WHEN '1m' THEN v_bucket_interval := INTERVAL '1 minute';
        WHEN '5m' THEN v_bucket_interval := INTERVAL '5 minutes';
        WHEN '15m' THEN v_bucket_interval := INTERVAL '15 minutes';
        WHEN '1h' THEN v_bucket_interval := INTERVAL '1 hour';
        WHEN '4h' THEN v_bucket_interval := INTERVAL '4 hours';
        WHEN '1d' THEN v_bucket_interval := INTERVAL '1 day';
        ELSE RAISE EXCEPTION 'Unsupported interval: %', p_interval;
    END CASE;

    -- Insert or replace candles for the given period
    INSERT INTO candles (instrument_id, time, interval, open, high, low, close, volume, trades_count)
    SELECT 
        instrument_id,
        time_bucket(v_bucket_interval, executed_at) AS time,
        p_interval AS interval,
        FIRST(price, executed_at) AS open,
        MAX(price) AS high,
        MIN(price) AS low,
        LAST(price, executed_at) AS close,
        SUM(quantity) AS volume,
        COUNT(*) AS trades_count
    FROM trades
    WHERE instrument_id = p_instrument_id
      AND executed_at >= p_start_time 
      AND executed_at < p_end_time
    GROUP BY instrument_id, time
    ON CONFLICT (instrument_id, time, interval) DO UPDATE SET
        open = EXCLUDED.open,
        high = EXCLUDED.high,
        low = EXCLUDED.low,
        close = EXCLUDED.close,
        volume = EXCLUDED.volume,
        trades_count = EXCLUDED.trades_count;
END;
$$ LANGUAGE plpgsql;

-- Function to execute a trade between two orders
CREATE OR REPLACE FUNCTION execute_trade(
    p_taker_order_id INTEGER,
    p_maker_order_id INTEGER,
    p_price NUMERIC(30, 15),
    p_quantity NUMERIC(30, 15),
    p_fee_percentage NUMERIC(5, 4) DEFAULT 0.001 -- 0.1% default fee
) RETURNS INTEGER AS $$
DECLARE
    v_taker_order RECORD;
    v_maker_order RECORD;
    v_trade_id INTEGER;
    v_fee_amount NUMERIC(30, 15);
BEGIN
    -- Get order details
    SELECT * INTO v_taker_order FROM orders WHERE order_id = p_taker_order_id;
    SELECT * INTO v_maker_order FROM orders WHERE order_id = p_maker_order_id;
    
    -- Validate orders
    IF v_taker_order IS NULL OR v_maker_order IS NULL THEN
        RAISE EXCEPTION 'One or both orders not found';
    END IF;
    
    IF v_taker_order.side = v_maker_order.side THEN
        RAISE EXCEPTION 'Cannot match orders with the same side';
    END IF;
    
    -- Calculate fee (simplified - in reality, fee logic would be more complex)
    v_fee_amount := p_price * p_quantity * p_fee_percentage;
    
    -- Record the trade
    INSERT INTO trades (
        order_id, 
        instrument_id,
        price,
        quantity,
        side,
        executed_at,
        taker_user_id,
        maker_user_id,
        maker_order_id,
        fee_amount,
        fee_currency
    ) VALUES (
        p_taker_order_id,
        v_taker_order.instrument_id,
        p_price,
        p_quantity,
        v_taker_order.side,
        NOW(),
        v_taker_order.user_id,
        v_maker_order.user_id,
        p_maker_order_id,
        v_fee_amount,
        v_taker_order.instrument_id -- Simplified, assuming fee in same instrument
    ) RETURNING trade_id INTO v_trade_id;
    
    -- Update filled quantity on both orders
    UPDATE orders 
    SET filled_quantity = filled_quantity + p_quantity,
        status = CASE 
            WHEN filled_quantity + p_quantity >= quantity THEN 'filled'::order_status 
            ELSE 'partially_filled'::order_status 
        END,
        updated_at = NOW()
    WHERE order_id IN (p_taker_order_id, p_maker_order_id);
    
    -- Update balances (simplified - real implementation would be more complex)
    -- This would involve releasing held amounts and updating actual balances
    
    RETURN v_trade_id;
END;
$$ LANGUAGE plpgsql;
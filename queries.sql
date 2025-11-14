-- TimescaleDB Exchange Application Sample Queries
-- Query 1: Get OHLCV data for a specific instrument and time range
SELECT time, open, high, low, close, volume 
FROM candles
WHERE instrument_id = 1 -- Assuming BTC/USD has id 1
  AND interval = '1h'
  AND time >= NOW() - INTERVAL '7 days'
ORDER BY time DESC;

-- Query 2: Get user's open orders
SELECT o.order_id, i.symbol, o.side, o.price, o.quantity, 
       o.filled_quantity, o.status, o.created_at
FROM orders o
JOIN instruments i ON o.instrument_id = i.instrument_id
WHERE o.user_id = 1 -- Assuming user id 1
  AND o.status IN ('open', 'partially_filled')
ORDER BY o.created_at DESC;

-- Query 3: Get user's trade history by instrument
SELECT t.trade_id, i.symbol, t.price, t.quantity, t.side, 
       t.executed_at, t.fee_amount
FROM trades t
JOIN instruments i ON t.instrument_id = i.instrument_id
WHERE (t.taker_user_id = 1 OR t.maker_user_id = 1) -- Assuming user id 1
  AND t.instrument_id = 2 -- Assuming ETH/USD has id 2
ORDER BY t.executed_at DESC
LIMIT 100;

-- Query 4: Get order book snapshot for a specific instrument
SELECT 
    time_bucket('1 second', time) AS bucket_time,
    last(bid_price, time) AS bid_price,
    last(bid_quantity, time) AS bid_quantity,
    last(ask_price, time) AS ask_price,
    last(ask_quantity, time) AS ask_quantity
FROM orderbook_snapshots
WHERE instrument_id = 1 -- Assuming BTC/USD
  AND level = 1 -- Top of book
  AND time >= NOW() - INTERVAL '1 hour'
GROUP BY bucket_time
ORDER BY bucket_time DESC
LIMIT 60;

-- Query 5: Calculate moving average price over time with different window sizes
SELECT 
    time_bucket('5 minutes', executed_at) AS bucket,
    AVG(price) AS avg_price,
    AVG(price) OVER (
        ORDER BY time_bucket('5 minutes', executed_at) 
        ROWS BETWEEN 11 PRECEDING AND CURRENT ROW
    ) AS ma_1hour,
    AVG(price) OVER (
        ORDER BY time_bucket('5 minutes', executed_at) 
        ROWS BETWEEN 71 PRECEDING AND CURRENT ROW
    ) AS ma_6hour
FROM trades
WHERE instrument_id = 1 -- Assuming BTC/USD
  AND executed_at >= NOW() - INTERVAL '24 hours'
GROUP BY bucket
ORDER BY bucket DESC;

-- Query 6: Get daily volume by instrument over the past month
SELECT 
    time_bucket('1 day', executed_at) AS day,
    instrument_id,
    SUM(quantity * price) AS volume_usd
FROM trades
WHERE executed_at >= NOW() - INTERVAL '30 days'
GROUP BY day, instrument_id
ORDER BY day DESC, volume_usd DESC;

-- Query 7: Find price volatility (high/low range as percentage) by day
SELECT 
    time_bucket('1 day', time) AS day,
    instrument_id,
    ((MAX(high) - MIN(low)) / AVG(close)) * 100 AS volatility_percent
FROM candles
WHERE interval = '1h'
  AND time >= NOW() - INTERVAL '30 days'
GROUP BY day, instrument_id
ORDER BY day DESC, volatility_percent DESC;

-- Query 8: Get all user balances with instrument details
SELECT u.username, i.symbol, b.amount, b.hold_amount, b.updated_at
FROM balances b
JOIN users u ON b.user_id = u.user_id
JOIN instruments i ON b.instrument_id = i.instrument_id
WHERE b.amount > 0 OR b.hold_amount > 0
ORDER BY u.username, i.symbol;

-- Query 9: Trading volume by hour of day (to find high activity periods)
SELECT 
    EXTRACT(HOUR FROM executed_at) AS hour_of_day,
    SUM(price * quantity) AS trading_volume
FROM trades
WHERE executed_at >= NOW() - INTERVAL '30 days'
GROUP BY hour_of_day
ORDER BY trading_volume DESC;

-- Query 10: Continuous aggregate for efficient analytics on large datasets
-- First create the continuous aggregate view
CREATE MATERIALIZED VIEW hourly_price_data
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', executed_at) AS bucket,
    instrument_id,
    FIRST(price, executed_at) AS open,
    MAX(price) AS high,
    MIN(price) AS low,
    LAST(price, executed_at) AS close,
    SUM(quantity) AS volume
FROM trades
GROUP BY bucket, instrument_id;

-- Select from the continuous aggregate for better performance
SELECT 
    bucket,
    instrument_id,
    open,
    high,
    low, 
    close,
    volume
FROM hourly_price_data
WHERE instrument_id = 1
  AND bucket >= NOW() - INTERVAL '7 days'
ORDER BY bucket DESC;

-- Query 11: Calculate realized profit/loss for completed trades
WITH buy_trades AS (
    SELECT 
        taker_user_id AS user_id,
        instrument_id,
        SUM(quantity) AS buy_quantity,
        SUM(price * quantity) AS buy_cost
    FROM trades
    WHERE side = 'buy'
      AND executed_at >= NOW() - INTERVAL '30 days'
      AND taker_user_id = 1
    GROUP BY taker_user_id, instrument_id
),
sell_trades AS (
    SELECT 
        taker_user_id AS user_id,
        instrument_id,
        SUM(quantity) AS sell_quantity,
        SUM(price * quantity) AS sell_revenue
    FROM trades
    WHERE side = 'sell'
      AND executed_at >= NOW() - INTERVAL '30 days'
      AND taker_user_id = 1
    GROUP BY taker_user_id, instrument_id
)
SELECT 
    i.symbol,
    COALESCE(b.buy_quantity, 0) AS buy_quantity,
    COALESCE(s.sell_quantity, 0) AS sell_quantity,
    COALESCE(b.buy_cost, 0) AS buy_cost,
    COALESCE(s.sell_revenue, 0) AS sell_revenue,
    COALESCE(s.sell_revenue, 0) - COALESCE(b.buy_cost, 0) AS realized_pnl
FROM instruments i
LEFT JOIN buy_trades b ON i.instrument_id = b.instrument_id
LEFT JOIN sell_trades s ON i.instrument_id = s.instrument_id
WHERE COALESCE(b.buy_quantity, 0) > 0 OR COALESCE(s.sell_quantity, 0) > 0
ORDER BY realized_pnl DESC;
-- TimescaleDB Exchange Application Schema
-- Enable TimescaleDB extension

CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- User accounts
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(256) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'active'
);

-- Assets/instruments that can be traded
CREATE TABLE instruments (
    instrument_id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL, -- e.g., 'stock', 'crypto', 'forex'
    decimals INTEGER NOT NULL, -- precision for price/quantity
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User balances for each asset
CREATE TABLE balances (
    balance_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    instrument_id INTEGER NOT NULL REFERENCES instruments(instrument_id),
    amount NUMERIC(30, 15) NOT NULL DEFAULT 0,
    hold_amount NUMERIC(30, 15) NOT NULL DEFAULT 0, -- amount on hold for open orders
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, instrument_id)
);

-- Order types and statuses
CREATE TYPE order_type AS ENUM ('market', 'limit', 'stop', 'stop_limit');
CREATE TYPE order_side AS ENUM ('buy', 'sell');
CREATE TYPE order_status AS ENUM ('pending', 'open', 'filled', 'partially_filled', 'cancelled', 'rejected');

-- Orders table
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    instrument_id INTEGER NOT NULL REFERENCES instruments(instrument_id),
    order_type order_type NOT NULL,
    side order_side NOT NULL,
    price NUMERIC(30, 15) NULL, -- NULL for market orders
    quantity NUMERIC(30, 15) NOT NULL,
    filled_quantity NUMERIC(30, 15) DEFAULT 0,
    status order_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NULL -- for orders with time limits
);

-- Trades/executions (hypertable with time partitioning)
CREATE TABLE trades (
    trade_id SERIAL,
    order_id INTEGER NOT NULL REFERENCES orders(order_id),
    instrument_id INTEGER NOT NULL REFERENCES instruments(instrument_id),
    price NUMERIC(30, 15) NOT NULL,
    quantity NUMERIC(30, 15) NOT NULL,
    side order_side NOT NULL,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    taker_user_id INTEGER NOT NULL REFERENCES users(user_id),
    maker_user_id INTEGER NOT NULL REFERENCES users(user_id),
    maker_order_id INTEGER NOT NULL REFERENCES orders(order_id),
    fee_amount NUMERIC(30, 15) NOT NULL DEFAULT 0,
    fee_currency INTEGER NOT NULL REFERENCES instruments(instrument_id)
);

-- Convert trades to a hypertable
SELECT create_hypertable('trades', 'executed_at', 
                        chunk_time_interval => INTERVAL '1 day');

-- OHLCV candle data (hypertable with time partitioning)
CREATE TABLE candles (
    instrument_id INTEGER NOT NULL REFERENCES instruments(instrument_id),
    time TIMESTAMPTZ NOT NULL,
    interval VARCHAR(10) NOT NULL, -- '1m', '5m', '1h', '1d', etc.
    open NUMERIC(30, 15) NOT NULL,
    high NUMERIC(30, 15) NOT NULL,
    low NUMERIC(30, 15) NOT NULL,
    close NUMERIC(30, 15) NOT NULL,
    volume NUMERIC(30, 15) NOT NULL,
    trades_count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (instrument_id, time, interval)
);

-- Convert candles to a hypertable
SELECT create_hypertable('candles', 'time',
                        chunk_time_interval => INTERVAL '1 day');

-- Order book snapshots (hypertable with time partitioning)
CREATE TABLE orderbook_snapshots (
    instrument_id INTEGER NOT NULL REFERENCES instruments(instrument_id),
    time TIMESTAMPTZ NOT NULL,
    level INTEGER NOT NULL, -- depth level from mid price
    bid_price NUMERIC(30, 15) NULL,
    bid_quantity NUMERIC(30, 15) NULL,
    ask_price NUMERIC(30, 15) NULL,
    ask_quantity NUMERIC(30, 15) NULL
);

-- Convert orderbook_snapshots to a hypertable
SELECT create_hypertable('orderbook_snapshots', 'time',
                        chunk_time_interval => INTERVAL '1 hour');

-- User fund transactions (deposits/withdrawals)
CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'fee', 'adjustment');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'canceled');

CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    instrument_id INTEGER NOT NULL REFERENCES instruments(instrument_id),
    amount NUMERIC(30, 15) NOT NULL,
    type transaction_type NOT NULL,
    status transaction_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ NULL,
    external_reference VARCHAR(256) NULL, -- e.g., blockchain tx id
    notes TEXT NULL
);

-- Create necessary indexes for performance
-- Time-series based indexes
CREATE INDEX ON trades (instrument_id, executed_at DESC);
CREATE INDEX ON candles (instrument_id, time DESC);
CREATE INDEX ON orderbook_snapshots (instrument_id, time DESC);

-- Order indexes for quick lookup
CREATE INDEX ON orders (user_id, status, created_at DESC);
CREATE INDEX ON orders (instrument_id, status, created_at DESC);

-- Add user account indexes
CREATE INDEX ON users (email);
CREATE INDEX ON users (username);

-- Add balance indexes
CREATE INDEX ON balances (user_id);
CREATE INDEX ON balances (instrument_id);
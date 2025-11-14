import { Router } from "express";
import { RedisManager } from "../RedisManager";
import { Client } from "pg";

const pgClient = new Client({
  user: "your_user",
  host: "localhost",
  database: "my_database",
  password: "your_password",
  port: 55432,
});

pgClient.connect();

export const klineRouter = Router();

klineRouter.get("/", async (req, res) => {
  const { market, interval, startTime, endTime } = req.query;

  let query;
  switch (interval) {
    case "1m":
      query = `SELECT * FROM klines_1m WHERE bucket >= $1 AND bucket <= $2`;
      break;
    case "1h":
      query = `SELECT * FROM klines_1h WHERE bucket >= $1 AND bucket <= $2`;
      break;
    case "1w":
      query = `SELECT * FROM klines_1w WHERE bucket >= $1 AND bucket <= $2`;
      break;
    default:
      return res.status(400).send("Invalid interval");
  }

  try {
    const result = await pgClient.query(query, [
      new Date(Number(startTime) * 1000),
      new Date(Number(startTime) * 1000),
    ]);
    res.json(
      result.rows.map((row) => ({
        close: row.close,
        high: row.high,
        low: row.low,
        open: row.open,
        volume: row.volume,
        quoteVolumes: row.quoteVolume,
        end: row.bucket,
        start: row.start,
        trades: row.trades,
      }))
    );
  } catch (e) {
    console.log(e);
    res.status(500).send("Internal Server Error");
  }
});

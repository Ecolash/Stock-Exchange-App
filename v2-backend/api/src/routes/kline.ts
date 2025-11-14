import { Client } from "pg";
import { Router } from "express";
import { RedisManager } from "../RedisManager";

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
  console.log({ market, interval, startTime, endTime });

  let query;
  switch (interval) {
    case "1m":
      query = `SELECT * FROM klines_1m WHERE bucket >= $1 AND bucket <= $2`;
      break;
    case "1h":
      query = `SELECT * FROM klines_1m WHERE  bucket >= $1 AND bucket <= $2`;
      break;
    case "1w":
      query = `SELECT * FROM klines_1w WHERE bucket >= $1 AND bucket <= $2`;
      break;
    default:
      return res.status(400).send("Invalid interval");
  }

  try {
    //@ts-ignore
    // if (typeof startTime === "number" && typeof endTime === "number") {
    //   const startDate = new Date(startTime * 1000); // valid number to Date
    //   const endDate = new Date(endTime * 1000);
    //   // use startDate and endDate here
    // } else {
    //   // handle undefined or invalid input
    //   throw new Error("startTime or endTime is missing or invalid");
    // }

    const result = await pgClient.query(query, [
      new Date(Number(startTime) * 1000),
      new Date(Number(endTime) * 1000),
    ]);
    console.log(result.rows);
    res.json(
      result.rows.map((x) => ({
        close: x.close,
        end: x.bucket,
        high: x.high,
        low: x.low,
        open: x.open,
        quoteVolume: x.quoteVolume,
        start: x.start,
        trades: x.trades,
        volume: x.volume,
      }))
    );
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

import { Router } from "express";
import { RedisManager } from "../RedisManager";
import { GET_TICKERS } from "../types";

export const tickersRouter = Router();

tickersRouter.get("/", async (req, res) => {
  const response = await RedisManager.getInstance().sendAndAwait({
    type: GET_TICKERS,
  });
  res.json(response.payload);
});

import { Router } from "express";
import { CREATE_ORDER, CANCEL_ORDER, ON_RAMP, GET_OPEN_ORDERS } from "../types";
import { RedisManager } from "../RedisManager";

export const orderRouter = Router();

orderRouter.post("/", async (req, res) => {
  const { market, price, quantity, side, userId } = req.body;
  const response = await RedisManager.getInstance().sendAndAwait({
    type: CREATE_ORDER,
    payload: {
      market,
      price,
      quantity,
      side,
      userId,
    },
  });
  res.json(response.payload);
});

orderRouter.delete("/", async (req, res) => {
  const { orderId, market } = req.body;

  const response = await RedisManager.getInstance().sendAndAwait({
    type: CANCEL_ORDER,
    payload: {
      orderId,
      market,
    },
  });
  res.json(response.payload);
});

orderRouter.get("/open", async (req, res) => {
  const response = await RedisManager.getInstance().sendAndAwait({
    type: GET_OPEN_ORDERS,
    payload: {
      userId: (req.query.userId as string) || "",
      market: (req.query.market as string) || "",
    },
  });
  res.json(response.payload);
});

import { ORDER_UPDATE, TRADE_ADDED } from "../types";
import {
  MessageFromApi,
  GET_DEPTH,
  GET_OPEN_ORDERS,
  ON_RAMP,
  CREATE_ORDER,
  CANCEL_ORDER,
} from "../types/fromAPI";
import { Orderbook } from "./OrderBook";
import fs from "fs";
import { RedisManager } from "../RedisManager";

// BTC: { available: 1.5, locked: 0.3 }
interface UserBalance {
  [key: string]: {
    available: number;
    locked: number;
  };
}

export class Engine {
  private balances: Map<string, UserBalance> = new Map();
  private orderbooks: Orderbook[] = [];

  constructor() {
    let snapshot = null;
    try {
      if (process.env.WITH_SNAPSHOT) {
        snapshot = fs.readFileSync("./snapshot.json");
      }
    } catch (e) {
      console.log("No snapshot found");
    }

    if (snapshot) {
      const parsedSnapshot = JSON.parse(snapshot.toString());
      this.balances = new Map(parsedSnapshot.balances);
      this.orderbooks = parsedSnapshot.orderbooks.map((x: any) => {
        new Orderbook(
          x.baseAsset,
          x.bids,
          x.asks,
          x.lastTradeId,
          x.currentPrice
        );
      });
    } else {
      this.orderbooks = [new Orderbook("BTC", [], [], 0, 0)];
      this.setBaseBalances();
    }
    setInterval(() => {
      this.saveSnapshot();
    }, 1000 * 3);
  }

  saveSnapshot() {
    const snapshot = {
      balances: Array.from(this.balances.entries()),
      orderbooks: this.orderbooks.map((x) => x.getSnapshot()),
    };
    fs.writeFileSync("./snapshot.json", JSON.stringify(snapshot));
  }
  processMessage({
    message,
    clientId,
  }: {
    message: MessageFromApi;
    clientId: string;
  }) {
    switch (message.type) {
      case CREATE_ORDER:
        try {
          const { executedQty, fills, orderId } = this.createOrder(
            message,
            clientId
          );
          RedisManager.getInstance().sendToApi(clientId, {
            type: "ORDER_PLACED",
            payload: {
              orderId,
              executedQty,
              fills,
            },
          });
        } catch (e) {
          console.log(e);
          RedisManager.getInstance().sendToApi(clientId, {
            type: "ORDER_CANCELLED",
            payload: {
              orderId: "",
              executedQty: 0,
              remainingQty: 0,
            },
          });
        }
        break;
      case CANCEL_ORDER:
        try {
          const orderId = message.payload.orderId;
          const cancelmarket = message.payload.market;
          const cancelorderbook = this.orderbooks.find(
            (x) => x.ticker() === cancelmarket
          );
          if (!cancelorderbook) {
            throw new Error("Orderbook not found");
          }
          const quoteAsset = cancelmarket.split("_")[1];

          const order =
            cancelorderbook.asks.find((x) => x.orderId === orderId) ||
            cancelorderbook.bids.find((x) => x.orderId === orderId);
          if (!order) {
            throw new Error("Order not found");
          }
          if (order.side === "buy") {
            const price = order.price;
            const leftover = order.quantity - order.filled;
            const rmn_price = price * leftover;
            //@ts-ignore
            this.balances.get(order.userId)["USDC"].available += rmn_price;
            //@ts-ignore
            this.balances.get(order.userId)["USDC"].locked -= rmn_price;
            if (price) {
              this.sendUpdatedDepthAt(price, cancelmarket);
            }
          } else {
            const price = order.price;
            const leftover = order.quantity - order.filled;
            const rmn_price = price * leftover;
            //@ts-ignore
            this.balances.get(order.userId)["BTC"].available += rmn_price;
            //@ts-ignore
            this.balances.get(order.userId)["BTC"].locked -= rmn_price;
            if (price) {
              this.sendUpdatedDepthAt(price, cancelmarket);
            }
          }

          RedisManager.getInstance().sendToApi(clientId, {
            type: "ORDER_CANCELLED",
            payload: {
              orderId,
              executedQty: 0,
              remainingQty: 0,
            },
          });
        } catch (e) {
          console.log("Error cancelling order");
          console.log(e);
        }
        break;
      case GET_OPEN_ORDERS:
        try {
          const market = message.payload.market;
          const openorderbook = this.orderbooks.find(
            (x) => x.ticker() === market
          );
          if (!openorderbook) {
            throw new Error("Orderbook not found");
          }

          const openorders = this.getOpenOrders(message.payload.userId);

          RedisManager.getInstance().sendToApi(clientId, {
            type: "OPEN_ORDERS",
            payload: openorders,
          });
        } catch (e) {
          console.log("Error getting open orders");
          console.log(e);
        }
        break;
      case ON_RAMP:
        const userId = message.payload.userId;
        const amount = Number(message.payload.amount);
        this.onRamp(userId, amount);
        break;
      case GET_DEPTH:
        try {
          const market = message.payload.market;
          const orderbook = this.orderbooks.find((x) => x.ticker() === market);
          if (!orderbook) {
            throw new Error("Orderbook not found");
          }
          RedisManager.getInstance().sendToApi(clientId, {
            type: "DEPTH",
            payload: orderbook.getDepth(),
          });
        } catch (e) {
          console.log(e);
          RedisManager.getInstance().sendToApi(clientId, {
            type: "DEPTH",
            payload: {
              bids: [],
              asks: [],
            },
          });
        }
        break;
    }
  }

  setBaseBalances() {
    this.balances.set("1", {
      ["USDC"]: {
        available: 10000000,
        locked: 0,
      },
      TATA: {
        available: 10000000,
        locked: 0,
      },
    });

    this.balances.set("2", {
      ["USDC"]: {
        available: 10000000,
        locked: 0,
      },
      TATA: {
        available: 10000000,
        locked: 0,
      },
    });

    this.balances.set("5", {
      ["USDC"]: {
        available: 10000000,
        locked: 0,
      },
      TATA: {
        available: 10000000,
        locked: 0,
      },
    });
  }
}

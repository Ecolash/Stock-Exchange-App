import { Order } from "../trade/OrderBook";

export type MessageToApi =
  | {
      type: "DEPTH";
      payload: {
        bids: [string, string][];
        asks: [string, string][];
      };
    }
  | {
      type: "ORDER_PLACED";
      payload: {
        orderId: string;
        executedQty: number;
        fills: {
          price: number;
          qty: number;
          tradeId: number;
        }[];
      };
    }
  | {
      type: "ORDER_CANCELLED";
      payload: {
        orderId: string;
        executedQty: number;
        remainingQty: number;
      };
    }
  | {
      type: "OPEN_ORDERS";
      payload: Order[];
    };

export const TRADE_ADDED = "TRADE_ADDED";
export const ORDER_UPDATE = "ORDER_UPDATE";

export type DbMessage =
  | {
      type: typeof TRADE_ADDED;
      payload: {
        id: string;
        isBuyerMaker: boolean;
        price: string;
        quantity: string;
        quoteQuantity: string;
        timestamp: number;
        market: string;
      };
    }
  | {
      type: typeof ORDER_UPDATE;
      payload: {
        orderId: string;
        executedQty: number;
        market: string;
        price: string;
        quantity: string;
        side: "buy" | "sell";
      };
    };

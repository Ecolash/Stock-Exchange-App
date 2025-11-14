import {
  CREATE_ORDER,
  CANCEL_ORDER,
  GET_DEPTH,
  GET_OPEN_ORDERS,
  ON_RAMP,
} from ".";

export type MessageToEngine =
  | {
      type: typeof CREATE_ORDER;
      payload: {
        market: string;
        price: string;
        quantity: string;
        side: "buy" | "sell";
        userId: string;
      };
    }
  | {
      type: typeof CANCEL_ORDER;
      payload: {
        orderId: string;
        market: string;
      };
    }
  | {
      type: typeof ON_RAMP;
      payload: {
        amount: string;
        txnId: string;
        userId: string;
      };
    }
  | {
      type: typeof GET_OPEN_ORDERS;
      payload: {
        userId: string;
        market: string;
      };
    }
  | {
      type: typeof GET_DEPTH;
      payload: {
        market: string;
      };
    };

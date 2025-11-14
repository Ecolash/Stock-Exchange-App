export const CREATE_ORDER = "CREATE_ORDER";
export const CANCEL_ORDER = "CANCEL_ORDER";
export const ON_RAMP = "ON_RAMP";
export const GET_OPEN_ORDERS = "GET_OPEN_ORDERS";
export const GET_DEPTH = "GET_DEPTH";

export type MessageFromApi =
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

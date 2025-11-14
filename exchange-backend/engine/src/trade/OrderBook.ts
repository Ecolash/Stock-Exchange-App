export interface Order {
  price: number;
  quantity: number;
  orderId: string;
  userId: string;
  side: "buy" | "sell";
  filled: number;
}

export interface Fill {
  price: number;
  qty: number;
  tradeId: number;
  otherUserId: string;
  marketOrderId: string;
}

export class Orderbook {
  bids: Order[] = [];
  asks: Order[] = [];
  baseAsset: string;
  quoteAsset: string = "USDC";
  lastTradeId: number;
  currentPrice: number;

  constructor(
    baseAsset: string,
    bids: Order[],
    asks: Order[],
    lastTradeId: number,
    currentPrice: number
  ) {
    this.baseAsset = baseAsset;
    this.bids = bids;
    this.asks = asks;
    this.lastTradeId = lastTradeId;
    this.currentPrice = currentPrice || 0;
  }

  ticker() {
    return `${this.baseAsset}_${this.quoteAsset}`;
  }

  getSnapshot() {
    return {
      baseAsset: this.baseAsset,
      bids: this.bids,
      asks: this.asks,
      lastTradeId: this.lastTradeId,
      currentPrice: this.currentPrice,
    };
  }
  addOrder(order: Order): {
    executedQty: number;
    fills: Fill[];
  } {
    if (order.side === "buy") {
      const { executedQty, fills } = this.matchAsk(order);
      order.filled = executedQty;
      if (executedQty === order.quantity) {
        return { executedQty, fills };
      }
      this.bids.push(order);
      return { executedQty, fills };
    } else {
      const { executedQty, fills } = this.matchBid(order);
      order.filled = executedQty;
      if (executedQty === order.quantity) {
        return { executedQty, fills };
      }
      this.asks.push(order);
      return { executedQty, fills };
    }
  }
  matchAsk(order: Order): {
    executedQty: number;
    fills: Fill[];
  } {
    const fills: Fill[] = [];
    let executedQty = 0;

    for (let i = 0; i < this.asks.length; i++) {
      if (this.asks[i].price <= order.price && executedQty < order.quantity) {
        const filledQty = Math.min(
          this.asks[i].quantity,
          order.quantity - executedQty
        );
        executedQty += filledQty;
        this.asks[i].filled += filledQty;
        fills.push({
          price: this.asks[i].price,
          qty: filledQty,
          tradeId: this.lastTradeId++,
          otherUserId: this.asks[i].userId,
          marketOrderId: this.asks[i].orderId,
        });
      }
    }

    for (let i = 0; i < this.asks.length; i++) {
      if (this.asks[i].filled === this.asks[i].quantity) {
        this.asks.splice(i, 1);
        i--;
      }
    }
    return {
      executedQty,
      fills,
    };
  }

  matchBid(order: Order): {
    executedQty: number;
    fills: Fill[];
  } {
    const fills: Fill[] = [];
    let executedQty = 0;

    for (let i = 0; i < this.bids.length; i++) {
      if (this.bids[i].price >= order.price && executedQty < order.quantity) {
        const filledQty = Math.min(
          this.bids[i].quantity,
          order.quantity - executedQty
        );
        executedQty += filledQty;
        this.bids[i].filled += filledQty;
        fills.push({
          price: this.bids[i].price,
          qty: filledQty,
          tradeId: this.lastTradeId++,
          otherUserId: this.bids[i].userId,
          marketOrderId: this.bids[i].orderId,
        });
      }
    }

    for (let i = 0; i < this.bids.length; i++) {
      if (this.bids[i].filled === this.bids[i].quantity) {
        this.bids.splice(i, 1);
        i--;
      }
    }
    return {
      executedQty,
      fills,
    };
  }

  getOpenOrders(userId: string): Order[] {
    const asks = this.asks.filter((x) => x.userId === userId);
    const bids = this.bids.filter((x) => x.userId === userId);
    return [...asks, ...bids];
  }

  cancelBid(order: Order) {
    const index = this.bids.findIndex((x) => x.orderId === order.orderId);
    if (index !== -1) {
      const price = this.bids[index].price;
      this.bids.splice(index, 1);
      return price;
    }
  }

  cancelAsk(order: Order) {
    const index = this.asks.findIndex((x) => x.orderId === order.orderId);
    if (index !== -1) {
      const price = this.asks[index].price;
      this.asks.splice(index, 1);
      return price;
    }
  }

  getDepth() {
    const bids: [string, string][] = [];
    const asks: [string, string][] = [];

    const bidsObj: { [key: number]: number } = {};
    const asksObj: { [key: number]: number } = {};

    for (let i = 0; i < this.bids.length; i++) {
      const order = this.bids[i];
      if (!bidsObj[order.price]) {
        bidsObj[order.price] = 0;
      }
      bidsObj[order.price] += order.quantity;
    }

    for (let i = 0; i < this.asks.length; i++) {
      const order = this.asks[i];
      if (!asksObj[order.price]) {
        asksObj[order.price] = 0;
      }
      asksObj[order.price] += order.quantity;
    }

    for (const price in bidsObj) {
      bids.push([price.toString(), bidsObj[price].toString()]);
    }

    for (const price in asksObj) {
      asks.push([price.toString(), asksObj[price].toString()]);
    }
    return {
      bids: bids,
      asks: asks,
    };
  }
}

export interface Depth {
  bids: [string, string][];
  asks: [string, string][];
  lastUpdateId: string;
}

export interface Trade {
  id: number;
  price: string;
  quantity: string;
  quoteQuantity: string;
  timestamp: number;
  isBuyerMaker: boolean;
}

export interface Ticker {
  symbol: string;
  firstPrice: string;
  lastPrice: string;
  priceChange: string;
  priceChangePercent: string;
  high: string;
  low: string;
  volume: string;
  quoteVolume: string;
  trades: string;
}
export interface KLine {
  start: string;
  end: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  quoteVolume: string;
  trades: string;
}

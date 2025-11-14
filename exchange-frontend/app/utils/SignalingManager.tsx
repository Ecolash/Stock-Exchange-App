import { Ticker, Depth, Trade, KLine } from "./types";

export const BASE_URL = "wss://ws.backpack.exchange/";
//export const BASE_URL = "ws://localhost:3001";

export class SignalingManager {
  private ws: WebSocket;
  private static instance: SignalingManager;
  private bufferedMessages: string[] = [];
  private isConnected: boolean = false;
  private callbacks: { [type: string]: any[] } = {};
  private id: number;

  private constructor(private signalingServerUrl?: string) {
    this.ws = new WebSocket(this.signalingServerUrl || BASE_URL);
    this.id = 1;
    this.bufferedMessages = [];
    this.init();
  }

  init() {
    this.ws.onopen = () => {
      this.isConnected = true;
      this.bufferedMessages.forEach((message) => {
        this.ws.send(message);
      });
      this.bufferedMessages = [];
    };
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      const type = message.data.e;

      if (this.callbacks[type]) {
        this.callbacks[type].forEach(({ callback }) => {
          if (type === "ticker") {
            const newTicker: Partial<Ticker> = {
              lastPrice: message.data.c,
              high: message.data.h,
              low: message.data.l,
              volume: message.data.v,
              quoteVolume: message.data.V,
              symbol: message.data.s,
            };
            callback(newTicker);
          }
          if (type === "depth") {
            const newDepth: Partial<Depth> = {
              bids: message.data.b,
              asks: message.data.a,
              lastUpdateId: message.data.u,
            };
            callback(newDepth);
          }
          if (type === "trade") {
            const newTrade: Partial<Trade> = {
              id: message.data.t,
              price: message.data.p,
              quantity: message.data.q,
              timestamp: message.data.E,
              isBuyerMaker: message.data.m,
            };
            callback(newTrade);
          }
          if (type === "kline") {
            const newKLine: Partial<KLine> = {
              close: message.data.c,
              high: message.data.h,
              low: message.data.l,
              open: message.data.o,
              volume: message.data.v,
              end: message.data.T * 1000,
            };
            callback(newKLine);
          }
        });
      }
    };
  }

  public static getInstance(signalingServerUrl?: string) {
    if (!this.instance) {
      this.instance = new SignalingManager(signalingServerUrl);
    }
    return this.instance;
  }

  sendMessage(message: any) {
    const sendMessage = {
      ...message,
      id: this.id++,
    };
    if (!this.isConnected) {
      this.bufferedMessages.push(JSON.stringify(sendMessage));
      return;
    }
    this.ws.send(JSON.stringify(sendMessage));
  }

  async registerCallback(type: string, callback: any, id: string) {
    this.callbacks[type] = this.callbacks[type] || [];
    this.callbacks[type].push({ callback, id });
  }

  async deregisterCallback(type: string, id: string) {
    if (this.callbacks[type]) {
      const index = this.callbacks[type].findIndex(
        (callback) => callback.id === id
      );
      if (index !== -1) {
        this.callbacks[type].splice(index, 1);
      }
    }
  }
}

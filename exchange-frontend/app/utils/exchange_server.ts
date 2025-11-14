import axios from "axios";
import { Depth, Trade, Ticker, KLine } from "./types";

export const BASE_URL = "http://localhost:3020/api/v1";
//export const BASE_URL = "http://localhost:3000/api/v1";
export async function getDepth(market: string): Promise<Depth> {
  const response = await axios.get(`${BASE_URL}/depth?symbol=${market}`);
  if (response.status !== 200) {
    throw new Error(`Failed to fetch depth data: ${response.statusText}`);
  }
  return response.data;
}

export async function getTrade(market: string): Promise<Trade[]> {
  const response = await axios.get(`${BASE_URL}/trades?symbol=${market}`);
  if (response.status !== 200) {
    throw new Error(`Failed to fetch trade data: ${response.statusText}`);
  }
  return response.data;
}

export async function getMarkets(): Promise<string[]> {
  const response = await axios.get(`${BASE_URL}/markets`);
  if (response.status !== 200) {
    throw new Error(`Failed to fetch markets data: ${response.statusText}`);
  }
  return response.data;
}

export async function getTickers(): Promise<Ticker[]> {
  const response = await axios.get(`${BASE_URL}/tickers`);
  if (response.status !== 200) {
    throw new Error(`Failed to fetch tickers data: ${response.statusText}`);
  }
  return response.data;
}

export async function getTicker(market: string): Promise<Ticker> {
  const tickers = await getTickers();
  const ticker = tickers.find((ticker) => ticker.symbol === market);
  if (!ticker) {
    throw new Error(`Ticker not found for market: ${market}`);
  }
  return ticker;
}

export async function getKLines(
  market: string,
  interval: string,
  startTime: number,
  endTime: number
): Promise<KLine[]> {
  const response = await axios.get(
    `${BASE_URL}/klines?symbol=${market}&interval=${interval}&startTime=${startTime}&endTime=${endTime}`
  );
  if (response.status !== 200) {
    throw new Error(`Failed to fetch klines data: ${response.statusText}`);
  }
  const data: KLine[] = response.data;
  return data.sort((a, b) => (Number(a.end) < Number(b.end) ? -1 : 1));
}

"use client";
import { useEffect, useState } from "react";
import { getDepth, getTicker } from "@/app/utils/exchange_server";
import { AskTable } from "./AskTable";
import { BidTable } from "./BidTable";
import { SignalingManager } from "@/app/utils/SignalingManager";
import type { Depth, Ticker } from "@/app/utils/types";

function TableHeader() {
  return (
    <div className="flex justify-between text-xs px-2 py-2 border-b border-gray-800 mb-2">
      <div className="text-white font-semibold">Price (USDC)</div>
      <div className="text-slate-400">Size (SOL)</div>
      <div className="text-slate-400">Total (SOL)</div>
    </div>
  );
}

export function Depth({ market }: { market: string }) {
  const [bids, setBids] = useState<[string, string][]>();
  const [asks, setAsks] = useState<[string, string][]>();
  const [price, setPrice] = useState<string>();
  const [bidPercentage, setBidPercentage] = useState<number>(50);
  const [askPercentage, setAskPercentage] = useState<number>(50);

  useEffect(() => {
    getDepth(market).then((data) => {
      setBids(data.bids.reverse());
      setAsks(data.asks);
      calculatePercentages(data.bids, data.asks);
    });

    getTicker(market).then((data) => {
      setPrice(data.lastPrice);
    });

    // Register the callback for depth updates
    SignalingManager.getInstance().registerCallback(
      "depth",
      (data: Partial<Depth>) => {
        setBids((prevbids) => {
          const updatedBids = updateOrderBook(prevbids ?? [], data?.bids ?? []);
          return updatedBids;
        });

        setAsks((prevasks) => {
          const updatedAsks = updateOrderBook(
            prevasks ?? [],
            data?.asks ?? []
          ).reverse();
          return updatedAsks;
        });

        // Calculate percentages when data updates
        if (data?.bids && data?.asks) {
          calculatePercentages(data.bids, data.asks);
        }
      },
      `DEPTH-${market}`
    );

    // Subscribe to the depth updates
    SignalingManager.getInstance().sendMessage({
      method: "SUBSCRIBE",
      params: [`depth.200ms.${market}`],
    });

    // Register the callback for ticker updates
    SignalingManager.getInstance().registerCallback(
      "ticker",
      (data: Partial<Ticker>) => {
        setPrice(data?.lastPrice);
      },
      `TICKER-${market}`
    );

    return () => {
      // Unsubscribe from the depth updates
      SignalingManager.getInstance().sendMessage({
        method: "UNSUBSCRIBE",
        params: [`depth.200ms.${market}`],
      });
      SignalingManager.getInstance().deregisterCallback(
        "depth",
        `DEPTH-${market}`
      );
      SignalingManager.getInstance().deregisterCallback(
        "ticker",
        `TICKER-${market}`
      );
    };
  }, [market]);

  // Calculate bid/ask percentages
  const calculatePercentages = (
    bids: [string, string][],
    asks: [string, string][]
  ) => {
    const bidVolume = bids.reduce(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (acc, [_, size]) => acc + Number.parseFloat(size),
      0
    );
    const askVolume = asks.reduce(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (acc, [_, size]) => acc + Number.parseFloat(size),
      0
    );
    const totalVolume = bidVolume + askVolume;

    if (totalVolume > 0) {
      setBidPercentage(Math.round((bidVolume / totalVolume) * 100));
      setAskPercentage(Math.round((askVolume / totalVolume) * 100));
    }
  };

  return (
    <div className="bg-[rgb(20,21,27)] rounded-lg overflow-hidden mx-1.5 my-2">
      <TableHeader />
      <div className="px-1">{asks && <AskTable asks={asks} />}</div>

      {price && (
        <div className="text-center py-1 my-1.5 border-t border-b border-gray-800 font-bold text-[16px]">
          {price}
        </div>
      )}

      <div className="px-1">{bids && <BidTable bids={bids} />}</div>

      <div className="flex w-full h-8 mt-2">
        <div
          className="bg-[rgba(0,194,120,0.5)] flex items-center justify-center text-green-400 font-bold"
          style={{ width: `${bidPercentage}%` }}
        >
          {bidPercentage}%
        </div>
        <div
          className="bg-[rgba(234,56,59,.5)] flex items-center justify-center text-red-400 font-bold"
          style={{ width: `${askPercentage}%` }}
        >
          {askPercentage}%
        </div>
      </div>
    </div>
  );
}

function updateOrderBook(
  prevLevels: [string, string][],
  newLevels: [string, string][]
): [string, string][] {
  const levelMap = new Map(prevLevels);
  for (const [price, size] of newLevels) {
    if (Number.parseFloat(size) === 0) {
      levelMap.delete(price);
    } else {
      levelMap.set(price, size);
    }
  }
  const updatedLevels = Array.from(levelMap.entries());
  return updatedLevels.sort(
    (a, b) => Number.parseFloat(b[0]) - Number.parseFloat(a[0])
  );
}

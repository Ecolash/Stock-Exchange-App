"use client";
import { useEffect, useState } from "react";
import { getTrade } from "@/app/utils/exchange_server";
import { SignalingManager } from "@/app/utils/SignalingManager";
import type { Trade } from "@/app/utils/types";

function TableHeader() {
  return (
    <div className="flex justify-start gap-10 text-xs px-2 py-2 border-b border-gray-800 mb-2">
      <div className="text-slate-400">Price (USDC)</div>
      <div className="text-slate-400">Qty (SOL)</div>
    </div>
  );
}

export function Trades({ market }: { market: string }) {
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    getTrade(market).then((data) => {
      setTrades(data);
    });
    // Register the callback for trade updates
    SignalingManager.getInstance().registerCallback(
      "trade",
      (data: Partial<Trade>) => {
        setTrades((prevTrades) => {
          const updatedTrades = [...prevTrades, data as Trade];
          return updatedTrades.slice(-100); // Keep only the last 100 trades
        });
      },
      `TRADE-${market}`
    );

    // Subscribe to trade updates
    SignalingManager.getInstance().sendMessage({
      method: "SUBSCRIBE",
      params: [`trade.${market}`],
    });

    return () => {
      // Unsubscribe from trade updates
      SignalingManager.getInstance().sendMessage({
        method: "UNSUBSCRIBE",
        params: [`trade.${market}`],
      });
      // Deregister the callback
      SignalingManager.getInstance().deregisterCallback(
        "trade",
        `TRADE-${market}`
      );
    };
  }, [market]);

  const getPriceColor = (price: number, index: number) => {
    if (index === trades.length - 1) return "text-red-500"; // Default for last item

    const nextPrice = parseFloat(trades[index + 1]?.price);
    if (!nextPrice) return "text-white";

    return price > nextPrice ? "text-green-500" : "text-red-500";
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="bg-gray-900 text-white rounded-md overflow-hidden">
      <TableHeader />
      <div className="max-h-[500px] overflow-y-auto">
        {trades.map((trade, index) => (
          <div
            key={`${trade.id || index}-${trade.timestamp}`}
            className="flex justify-between items-center px-2 py-1 text-sm"
          >
            <div className={getPriceColor(parseFloat(trade.price), index)}>
              {parseFloat(trade.price).toFixed(2)}
            </div>
            <div className="flex justify-between w-1/2">
              <div className="text-white">
                {parseFloat(trade.quantity).toFixed(2)}
              </div>
              <div className="text-gray-500 text-xs">
                {formatTime(trade.timestamp)}
              </div>
            </div>
          </div>
        ))}
        {trades.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            Loading trades...
          </div>
        )}
      </div>
    </div>
  );
}

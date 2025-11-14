"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChartManager } from "@/app/utils/ChartManager";
import { getKLines } from "@/app/utils/exchange_server";
import { Button } from "@/app/components/ui/button";
import { SignalingManager } from "@/app/utils/SignalingManager";
import { KLine } from "@/app/utils/types";

type TimeInterval = "1m" | "1h" | "1w";

export function TradeView({ market }: { market: string }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartManagerRef = useRef<ChartManager | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<TimeInterval>("1h");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getTimeRange = (interval: TimeInterval) => {
    const now = Math.floor(new Date().getTime() / 1000);
    let startTime;

    switch (interval) {
      case "1m":
        // Last 24 hours for 1-minute data
        startTime = now - 60 * 60 * 2;
        break;
      case "1h":
        startTime = now - 60 * 60 * 24 * 4;
        break;
      case "1w":
        startTime = now - 60 * 60 * 24 * 800;
        break;
      default:
        startTime = now - 60 * 60 * 24 * 7;
    }

    return { startTime, endTime: now };
  };

  const loadChartData = useCallback(
    async (interval: TimeInterval) => {
      setIsLoading(true);
      try {
        const { startTime, endTime } = getTimeRange(interval);
        const klineData = await getKLines(market, interval, startTime, endTime);

        if (chartRef.current) {
          if (chartManagerRef.current) {
            chartManagerRef.current.destroy();
          }

          const formattedData =
            [
              ...klineData?.map((x) => ({
                close: Number.parseFloat(x.close),
                high: Number.parseFloat(x.high),
                low: Number.parseFloat(x.low),
                open: Number.parseFloat(x.open),
                timestamp: new Date(x.end),
                volume: Number.parseFloat(x.volume),
              })),
            ].sort((x, y) => (x.timestamp < y.timestamp ? -1 : 1)) || [];

          const chartManager = new ChartManager(
            chartRef.current,
            formattedData,
            {
              background: "#0e0f14",
              color: "white",
            }
          );

          chartManagerRef.current = chartManager;
        }
      } catch (error) {
        console.error("Failed to load chart data:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [market]
  );

  useEffect(() => {
    loadChartData(selectedInterval);
    SignalingManager.getInstance().registerCallback(
      "kline",
      (data: Partial<KLine>) => {
        if (!chartManagerRef.current) return;
        const newKLine = {
          timestamp: new Date(data?.end ?? Date.now()),
          open: Number.parseFloat(data?.open || "0"),
          high: Number.parseFloat(data?.high || "0"),
          low: Number.parseFloat(data?.low || "0"),
          close: Number.parseFloat(data?.close || "0"),
          volume: Number.parseFloat(data?.volume || "0"),
        };

        chartManagerRef.current.update(newKLine);
      },
      "KLINE-" + market + "-" + selectedInterval
    );
    SignalingManager.getInstance().sendMessage({
      method: "SUBSCRIBE",
      params: [`kline.${selectedInterval}.${market}`],
    });

    return () => {
      if (chartManagerRef.current) {
        chartManagerRef.current.destroy();
        chartManagerRef.current = null;
      }
      SignalingManager.getInstance().deregisterCallback(
        "kline",
        "KLINE-" + market + "-" + selectedInterval
      );
      SignalingManager.getInstance().sendMessage({
        method: "UNSUBSCRIBE",
        params: [`kline.${selectedInterval}.${market}`],
      });
    };
  }, [market, selectedInterval, loadChartData]);

  const handleIntervalChange = (interval: TimeInterval) => {
    setSelectedInterval(interval);
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-medium text-gray-300">
          Time Interval:
        </span>
        <div className="flex gap-1">
          <Button
            variant={selectedInterval === "1m" ? "secondary" : "outline"}
            className={`
          ${
            selectedInterval === "1m"
              ? "bg-indigo-600/30 hover:bg-indigo-500/40 text-indigo-200 border border-indigo-700/60"
              : "bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 border border-gray-700"
          } transition-colors`}
            size="sm"
            onClick={() => handleIntervalChange("1m")}
            disabled={isLoading}
          >
            1 Minute
          </Button>
          <Button
            variant={selectedInterval === "1h" ? "secondary" : "outline"}
            className={`
          ${
            selectedInterval === "1h"
              ? "bg-indigo-600/30 hover:bg-indigo-500/40 text-indigo-200 border border-indigo-700/60"
              : "bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 border border-gray-700"
          } transition-colors`}
            size="sm"
            onClick={() => handleIntervalChange("1h")}
            disabled={isLoading}
          >
            1 Hour
          </Button>
          <Button
            variant={selectedInterval === "1w" ? "secondary" : "outline"}
            className={`
          ${
            selectedInterval === "1w"
              ? "bg-indigo-600/30 hover:bg-indigo-500/40 text-indigo-200 border border-indigo-700/60"
              : "bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 border border-gray-700"
          } transition-colors`}
            size="sm"
            onClick={() => handleIntervalChange("1w")}
            disabled={isLoading}
          >
            1 Week
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      )}

      <div
        ref={chartRef}
        className="relative"
        style={{ height: "550px", width: "100%" }}
      ></div>
    </div>
  );
}

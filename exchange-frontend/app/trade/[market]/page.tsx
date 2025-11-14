"use client";

import { MarketBar } from "@/app/components/MarketBar";
import { TradeView } from "@/app/components/TradeView";
import { SwapUI } from "@/app/components/SwapUI";
import { useParams } from "next/navigation";
import { Depth } from "@/app/components/depth";
import { Trades } from "@/app/components/trades";
import { useState } from "react";

export function TabSelector({ market }: { market: string }) {
  const [activeTab, setActiveTab] = useState<"book" | "trades">("book");

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex bg-gray-900 rounded-t-md">
        <button
          onClick={() => setActiveTab("book")}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "book"
              ? "bg-gray-800 text-white"
              : "text-gray-400 hover:text-gray-300"
          }`}
        >
          Book
        </button>
        <button
          onClick={() => setActiveTab("trades")}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "trades"
              ? "bg-gray-800 text-white"
              : "text-gray-400 hover:text-gray-300"
          }`}
        >
          Trades
        </button>
      </div>

      {activeTab === "book" && <Depth market={market} />}
      {activeTab === "trades" && <Trades market={market} />}
    </div>
  );
}

export default function Page() {
  const { market } = useParams();
  return (
    <div className="flex flex-row flex-1">
      <div className="flex flex-col flex-1">
        <MarketBar market={market as string} />
        <div className="flex flex-row h-[620px] border-y border-slate-800">
          <div className="flex flex-col flex-1">
            <TradeView market={market as string} />
          </div>
          <div className="w-[1px] flex-col border-slate-800 border-l"></div>
          <div className="flex flex-col w-[250px] overflow-hidden">
            <TabSelector market={market as string} />
          </div>
        </div>
      </div>
      <div className="w-[1px] flex-col border-slate-800 border-l"></div>
      <div>
        <div className="flex flex-col w-[245px]">
          <SwapUI market={market as string} />
        </div>
      </div>
    </div>
  );
}

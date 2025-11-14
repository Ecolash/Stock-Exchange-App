/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useState, useRef } from "react";
import type { Ticker } from "@/app/utils/types";
import { getTicker } from "@/app/utils/exchange_server";
import { SignalingManager } from "@/app/utils/SignalingManager";

export const MarketBar = ({ market }: { market: string }) => {
  const [ticker, setTicker] = useState<Ticker | null>(null);
  const netDirectionRef = useRef<number>(0);

  const callbackKeyRef = useRef(`TICKER-${market}-${Math.random()}`);

  useEffect(() => {
    const callbackKey = callbackKeyRef.current;
    getTicker(market).then(setTicker);
    SignalingManager.getInstance().registerCallback(
      "ticker",
      (data: Partial<Ticker>) =>
        setTicker((prevTicker) => {
          const symbol = data?.symbol ?? prevTicker?.symbol ?? "";
          const firstPrice = data?.firstPrice ?? prevTicker?.firstPrice ?? "";
          const lastPrice = data?.lastPrice ?? prevTicker?.lastPrice ?? "";
          const high = data?.high ?? prevTicker?.high ?? "";
          const low = data?.low ?? prevTicker?.low ?? "";
          const volume = data?.volume ?? prevTicker?.volume ?? "";
          const quoteVolume =
            data?.quoteVolume ?? prevTicker?.quoteVolume ?? "";
          const trades = data?.trades ?? prevTicker?.trades ?? "";

          if (data?.lastPrice && prevTicker?.lastPrice) {
            netDirectionRef.current =
              parseFloat(data?.lastPrice) - parseFloat(prevTicker?.lastPrice);
          }

          const priceChange =
            lastPrice && firstPrice
              ? (parseFloat(lastPrice) - parseFloat(firstPrice)).toFixed(2)
              : prevTicker?.priceChange ?? "";

          const priceChangePercent =
            lastPrice && firstPrice
              ? (
                  ((parseFloat(lastPrice) - parseFloat(firstPrice)) /
                    parseFloat(firstPrice)) *
                  100
                ).toFixed(2)
              : prevTicker?.priceChangePercent ?? "";

          return {
            symbol,
            firstPrice,
            lastPrice,
            priceChange,
            priceChangePercent,
            high,
            low,
            volume,
            quoteVolume,
            trades,
          };
        }),
      callbackKey // Register the callback for the specific market
    );
    SignalingManager.getInstance().sendMessage({
      method: "SUBSCRIBE",
      params: [`ticker.${market}`],
    });

    return () => {
      SignalingManager.getInstance().deregisterCallback("ticker", callbackKey); // Deregister the callback when the component unmounts
      SignalingManager.getInstance().sendMessage({
        method: "UNSUBSCRIBE",
        params: [`ticker.${market}`],
      });
    };
  }, [market]);

  return (
    <div>
      <div className="flex items-center flex-row relative w-full overflow-hidden border-b border-slate-800">
        <div className="flex items-center justify-between flex-row no-scrollbar overflow-auto pr-4">
          <Ticker market={market} />
          <div className="flex items-center flex-row space-x-8 pl-4">
            <div className="flex flex-col h-full justify-center">
              <p
                className={`font-medium tabular-nums text-greenText text-md
                   ${
                     netDirectionRef.current >= 0
                       ? "text-green-500"
                       : "text-red-500"
                   }
                  `}
              >
                ${ticker?.lastPrice}
              </p>
              <p className="font-medium text-sm  tabular-nums">
                ${ticker?.lastPrice}
              </p>
            </div>
            <div className="flex flex-col">
              <p className={`font-medium text-xs text-slate-400 `}>
                24H Change
              </p>
              <p
                className={` font-medium tabular-nums leading-5 text-sm text-greenText ${
                  Number(ticker?.priceChange) > 0
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {Number(ticker?.priceChange) > 0 ? "+" : ""}{" "}
                {ticker?.priceChange}{" "}
                {Number(ticker?.priceChangePercent)?.toFixed(2)}%
              </p>
            </div>
            <div className="flex flex-col">
              <p className="font-medium text-xs text-slate-400 ">24H High</p>
              <p className=" font-medium tabular-nums leading-5 text-sm ">
                {ticker?.high}
              </p>
            </div>
            <div className="flex flex-col">
              <p className="font-medium text-xs text-slate-400 ">24H Low</p>
              <p className=" font-medium tabular-nums leading-5 text-sm ">
                {ticker?.low}
              </p>
            </div>
            <button
              type="button"
              className="font-medium transition-opacity hover:opacity-80 hover:cursor-pointer text-base text-left"
              data-rac=""
            >
              <div className="flex flex-col">
                <p className="font-medium text-xs text-slate-400 ">
                  24H Volume
                </p>
                <p className="mt-1 text-sm font-medium tabular-nums leading-5  ">
                  {ticker?.volume}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function Ticker({ market }: { market: string }) {
  const baseAsset = market.split("_")[0];
  const quoteAsset = market.split("_")[1];
  return (
    <div className="flex h-[60px] shrink-0 space-x-4">
      <div className="flex flex-row relative ml-2 -mr-4">
        <img
          alt="SOL Logo"
          loading="lazy"
          decoding="async"
          data-nimg="1"
          className="z-10 rounded-full h-6 w-6 mt-4 outline-baseBackgroundL1"
          src={`/${baseAsset}.webp`}
        />
        <img
          alt="USDC Logo"
          loading="lazy"
          decoding="async"
          data-nimg="1"
          className="h-6 w-6 -ml-2 mt-4 rounded-full"
          src={`/${quoteAsset}.webp`}
        />
      </div>
      <button type="button" className="react-aria-Button" data-rac="">
        <div className="flex items-center justify-between flex-row cursor-pointer rounded-lg p-3 hover:opacity-80">
          <div className="flex items-center flex-row gap-2 undefined">
            <div className="flex flex-row relative">
              <p className="font-medium text-sm undefined">
                {market.replace("_", " / ")}
              </p>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

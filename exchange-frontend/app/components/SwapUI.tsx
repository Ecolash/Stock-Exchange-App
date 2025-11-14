"use client";
import { useState } from "react";
import axios from "axios";
import { BASE_URL } from "@/app/utils/exchange_server";

export function SwapUI({ market }: { market: string }) {
  const [price, setPrice] = useState("134.38");
  const [quantity, setQuantity] = useState("123");

  const [activeTab, setActiveTab] = useState("buy");
  const [type, setType] = useState("limit");
  const baseAsset = market.split("_")[0];
  const quoteAsset = market.split("_")[1];

  const handleOrder = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/order`, {
        market,
        price,
        quantity,
        side: activeTab,
        userId: "1",
      });
      console.log("Order Success:", res.data);
    } catch (err) {
      console.error("Order Error:", err);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col">
        <div className="flex flex-row h-[60px]">
          <BuyButton activeTab={activeTab} setActiveTab={setActiveTab} />
          <SellButton activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
        <div className="flex flex-col gap-1">
          <div className="px-3">
            <div className="flex flex-row flex-0 gap-5 undefined">
              <LimitButton type={type} setType={setType} />
              <MarketButton type={type} setType={setType} />
            </div>
          </div>
          <div className="flex flex-col px-3">
            <div className="flex flex-col flex-1 gap-3 text-[rgb(244,244,246)]">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between flex-row">
                  <p className="text-xs font-normal text-baseTextMedEmphasis">
                    Available Balance
                  </p>
                  <p className="font-medium text-xs text-[rgb(244,244,246)]">
                    36.94 USDC
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xs font-normal text-baseTextMedEmphasis">
                  Price
                </p>
                <div className="flex flex-col relative">
                  <input
                    step="0.01"
                    placeholder="0"
                    className="h-12 rounded-lg border-2 border-solid border-[rgb(32,33,39)] bg-[var(--background)] pr-12 text-right text-2xl leading-9 text-[$text] placeholder-baseTextMedEmphasis ring-0 transition focus:border-[rgb(76,148,255)] focus:ring-0"
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                  <div className="flex flex-row absolute right-1 top-1 p-2">
                    <div className="relative">
                      <img src={`/${quoteAsset}.webp`} className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-normal text-baseTextMedEmphasis">
                Quantity
              </p>
              <div className="flex flex-col relative">
                <input
                  step="0.01"
                  placeholder="0"
                  className="h-12 rounded-lg border-2 border-solid border-[rgb(32,33,39)] bg-[var(--background)] pr-12 text-right text-2xl leading-9 text-[$text] placeholder-baseTextMedEmphasis ring-0 transition focus:border-[rgb(76,148,255)] focus:ring-0"
                  type="text"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
                <div className="flex flex-row absolute right-1 top-1 p-2">
                  <div className="relative">
                    <img src={`/${baseAsset}.webp`} className="w-6 h-6" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end flex-row">
                <p className="font-medium pr-2 text-xs text-baseTextMedEmphasis">
                  ≈ 0.00 USDC
                </p>
              </div>
              <div className="flex justify-center flex-row mt-2 gap-3">
                <div className="flex items-center justify-center flex-row rounded-full px-[16px] py-[6px] text-xs cursor-pointer bg-[rgb(32,33,39)] hover:bg-[rgb(32,33,39)]">
                  25%
                </div>
                <div className="flex items-center justify-center flex-row rounded-full px-[16px] py-[6px] text-xs cursor-pointer bg-[rgb(32,33,39)] hover:bg-[rgb(32,33,39)]">
                  50%
                </div>
                <div className="flex items-center justify-center flex-row rounded-full px-[16px] py-[6px] text-xs cursor-pointer bg-[rgb(32,33,39)] hover:bg-[rgb(32,33,39)]">
                  75%
                </div>
                <div className="flex items-center justify-center flex-row rounded-full px-[16px] py-[6px] text-xs cursor-pointer bg-[rgb(32,33,39)] hover:bg-[rgb(32,33,39)]">
                  Max
                </div>
              </div>
            </div>
            <button
              type="button"
              className="font-semibold  focus:ring-blue-200 focus:none focus:outline-none text-center h-12 rounded-xl text-base px-4 py-2 my-4 bg-[rgb(0,194,120)]  text-[rgb(20,21,27)] active:scale-98"
              data-rac=""
              onClick={handleOrder}
            >
              {activeTab === "buy" ? "Buy" : "Sell"}
            </button>
            <div className="flex justify-between flex-row mt-1">
              <div className="flex flex-row gap-2">
                <div className="flex items-center">
                  <input
                    className="form-checkbox rounded border border-solid border-[#cccccc] bg-base-950 font-light text-transparent shadow-none shadow-transparent outline-none ring-0 ring-transparent checked:border-[#cccccc] checked:bg-base-900 checked:hover:border-[#cccccc] focus:bg-base-900 focus:ring-0 focus:ring-offset-0 focus:checked:border-[#cccccc] cursor-pointer h-5 w-5"
                    id="postOnly"
                    type="checkbox"
                    data-rac=""
                  />
                  <label className="ml-2 text-xs">Post Only</label>
                </div>
                <div className="flex items-center">
                  <input
                    className="form-checkbox rounded border border-solid border-[#cccccc] bg-base-950 font-light text-transparent shadow-none shadow-transparent outline-none ring-0 ring-transparent checked:border-[#cccccc] checked:bg-base-900 checked:hover:border-[#cccccc] focus:bg-base-900 focus:ring-0 focus:ring-offset-0 focus:checked:border-[#cccccc] cursor-pointer h-5 w-5"
                    id="ioc"
                    type="checkbox"
                    data-rac=""
                  />
                  <label className="ml-2 text-xs">IOC</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LimitButton({ type, setType }: { type: string; setType: any }) {
  return (
    <div
      className="flex flex-col cursor-pointer justify-center py-2"
      onClick={() => setType("limit")}
    >
      <div
        className={`text-sm font-medium py-1 border-b-2 ${
          type === "limit"
            ? "border-[rgb(76,148,255)] text-[rgb(244,244,246)]"
            : "border-transparent text-baseTextMedEmphasis hover:border-[rgb(244,244,246)] hover:text-[rgb(244,244,246)]"
        }`}
      >
        Limit
      </div>
    </div>
  );
}

function MarketButton({ type, setType }: { type: string; setType: any }) {
  return (
    <div
      className="flex flex-col cursor-pointer justify-center py-2"
      onClick={() => setType("market")}
    >
      <div
        className={`text-sm font-medium py-1 border-b-2 ${
          type === "market"
            ? "border-[rgb(76,148,255)] text-[rgb(244,244,246)]"
            : "border-b-2 border-transparent text-baseTextMedEmphasis hover:border-[rgb(244,244,246)] hover:text-[rgb(244,244,246)]"
        } `}
      >
        Market
      </div>
    </div>
  );
}

function BuyButton({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: any;
}) {
  return (
    <div
      className={`flex flex-col mb-[-2px] flex-1 cursor-pointer justify-center border-b-2 p-4 ${
        activeTab === "buy"
          ? "border-b-[rgba(0,194,120,.4)] bg-[rgba(0,194,120,.12)]"
          : "border-b-[#cccccc] hover:border-b-baseBorderFocus"
      }`}
      onClick={() => setActiveTab("buy")}
    >
      <p className="text-center text-sm font-semibold text-greenText">Buy</p>
    </div>
  );
}

function SellButton({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: any;
}) {
  return (
    <div
      className={`flex flex-col mb-[-2px] flex-1 cursor-pointer justify-center border-b-2 p-4 ${
        activeTab === "sell"
          ? "border-b-[rgba(234,56,59,.5)] bg-[rgba(234,56,59,.12)]"
          : "border-b-[#cccccc] hover:border-b-baseBorderFocus"
      }`}
      onClick={() => setActiveTab("sell")}
    >
      <p className="text-center text-sm font-semibold text-redText">Sell</p>
    </div>
  );
}

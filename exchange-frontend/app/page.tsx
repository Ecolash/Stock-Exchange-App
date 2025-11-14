"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"

// Market data
const markets = [
  { name: "jup", fullName: "Jupiter" },
  { name: "render", fullName: "Render" },
  { name: "btc", fullName: "Bitcoin" },
  { name: "usdt", fullName: "Tether" },
  { name: "blur", fullName: "Blur" },
  { name: "hnt", fullName: "Helium" },
  { name: "ape", fullName: "ApeCoin" },
  { name: "eth", fullName: "Ethereum" },
  { name: "strk", fullName: "Starknet" },
  { name: "pol", fullName: "Polygon" },
  { name: "sol", fullName: "Solana" },
  { name: "avax", fullName: "Avalanche" },
  { name: "link", fullName: "Chainlink" },
  { name: "doge", fullName: "Dogecoin" },
  { name: "uni", fullName: "Uniswap" },
]

export default function Home() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")

  const handleMarketClick = (marketName: string) => {
    router.push(`/trade/${marketName.toUpperCase()}_USDC`)
  }

  const filteredMarkets = markets.filter((market) => market.fullName.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">CryptoExchange</h1>
            <div className="flex items-center space-x-4">
              <button className="rounded-lg bg-blue-600 px-4 py-2 font-medium hover:bg-blue-700">Connect Wallet</button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="mb-6 text-3xl font-bold">Markets</h2>

          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search markets..."
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 focus:border-blue-500 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Market Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filteredMarkets.map((market) => (
              <div
                key={market.name}
                className="cursor-pointer rounded-lg bg-gray-800 p-4 transition-all hover:bg-gray-700"
                onClick={() => handleMarketClick(market.name)}
              >
                <div className="flex flex-col items-center">
                  <div className="mb-3 h-16 w-16 overflow-hidden rounded-full">
                    {market.name === "jup" && (
                      <Image
                        src="/jup.webp"
                        alt="Jupiter"
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    )}
                    {market.name === "render" && (
                      <Image
                        src="/render.webp"
                        alt="Render"
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    )}
                    {market.name === "btc" && (
                      <Image
                        src="/btc.webp"
                        alt="Bitcoin"
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    )}
                    {market.name === "usdt" && (
                      <Image
                        src="/usdt.webp"
                        alt="Tether"
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    )}
                    {market.name === "blur" && (
                      <Image
                        src="/blur.webp"
                        alt="Blur"
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    )}
                    {market.name === "hnt" && (
                      <Image
                        src="/hnt.webp"
                        alt="Helium"
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    )}
                    {market.name === "ape" && (
                      <Image
                        src="/ape.webp"
                        alt="ApeCoin"
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    )}
                    {market.name === "eth" && (
                      <Image
                        src="/eth.webp"
                        alt="Ethereum"
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    )}
                    {market.name === "strk" && (
                      <Image
                        src="/strk.webp"
                        alt="Starknet"
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    )}
                    {market.name === "pol" && (
                      <Image
                        src="/pol.webp"
                        alt="Polygon"
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    )}
                    {/* Placeholder for other markets */}
                    {["sol", "avax", "link", "doge", "uni"].includes(market.name) && (
                      <div className="flex h-full w-full items-center justify-center bg-gray-700 text-sm">
                        {market.name.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="text-center font-medium">{market.fullName}</span>
                  <span className="mt-1 text-sm text-gray-400">{market.name.toUpperCase()}/USDC</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Market Stats Section */}
        <div className="mt-12">
          <h2 className="mb-6 text-2xl font-bold">Market Overview</h2>
          <div className="overflow-x-auto rounded-lg border border-gray-800">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left">Market</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">24h Change</th>
                  <th className="px-4 py-3 text-right">24h Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                <tr className="bg-gray-900 hover:bg-gray-800">
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="mr-3 h-8 w-8 overflow-hidden rounded-full">
                        <Image
                          src="/btc.webp"
                          alt="Bitcoin"
                          width={32}
                          height={32}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span>Bitcoin</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">$68,245.32</td>
                  <td className="px-4 py-3 text-right text-green-500">+2.34%</td>
                  <td className="px-4 py-3 text-right">$32.5B</td>
                </tr>
                <tr className="bg-gray-900 hover:bg-gray-800">
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="mr-3 h-8 w-8 overflow-hidden rounded-full">
                        <Image
                          src="/eth.webp"
                          alt="Ethereum"
                          width={32}
                          height={32}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span>Ethereum</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">$3,456.78</td>
                  <td className="px-4 py-3 text-right text-red-500">-1.23%</td>
                  <td className="px-4 py-3 text-right">$15.7B</td>
                </tr>
                <tr className="bg-gray-900 hover:bg-gray-800">
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="mr-3 h-8 w-8 overflow-hidden rounded-full">
                        <Image
                          src="/usdt.webp"
                          alt="Tether"
                          width={32}
                          height={32}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span>Tether</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">$1.00</td>
                  <td className="px-4 py-3 text-right text-green-500">+0.01%</td>
                  <td className="px-4 py-3 text-right">$42.1B</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-800 bg-gray-950 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-400">© 2025 CryptoExchange. All rights reserved.</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-sm text-gray-400 hover:text-white">
                Terms
              </a>
              <a href="#" className="text-sm text-gray-400 hover:text-white">
                Privacy
              </a>
              <a href="#" className="text-sm text-gray-400 hover:text-white">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

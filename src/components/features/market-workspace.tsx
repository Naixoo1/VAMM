"use client";

import { TradingViewChart } from "./tradingview-chart";

/** Live presentation only; frozen teaching data remains in Simulation and its mentor. */
export function MarketWorkspace() {
  return <TradingViewChart variant="market" />;
}
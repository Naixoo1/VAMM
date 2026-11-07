"use client";

import { useState } from "react";
import { MotionBoundary } from "@/components/motion";
import { LIVE_COMPANIES, isLiveCompanySymbol } from "@/lib/data/tradingview-widgets";
import type { LiveCompanySymbol } from "@/lib/data/tradingview-widgets";
import { LiveMarketWidget } from "./live-market-widget";
import { styles } from "./workspace";
import liveStyles from "./live-market-widget.module.css";

export function LiveMarketComparison() {
  const [first, setFirst] = useState<LiveCompanySymbol>("NASDAQ:AAPL");
  const [second, setSecond] = useState<LiveCompanySymbol>("NASDAQ:MSFT");
  return <div className={styles.stack}>
    <section className={liveStyles.selectorPanel} aria-labelledby="live-comparison-choice-title">
      <h2 className={liveStyles.selectorTitle} id="live-comparison-choice-title">Choose two company listings</h2>
      <div className={liveStyles.controls}>
        {[{ label: "First company", id: "live-first-company", value: first, other: second, change: setFirst }, { label: "Second company", id: "live-second-company", value: second, other: first, change: setSecond }].map(field => <div className={liveStyles.companyField} key={field.id}>
          <label htmlFor={field.id}>{field.label}</label>
          <select id={field.id} value={field.value} onChange={event => { if (isLiveCompanySymbol(event.target.value) && event.target.value !== field.other) field.change(event.target.value); }}>
            {LIVE_COMPANIES.map(company => <option key={company.symbol} value={company.symbol} disabled={company.symbol === field.other}>{company.name} · {company.ticker} · {company.currency}</option>)}
          </select>
        </div>)}
      </div>
      <p className={liveStyles.context}>The provider overlays the two companies on a percentage scale for the selected period. Use its time-range controls and tooltip to inspect movement. Quotes may be delayed; the underlying listings are in USD.</p>
    </section>
    <MotionBoundary preset="selection-morph" state="ready" motionKey={first + ":" + second}>
      <LiveMarketWidget kind="comparison" symbol={first} comparison={second} />
    </MotionBoundary>
  </div>;
}

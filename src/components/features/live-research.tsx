"use client";

import { useState } from "react";
import { LIVE_COMPANIES, isLiveCompanySymbol } from "@/lib/data/tradingview-widgets";
import type { LiveCompanySymbol } from "@/lib/data/tradingview-widgets";
import { LiveMarketWidget } from "./live-market-widget";
import { styles } from "./workspace";
import liveStyles from "./live-market-widget.module.css";

export function LiveResearchWorkspace() {
  const [symbol, setSymbol] = useState<LiveCompanySymbol>("NASDAQ:AAPL");
  return <div className={styles.stack}>
    <section className={liveStyles.selectorPanel} aria-labelledby="live-research-choice-title">
      <h2 id="live-research-choice-title" className={liveStyles.selectorTitle}>Explore a real company</h2>
      <div className={liveStyles.companyField}>
        <label htmlFor="live-research-company">Company context</label>
        <select id="live-research-company" value={symbol} onChange={event => { if (isLiveCompanySymbol(event.target.value)) setSymbol(event.target.value); }}>
          {LIVE_COMPANIES.map(company => <option key={company.symbol} value={company.symbol}>{company.name} · {company.ticker} · {company.currency}</option>)}
        </select>
      </div>
      <p className={liveStyles.context}>These panels display TradingView’s company information, financial reporting, and technical context. They do not provide facts to the AI form or create live-grounded AI answers. The separate Synthetic basket mentor below uses only its fixed teaching evidence.</p>
    </section>
    <div className={liveStyles.researchGrid}>
      <LiveMarketWidget kind="profile" symbol={symbol} />
      <LiveMarketWidget kind="technical" symbol={symbol} />
      <div className={liveStyles.researchFull}><LiveMarketWidget kind="fundamentals" symbol={symbol} /></div>
    </div>
  </div>;
}

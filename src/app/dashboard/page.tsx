"use client";

import { TradingViewChart } from "@/components/features/tradingview-chart";
import { LiveMarketWidget } from "@/components/features/live-market-widget";
import { TeamHomeOverview } from "@/components/features/team-design";
import { styles } from "@/components/features/workspace";

export default function DashboardPage() {
  return <>
    <TeamHomeOverview />
    <div className={styles.stack}>
      <LiveMarketWidget kind="summary" />
      <TradingViewChart variant="dashboard" />
    </div>
  </>;
}

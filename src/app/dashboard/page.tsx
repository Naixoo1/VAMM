"use client";

import { TradingViewChart } from "@/components/features/tradingview-chart";
import { LiveMarketWidget } from "@/components/features/live-market-widget";
import { TeamHomeOverview } from "@/components/features/team-design";
import { styles } from "@/components/features/workspace";
import { LearningActivity } from "@/components/learning/activity";

export default function DashboardPage() {
  return <>
    <TeamHomeOverview />
    <div className={styles.stack}>
      <LearningActivity compact />
      <LiveMarketWidget kind="summary" />
      <TradingViewChart variant="dashboard" />
    </div>
  </>;
}

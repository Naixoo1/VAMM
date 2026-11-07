"use client";

import { TradingViewChart } from "@/components/features/tradingview-chart";
import { LiveMarketWidget } from "@/components/features/live-market-widget";
import { LiveLearningArea } from "@/components/features/live-market-learning";
import { SyntheticDashboardLearning } from "@/components/features/live-market-dashboard-learning";
import { TeamHomeOverview } from "@/components/features/team-design";
import { styles } from "@/components/features/workspace";

export default function DashboardPage() {
  return <>
    <TeamHomeOverview />
    <div className={styles.stack}>
      <LiveMarketWidget kind="summary" />
      <TradingViewChart variant="dashboard" />
      <LiveLearningArea title="Synthetic learning baskets" description="Three authored baskets in IDR, the learning path, and the frozen simulation exercise.">
        <SyntheticDashboardLearning />
      </LiveLearningArea>
    </div>
  </>;
}

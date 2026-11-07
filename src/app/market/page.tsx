import {Info} from "lucide-react";
import {TradingViewChart} from "@/components/features/tradingview-chart";
import styles from "./market.module.css";

export default function MarketPage(){
 return <section className={styles.market} aria-labelledby="market-title">
  <header className={styles.header}><div><p className={styles.eyebrow}>A wider perspective</p><h1 id="market-title" className={styles.title}>Market</h1><p className={styles.description}>Explore the market with TradingView’s interactive chart. Start with Apple, then use the chart’s symbol search to look further.</p></div></header>
  <TradingViewChart variant="market"/>
  <p className={styles.note}><Info size={16} aria-hidden="true"/>This independent chart does not change your simulated holdings, returns, or scenarios. Quotes may be delayed, and the chart’s currency is set by its selected instrument.</p>
 </section>
}

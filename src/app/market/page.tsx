import {Info} from "lucide-react";
import {MarketWorkspace} from "@/components/features/market-workspace";
import styles from "./market.module.css";

export default function MarketPage(){
 return <section className={styles.market} aria-labelledby="market-title">
  <header className={styles.header}><div><p className={styles.eyebrow}>A wider perspective</p><h1 id="market-title" className={styles.title}>Market</h1><p className={styles.description}>Explore TradingView’s interactive market chart, or switch to the original chart for all three educational instruments.</p></div></header>
  <MarketWorkspace/>
  <p className={styles.note}><Info size={16} aria-hidden="true"/>Exploring either chart does not change your simulated holdings, returns, or scenarios. TradingView provides external market data; the original learning chart uses VAMM’s frozen synthetic teaching data.</p>
 </section>
}

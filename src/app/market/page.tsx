import {Info} from "lucide-react";
import {MarketWorkspace} from "@/components/features/market-workspace";
import styles from "./market.module.css";

export default function MarketPage(){
 return <section className={styles.market} aria-labelledby="market-title">
  <header className={styles.header}><div><p className={styles.eyebrow}>A wider perspective</p><h1 id="market-title" className={styles.title}>Market</h1><p className={styles.description}>Explore real listings with TradingView’s interactive chart. Use the symbol search to find stocks across supported exchanges.</p></div></header>
  <MarketWorkspace/>
  <p className={styles.note}><Info size={16} aria-hidden="true"/>TradingView supplies the market data; exchange delays and availability apply. Exploring the chart does not change your simulated holdings, returns, or scenarios.</p>
 </section>
}

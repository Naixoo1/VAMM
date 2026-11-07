"use client";
import {useState} from "react";
import {Tabs} from "radix-ui";
import {useMarketData} from "@/hooks/use-api-data";
import {IndexChart} from "./index-chart";
import {TradingViewChart} from "./tradingview-chart";
import {ErrorNotice,LoadingPanel,SourceLine} from "./workspace";
import styles from "./market-workspace.module.css";

export function MarketWorkspace(){
 const[view,setView]=useState("tradingview");
 const{data,error,loading,reload}=useMarketData();
 return <Tabs.Root value={view} onValueChange={setView} className={styles.workspace}>
  <p className={styles.label}>Practice Workspace</p>
  <Tabs.List className={styles.tabs} aria-label="Practice Workspace">
   <Tabs.Trigger className={styles.tab} value="tradingview">TradingView Chart</Tabs.Trigger>
   <Tabs.Trigger className={styles.tab} value="learning">Original Chart for Learning</Tabs.Trigger>
  </Tabs.List>
  {/* Keep the provider element connected so its selected symbol survives tab changes. */}
  <Tabs.Content className={styles.tabPanel} value="tradingview" forceMount hidden={view!=="tradingview"}><TradingViewChart variant="market"/></Tabs.Content>
  <Tabs.Content className={styles.tabPanel} value="learning">
   <section className={styles.learning} aria-labelledby="original-chart-title">
    <h2 id="original-chart-title" className={styles.title}>Original Chart for Learning</h2>
    <p className={styles.description}>Explore all available educational instruments together. This original synthetic index chart starts every basket at 100; its values are not asset prices.</p>
    {error&&<ErrorNotice message={error} onRetry={reload}/>}
    {loading&&!data&&<LoadingPanel message="Loading the original learning chart…"/>}
    {data&&(data.instruments.length>0&&data.chartSeries.length>0?<>
     <ul className={styles.instruments} aria-label="Available educational instruments">{data.instruments.map(instrument=><li key={instrument.id}>{instrument.name}</li>)}</ul>
     <IndexChart series={data.chartSeries}/>
     <SourceLine version={data.chartSeries[0].datasetVersion}/>
     <p className={styles.description}>Authored teaching assumptions, not forecasts or external market observations. These baskets stay separate from TradingView’s market data.</p>
    </>:<p className={styles.description} role="status">No educational chart data is available.</p>)}
   </section>
  </Tabs.Content>
 </Tabs.Root>
}

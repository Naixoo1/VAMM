"use client";
import Link from "next/link";
import {ArrowRight,Banknote,Landmark,Sprout} from "lucide-react";
import {useMarketData} from "@/hooks/use-api-data";
import {TradingViewChart} from "@/components/features/tradingview-chart";
import {Badge,ErrorNotice,LoadingPanel,PageHeading,Panel,SourceLine,ratio,styles} from "@/components/features/workspace";

const icons={cash:Banknote,bonds:Landmark,equity:Sprout};
export default function DashboardPage(){
 const{data,error,loading,reload}=useMarketData();
 return <>
  <PageHeading eyebrow="A clearer view of your future" title="Small steps. Lasting understanding." description="Explore the basics, make thoughtful choices, and see what happens over time."><Badge>Learning workspace</Badge></PageHeading>
  <section className={styles.intro}><div><p className={styles.eyebrow}>Your future starts with a question</p><h2>What could your savings become?</h2><p>Start from zero. Explore three synthetic years of choices, changing prices, and the unexpected.</p><Link href="/simulation" className={styles.button}>Explore the simulation <ArrowRight size={14} aria-hidden="true"/></Link></div><div className={styles.introArt} aria-hidden="true"><span className={styles.artBar}/><span className={styles.artBar}/><span className={styles.artBar}/></div></section>
  <div className={styles.stack}>
   <section aria-labelledby="synthetic-baskets-title">
    <div className={styles.sectionHead}><h2 id="synthetic-baskets-title">Meet the educational baskets</h2><p>Synthetic baskets · IDR</p></div>
    {error&&<ErrorNotice message={error} onRetry={reload}/>}
    {loading&&!data?<LoadingPanel message="Loading the educational baskets…"/>:data&&<>
     <div className={styles.grid3}>{data.instruments.map(instrument=>{
      const Icon=icons[instrument.assetClass];const growth=instrument.metrics.find(metric=>metric.key==="cumulative_return");
      return <article className={[styles.panel,styles.instrument].join(" ")} key={instrument.id}><div className={styles.row}><span className={styles.instrumentIcon}><Icon size={18} strokeWidth={1.5} aria-hidden="true"/></span><Badge tone="muted">Synthetic</Badge></div><h3 className={styles.instrumentName}>{instrument.name}</h3><p className={styles.instrumentSub}>Educational basket · IDR</p><p className={[styles.statValue,styles.positive].join(" ")}>{growth?.value==null?"Unavailable":ratio(growth.value)}</p><span className={styles.label}>Cumulative modeled return</span></article>;
     })}</div>
     {data.instruments.length===0&&<p className={styles.empty}>No educational baskets are available yet.</p>}
     <SourceLine version={data.instruments[0]?.datasetVersion}/>
     <p className={styles.fieldHelp}>These authored baskets are teaching assumptions. Their IDR values and modeled returns are independent of the external chart below.</p>
    </>}
   </section>
   <TradingViewChart variant="dashboard"/>
   <Panel title="Make room for understanding" description="A simple path through your workspace">
    <ol className={styles.list}>{[{title:"Explore the differences",text:"Compare the same synthetic period and see what each basket models.",href:"/compare"},{title:"Follow your curiosity",text:"Ask your mentor a question grounded in the teaching data.",href:"/research"},{title:"Learn through your choices",text:"Save, allocate, and decide how to fund an unexpected cost.",href:"/simulation"}].map((item,index)=><li className={styles.listItem} key={item.href}><span className={styles.listNumber}>{index+1}</span><div><h3><Link href={item.href} style={{color:"inherit",textDecoration:"none"}}>{item.title}</Link></h3><p>{item.text}</p></div></li>)}</ol>
    <div className={styles.divider}/><Badge tone="muted">No real money. Just room to learn.</Badge><p className={[styles.small,styles.muted].join(" ")}>Understanding comes from the process, not the biggest return.</p>
   </Panel>
  </div>
 </>;
}

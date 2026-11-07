import Image from "next/image";
import Link from "next/link";
import {Banknote,CalendarDays,ChartNoAxesCombined,GitCompareArrows,LockKeyhole} from "lucide-react";
import theme from "./team-design.module.css";

const features=[
 {href:"/market",title:"Market & charts",kind:"Market context",description:"Explore the provider’s real market chart and the separate original chart for learning.",image:"market",icon:null},
 {href:"/compare",title:"Compare instruments",kind:"Perspective",description:"Compare company views, then explore compatible synthetic basket metrics.",image:null,icon:GitCompareArrows},
 {href:"/research",title:"AI Investment Mentor",kind:"Curiosity",description:"Explore company context and ask a separate question grounded in frozen teaching evidence.",image:"mentor",icon:null},
 {href:"/simulation",title:"Simulation",kind:"Practice",description:"Save, allocate, and fund the unexpected across three synthetic years. Start from zero.",image:null,icon:ChartNoAxesCombined},
 {href:"/news",title:"News & Sentiment Lab",kind:"Context",description:"Follow live provider headlines and open the separate prewritten sentiment exercise.",image:"news",icon:null},
];

/** Presentation only. Fixed capabilities are not a user's live balance or progress. */
export function TeamHomeOverview(){
 return <div className={theme.overview} data-team-home="">
  <header className={theme.hero} data-motion-surface="heading"><div className={theme.heroContent}><div className={theme.heroMeta}><span className={theme.eyebrow}>Student investment lab</span><span className={theme.labStatus}>Learn · practice · reflect</span></div><h1>Learn to invest.<span>One move at a time.</span></h1><p>Explore real market context, ask questions about synthetic baskets, and practice three years of savings choices. A little understanding, every day.</p></div><figure className={theme.illustration}><Image src="/team-design/learning-chart.svg" width={380} height={248} alt="" unoptimized/><figcaption>Illustrative learning chart · not market data</figcaption></figure></header>
  <div className={theme.capabilities} aria-label="Fixed teaching defaults">
   <div className={theme.capability} data-motion-surface="panel"><span className={theme.capabilityIcon} aria-hidden="true"><Banknote size={19}/></span><p>Starting holdings</p><strong>Rp 0</strong><span>Each new simulation starts fresh</span></div>
   <div className={theme.capability} data-motion-surface="panel"><span className={theme.capabilityIcon} aria-hidden="true"><CalendarDays size={19}/></span><p>Practice horizon</p><strong>3 annual turns</strong><span>Deterministic teaching scenarios</span></div>
   <div className={theme.capability} data-motion-surface="panel"><span className={theme.capabilityIcon} aria-hidden="true"><LockKeyhole size={19}/></span><p>Your history</p><strong>On this device</strong><span>Shared browser profile can access it</span></div>
  </div>
  <section className={theme.features} aria-labelledby="team-features-title"><div className={theme.sectionHeading}><span>Five ways to explore</span><h2 id="team-features-title">What’s on VAMM</h2><p>Live context and synthetic learning tools stay clearly labeled.</p></div><ul className={theme.featureGrid}>{features.map((feature,index)=><li key={feature.href}><Link href={feature.href} className={theme.featureCard} aria-label={"Explore "+feature.title} data-motion-surface="panel"><span className={theme.featureNumber} aria-hidden="true">{String(index+1).padStart(2,"0")}</span><span className={theme.featureVisual} aria-hidden="true">{feature.image?<Image src={"/team-design/"+feature.image+".svg"} width={44} height={44} alt="" unoptimized/>:feature.icon?<feature.icon size={25} strokeWidth={1.7}/>:null}</span><div className={theme.featureCopy}><span className={theme.featureKind}>{feature.kind}</span><h3>{feature.title}</h3><p>{feature.description}</p></div></Link></li>)}</ul></section>
 </div>;
}

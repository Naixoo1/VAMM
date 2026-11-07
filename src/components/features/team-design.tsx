import Image from "next/image";
import Link from "next/link";
import {Banknote,CalendarDays,ChartNoAxesCombined,GitCompareArrows,LockKeyhole} from "lucide-react";
import {BrandLogo} from "./branding";
import {StudioArtwork} from "./studio-artwork";
import theme from "./team-design.module.css";

const features=[
 {href:"/market",title:"Market & charts",kind:"Market context",description:"Explore TradingView’s live market chart. Change symbols and check the provider’s timing and availability.",image:"market",icon:null},
 {href:"/compare",title:"Compare instruments",kind:"Perspective",description:"Compare company price movements on the provider’s percentage chart, with range and availability shown in the panel.",image:null,icon:GitCompareArrows},
 {href:"/research",title:"AI Investment Mentor",kind:"Curiosity",description:"Explore company context and ask a separate question grounded in frozen teaching evidence.",image:"mentor",icon:null},
 {href:"/simulation",title:"Simulation",kind:"Practice",description:"Save, allocate, and fund the unexpected across three synthetic years. Start from zero.",image:null,icon:ChartNoAxesCombined},
 {href:"/news",title:"News & Sentiment Lab",kind:"Context",description:"Follow automatically updating headlines and open a story to check its publisher and full context.",image:"news",icon:null},
 {href:"/academy",title:"Learning Academy",kind:"Foundations",description:"Build understanding through ten short lessons, source links, and a glossary. Your progress stays on this device.",image:"academy",icon:null},
 {href:"/missions",title:"Missions & Challenges",kind:"Knowledge check",description:"Try three reviewed quizzes, learn from answer explanations, and earn one-time learning XP.",image:"missions",icon:null},
];

/** Presentation only. Fixed capabilities are not a user's live balance or progress. */
export function TeamHomeOverview(){
 return <div className={theme.overview} data-team-home="">
  <header className={theme.hero} data-motion-surface="heading" data-studio-hero=""><div className={theme.heroContent}><div className={theme.heroMeta}><span className={theme.beacon} aria-hidden="true"/><span className={theme.eyebrow}>The VAMM learning studio</span></div><h1>Big ideas.<span>Small first steps.</span></h1><p>Find your footing in investing. Explore real market context, learn the basics, and practice savings choices across three synthetic years.</p><ol className={theme.principles} aria-label="Your learning loop"><li><span>01</span> Learn</li><li><span>02</span> Practice</li><li><span>03</span> Reflect</li></ol><p className={theme.heroNote}>Real curiosity. Virtual money. Your own pace.</p><figure className={theme.brandFigure}><BrandLogo variant="hero"/><figcaption>VAMM AI Teknologi</figcaption></figure></div><StudioArtwork/></header>
  <div className={theme.capabilities} aria-label="Fixed teaching defaults">
   <div className={theme.capability} data-motion-surface="panel"><span className={theme.capabilityIcon} aria-hidden="true"><Banknote size={19}/></span><p>Starting holdings</p><strong>Rp 0</strong><span>Each new simulation starts fresh</span></div>
   <div className={theme.capability} data-motion-surface="panel"><span className={theme.capabilityIcon} aria-hidden="true"><CalendarDays size={19}/></span><p>Practice horizon</p><strong>3 annual turns</strong><span>Deterministic teaching scenarios</span></div>
   <div className={theme.capability} data-motion-surface="panel"><span className={theme.capabilityIcon} aria-hidden="true"><LockKeyhole size={19}/></span><p>Your history</p><strong>On this device</strong><span>Shared browser profile can access it</span></div>
  </div>
  <section className={theme.features} aria-labelledby="team-features-title"><div className={theme.sectionHeading}><span>Seven ways to explore</span><h2 id="team-features-title">Find your next step</h2><p>Explore live market context and practice with the separate educational simulation.</p></div><ul className={theme.featureGrid}>{features.map((feature,index)=><li key={feature.href}><Link href={feature.href} className={theme.featureCard} data-accent={feature.image??"market"} aria-label={"Explore "+feature.title} data-motion-surface="panel"><span className={theme.featureNumber} aria-hidden="true">{String(index+1).padStart(2,"0")}</span><svg className={theme.featureMotif} viewBox="0 0 160 50" fill="none" aria-hidden="true" focusable="false"><path d="M1 39h23l17-23 21 16 24-24 24 13 23-10h26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="86" cy="8" r="4" fill="currentColor"/></svg><span className={theme.featureVisual} aria-hidden="true">{feature.image?<Image src={"/team-design/"+feature.image+".svg"} width={44} height={44} alt="" unoptimized/>:feature.icon?<feature.icon size={25} strokeWidth={1.7}/>:null}</span><div className={theme.featureCopy}><span className={theme.featureKind}>{feature.kind}</span><h3>{feature.title}</h3><p>{feature.description}</p></div></Link></li>)}</ul></section>
 </div>;
}

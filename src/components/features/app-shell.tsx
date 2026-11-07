"use client";
import Image from "next/image";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {ChartNoAxesCombined,ChevronRight,GitCompareArrows,House,LockKeyhole,PanelLeftClose,PanelLeftOpen,ShieldCheck,UserRound,X} from "lucide-react";
import {useEffect,useRef,useState,useSyncExternalStore,type ReactNode} from "react";
import {MotionBoundary} from "@/components/motion";
import {AccountControls} from "@/components/auth/account-controls";
import {styles} from "./workspace";
import {BrandLogo} from "./branding";
import shell from "./app-shell.module.css";

const mobileQuery="(max-width: 760px)";
function subscribeMobile(listener:()=>void){if(typeof window==="undefined"||typeof window.matchMedia!=="function")return()=>{};const media=window.matchMedia(mobileQuery);media.addEventListener("change",listener);return()=>media.removeEventListener("change",listener)}
function mobileSnapshot(){return typeof window!=="undefined"&&typeof window.matchMedia==="function"&&window.matchMedia(mobileQuery).matches}
const links=[
 {href:"/dashboard",name:"Home",icon:House,image:null},
 {href:"/market",name:"Market",icon:null,image:"market"},
 {href:"/research",name:"AI Investment Mentor",icon:null,image:"mentor"},
 {href:"/compare",name:"Compare",icon:GitCompareArrows,image:null},
 {href:"/simulation",name:"Simulation",icon:ChartNoAxesCombined,image:null},
 {href:"/news",name:"News & Sentiment Lab",icon:null,image:"news"},
 {href:"/academy",name:"Learning Academy",icon:null,image:"academy"},
 {href:"/missions",name:"Missions & Challenges",icon:null,image:"missions"},
 {href:"/profile",name:"Learning Profile",icon:UserRound,image:null},
];
const contexts:Record<string,{kicker:string;description:string;links:{href:string;label:string}[]}>={
 "/profile":{kicker:"Your learning record",description:"Review progress saved in this browser. Optional Google sign-in stays separate from your device history; no cloud sync or financial ranking.",links:[{href:"/profile",label:"Learning activity & account"},{href:"/academy",label:"Continue learning"},{href:"/missions",label:"Quiz challenges"}]},
 "/dashboard":{kicker:"Start with curiosity",description:"Explore live market context, compare instruments, and practice with the separate educational simulation.",links:[{href:"/market",label:"Explore the charts"},{href:"/simulation",label:"Practice from zero"},{href:"/research",label:"Chat with your mentor"}]},
 "/market":{kicker:"Observe & understand",description:"Explore TradingView’s live chart. Symbols, currency and delivery timing are determined by the provider.",links:[{href:"/market",label:"Real market chart"},{href:"/compare",label:"Compare instruments"}]},
 "/research":{kicker:"Follow your questions",description:"Ask questions, discuss a chart screenshot, and reopen conversations saved on this device.",links:[{href:"/research",label:"Your conversations"},{href:"/compare",label:"Explore the differences"}]},
 "/compare":{kicker:"A little perspective",description:"Compare compatible company views on the provider’s percentage chart. Check its currency, range and availability.",links:[{href:"/compare",label:"Instrument comparison"},{href:"/research",label:"Chat with your mentor"}]},
 "/simulation":{kicker:"Learn through choices",description:"Start at zero. Save, allocate, and address one unexpected cost in each of three years.",links:[{href:"/simulation",label:"Your simulation"},{href:"/compare",label:"Compare company listings"}]},
 "/news":{kicker:"Read the context",description:"Follow automatically updating provider headlines. Open a story to check its publisher and full context.",links:[{href:"/news",label:"Live market news"},{href:"/research",label:"Explore a question"}]},
 "/academy":{kicker:"Build your foundation",description:"Read short lessons, check primary sources, and track your learning on this device. Learning rewards never change your simulation.",links:[{href:"/academy",label:"Lessons & glossary"},{href:"/missions",label:"Practice with quizzes"}]},
 "/missions":{kicker:"Put ideas into practice",description:"Try reviewed questions, learn from each explanation, and earn learning XP once per passed quiz. No stock orders or financial rewards.",links:[{href:"/missions",label:"Quiz challenges"},{href:"/academy",label:"Review the lessons"},{href:"/news",label:"Read market headlines"}]},
};

export function AppShell({children}:{children:ReactNode}){
 const pathname=usePathname();
 const isMobile=useSyncExternalStore(subscribeMobile,mobileSnapshot,()=>false);
 const[collapsed,setCollapsed]=useState(false);const[mobileOpen,setMobileOpen]=useState(false);
 const aside=useRef<HTMLElement>(null);const opener=useRef<HTMLButtonElement>(null);const closer=useRef<HTMLButtonElement>(null);
 const active=links.find(link=>pathname.startsWith(link.href))??links[0];const context=contexts[active.href];
 const panelOpen=isMobile?mobileOpen:!collapsed;const modalOpen=isMobile&&mobileOpen;
 const external=["/market","/dashboard","/compare"].some(route=>pathname.startsWith(route));
 const menuLabel=isMobile?(mobileOpen?"Close workspace menu":"Open workspace menu"):(collapsed?"Show sidebar":"Hide sidebar");
 useEffect(()=>{
  if(!modalOpen)return;
  // The trigger becomes inert before this effect; capture its ref rather than the blurred BODY.
  const previous=opener.current;
  const previousOverflow=document.body.style.overflow;document.body.style.overflow="hidden";
  closer.current?.focus();
  function onKey(event:KeyboardEvent){
   if(event.key==="Escape"){event.preventDefault();setMobileOpen(false);return}
   if(event.key!=="Tab")return;
   const focusable=Array.from(aside.current?.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),[tabindex="0"]')??[]).filter(element=>!element.closest("[inert]")&&element.getClientRects().length>0);
   const first=focusable[0],last=focusable.at(-1);if(!first||!last)return;
   if(event.shiftKey&&(document.activeElement===first||!aside.current?.contains(document.activeElement))){event.preventDefault();last.focus()}
   else if(!event.shiftKey&&(document.activeElement===last||!aside.current?.contains(document.activeElement))){event.preventDefault();first.focus()}
  }
  document.addEventListener("keydown",onKey);
  return()=>{document.removeEventListener("keydown",onKey);document.body.style.overflow=previousOverflow;if(previous?.isConnected)previous.focus()};
 },[modalOpen]);
 function toggleMenu(){if(isMobile)setMobileOpen(value=>!value);else setCollapsed(value=>!value)}
 function followLink(){if(isMobile)setMobileOpen(false)}
 return <div className={[styles.shell,shell.shell].join(" ")} data-site-motion="" data-context-collapsed={collapsed} data-mobile-menu-open={mobileOpen}>
  <a href="#main-content" className={shell.skip}>Skip to main content</a>
  <aside ref={aside} className={shell.sidebar} role={modalOpen?"dialog":undefined} aria-label={modalOpen?"Workspace menu":undefined} aria-modal={modalOpen?true:undefined}>
   <div className={shell.rail}>
    <MotionBoundary preset="focus-ring" state="idle"><nav className={shell.nav} aria-label="Main navigation">{links.map(link=><Link key={link.href} href={link.href} aria-label={link.name} title={link.name} aria-current={active.href===link.href?"page":undefined} className={[shell.railLink,link.href==="/dashboard"?shell.homeLink:""].join(" ")} onClick={followLink}>{link.image?<Image src={"/team-design/"+link.image+".svg"} width={34} height={34} alt="" unoptimized/>:link.icon?<link.icon size={24} strokeWidth={1.7} aria-hidden="true"/>:null}<span className={shell.railLabel} aria-hidden="true">{({"/dashboard":"Home","/market":"Market","/research":"Mentor","/compare":"Compare","/simulation":"Practice","/news":"News","/academy":"Learn","/missions":"Quizzes","/profile":"Profile"} as Record<string,string>)[link.href]}</span></Link>)}</nav></MotionBoundary>
   </div>
   <section id="workspace-context" className={shell.contextPanel} aria-labelledby="workspace-context-title" inert={!panelOpen} aria-hidden={!panelOpen}>
    <Link href="/dashboard" className={shell.brand} aria-label="VAMM home" onClick={followLink}><BrandLogo decorative/></Link>
    <div className={shell.contextHeading}><div><p>Your space</p><h2 id="workspace-context-title">{active.name}</h2></div><button ref={closer} type="button" className={shell.close} aria-label="Close workspace menu" onClick={()=>setMobileOpen(false)}><X size={19} aria-hidden="true"/></button></div>
    <div className={shell.contextBody}><p className={shell.contextKicker}>{context.kicker}</p><ul className={shell.contextLinks}>{context.links.map(link=><li key={link.href}><Link href={link.href} className={shell.contextLink} aria-current={active.href===link.href?"page":undefined} onClick={followLink}>{link.label}<ChevronRight size={14} aria-hidden="true"/></Link></li>)}</ul><div className={shell.contextNote}><ShieldCheck size={20} strokeWidth={1.6} aria-hidden="true"/><p>{context.description}</p></div></div>
    <div className={shell.panelFoot}><span className={shell.dot} aria-hidden="true"/><div><strong>Student workspace</strong><p>Learn · practice · reflect</p></div></div>
   </section>
  </aside>
  {modalOpen&&<button type="button" className={shell.backdrop} aria-label="Dismiss workspace menu" tabIndex={-1} onClick={()=>setMobileOpen(false)}/>}
  <div className={shell.workspace} inert={modalOpen}>
   <header className={shell.toolbar}><div className={shell.toolbarStart}><button ref={opener} type="button" className={shell.menuButton} aria-label={menuLabel} title={menuLabel} aria-controls="workspace-context" aria-expanded={panelOpen} onClick={toggleMenu}>{panelOpen?<PanelLeftClose size={20} aria-hidden="true"/>:<PanelLeftOpen size={20} aria-hidden="true"/>}</button><span className={shell.toolbarBrand}>VAMM</span><span className={shell.toolbarDivider} aria-hidden="true">/</span><span className={shell.location}>{active.name}</span></div><div className={shell.toolbarEnd}><span className={shell.workspacePill}><span className={shell.dot} aria-hidden="true"/>{external?"Live market context":pathname.startsWith("/news")?"Live news context":"Educational workspace"}</span><AccountControls/></div></header>
   <main id="main-content" className={shell.main} tabIndex={-1}>
    <MotionBoundary preset="route-arrival" state="ready" motionKey={pathname}>{children}</MotionBoundary>
    <footer className={shell.footer}><p><LockKeyhole size={13} aria-hidden="true"/>Stored on this device; anyone using this browser profile can access it.</p><p>{pathname.startsWith("/research")?"Screenshot observations are not a live feed or guaranteed prediction · Educational use":external?"External market data · Provider timing and availability apply · Educational use":pathname.startsWith("/news")?"External news feed · Provider and publisher timing apply · Educational use":pathname.startsWith("/academy")||pathname.startsWith("/missions")||pathname.startsWith("/profile")?"Reviewed learning material · Progress on this device · Educational use":"Synthetic data · Educational use only"}</p></footer>
   </main>
  </div>
 </div>;
}

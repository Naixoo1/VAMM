"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {BookOpenText,ChartNoAxesCombined,GitCompareArrows,House,Leaf,LineChart,LockKeyhole,Newspaper,Sparkles} from "lucide-react";
import type {ReactNode} from "react";
import {MotionBoundary,MotionControls} from "@/components/motion";
import styles from "./workspace.module.css";
import motionStyles from "./app-shell-motion.module.css";

const links=[{href:"/dashboard",name:"Home",icon:House},{href:"/market",name:"Market",icon:LineChart},{href:"/research",name:"AI Investment Mentor",icon:Sparkles},{href:"/compare",name:"Compare",icon:GitCompareArrows},{href:"/simulation",name:"Simulation",icon:ChartNoAxesCombined},{href:"/news",name:"News & Sentiment Lab",icon:Newspaper}];

export function AppShell({children}:{children:ReactNode}){
 const pathname=usePathname();
 const external=["/market","/dashboard","/compare","/research"].some(route=>pathname.startsWith(route));
 const active=links.find(link=>pathname.startsWith(link.href));
 return <div className={styles.shell}>
  <a href="#main-content" className={styles.skip}>Skip to main content</a>
  <aside className={styles.sidebar}>
   <Link href="/dashboard" className={styles.brand} aria-label="VAMM home"><span className={styles.brandMark}><ChartNoAxesCombined size={21} strokeWidth={1.6} aria-hidden="true"/></span><span>VAMM<small>LEARN. SIMULATE. GROW.</small></span></Link>
   <p className={styles.navLabel}>Your workspace</p>
   <MotionBoundary preset="focus-ring" state="idle"><nav className={styles.nav} aria-label="Main navigation">{links.map(link=><Link key={link.href} href={link.href} aria-current={pathname.startsWith(link.href)?"page":undefined} className={[styles.navLink,pathname.startsWith(link.href)?styles.navActive:""].join(" ")}><link.icon size={17} strokeWidth={1.6} aria-hidden="true"/>{link.name}</Link>)}</nav></MotionBoundary>
   <div className={styles.sidebarFoot}><Leaf size={20} strokeWidth={1.4} aria-hidden="true"/><strong>A little learning, every day.</strong><p>Explore how your choices shape a simulated financial future.</p><p><LockKeyhole size={10} aria-hidden="true"/> Stored on this device; anyone using this browser profile can access it.</p></div>
  </aside>
  <div className={styles.workspace}>
   <div className={styles.topbar}><span className={styles.topbarTitle}><BookOpenText size={14} aria-hidden="true"/>Your learning workspace <span aria-hidden="true">/</span><strong>{active?.name??"VAMM"}</strong></span><span className={styles.topbarRight}><span className={styles.dot} aria-hidden="true"/>{external?"Live market context":"Educational workspace"}<span className={styles.avatar} aria-hidden="true">V</span></span></div>
   <div className={motionStyles.toolbar}><MotionControls/></div>
   <main id="main-content" className={styles.main} tabIndex={-1}>
    <MotionBoundary preset="route-arrival" state="ready" motionKey={pathname}>{children}</MotionBoundary>
    <footer className={styles.footer}><span className={styles.footerDisclosure}>Stored on this device; anyone using this browser profile can access it.</span><span>{external?"Live market context and synthetic learning tools labeled separately · Educational use":pathname.startsWith("/news")?"Live news and synthetic practice labeled separately · Educational use":"Synthetic data · Educational use only"}</span></footer>
   </main>
  </div>
 </div>;
}

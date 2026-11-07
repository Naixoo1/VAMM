import Image from "next/image";
import styles from "./branding.module.css";

/** The supplied original PNG is served unchanged; CSS only frames its outer whitespace. */
export function BrandLogo({variant="sidebar",decorative=false}:{variant?:"sidebar"|"hero";decorative?:boolean}){
 return <span className={[styles.frame,styles[variant]].join(" ")} data-brand-logo={variant} aria-hidden={decorative?true:undefined}>
  <Image className={styles.asset} src="/branding/vamm-ai-teknologi-original.png" width={1600} height={1600} alt={decorative?"":"VAMM AI Teknologi logo"} unoptimized/>
 </span>;
}

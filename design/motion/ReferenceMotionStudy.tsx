import {useState,useSyncExternalStore,type CSSProperties} from "react";
import "./ReferenceMotionStudy.css";

type Palette="silver"|"green"|"warm";
type SampleState="loading"|"ready"|"error";
const motionQuery="(prefers-reduced-motion: reduce)";
function subscribeMotion(callback:()=>void){if(typeof window==="undefined")return()=>{};const query=window.matchMedia(motionQuery);query.addEventListener("change",callback);return()=>query.removeEventListener("change",callback)}
function reducedSnapshot(){return typeof window==="undefined"||window.matchMedia(motionQuery).matches}
function seeded(value:number){let n=(value*1664525+1013904223)>>>0;n^=n>>>13;return(n>>>0)/4294967295}
function grain(seed:number){return Array.from({length:7},(_,index)=>{const x=(seeded(seed+index*37)-.5)*7;const y=(seeded(seed+index*67+9)-.5)*6;return x.toFixed(2)+"px "+y.toFixed(2)+"px 0 currentColor"}).join(",")}
function Glyph({kind}:{kind:"pause"|"play"|"replay"|"check"|"arrow"}){const paths={pause:"M8 5v14M16 5v14",play:"m8 5 11 7-11 7Z",replay:"M4 10a8 8 0 1 1 1 8M4 4v6h6",check:"m5 12 4 4L19 6",arrow:"M5 12h14m-6-6 6 6-6 6"};return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true"><path d={paths[kind]}/></svg>}
function ParticleHelix(){return <div className="vrs-helix" aria-hidden="true"><div className="vrs-axis">{Array.from({length:112},(_,index)=><div key={index} className="vrs-slice" style={{left:(index/111*100)+"%","--phase":index/111*760+"deg"} as CSSProperties}><span className="vrs-grain vrs-strand-one" style={{boxShadow:grain(index*91+17)}}/><span className="vrs-grain vrs-strand-two" style={{boxShadow:grain(index*53+81)}}/>{index%7===0&&Array.from({length:17},(_,rung)=><i key={rung} className="vrs-crossbar" style={{transform:"translate3d("+((seeded(index+rung)-.5)*2).toFixed(2)+"px,"+(-76+rung*9.5)+"px,0)",boxShadow:grain(index+rung*17)}}/>)}</div>)}</div></div>}
const stateCopy:Record<SampleState,{label:string;detail:string}>={loading:{label:"Opening your workspace",detail:"An indeterminate wait. No percentage, no promise."},ready:{label:"Ready when you are",detail:"In a real interface, the completed request ends the wait."},error:{label:"Something needs a second look",detail:"The error stays visible. Motion never hides a recovery action."}};

export const ReferenceMotionStudy=()=>{
 const[palette,setPalette]=useState<Palette>("silver");const[paused,setPaused]=useState(false);const[staticMode,setStaticMode]=useState(false);const[replay,setReplay]=useState(0);const[sample,setSample]=useState<SampleState>("loading");
 const systemReduced=useSyncExternalStore(subscribeMotion,reducedSnapshot,()=>true);
 const still=systemReduced||staticMode;const stopped=paused||sample!=="loading";
 return <main className="vrs" data-palette={palette} data-paused={stopped} data-static={still} data-sample={sample}>
  <div className="vrs-wrap">
   <header className="vrs-top"><a className="vrs-brand" href="#vrs-title" aria-label="VAMM motion study"><svg viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M5 24C3 14 25 14 23 4M6 4c-2 10 18 10 16 20M8 7l12 1M6 13l16 2M8 20l12 1" stroke="currentColor" strokeWidth="1.1"/></svg><strong>VAMM</strong><span>Motion studies</span></a><span className="vrs-edition"><b>01</b> / REFERENCE STUDY</span></header>
   <section className="vrs-intro"><div><p className="vrs-eyebrow">Borrow the feeling. Keep the purpose.</p><h1 id="vrs-title">The shape of waiting.</h1></div><p>A quiet particle helix, drawn from your reference.<br/>Less spectacle. A little more intention.</p></section>
   <section className="vrs-stage" aria-label="Interactive particle helix motion preview">
    <div className="vrs-stage-top"><span><i/> PARTICLE HELIX</span><span>{still?"STATIC STUDY":paused?"MOTION PAUSED":sample==="loading"?"SLOW AXIAL ROLL":"STATE AT REST"}</span></div>
    <div key={replay} className="vrs-motif"><ParticleHelix/></div>
    <div className="vrs-stage-caption"><div className="vrs-sample-copy" aria-live="polite">{sample==="ready"&&<span className="vrs-ready-mark"><Glyph kind="check"/></span>}<div><h2>{stateCopy[sample].label}</h2><p>{stateCopy[sample].detail}</p></div></div><span className="vrs-preview-label">MOTION PREVIEW<br/><b>No live request</b></span></div>
   </section>
   <div className="vrs-toolbar">
    <fieldset className="vrs-palettes"><legend>Color direction</legend>{([{id:"silver",name:"Reference silver"},{id:"green",name:"VAMM green"},{id:"warm",name:"Warm ivory"}] as const).map(item=><button key={item.id} type="button" aria-pressed={palette===item.id} onClick={()=>setPalette(item.id)}><i className={"vrs-color-"+item.id}/>{item.name}</button>)}</fieldset>
    <div className="vrs-playback"><button type="button" className="vrs-icon-button" disabled={still} onClick={()=>setPaused(value=>!value)}><Glyph kind={paused?"play":"pause"}/>{paused?"Resume motion":"Pause motion"}</button><button type="button" className="vrs-icon-button" disabled={still} onClick={()=>setReplay(value=>value+1)}><Glyph kind="replay"/>Replay motion</button><button type="button" className="vrs-static-toggle" role="switch" aria-checked={still} disabled={systemReduced} onClick={()=>setStaticMode(value=>!value)}><span><i/></span>Static mode</button></div>
   </div>
   <p className="vrs-system-note">{systemReduced?"Your system requests reduced motion. This preview stays static, even if playback is selected.":staticMode?"Static mode keeps the same composition, without rotation or shimmer.":"Pause holds the current frame. Replay restarts only the visual loop."}</p>
   <div className="vrs-bottom-grid">
    <section className="vrs-context"><p className="vrs-eyebrow">One motif, a few considered uses</p><h2>A small signature.<br/>Not a full-screen interruption.</h2><p>Use the expressive version only while an initial request is actually pending. Keep repeated waits small and inline; never add a minimum splash delay.</p><div className="vrs-use-list"><span><b>01</b> Workspace restoration</span><span><b>02</b> Mentor response</span><span><b>03</b> External market chart</span></div></section>
    <section className="vrs-state-map"><div className="vrs-map-heading"><p className="vrs-eyebrow">Try the state handoff</p><span>PRESENTATION ONLY</span></div><div className="vrs-state-buttons">{(["loading","ready","error"] as const).map(item=><button type="button" key={item} aria-pressed={sample===item} onClick={()=>setSample(item)}>{item==="loading"?"Waiting":item==="ready"?"Ready":"Unavailable"}</button>)}</div><h3>The task owns the timing.</h3><p>When real data is ready, show it immediately. When a request fails, reveal the error. The loop never delays completion or starts an action.</p><div className="vrs-rule"><Glyph kind="arrow"/><span>Actual request state → motion state<br/><b>Never animation → application state</b></span></div></section>
   </div>
   <footer className="vrs-footer"><span>Study 01 · Particle helix</span><span>A separate exploration. Your current app design stays unchanged.</span></footer>
  </div>
 </main>
};

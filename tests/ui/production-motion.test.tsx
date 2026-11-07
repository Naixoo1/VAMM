// @vitest-environment jsdom
import {useEffect,useState} from "react";
import {renderToString} from "react-dom/server";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {act,cleanup,fireEvent,render,screen} from "@testing-library/react";
import {MotionBoundary,MotionControls,MotionMark,MotionPreferenceProvider,MOTION_PRESETS} from "@/components/motion";
import {LoadingPanel,ErrorNotice} from "@/components/features/workspace";

let reduced=false;
let listeners:Set<()=>void>;
let oldMatchMedia:PropertyDescriptor|undefined;
beforeEach(()=>{
 reduced=false;listeners=new Set();oldMatchMedia=Object.getOwnPropertyDescriptor(window,"matchMedia");
 const media={get matches(){return reduced},media:"(prefers-reduced-motion: reduce)",addEventListener:(_event:string,listener:()=>void)=>listeners.add(listener),removeEventListener:(_event:string,listener:()=>void)=>listeners.delete(listener)};
 Object.defineProperty(window,"matchMedia",{configurable:true,writable:true,value:()=>media as unknown as MediaQueryList});
 vi.stubGlobal("fetch",vi.fn());
});
afterEach(()=>{cleanup();vi.unstubAllGlobals();if(oldMatchMedia)Object.defineProperty(window,"matchMedia",oldMatchMedia);else Reflect.deleteProperty(window,"matchMedia")});
function setReduced(value:boolean){act(()=>{reduced=value;for(const listener of listeners)listener()})}
const scope=()=>document.querySelector("[data-motion-scope]")!;
describe("Production motion boundaries",()=>{
 it("covers all24 treatments with bounded deterministic artwork and no provider dependency",()=>{
  const entries=Object.entries(MOTION_PRESETS);
  expect(entries).toHaveLength(24);expect(new Set(entries.map(([,preset])=>preset.number)).size).toBe(24);
  render(<>{entries.map(([id])=><MotionMark key={id} preset={id}/>)}</>);
  for(const[id]of entries){const mark=document.querySelector('[data-motion-preset="'+id+'"]')!;expect(mark).not.toBeNull();expect(mark.getAttribute("data-motion-static")).toBe("true");expect(mark.getAttribute("data-motion-running")).toBe("false")}
  for(const artwork of document.querySelectorAll("[data-motion-artwork]"))expect(artwork.querySelectorAll("circle,path,rect,line,polyline,polygon,ellipse").length).toBeLessThanOrEqual(36);
  expect(fetch).not.toHaveBeenCalled();
 });
 it("has stable SSR output and a safe static fallback for unknown IDs",()=>{
  const first=renderToString(<MotionMark preset="reference-helix"/>);const second=renderToString(<MotionMark preset="reference-helix"/>);
  expect(first).toBe(second);expect(first).toContain('data-motion-static="true"');expect(first).not.toContain("<script");
  render(<MotionMark preset="unknown-input"/>);expect(document.querySelector('[data-motion-preset="returning-static"]')).not.toBeNull();
 });
 it("pauses loops without changing their eligible state or issuing a request",()=>{
  render(<MotionPreferenceProvider><MotionControls/><MotionMark preset="mentor-orbit"/></MotionPreferenceProvider>);
  const mark=document.querySelector('[data-motion-preset="mentor-orbit"]')!;
  expect(mark.getAttribute("data-motion-running")).toBe("true");
  fireEvent.click(screen.getByRole("button",{name:"Pause animations"}));
  expect(scope().getAttribute("data-motion-paused")).toBe("true");expect(mark.getAttribute("data-motion-eligible")).toBe("true");expect(mark.getAttribute("data-motion-running")).toBe("false");
  fireEvent.click(screen.getByRole("button",{name:"Resume animations"}));expect(mark.getAttribute("data-motion-running")).toBe("true");expect(fetch).not.toHaveBeenCalled();
 });
 it("honors manual static and runtimeOS preference with truthful switch semantics",()=>{
  render(<MotionPreferenceProvider><MotionControls/><MotionMark preset="workspace-restore"/></MotionPreferenceProvider>);
  const toggle=screen.getByRole("switch",{name:"Static motion"}) as HTMLButtonElement;
  fireEvent.click(toggle);expect(toggle.getAttribute("aria-checked")).toBe("true");expect(scope().getAttribute("data-motion-static")).toBe("true");
  fireEvent.click(toggle);expect(scope().getAttribute("data-motion-static")).toBe("false");
  setReduced(true);expect(toggle.getAttribute("aria-checked")).toBe("true");expect(toggle.disabled).toBe(true);expect(scope().getAttribute("data-motion-os-reduced")).toBe("true");expect((screen.getByRole("button",{name:"Pause animations"}) as HTMLButtonElement).disabled).toBe(true);
  setReduced(false);expect(toggle.disabled).toBe(false);expect(toggle.getAttribute("aria-checked")).toBe("false");
 });
 it("keeps financial content immediate and never turns animation events into an action",()=>{
  const onAction=vi.fn();
  render(<MotionPreferenceProvider><MotionBoundary preset="turn-confirmed" state="ready"><output>Rp 2.714.400</output><button type="button" onClick={onAction}>Continue</button></MotionBoundary></MotionPreferenceProvider>);
  expect(screen.getByText("Rp 2.714.400")).toBeTruthy();expect((screen.getByRole("button",{name:"Continue"}) as HTMLButtonElement).disabled).toBe(false);
  fireEvent.animationEnd(document.querySelector("[data-motion-artwork]")!);expect(onAction).not.toHaveBeenCalled();expect(screen.getByText("Rp 2.714.400")).toBeTruthy();expect(fetch).not.toHaveBeenCalled();
 });
 it("restarts decoration without remounting children or losing manual preferences",()=>{
  const mount=vi.fn();
  function Child(){const[count,setCount]=useState(0);useEffect(()=>{mount()},[]);return <button type="button" onClick={()=>setCount(value=>value+1)}>Child count {count}</button>}
  function Example({motionKey}:{motionKey:string}){return <MotionPreferenceProvider><MotionControls/><MotionBoundary preset="selection-morph" motionKey={motionKey}><Child/></MotionBoundary></MotionPreferenceProvider>}
  const view=render(<Example motionKey="first"/>);fireEvent.click(screen.getByRole("button",{name:"Child count 0"}));fireEvent.click(screen.getByRole("switch",{name:"Static motion"}));
  view.rerender(<Example motionKey="second"/>);expect(screen.getByRole("button",{name:"Child count 1"})).toBeTruthy();expect(mount).toHaveBeenCalledTimes(1);expect(scope().getAttribute("data-motion-static")).toBe("true");
 });
 it("stops loading effects at actual ready/error while static treatments never loop",()=>{
  function Example({state}:{state:"loading"|"ready"|"error"}){return <MotionPreferenceProvider><MotionMark preset="chart-loading" state={state}/><MotionMark preset="news-static" state="loading"/></MotionPreferenceProvider>}
  const view=render(<Example state="loading"/>);expect(document.querySelector('[data-motion-preset="chart-loading"]')!.getAttribute("data-motion-running")).toBe("true");expect(document.querySelector('[data-motion-preset="news-static"]')!.getAttribute("data-motion-running")).toBe("false");
  view.rerender(<Example state="ready"/>);expect(document.querySelector('[data-motion-preset="chart-loading"]')!.getAttribute("data-motion-eligible")).toBe("false");
  view.rerender(<Example state="error"/>);expect(document.querySelector('[data-motion-preset="chart-loading"]')!.getAttribute("data-motion-eligible")).toBe("false");
 });
 it("preserves existing status/error text and offers no nonfunctional controls without a provider",()=>{
  render(<><MotionControls/><LoadingPanel message="Restoring session"/><ErrorNotice message="Storage is unavailable"/></>);
  expect(screen.getByRole("status").textContent).toBe("Restoring session");expect(screen.getByRole("alert").textContent).toContain("Storage is unavailable");expect(screen.queryByRole("group",{name:"Animation preferences"})).toBeNull();
 });
});

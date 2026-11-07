export type MotionState="loading"|"ready"|"error"|"idle";
export type MotionKind="helix"|"orbit"|"line"|"check"|"skeleton"|"grain"|"focus";
export interface MotionPreset {number:string;name:string;kind:MotionKind;palette:"silver"|"green"|"ivory";behavior:"loop"|"static"|"arrival"|"focus";seconds:number;compact:boolean}
export const MOTION_PRESETS={
 "reference-helix":{number:"01",name:"Silver reference helix",kind:"helix",palette:"silver",behavior:"loop",seconds:22,compact:false},
 "workspace-restore":{number:"02",name:"Green workspace helix",kind:"helix",palette:"green",behavior:"loop",seconds:20,compact:true},
 "returning-static":{number:"03",name:"Ivory static helix",kind:"helix",palette:"ivory",behavior:"static",seconds:0,compact:true},
 "content-arrival":{number:"04",name:"Content constellation settle",kind:"grain",palette:"silver",behavior:"arrival",seconds:.18,compact:true},
 "query-inline":{number:"05",name:"Compact query helix",kind:"helix",palette:"green",behavior:"loop",seconds:18,compact:true},
 "chart-loading":{number:"06",name:"External chart helix",kind:"helix",palette:"silver",behavior:"loop",seconds:22,compact:true},
 "mentor-orbit":{number:"07",name:"Mentor evidence orbit",kind:"orbit",palette:"green",behavior:"loop",seconds:16,compact:true},
 "evidence-arrival":{number:"08",name:"Evidence orbit settle",kind:"orbit",palette:"silver",behavior:"arrival",seconds:.18,compact:true},
 "research-fallback":{number:"09",name:"Static fallback orbit",kind:"orbit",palette:"ivory",behavior:"static",seconds:0,compact:true},
 "preview-signal":{number:"10",name:"Neutral contribution signal",kind:"line",palette:"green",behavior:"loop",seconds:3.6,compact:true},
 "selection-morph":{number:"11",name:"Selection signal settle",kind:"line",palette:"silver",behavior:"arrival",seconds:.18,compact:true},
 "turn-confirmed":{number:"12",name:"Committed turn check",kind:"check",palette:"ivory",behavior:"arrival",seconds:.16,compact:true},
 "shock-settled":{number:"13",name:"Settled shock check",kind:"check",palette:"green",behavior:"static",seconds:0,compact:true},
 "storage-error":{number:"14",name:"Paused storage grain",kind:"grain",palette:"silver",behavior:"static",seconds:0,compact:true},
 "empty-line":{number:"15",name:"Unavailable static line",kind:"line",palette:"ivory",behavior:"static",seconds:0,compact:true},
 "news-thumbnail":{number:"16",name:"News thumbnail helix",kind:"helix",palette:"green",behavior:"loop",seconds:20,compact:true},
 "news-skeleton":{number:"17",name:"Outer news skeleton",kind:"skeleton",palette:"silver",behavior:"loop",seconds:2.8,compact:false},
 "news-static":{number:"18",name:"Static news skeleton",kind:"skeleton",palette:"ivory",behavior:"static",seconds:0,compact:false},
 "news-arrival":{number:"19",name:"News host arrival",kind:"grain",palette:"green",behavior:"arrival",seconds:.18,compact:true},
 "feed-paused":{number:"20",name:"Hidden feed orbit",kind:"orbit",palette:"silver",behavior:"static",seconds:0,compact:true},
 "route-arrival":{number:"21",name:"Route divider settle",kind:"line",palette:"ivory",behavior:"arrival",seconds:.16,compact:true},
 "focus-ring":{number:"22",name:"Static keyboard focus",kind:"focus",palette:"green",behavior:"focus",seconds:0,compact:true},
 "stale-context":{number:"23",name:"Retained context grain",kind:"grain",palette:"silver",behavior:"static",seconds:0,compact:true},
 "reset-confirmed":{number:"24",name:"Saved reset check",kind:"check",palette:"green",behavior:"static",seconds:0,compact:true}
} as const satisfies Record<string,MotionPreset>;
export type MotionPresetId=keyof typeof MOTION_PRESETS;
export function resolveMotionPreset(id:string):{id:MotionPresetId;preset:MotionPreset}{
 const key=Object.prototype.hasOwnProperty.call(MOTION_PRESETS,id)?id as MotionPresetId:"returning-static";
 return{id:key,preset:MOTION_PRESETS[key]};
}

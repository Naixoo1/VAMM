import {Suspense} from "react";
import {MissionsWorkspace} from "@/components/learning/missions";
import {LoadingPanel} from "@/components/features/workspace";
export default function MissionsPage(){return <Suspense fallback={<LoadingPanel message="Opening Missions & Challenges…"/>}><MissionsWorkspace/></Suspense>}

import {Suspense} from "react";
import {AcademyWorkspace} from "@/components/learning/academy";
import {LoadingPanel} from "@/components/features/workspace";
export default function AcademyPage(){return <Suspense fallback={<LoadingPanel message="Opening Learning Academy…"/>}><AcademyWorkspace/></Suspense>}

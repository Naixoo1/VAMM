"use client";
import {useQuery} from "@tanstack/react-query";
import type {Result,MarketResponse,NewsResponse} from "@/contracts";
export function useApiData<T>(url:string){
 const query=useQuery<T,Error>({queryKey:["vamm-data",url],queryFn:async({signal})=>{
  const response=await fetch(url,{signal});
  const result=await response.json() as Result<T>;
  if(result.ok)return result.data;
  throw new Error(result.error?.message??"We couldn’t load this data. Check your connection and try again.");
 },retry:false,refetchOnWindowFocus:false,staleTime:60_000});
 return{data:query.data??null,error:query.error?.message??null,loading:query.isPending||query.isFetching,reload:()=>{void query.refetch()}};
}
export const useMarketData=()=>useApiData<MarketResponse>("/api/market");
export const useNewsData=()=>useApiData<NewsResponse>("/api/news");

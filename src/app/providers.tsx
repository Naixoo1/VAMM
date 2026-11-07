"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { MotionPreferenceProvider } from "@/components/motion";
export function Providers({ children }: { children: ReactNode }) { const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 60000, refetchOnWindowFocus: false }, mutations: { retry: false } } })); return <QueryClientProvider client={client}><MotionPreferenceProvider>{children}</MotionPreferenceProvider></QueryClientProvider>; }

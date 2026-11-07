import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import { AppShell } from "@/components/features/app-shell";
import "./globals.css";
export const metadata: Metadata = { title: { default: "VAMM · Learn through choices", template: "%s · VAMM" }, description: "An educational, synthetic savings simulation. Explore three baskets, make choices, and understand purchasing power." };
export default function RootLayout({ children }: { children: ReactNode }) { return <html lang="en"><body><Providers><AppShell>{children}</AppShell></Providers></body></html>; }

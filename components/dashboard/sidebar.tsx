"use client";

import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard, AlertTriangle, Layers, Lightbulb, FileText, ChevronRight, ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  showBack?: boolean;
}

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "features", label: "Features", icon: Layers },
  { id: "risks", label: "Risks", icon: AlertTriangle },
  { id: "recommendations", label: "Recommendations", icon: Lightbulb },
  { id: "report", label: "Full Report", icon: FileText },
];

export function Sidebar({ activeSection, onSectionChange, showBack = false }: SidebarProps) {
  return (
    <aside className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <Image src="/bob-mascot.png" alt="BobOps mascot" width={40} height={40} className="rounded-lg" />
          <span className="font-semibold text-white">BobOps</span>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">
          Analysis
        </div>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#9f1239] text-white"
                      : "text-slate-400 hover:text-white hover:bg-[#1e3a5f]"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4" />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        {showBack ? (
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1e3a5f] hover:bg-[#1e3a5f]/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-300" />
            <span className="text-xs text-slate-300">New Analysis</span>
          </Link>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1e3a5f]">
            <Image src="/bob-mascot.png" alt="BobOps" width={20} height={20} className="rounded" />
            <span className="text-xs text-slate-300">Analysis Complete</span>
          </div>
        )}
      </div>
    </aside>
  );
}

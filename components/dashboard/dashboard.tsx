"use client";

import { useState } from "react";
import Image from "next/image";
import { Sidebar } from "./sidebar";
import { DashboardContent } from "./dashboard-content";
import { mockAnalysisResult } from "@/lib/mock-data";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Dashboard() {
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#0f172a]">
      {/* Mobile sidebar overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 transform transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar
          activeSection={activeSection}
          onSectionChange={(section) => {
            setActiveSection(section);
            setSidebarOpen(false);
          }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-[#3b4f6b] bg-[#1e293b]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-[#1e3a5f]"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <Image
              src="/bob-mascot.png"
              alt="BobOps mascot"
              width={28}
              height={28}
              className="rounded-md"
            />
            <span className="font-semibold text-white">BobOps</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "p-2 rounded-lg hover:bg-[#1e3a5f]",
              !sidebarOpen && "invisible"
            )}
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </header>

        <DashboardContent
          activeSection={activeSection}
          data={mockAnalysisResult}
        />
      </div>
    </div>
  );
}

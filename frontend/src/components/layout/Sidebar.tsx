"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { UserRole } from "@/lib/types";
import {
  LayoutDashboard,
  Camera,
  Image as ImageIcon,
  Cpu,
  BarChart3,
  Database,
  Layers,
  Sparkles,
  TrendingUp,
  FileText,
  Key,
  ShieldCheck,
  History,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  LogOut,
  UserCheck
} from "lucide-react";

interface NavGroup {
  title: string;
  items: {
    label: string;
    href: string;
    icon: React.ElementType;
    minRole?: UserRole;
    badge?: string;
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Core Vision",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Live Face Detection", href: "/live-detection", icon: Camera, badge: "Live" },
      { label: "Image Analysis", href: "/image-analysis", icon: ImageIcon },
    ],
  },
  {
    title: "AI Governance",
    items: [
      { label: "AI Models", href: "/models", icon: Cpu, minRole: "Operator" },
      { label: "Model Evaluation", href: "/model-evaluation", icon: BarChart3, minRole: "Operator" },
      { label: "Datasets", href: "/datasets", icon: Database, minRole: "Administrator" },
      { label: "Training Management", href: "/training", icon: Layers, minRole: "Operator" },
    ],
  },
  {
    title: "Intelligence & Insights",
    items: [
      { label: "RAG Assistant", href: "/rag-assistant", icon: Sparkles, badge: "AI" },
      { label: "Analytics", href: "/analytics", icon: TrendingUp },
      { label: "Reports & Exports", href: "/reports", icon: FileText },
      { label: "API Management", href: "/api-management", icon: Key, minRole: "Administrator" },
    ],
  },
  {
    title: "Security & Admin",
    items: [
      { label: "Security Center", href: "/security", icon: ShieldCheck, minRole: "Administrator" },
      { label: "Activity Logs", href: "/activity-logs", icon: History, minRole: "Operator" },
      { label: "User Management", href: "/users", icon: Users, minRole: "Administrator" },
      { label: "System Settings", href: "/settings", icon: Settings, minRole: "Super Administrator" },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, role, hasRole, switchDemoRole, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const rolesList: UserRole[] = [
    "Super Administrator",
    "Administrator",
    "Operator",
    "Read-only Analyst",
  ];

  return (
    <aside
      className={`relative flex flex-col bg-navy-950 border-r border-slate-800/80 transition-all duration-300 z-30 select-none ${
        collapsed ? "w-20" : "w-72"
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80 bg-navy-900/50">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-electric-600 via-electric-500 to-accent-500 flex items-center justify-center shadow-lg shadow-electric-500/20">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                AI VISION
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-electric-500/20 text-electric-400 font-medium border border-electric-500/30">
                  SaaS
                </span>
              </div>
              <div className="text-[11px] text-slate-400">Computer Vision Platform</div>
            </div>
          </Link>
        )}

        {collapsed && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-electric-600 to-accent-500 flex items-center justify-center mx-auto">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg bg-navy-850 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!collapsed && (
              <div className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {group.title}
              </div>
            )}
            {group.items.map((item, iIdx) => {
              const active = pathname === item.href;
              const permitted = !item.minRole || hasRole(item.minRole);
              const Icon = item.icon;

              if (!permitted && !collapsed) {
                return (
                  <div
                    key={iIdx}
                    className="flex items-center px-3 py-2 text-xs font-medium text-slate-400 cursor-not-allowed opacity-40"
                    title={`Restricted to ${item.minRole}+`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    <span>{item.label}</span>
                    <ShieldAlert className="w-3.5 h-3.5 ml-auto text-slate-400" />
                  </div>
                );
              }

              return (
                <Link
                  key={iIdx}
                  href={item.href}
                  className={`flex items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                    active
                      ? "bg-gradient-to-r from-electric-500/20 to-accent-500/10 text-electric-400 border border-electric-500/30 shadow-md shadow-electric-500/5 font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-navy-850/80"
                  }`}
                  title={item.label}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-colors ${
                      active ? "text-electric-400" : "text-slate-400 group-hover:text-slate-200"
                    } ${!collapsed ? "mr-3" : "mx-auto"}`}
                  />
                  {!collapsed && (
                    <>
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto text-[10px] px-1.5 py-0.2 rounded-full bg-electric-500/20 text-electric-400 font-semibold border border-electric-500/30">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Role Switcher & User Profile Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-navy-900/40 space-y-2">
        {!collapsed && (
          <div className="bg-navy-850 p-2.5 rounded-lg border border-slate-800/70">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-electric-400" /> Active Role
              </span>
              <span className="text-[10px] font-mono text-electric-400 bg-electric-500/10 px-1 rounded">
                RBAC
              </span>
            </div>
            <select
              value={role}
              onChange={(e) => switchDemoRole(e.target.value as UserRole)}
              className="w-full text-xs bg-navy-950 border border-slate-700/80 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-electric-400"
            >
              {rolesList.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Current User Card */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-navy-850/60 border border-slate-800/50">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent-600 to-electric-500 flex items-center justify-center font-bold text-xs text-white">
              {user?.full_name?.charAt(0) || "U"}
            </div>
            {!collapsed && (
              <div className="truncate">
                <div className="text-xs font-semibold text-slate-200 truncate">{user?.full_name || "User"}</div>
                <div className="text-[10px] text-slate-400 truncate">{user?.role}</div>
              </div>
            )}
          </div>
          <button
            onClick={() => logout()}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};


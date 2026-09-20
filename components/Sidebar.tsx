"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  UserCheck,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { LogoutModal } from "./LogoutModal";
import { useAuth } from "@/lib/AuthContext";

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const { isSuperAdmin, role } = useAuth();

  // Core navigation items accessible by both roles
  const baseNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Orders", href: "/orders", icon: ShoppingBag },
    { name: "Inventory", href: "/inventory", icon: Package },
    { name: "Team", href: "/team", icon: Users },
  ];

  // Customers is ONLY appended for Super Admin, immediately after Team
  const navItems = isSuperAdmin
    ? [
        ...baseNavItems,
        { name: "Customers", href: "/customers", icon: UserCheck },
      ]
    : baseNavItems;

  const bottomItems = [
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-sm border border-gray-200"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation menu"
      >
        {isOpen ? <X size={20} className="text-navy" /> : <Menu size={20} className="text-navy" />}
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`
          fixed md:sticky top-0 left-0 h-screen flex flex-col
          transition-transform duration-300 z-40
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        style={{ width: 230, backgroundColor: "#0B2A63", color: "white", minHeight: "100vh" }}
      >
        {/* ── Logo ── */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-end gap-1 leading-none mb-0.5">
            <span
              className="font-black italic"
              style={{ fontSize: 38, color: "#E31B23", lineHeight: 1 }}
            >
              K
            </span>
            <span
              className="font-black italic tracking-widest"
              style={{ fontSize: 20, color: "white", lineHeight: 1, marginBottom: 2 }}
            >
              KMART
            </span>
          </div>
          <div className="flex items-center justify-between">
            <p
              className="uppercase tracking-widest font-medium"
              style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: "0.2em" }}
            >
              Admin Panel
            </p>
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase"
              style={{
                backgroundColor: isSuperAdmin ? "rgba(227, 27, 35, 0.25)" : "rgba(255, 255, 255, 0.15)",
                color: isSuperAdmin ? "#FF8A90" : "rgba(255, 255, 255, 0.7)",
                border: isSuperAdmin ? "1px solid rgba(227, 27, 35, 0.4)" : "1px solid rgba(255,255,255,0.2)",
              }}
            >
              {isSuperAdmin ? "Super" : "Admin"}
            </span>
          </div>
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
                  isActive
                    ? "text-white shadow-sm"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
                style={
                  isActive
                    ? { backgroundColor: "#E31B23" }
                    : {}
                }
              >
                <item.icon size={19} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* ── Bottom section with decorative CSS shape ── */}
        <div className="relative overflow-hidden">
          {/* CSS diagonal red + dark navy decorative wedge */}
          <div
            className="absolute pointer-events-none"
            style={{
              bottom: 0,
              left: 0,
              right: 0,
              height: 140,
              overflow: "hidden",
            }}
          >
            {/* Dark navy angled block */}
            <div
              style={{
                position: "absolute",
                bottom: -30,
                left: -20,
                width: 200,
                height: 130,
                backgroundColor: "#071D4A",
                transform: "rotate(-18deg)",
                transformOrigin: "bottom left",
                borderRadius: 6,
              }}
            />
            {/* Red diagonal slash */}
            <div
              style={{
                position: "absolute",
                bottom: -20,
                right: -10,
                width: 110,
                height: 160,
                backgroundColor: "#E31B23",
                transform: "rotate(-18deg)",
                transformOrigin: "bottom right",
                borderRadius: 4,
              }}
            />
          </div>

          {/* Profile & Logout links */}
          <div className="px-3 py-2 space-y-1 relative z-10">
            {bottomItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
                    isActive
                      ? "text-white"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                  style={isActive ? { backgroundColor: "#E31B23" } : {}}
                >
                  <item.icon size={19} />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            <button
              onClick={() => setShowLogout(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm font-semibold"
            >
              <LogOut size={19} />
              <span>Logout</span>
            </button>
          </div>

          {/* Tagline */}
          <div className="px-6 pb-5 pt-2 relative z-10">
            <p className="text-white font-bold text-sm leading-snug">
              Better Essentials
            </p>
            <p className="text-white/70 text-sm font-medium">Brighter Everyday</p>
          </div>
        </div>
      </aside>

      <LogoutModal isOpen={showLogout} onClose={() => setShowLogout(false)} />
    </>
  );
}

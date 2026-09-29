"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStaff, getStores, StaffMember, Store } from "@/lib/supabaseService";
import { Plus, ChevronDown, Receipt, Trash2, X, Download } from "lucide-react";
import Link from "next/link";
import { DeleteTeamMemberModal } from "@/components/DeleteTeamMemberModal";
import { ExportModal, ColumnDefinition } from "@/components/ExportModal";

// Avatar with initials
function Avatar({ name }: { name: string }) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "ST";
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
      style={{ backgroundColor: "#1A3A6B", color: "#fff" }}
    >
      {initials}
    </div>
  );
}

// Role badge
function RoleBadge({ role }: { role: string }) {
  const isPacker = role?.toUpperCase() === "PACKER";
  return (
    <span
      className="inline-flex items-center px-4 py-1 rounded-lg text-sm font-semibold"
      style={
        isPacker
          ? { backgroundColor: "#DBEAFE", color: "#1D4ED8" }
          : { backgroundColor: "#FEF3C7", color: "#92400E" }
      }
    >
      {role}
    </span>
  );
}

// Store dropdown
function StoreDropdown({
  value,
  stores,
  onChange,
}: {
  value: string;
  stores: Store[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const storeOptions = ["All Stores", ...stores.map((s) => s.name)];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors min-w-[140px] justify-between"
        style={{ color: "#102452" }}
      >
        <span>{value}</span>
        <ChevronDown size={14} className={`text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-40 bg-white rounded-xl border border-gray-100 shadow-xl z-20 py-1 overflow-hidden">
          {storeOptions.map((s) => (
            <button
              key={s}
              onClick={() => {
                onChange(s);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm font-medium transition-colors"
              style={value === s ? { backgroundColor: "#0B2A63", color: "#fff" } : { color: "#374151" }}
              onMouseEnter={(e) => {
                if (value !== s) e.currentTarget.style.backgroundColor = "#F9FAFB";
              }}
              onMouseLeave={(e) => {
                if (value !== s) e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type Tab = "All" | "PACKER" | "DELIVERY";

const TEAM_EXPORT_COLUMNS: ColumnDefinition[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
  { key: "employee_id", label: "Employee ID" },
  { key: "store_name", label: "Store" },
];

export default function TeamPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [store, setStore] = useState("All Stores");
  const [stores, setStores] = useState<Store[]>([]);
  const [team, setTeam] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberToDelete, setMemberToDelete] = useState<StaffMember | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    async function loadStores() {
      try {
        const storeList = await getStores();
        setStores(storeList);
      } catch (err) {
        console.error("Failed to load stores:", err);
      }
    }
    loadStores();
  }, []);

  useEffect(() => {
    async function loadTeam() {
      try {
        setLoading(true);
        const members = await getStaff(activeTab, store);
        setTeam(members);
      } catch (err) {
        console.error("Failed to load staff:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTeam();
  }, [activeTab, store]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "All", label: "All" },
    { key: "PACKER", label: "Packers" },
    { key: "DELIVERY", label: "Delivery" },
  ];

  return (
    <div className="space-y-5 pb-8">
      {notice && (
        <div className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm font-medium ${notice.kind === "success" ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"}`} role={notice.kind === "error" ? "alert" : "status"}>
          <span>{notice.message}</span>
          <button aria-label="Dismiss notification" className="rounded p-1 hover:bg-black/5" onClick={() => setNotice(null)} type="button"><X size={16} /></button>
        </div>
      )}
      {/* Heading row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: "#102452" }}>Team</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your packing and delivery team members.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={() => setExportOpen(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50" type="button">
            <Download size={16} /> Export Excel
          </button>
          <Link
            href="/team/add"
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold text-white transition-colors shadow-sm"
            style={{ backgroundColor: "#E31B23" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#c41520")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#E31B23")}
          >
            <Plus size={16} />
            Add Team Member
          </Link>
        </div>
      </div>

      {/* Tabs + store filter row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="px-5 py-2 rounded-xl text-sm font-bold transition-all"
              style={
                activeTab === t.key
                  ? { backgroundColor: "#0B2A63", color: "#fff" }
                  : { backgroundColor: "#fff", color: "#64748B", border: "1px solid #E5E7EB" }
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-gray-500">Store</span>
          <StoreDropdown value={store} stores={stores} onChange={setStore} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[560px]">
            <thead>
              <tr style={{ backgroundColor: "#F8FAFC" }}>
                {["Name & Latest Note", "Email", "Role", "Store", "Action"].map((h) => (
                  <th key={h} className="py-3.5 px-6 text-xs font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-100">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-sm text-gray-400">
                    Loading team members...
                  </td>
                </tr>
              ) : team.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-sm text-gray-400">
                    No team members found matching criteria.
                  </td>
                </tr>
              ) : (
                team.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-blue-50/40 transition-colors border-b border-gray-50 last:border-0 cursor-pointer"
                    onClick={() => router.push(`/team/${member.id}`)}
                  >
                    {/* Name + avatar + expense note */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Avatar name={member.name} />
                        <div>
                          <span className="text-sm font-bold block" style={{ color: "#102452" }}>
                            {member.name}
                          </span>
                          {member.latest_expense_note ? (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Receipt size={12} className="text-navy/60" />
                              <span className="italic">{member.latest_expense_note}</span>
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400 mt-0.5">No recent expenses</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500">{member.email}</td>
                    <td className="py-4 px-6">
                      <RoleBadge role={member.role} />
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500">{member.store_name || "—"}</td>
                    <td className="py-4 px-6" onClick={(event) => event.stopPropagation()}>
                      <button
                        aria-label={`Delete ${member.name}`}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                        onClick={() => {
                          setNotice(null);
                          setMemberToDelete(member);
                        }}
                        type="button"
                      >
                        <Trash2 aria-hidden="true" size={15} />
                        <span className="hidden lg:inline">Delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        <div className="px-6 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-400 font-medium">
            Showing {team.length} team members
          </p>
        </div>
      </div>
      <DeleteTeamMemberModal
        member={memberToDelete}
        onClose={() => setMemberToDelete(null)}
        onDeleted={(name) => {
          setTeam((current) => current.filter((member) => member.id !== memberToDelete?.id));
          setMemberToDelete(null);
          setNotice({ kind: "success", message: `${name} was deleted from the team.` });
        }}
        onError={(message) => {
          setNotice({ kind: "error", message });
        }}
      />
      <ExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        reportType="Team Members"
        availableColumns={TEAM_EXPORT_COLUMNS}
        data={team as unknown as Record<string, unknown>[]}
        activeFilters={{ datePreset: "All Time", store, slot: "All Slots", status: activeTab }}
      />
    </div>
  );
}

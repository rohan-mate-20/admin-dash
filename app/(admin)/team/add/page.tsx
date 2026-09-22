"use client";

import Link from "next/link";
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Package,
  Truck,
  Store as StoreIcon,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Hash,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getStores, Store } from "@/lib/supabaseService";

// Form row
function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-start gap-6">
      <label className="text-sm font-bold pt-3" style={{ color: "#102452" }}>
        {label}
      </label>
      <div>{children}</div>
    </div>
  );
}

// Store dropdown
function StoreSelect({
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

  const selectedStore = stores.find((s) => s.id === value);
  const displayName = selectedStore ? selectedStore.name : "Select a store";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-medium transition-all hover:border-gray-300 focus:outline-none"
        style={{ color: "#102452" }}
      >
        <StoreIcon size={16} className="text-gray-400 shrink-0" />
        <span className="flex-1 text-left">{displayName}</span>
        <ChevronDown size={15} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-gray-100 shadow-xl z-20 py-1 overflow-hidden">
          {stores.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                onChange(s.id);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm font-medium transition-colors"
              style={value === s.id ? { backgroundColor: "#0B2A63", color: "#fff" } : { color: "#374151" }}
              onMouseEnter={(e) => {
                if (value !== s.id) e.currentTarget.style.backgroundColor = "#F9FAFB";
              }}
              onMouseLeave={(e) => {
                if (value !== s.id) e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AddTeamPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"PACKER" | "DELIVERY">("PACKER");
  const [storeId, setStoreId] = useState("");
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadStores() {
      try {
        const storeList = await getStores();
        setStores(storeList);
        if (storeList.length > 0) {
          setStoreId(storeList[0].id);
        }
      } catch (err) {
        console.error("Failed to load stores:", err);
      }
    }
    loadStores();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || !storeId) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);

      const { data, error: invokeError } = await supabase.functions.invoke("add-team-member", {
        body: {
          name,
          email,
          password,
          role,
          storeId,
          employeeId: employeeId || undefined,
        },
      });

      if (invokeError) {
        throw new Error(invokeError.message || "Failed to add team member.");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setSuccess(true);
      setTimeout(() => router.push("/team"), 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create team member.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
          style={{ backgroundColor: "#DCFCE7" }}
        >
          <CheckCircle2 size={40} style={{ color: "#16a34a" }} />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: "#102452" }}>
          Team Member Added!
        </h2>
        <p className="text-sm text-gray-500">Redirecting back to team list…</p>
      </div>
    );
  }

  return (
    <div className="pb-8 max-w-3xl">
      {/* Back link */}
      <Link
        href="/team"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-navy transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Back to Team
      </Link>

      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold" style={{ color: "#102452" }}>
          Add Team Member
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Create a new account for your packing or delivery team member via the secure backend function.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-sm text-red-700 font-semibold">
          <AlertCircle size={18} className="text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="px-8 py-5 border-b border-gray-100">
          <h2 className="text-base font-bold" style={{ color: "#102452" }}>
            Member Information
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Fill in the details below. Role must be Packer or Delivery.
          </p>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
          {/* Name */}
          <FormRow label="Name *">
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy transition-all"
                style={{ color: "#102452" }}
              />
            </div>
          </FormRow>

          {/* Email */}
          <FormRow label="Email *">
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy transition-all"
                style={{ color: "#102452" }}
              />
            </div>
          </FormRow>

          {/* Password */}
          <FormRow label="Password *">
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
                className="w-full pl-11 pr-12 py-3 rounded-xl border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy transition-all"
                style={{ color: "#102452" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </FormRow>

          {/* Employee ID (optional) */}
          <FormRow label="Employee ID">
            <div className="relative">
              <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g. EMP-101 (optional)"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy transition-all"
                style={{ color: "#102452" }}
              />
            </div>
          </FormRow>

          {/* Role */}
          <FormRow label="Role *">
            <div className="grid grid-cols-2 gap-3">
              {(["PACKER", "DELIVERY"] as const).map((r) => {
                const isSelected = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-sm font-semibold text-left"
                    style={
                      isSelected
                        ? { borderColor: "#0B2A63", backgroundColor: "#EBF0FB", color: "#0B2A63" }
                        : { borderColor: "#E5E7EB", backgroundColor: "#fff", color: "#6B7280" }
                    }
                  >
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                      style={
                        isSelected
                          ? { borderColor: "#0B2A63", backgroundColor: "#0B2A63" }
                          : { borderColor: "#D1D5DB" }
                      }
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    {r === "PACKER" ? <Package size={17} /> : <Truck size={17} />}
                    {r === "PACKER" ? "Packer" : "Delivery"}
                  </button>
                );
              })}
            </div>
          </FormRow>

          {/* Store */}
          <FormRow label="Store *">
            <StoreSelect value={storeId} stores={stores} onChange={setStoreId} />
          </FormRow>

          {/* Divider */}
          <div className="border-t border-gray-100 pt-5 flex gap-3 justify-between">
            <Link
              href="/team"
              className="px-8 py-3 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-gray-50 transition-colors"
              style={{ color: "#374151" }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center"
              style={{ backgroundColor: "#E31B23" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#c41520")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#E31B23")}
            >
              {loading ? "Adding member..." : "Add to Team"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

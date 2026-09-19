"use client";

import { Eye, EyeOff, Mail, Lock, ShoppingCart, Users, Building2, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

// ─── KMart Logo SVG (inline, matching reference) ──────────────────────────────
function KmartLogo({ size = 56 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size * 0.72}
      viewBox="0 0 90 65"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Big stylised K */}
      <text
        x="0"
        y="55"
        fontFamily="Arial Black, Arial"
        fontWeight="900"
        fontSize="62"
        fill="#E31B23"
        fontStyle="italic"
      >
        K
      </text>
    </svg>
  );
}

// ─── Screen A: Login ───────────────────────────────────────────────────────────
function LoginScreen({
  onForgotPassword,
  onLogin,
}: {
  onForgotPassword: () => void;
  onLogin: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 900);
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-right-4 duration-300">
      {/* ── Kmart brand header ── */}
      <div className="flex items-center gap-5 mb-8">
        <div className="flex flex-col leading-none">
          <div className="flex items-end gap-0.5 leading-none">
            <span
              className="font-black italic leading-none"
              style={{ fontSize: 48, color: "#E31B23", lineHeight: 1 }}
            >
              K
            </span>
          </div>
          <span
            className="font-black italic tracking-widest text-navy uppercase"
            style={{ fontSize: 15, letterSpacing: "0.18em", marginTop: -4 }}
          >
            KMART
          </span>
        </div>
        {/* vertical divider */}
        <div className="w-px self-stretch bg-gray-300 mx-1" />
        <h1 className="text-2xl font-bold text-navy leading-snug">
          Admin<br />Dashboard
        </h1>
      </div>

      {/* ── Heading ── */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-navy mb-1">Welcome Back</h2>
        <p className="text-sm text-text-secondary">
          Sign in to manage your K Mart operations
        </p>
      </div>

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-text-main mb-1.5 uppercase tracking-wide">
            Email address
          </label>
          <div className="relative">
            <Mail
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="email"
              placeholder="Email address"
              defaultValue="admin@kmart.com"
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 bg-white text-sm text-text-main placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-text-main mb-1.5 uppercase tracking-wide">
            Password
          </label>
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              defaultValue="password123"
              className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-gray-200 bg-white text-sm text-text-main placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Remember me + Forgot password */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div
              onClick={() => setRememberMe(!rememberMe)}
              className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${
                rememberMe
                  ? "bg-navy border-navy"
                  : "bg-white border-gray-300 hover:border-navy"
              }`}
            >
              {rememberMe && (
                <svg
                  viewBox="0 0 12 12"
                  className="w-2.5 h-2.5 text-white fill-white"
                >
                  <path d="M1.5 6 L4.5 9 L10.5 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              )}
            </div>
            <span className="text-sm text-text-secondary font-medium">
              Remember me
            </span>
          </label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm font-bold text-navy hover:text-red transition-colors"
          >
            Forgot password?
          </button>
        </div>

        {/* Login button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl font-bold text-white text-base flex items-center justify-center gap-3 transition-all duration-200 shadow-sm mt-2"
          style={{ backgroundColor: "#E31B23" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "#c41520")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "#E31B23")
          }
        >
          {loading ? (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <>
              <span>Login</span>
              <span className="text-xl">→</span>
            </>
          )}
        </button>
      </form>

      {/* ── Secure Access ── */}
      <div className="mt-7 flex items-center justify-center gap-2">
        <div className="h-px flex-1 bg-gray-200" />
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          <span className="text-xs text-gray-400 font-medium">Secure Access</span>
        </div>
        <div className="h-px flex-1 bg-gray-200" />
      </div>
    </div>
  );
}

// ─── Screen B: Forgot Password ─────────────────────────────────────────────────
function ForgotPasswordScreen({ onBack }: { onBack: () => void }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 900);
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-left-4 duration-300">
      {/* ── Kmart brand header (same as login) ── */}
      <div className="flex items-center gap-5 mb-8">
        <div className="flex flex-col leading-none">
          <div className="flex items-end gap-0.5 leading-none">
            <span
              className="font-black italic leading-none"
              style={{ fontSize: 48, color: "#E31B23", lineHeight: 1 }}
            >
              K
            </span>
          </div>
          <span
            className="font-black italic tracking-widest text-navy uppercase"
            style={{ fontSize: 15, letterSpacing: "0.18em", marginTop: -4 }}
          >
            KMART
          </span>
        </div>
        <div className="w-px self-stretch bg-gray-300 mx-1" />
        <h1 className="text-2xl font-bold text-navy leading-snug">
          Admin<br />Dashboard
        </h1>
      </div>

      {/* ── Heading ── */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-navy mb-1">Reset Password</h2>
        <p className="text-sm text-text-secondary">
          Enter your admin email to receive recovery instructions.
        </p>
      </div>

      {sent ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-green-600 stroke-current" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <p className="font-bold text-green-800 mb-1">Reset link sent!</p>
          <p className="text-sm text-green-600">Check your email inbox for the recovery instructions.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-text-main mb-1.5 uppercase tracking-wide">
              Email address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                placeholder="Enter your admin email"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 bg-white text-sm text-text-main placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy transition-all"
                required
              />
            </div>
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-white text-base flex items-center justify-center gap-3 transition-all duration-200 shadow-sm"
            style={{ backgroundColor: "#E31B23" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#c41520")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#E31B23")}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <>
                <span>Send Reset Link</span>
                <span className="text-xl">→</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* ── Back to Login ── */}
      <button
        type="button"
        onClick={onBack}
        className="mt-6 flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-navy transition-colors mx-auto"
      >
        <ArrowLeft size={16} />
        Back to Login
      </button>

      {/* ── Secure Access ── */}
      <div className="mt-5 flex items-center justify-center gap-2">
        <div className="h-px flex-1 bg-gray-200" />
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          <span className="text-xs text-gray-400 font-medium">Secure Access</span>
        </div>
        <div className="h-px flex-1 bg-gray-200" />
      </div>
    </div>
  );
}

// ─── Root Page ─────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [screen, setScreen] = useState<"login" | "forgot">("login");
  const router = useRouter();

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "#F0F4FA" }}
    >
      <div
        className="w-full flex flex-col md:flex-row overflow-hidden"
        style={{ minHeight: "100vh" }}
      >
        {/* ════════════════════════════════════════════════
            LEFT PANEL – Hero / Brand
        ════════════════════════════════════════════════ */}
        <div className="w-full md:w-[44%] relative overflow-hidden flex flex-col" style={{ minHeight: "100vh" }}>
          {/* Store photo background */}
          <div
            className="absolute inset-0 bg-center bg-cover"
            style={{ backgroundImage: "url('/kmart-store.jpg')" }}
          />

          {/* Deep navy blue overlay */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(11,34,101,0.82)" }}
          />

          {/* Diagonal red brand slash — bottom-right corner triangle */}
          <div
            className="absolute"
            style={{
              bottom: 0,
              right: 0,
              width: "100%",
              height: "100%",
              overflow: "hidden",
              pointerEvents: "none",
            }}
          >
            {/* Large red diagonal wedge */}
            <div
              style={{
                position: "absolute",
                bottom: -20,
                right: -20,
                width: 260,
                height: 340,
                background: "#E31B23",
                transform: "rotate(-40deg) translateX(60px) translateY(60px)",
                transformOrigin: "bottom right",
                borderRadius: 4,
              }}
            />
            {/* Thin lighter diagonal accent */}
            <div
              style={{
                position: "absolute",
                bottom: -20,
                right: 80,
                width: 8,
                height: 280,
                background: "rgba(255,255,255,0.18)",
                transform: "rotate(-40deg) translateX(60px) translateY(60px)",
                transformOrigin: "bottom right",
                borderRadius: 4,
              }}
            />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-between h-full p-10 text-white flex-1">
            {/* Heading */}
            <div>
              <h2 className="text-3xl lg:text-4xl font-extrabold leading-tight mb-4 drop-shadow">
                Better Essentials<br />Brighter Everyday
              </h2>
              {/* Red underline accent */}
              <div
                className="rounded"
                style={{ width: 40, height: 4, backgroundColor: "#E31B23" }}
              />
            </div>

            {/* Bullet items */}
            <div className="space-y-4 mt-8">
              {[
                { Icon: ShoppingCart, label: "Quality Products" },
                { Icon: Users, label: "Stronger Communities" },
                { Icon: Building2, label: "A Brighter Tomorrow" },
              ].map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <Icon size={18} className="text-white/80 shrink-0" />
                  <span className="text-sm font-medium text-white/90">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════
            RIGHT PANEL – Form
        ════════════════════════════════════════════════ */}
        <div className="w-full md:w-[56%] bg-white flex items-center justify-center p-8 md:p-12">
          <div className="w-full max-w-md">
            {screen === "login" ? (
              <LoginScreen
                onForgotPassword={() => setScreen("forgot")}
                onLogin={() => router.push("/dashboard")}
              />
            ) : (
              <ForgotPasswordScreen onBack={() => setScreen("login")} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

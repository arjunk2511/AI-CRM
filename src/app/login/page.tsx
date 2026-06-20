"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, ShieldCheck, Mail, Lock, Building2, Phone } from "lucide-react";
import { dbClient } from "@/lib/dbClient";

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("Consumer Electronics");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Auto redirect if session exists
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("swara_session");
    if (isLoggedIn) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      if (activeTab === "signin") {
        // Sign In Flow
        if (!email || !password) {
          setErrorMsg("Please fill in email and password.");
          setIsLoading(false);
          return;
        }

        // Check if admin email or normal user
        const isAdmin = email.toLowerCase() === "admin@swara.ai" || email.toLowerCase() === "admin@kannadavoice.ai";
        let user = await dbClient.getUserByEmail(email);
        
        if (!user) {
          // Auto create user for easy local sandbox flow
          user = await dbClient.createUser(email, "mock_hash", isAdmin ? "super_admin" : "user");
        }

        let biz = await dbClient.getBusiness(user.id);
        if (!biz) {
          biz = await dbClient.createBusiness("SmartMop India", "Consumer Electronics", "+91 98860 12345", user.id);
        }

        localStorage.setItem(
          "swara_session",
          JSON.stringify({
            userId: user.id,
            email: user.email,
            role: user.role,
            businessId: biz.id,
            businessName: biz.business_name,
            isSandbox: false
          })
        );
        router.push("/dashboard");
      } else {
        // Sign Up / Workspace Registration Flow
        if (!email || !password || !businessName || !phone) {
          setErrorMsg("Please complete all workspace details.");
          setIsLoading(false);
          return;
        }

        const user = await dbClient.createUser(email, "mock_hash", "user");
        const biz = await dbClient.createBusiness(businessName, category, phone, user.id);

        localStorage.setItem(
          "swara_session",
          JSON.stringify({
            userId: user.id,
            email: user.email,
            role: user.role,
            businessId: biz.id,
            businessName: biz.business_name,
            isSandbox: false
          })
        );
        alert("SaaS Business Workspace registered successfully!");
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Authentication transaction failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSandboxBypass = async () => {
    setIsLoading(true);
    try {
      localStorage.setItem(
        "swara_session",
        JSON.stringify({
          userId: "demo-user-id",
          email: "sandbox@kannadavoice.ai",
          role: "user",
          businessId: "demo-business-id",
          businessName: "SmartMop India",
          isSandbox: true
        })
      );
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSuccess(true);
    setTimeout(() => {
      setShowForgotModal(false);
      setForgotSuccess(false);
      setForgotEmail("");
      alert("Password reset code sent to: " + forgotEmail);
    }, 1200);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-radial from-slate-900 via-slate-950 to-black text-slate-100" id="auth-root">
      
      <div className="w-full max-w-md p-8 rounded-2xl bg-slate-950/60 backdrop-blur-xl border border-slate-800/80 shadow-2xl transition-all duration-300">
        
        {/* Brand Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 justify-center mb-2">
            <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-violet-500/20">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-indigo-400 to-indigo-500 bg-clip-text text-transparent drop-shadow-md">
              KannadaAI Business OS
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            SaaS Platform for Kannada Speaking AI Employees
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-2 p-1 bg-slate-900/60 rounded-xl mb-6 border border-slate-800">
          <button
            id="tab-login"
            type="button"
            className={`py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
              activeTab === "signin" 
                ? "bg-violet-600 text-white shadow-md" 
                : "text-slate-400 hover:text-slate-200"
            }`}
            onClick={() => setActiveTab("signin")}
          >
            Workspace Sign In
          </button>
          <button
            id="tab-register"
            type="button"
            className={`py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
              activeTab === "signup" 
                ? "bg-violet-600 text-white shadow-md" 
                : "text-slate-400 hover:text-slate-200"
            }`}
            onClick={() => setActiveTab("signup")}
          >
            Create Workspace
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs mb-4">
            {errorMsg}
          </div>
        )}

        {/* Forms Panel */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                id="auth-email"
                type="email"
                required
                className="w-full bg-slate-900/80 border border-slate-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-slate-200 placeholder-slate-600 rounded-xl px-4 py-3 pl-10 text-sm focus:outline-none transition-all"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              {activeTab === "signin" && (
                <button
                  id="forgot-password-link"
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                id="auth-password"
                type="password"
                required
                className="w-full bg-slate-900/80 border border-slate-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-slate-200 placeholder-slate-600 rounded-xl px-4 py-3 pl-10 text-sm focus:outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {activeTab === "signup" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Business Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    id="auth-biz-name"
                    type="text"
                    required
                    className="w-full bg-slate-900/80 border border-slate-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-slate-200 placeholder-slate-600 rounded-xl px-4 py-3 pl-10 text-sm focus:outline-none transition-all"
                    placeholder="e.g. SmartMop India"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Industry Type
                  </label>
                  <select
                    id="auth-category"
                    className="w-full bg-slate-900/80 border border-slate-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none transition-all"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Consumer Electronics">E-Commerce</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Retail Services">Local Retail</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Workspace Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      id="auth-phone"
                      type="text"
                      required
                      className="w-full bg-slate-900/80 border border-slate-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-slate-200 placeholder-slate-600 rounded-xl px-3 py-3 pl-8 text-sm focus:outline-none transition-all"
                      placeholder="+91..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <button
            id="auth-submit"
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-500 active:scale-98 text-white text-sm font-semibold rounded-xl cursor-pointer shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 transition-all duration-200 mt-2"
            disabled={isLoading}
          >
            {isLoading ? "Provisioning..." : activeTab === "signin" ? "Sign In to Console" : "Deploy Workspace"}
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6 gap-3">
          <div className="flex-grow h-px bg-slate-800" />
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Or</span>
          <div className="flex-grow h-px bg-slate-800" />
        </div>

        {/* Sandbox mode shortcut */}
        <button
          id="sandbox-bypass"
          type="button"
          className="w-full flex items-center justify-center gap-2 py-3 border border-emerald-500/30 hover:border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/10 active:scale-98 text-emerald-400 text-sm font-semibold rounded-xl cursor-pointer transition-all duration-200"
          onClick={handleSandboxBypass}
          disabled={isLoading}
        >
          <ShieldCheck className="h-4 w-4" />
          Sandbox Demo (Local Preview)
        </button>

        <p className="text-[11px] text-slate-500 text-center leading-normal mt-5">
          Tip: Log in with <code className="text-violet-400">admin@swara.ai</code> to access Super Admin dashboard statistics and workspace monitors.
        </p>

      </div>

      {/* Forgot Password Drawer Overlay */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-sm p-6 rounded-2xl shadow-2xl relative">
            <button
              id="close-forgot-modal"
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-200"
            >
              &times;
            </button>
            <h3 className="text-lg font-bold mb-2">Reset Password</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter your registered email address and we'll send a code to reset your password.
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <input
                  id="forgot-email-input"
                  type="email"
                  required
                  placeholder="Enter email"
                  className="w-full bg-slate-900 border border-slate-850 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-200 placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </div>

              <button
                id="forgot-submit"
                type="submit"
                className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl text-sm transition-all"
                disabled={forgotSuccess}
              >
                {forgotSuccess ? "Sending link..." : "Send Reset Link"}
              </button>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}

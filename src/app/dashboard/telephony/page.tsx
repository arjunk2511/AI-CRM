"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Sparkles, Phone, Clock, UserCheck, AlertCircle, Play, LogOut, 
  Settings, BookOpen, Users, ArrowRight, ShieldCheck, BarChart2, 
  ShoppingBag, Wrench, CreditCard, ShieldAlert, PhoneCall, Menu,
  RefreshCw, Link2, Key, Info
} from "lucide-react";
import { dbClient } from "@/lib/dbClient";
import { Business, Agent, Customer, Subscription } from "@/lib/db";

export default function TelephonyPage() {
  const router = useRouter();
  
  // Navigation states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);

  // Telephony credentials state
  const [provider, setProvider] = useState<"disabled" | "twilio" | "exotel">("disabled");
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");
  const [twilioPhone, setTwilioPhone] = useState("");
  const [exotelApiKey, setExotelApiKey] = useState("");
  const [exotelToken, setExotelToken] = useState("");
  const [exotelSid, setExotelSid] = useState("");
  const [exotelPhone, setExotelPhone] = useState("");
  const [exotelSubdomain, setExotelSubdomain] = useState("api");

  // Test Call state
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [testPhoneNumber, setTestPhoneNumber] = useState("");
  const [isDialing, setIsDialing] = useState(false);
  const [dialResult, setDialResult] = useState<{ success?: boolean; isSandbox?: boolean; message?: string; error?: string } | null>(null);

  // Webhook display state
  const [domainName, setDomainName] = useState("your-app-domain.vercel.app");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDomainName(window.location.host);
      
      // Load session
      const sessionStr = localStorage.getItem("swara_session");
      if (!sessionStr) {
        router.push("/login");
        return;
      }
      const sess = JSON.parse(sessionStr);
      setSession(sess);

      // Load SaaS DB Data
      const loadData = async () => {
        try {
          const biz = await dbClient.getBusiness(sess.userId);
          setBusiness(biz);
          if (biz) {
            const listAgents = await dbClient.getAgents(biz.id);
            setAgents(listAgents);
            if (listAgents.length > 0) {
              setSelectedAgentId(listAgents[0].id);
            }
            const sub = await dbClient.getSubscription(biz.id);
            setSubscription(sub);
          }
        } catch (e) {
          console.error("Failed to load telephony page context:", e);
        }
      };
      
      loadData();

      // Load Telephony Credentials
      const storedTelephony = localStorage.getItem("swara_telephony");
      if (storedTelephony) {
        try {
          const config = JSON.parse(storedTelephony);
          setProvider(config.provider || "disabled");
          setTwilioSid(config.twilioSid || "");
          setTwilioToken(config.twilioToken || "");
          setTwilioPhone(config.twilioPhone || "");
          setExotelApiKey(config.exotelApiKey || "");
          setExotelToken(config.exotelToken || "");
          setExotelSid(config.exotelSid || "");
          setExotelPhone(config.exotelPhone || "");
          setExotelSubdomain(config.exotelSubdomain || "api");
        } catch (e) {}
      }
    }
  }, [router]);

  const handleSaveTelephony = (e: React.FormEvent) => {
    e.preventDefault();
    const config = {
      provider,
      twilioSid,
      twilioToken,
      twilioPhone,
      exotelApiKey,
      exotelToken,
      exotelSid,
      exotelPhone,
      exotelSubdomain
    };
    localStorage.setItem("swara_telephony", JSON.stringify(config));
    alert("Telephony integration credentials saved successfully!");
  };

  const handleTriggerTestCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhoneNumber || !selectedAgentId) {
      alert("Please enter a phone number and select an agent.");
      return;
    }

    setIsDialing(true);
    setDialResult(null);

    try {
      const storedTelephony = localStorage.getItem("swara_telephony");
      const credentials = storedTelephony ? JSON.parse(storedTelephony) : null;

      const response = await fetch("/api/outbound-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerPhone: testPhoneNumber,
          agentId: selectedAgentId,
          credentials
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Failed to trigger dialer");
      }

      setDialResult({
        success: true,
        isSandbox: resData.isSandbox,
        message: resData.message
      });

      if (resData.isSandbox) {
        alert("Credentials not set: Outbound call logged in local simulator mode.");
      } else {
        alert("Outbound carrier call triggered successfully!");
      }

    } catch (err: any) {
      console.error(err);
      setDialResult({
        success: false,
        error: err.message
      });
      alert(`Call failed: ${err.message}`);
    } finally {
      setIsDialing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("swara_session");
    router.push("/login");
  };

  const isSuperAdmin = session?.role === "super_admin";
  const exotelWebhookUrl = `https://${domainName}/api/exotel?agentId=${selectedAgentId || "default"}`;

  return (
    <div className="flex min-h-screen w-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden" id="telephony-root">
      
      {/* Sidebar Overlay Backdrop on Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col p-6 transition-transform duration-300 shrink-0 ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>
        <div className="flex items-center gap-3 pb-6 border-b border-slate-800 mb-6">
          <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-2 rounded-lg shadow-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            KannadaAI Business OS
          </span>
        </div>

        {/* Sidebar Nav (Redirects to dashboard tabs) */}
        <nav className="flex flex-col gap-1.5 flex-grow">
          <button
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-lg cursor-pointer text-slate-400 hover:text-slate-200 border border-transparent transition-all"
            onClick={() => router.push("/dashboard?tab=overview")}
          >
            <BarChart2 className="h-4 w-4" />
            Overview Panel
          </button>

          <button
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-lg cursor-pointer text-slate-400 hover:text-slate-200 border border-transparent transition-all"
            onClick={() => router.push("/dashboard?tab=crm")}
          >
            <Users className="h-4 w-4" />
            CRM & qualified Leads
          </button>

          <button
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-lg cursor-pointer text-slate-400 hover:text-slate-200 border border-transparent transition-all"
            onClick={() => router.push("/dashboard?tab=products")}
          >
            <ShoppingBag className="h-4 w-4" />
            Product Specs
          </button>

          <button
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-lg cursor-pointer text-slate-400 hover:text-slate-200 border border-transparent transition-all"
            onClick={() => router.push("/dashboard?tab=services")}
          >
            <Wrench className="h-4 w-4" />
            Services catalog
          </button>

          <button
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-lg cursor-pointer text-slate-400 hover:text-slate-200 border border-transparent transition-all"
            onClick={() => router.push("/dashboard?tab=kb")}
          >
            <BookOpen className="h-4 w-4" />
            RAG Knowledge Base
          </button>

          <button
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-lg cursor-pointer text-slate-400 hover:text-slate-200 border border-transparent transition-all"
            onClick={() => router.push("/dashboard?tab=agents")}
          >
            <Play className="h-4 w-4" />
            Voice Agent Config
          </button>

          <button
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-lg cursor-pointer text-slate-400 hover:text-slate-200 border border-transparent transition-all"
            onClick={() => router.push("/dashboard?tab=billing")}
          >
            <CreditCard className="h-4 w-4" />
            Plans & Razorpay
          </button>

          {isSuperAdmin && (
            <button
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-lg cursor-pointer text-slate-400 hover:text-slate-200 border border-transparent transition-all"
              onClick={() => router.push("/dashboard?tab=admin")}
            >
              <ShieldAlert className="h-4 w-4" />
              Super Admin panel
            </button>
          )}
        </nav>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-800/80 mt-auto">
          <button
            id="nav-settings"
            className="w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg cursor-pointer font-bold transition-all mb-2 bg-violet-600/15 border border-violet-500/25 text-violet-400"
            onClick={() => setIsSidebarOpen(false)}
          >
            <Settings className="h-4.5 w-4.5" />
            Telephony settings
          </button>

          <button
            id="logout"
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/5 rounded-lg cursor-pointer font-semibold transition-all"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Panel View */}
      <main className="flex-grow p-4 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Mobile Header Bar */}
        <div className="flex md:hidden items-center justify-between p-3.5 border border-slate-800 bg-slate-900/60 backdrop-blur-md rounded-2xl mb-6 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-1.5 rounded-lg">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white font-display">KannadaAI OS</span>
          </div>
          <button 
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/80 rounded-xl cursor-pointer"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        {/* Header bar */}
        <header className="flex justify-between items-center mb-8 pb-4 border-b border-slate-900">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white capitalize">
              Telephony Settings & Test Caller
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Configure Webhooks, connect carriers, and initiate live AI-to-human test calls.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="badge badge-primary bg-violet-600/10 border border-violet-500/20 text-violet-400 px-3 py-1.5 rounded-full text-xs font-semibold">
              Plan: <span className="uppercase text-white ml-1">{subscription?.plan || "Starter"}</span>
            </span>
            {provider === "disabled" ? (
              <span className="badge bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center">
                <span className="pulsing-indicator active bg-amber-400 mr-2" />
                Sandbox Dialer
              </span>
            ) : (
              <span className="badge bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center">
                <span className="pulsing-indicator active bg-emerald-400 mr-2" />
                Live {provider.toUpperCase()}
              </span>
            )}
          </div>
        </header>

        {/* Content Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Column 1: Telephony Configurations */}
          <div className="space-y-6">
            
            {/* Connection Webhook Box */}
            <div className="glass-panel rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Link2 className="h-4 w-4 text-violet-400" />
                Production Webhook Endpoints
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Add this URL to your Twilio/Exotel console settings to handle incoming customer calls dynamically.
              </p>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Exotel Inbound URL</label>
                  <div className="flex bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-xs font-mono text-violet-400 break-all select-all justify-between items-center">
                    <span>{exotelWebhookUrl}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Config Form */}
            <div className="glass-panel rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                <Key className="h-4 w-4 text-violet-400" />
                Configure Gateway Credentials
              </h3>

              <form onSubmit={handleSaveTelephony} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">Telephony calling gateway</label>
                  <select
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as any)}
                  >
                    <option value="disabled">Sandbox Dialer Emulator (No API keys required)</option>
                    <option value="twilio">Twilio API Integration</option>
                    <option value="exotel">Exotel API Integration (India)</option>
                  </select>
                </div>

                {provider === "twilio" && (
                  <div className="space-y-3 border-t border-slate-800/80 pt-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Account SID</label>
                        <input
                          type="text"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none"
                          value={twilioSid}
                          onChange={(e) => setTwilioSid(e.target.value)}
                          placeholder="AC..."
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Auth Token</label>
                        <input
                          type="password"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none"
                          value={twilioToken}
                          onChange={(e) => setTwilioToken(e.target.value)}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Connected Phone Number</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none"
                        value={twilioPhone}
                        onChange={(e) => setTwilioPhone(e.target.value)}
                        placeholder="e.g. +14158889999"
                      />
                    </div>
                  </div>
                )}

                {provider === "exotel" && (
                  <div className="space-y-3 border-t border-slate-800/80 pt-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Exotel API Key</label>
                        <input
                          type="text"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none"
                          value={exotelApiKey}
                          onChange={(e) => setExotelApiKey(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Exotel Auth Token</label>
                        <input
                          type="password"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none"
                          value={exotelToken}
                          onChange={(e) => setExotelToken(e.target.value)}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Exotel Sid</label>
                        <input
                          type="text"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none"
                          value={exotelSid}
                          onChange={(e) => setExotelSid(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Connected Number</label>
                        <input
                          type="text"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none"
                          value={exotelPhone}
                          onChange={(e) => setExotelPhone(e.target.value)}
                          placeholder="Exotel CallerId"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="py-2.5 w-full bg-violet-600 hover:bg-violet-500 text-xs font-bold rounded-lg cursor-pointer transition-all"
                >
                  Save Telephony Configurations
                </button>
              </form>
            </div>

          </div>

          {/* Column 2: Live Test dialer Console */}
          <div className="space-y-6">
            
            {/* Dialer Frame */}
            <div className="glass-panel rounded-2xl p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <PhoneCall className="h-4 w-4 text-violet-400" />
                  Initiate AI Outbound Call
                </h3>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Simulator Interface</span>
              </div>

              <form onSubmit={handleTriggerTestCall} className="space-y-4">
                
                {/* Select Agent */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">Select Active AI Employee</label>
                  <select
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                  >
                    {agents.length === 0 ? (
                      <option value="">No agents found (Create one in Config tab)</option>
                    ) : (
                      agents.map(a => (
                        <option key={a.id} value={a.id}>{a.name} ({a.language})</option>
                      ))
                    )}
                  </select>
                </div>

                {/* Input Phone number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">Target Customer Phone Number</label>
                  <input
                    type="text"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none"
                    value={testPhoneNumber}
                    onChange={(e) => setTestPhoneNumber(e.target.value)}
                    placeholder="e.g. +91 98860 12345"
                    required
                  />
                </div>

                {/* Dial Button */}
                <button
                  type="submit"
                  disabled={isDialing || agents.length === 0}
                  className="py-3 w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-900 disabled:text-slate-600 text-white font-bold rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/10 active:scale-98"
                >
                  {isDialing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Triggering Dial API...
                    </>
                  ) : (
                    <>
                      <PhoneCall className="h-4 w-4" />
                      Dial Phone Number
                    </>
                  )}
                </button>

              </form>

              {/* Dial result banner log */}
              {dialResult && (
                <div className={`p-4 border rounded-xl space-y-2 text-xs leading-normal font-sans ${
                  dialResult.success 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}>
                  <h4 className="font-bold uppercase tracking-wider text-[10px]">
                    {dialResult.success ? "✓ API Dial Handshake Success" : "⚠ API Outbound Call Error"}
                  </h4>
                  <p className="font-sans">
                    {dialResult.success 
                      ? dialResult.isSandbox 
                        ? "Local Sandbox Call Triggered. Please go to the CRM Leads tab to interact with the Call Dialer simulator." 
                        : "Outbound carrier dial sent successfully! Customer phone will ring and start the live conversation loop."
                      : dialResult.error}
                  </p>
                </div>
              )}
            </div>

            {/* Connection Information */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Info className="h-4 w-4 text-violet-400" />
                Telephony Gateway Instructions:
              </h4>
              <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-2 leading-relaxed font-sans">
                <li>Choose <strong>Sandbox mode</strong> to run local voice call simulations directly inside your browser without entering API keys.</li>
                <li>Connect your <strong>Exotel India</strong> virtual numbers using your API credentials.</li>
                <li>Copy the Exotel Inbound Webhook URL and paste it under the Passthru node in Exotel Flow builder.</li>
                <li>ElevenLabs handles live vocal play responses in natural Kannada, Telugu, Tamil, and Malayalam.</li>
              </ul>
            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

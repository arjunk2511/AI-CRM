import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, PhoneCall, Bot, FileText } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans bg-radial from-slate-900/50 via-slate-950 to-black relative overflow-hidden" id="home-root">
      
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="glass-panel w-11/12 max-w-6xl mx-auto my-6 px-6 py-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-950/70 border border-slate-800/60 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-2 rounded-lg shadow-lg">
            <Sparkles className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent font-display">
            KannadaAI Business OS
          </span>
        </div>

        <Link 
          href="/login" 
          id="nav-login-btn"
          className="px-5 py-2 text-xs font-bold bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:text-white rounded-xl cursor-pointer transition-all active:scale-95"
        >
          Console Login
        </Link>
      </header>

      {/* Hero Section */}
      <section className="flex-grow flex flex-col items-center justify-center text-center px-4 py-16 max-w-3xl mx-auto z-10">
        <div className="bg-violet-600/10 border border-violet-500/20 text-violet-400 px-3.5 py-1 rounded-full text-xs font-semibold mb-6 animate-pulse">
          🚀 Deploy Kannada Speech AI Employees
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6 font-display text-white">
          Hire a Kannada Speaking <span className="gradient-text glow-text">AI Employee</span> for Your Business
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed mb-8">
          KannadaAI Business OS enables business owners to deploy smart AI-powered voice employees that answer phone calls, qualify leads, explain product catalogs, and schedule appointments in natural local Kannada.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
          <Link
            id="hero-cta-btn"
            href="/login"
            className="px-6 py-3 text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white rounded-xl shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            Start Building Free MVP
            <ArrowRight className="h-4.5 w-4.5" />
          </Link>
          
          <a
            href="https://github.com/arjunk2511/AI-CRM"
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3 text-sm font-bold bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:text-white rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            Watch Demo Walkthrough
          </a>
        </div>
      </section>

      {/* Features Overview Grid */}
      <section className="px-4 py-16 max-w-6xl mx-auto w-full z-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-12 font-display">
          Core AI SaaS Calling Modules
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/60 transition-all">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Bot className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Kannada AI Employees</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Speak natural Kannada (ಕನ್ನಡ), Hindi, Telugu, and Tamil. Trained to handle support, lead registration, and service FAQs smoothly.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/60 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">RAG Knowledge Bases</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload company PDFs, product catalogs, and service manuals. The AI agent searches this context to answer customer calls accurately.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/60 transition-all sm:col-span-2 md:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-accent-warning">
              <PhoneCall className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Real-Time Webhooks</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Connected directly to Twilio and Exotel. Handles live telephony webhooks, outputting XML directives with latency optimized for speech.
            </p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 text-center py-8 text-xs text-slate-500 mt-auto px-4">
        <p>© 2026 KannadaAI Business OS Systems Pvt Ltd. All rights reserved.</p>
        <p className="text-[10px] text-slate-600 mt-1">Built for local Indian enterprises using Outpero-grade AI voice pipelines.</p>
      </footer>

    </main>
  );
}

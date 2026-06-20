import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, PhoneCall, Bot, FileText, CheckCircle } from "lucide-react";

export default function Home() {
  return (
    <main style={{
      minHeight: "100vh",
      backgroundColor: "var(--bg-main)",
      color: "var(--text-primary)",
      display: "flex",
      flexDirection: "column",
      background: "radial-gradient(circle at top right, hsla(250, 85%, 65%, 0.1), transparent 50%), " +
                  "radial-gradient(circle at bottom left, hsla(142, 72%, 45%, 0.05), transparent 50%), " +
                  "var(--bg-main)",
      fontFamily: "var(--font-family-base)"
    }} id="home-root">

      {/* Navigation Header */}
      <header className="glass-panel" style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 32px",
        margin: "20px auto",
        width: "90%",
        maxWidth: "1200px",
        borderRadius: "16px",
        border: "1px solid var(--border-light)",
        backgroundColor: "rgba(10, 15, 30, 0.7)"
      }}>
        <div className="flex-row-center">
          <div style={{
            background: "linear-gradient(135deg, var(--accent-primary) 0%, #6366f1 100%)",
            borderRadius: "8px",
            padding: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Sparkles size={18} color="white" />
          </div>
          <span style={{ fontSize: "1.25rem", fontWeight: 800, fontFamily: "var(--font-family-display)" }} className="gradient-text">
            KannadaAI Business OS
          </span>
        </div>

        <Link 
          href="/login" 
          id="nav-login-btn"
          className="btn btn-secondary" 
          style={{ padding: "8px 20px", fontSize: "0.85rem", borderRadius: "8px" }}
        >
          Console Login
        </Link>
      </header>

      {/* Hero Section */}
      <section style={{
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "60px 20px",
        maxWidth: "900px",
        margin: "0 auto"
      }}>
        <div className="badge badge-primary" style={{ marginBottom: "20px", padding: "6px 14px", textTransform: "none", fontSize: "0.8rem" }}>
          🚀 Launching KannadaAI Business OS (ಸ್ವರ AI) Voice Agent SaaS
        </div>

        <h1 style={{
          fontSize: "3.75rem",
          fontWeight: 800,
          fontFamily: "var(--font-family-display)",
          lineHeight: 1.1,
          marginBottom: "24px"
        }}>
          Hire a Kannada Speaking <span className="gradient-text glow-text">AI Employee</span> for Your Business
        </h1>

        <p style={{
          fontSize: "1.2rem",
          color: "var(--text-secondary)",
          maxWidth: "700px",
          lineHeight: 1.6,
          marginBottom: "40px"
        }}>
          KannadaAI Business OS enables business owners to deploy smart AI-powered voice employees that answer calls, qualify leads, explain product specs, and book appointments in local Kannada.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            id="hero-cta-btn"
            href="/login"
            className="btn btn-primary"
            style={{ padding: "14px 32px", fontSize: "1rem", boxShadow: "var(--shadow-glow)" }}
          >
            Start Building Free MVP
            <ArrowRight size={18} />
          </Link>
          
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{ padding: "14px 32px", fontSize: "1rem" }}
          >
            Watch Phase 1 Demo
          </a>
        </div>
      </section>

      {/* Features Overview Grid */}
      <section style={{
        padding: "80px 20px",
        maxWidth: "1200px",
        margin: "0 auto",
        width: "100%"
      }}>
        <h2 style={{
          textAlign: "center",
          fontSize: "2.25rem",
          fontFamily: "var(--font-family-display)",
          marginBottom: "48px"
        }}>
          Why Businesses Choose KannadaAI Business OS
        </h2>

        <div className="stats-grid">
          
          <div className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "rgba(139, 92, 246, 0.1)",
              border: "1px solid rgba(139, 92, 246, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-primary)"
            }}>
              <Bot size={22} />
            </div>
            <h3 style={{ fontSize: "1.25rem" }}>Kannada AI Employees</h3>
            <p style={{ fontSize: "0.95rem" }}>
              Our agents are customized to speak natural Kannada (ಕನ್ನಡ), providing a welcoming voice for local customers.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-success)"
            }}>
              <FileText size={22} />
            </div>
            <h3 style={{ fontSize: "1.25rem" }}>RAG Knowledge Bases</h3>
            <p style={{ fontSize: "0.95rem" }}>
              Upload your own FAQs and products brochures. The agent references this custom context to answer queries accurately.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-warning)"
            }}>
              <PhoneCall size={22} />
            </div>
            <h3 style={{ fontSize: "1.25rem" }}>Real-time Conversations</h3>
            <p style={{ fontSize: "0.95rem" }}>
              Engineered for low-latency voice feedback so call transcripts feel like a natural human discussion.
            </p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid var(--border-light)",
        padding: "40px 20px",
        textAlign: "center",
        fontSize: "0.85rem",
        color: "var(--text-muted)",
        backgroundColor: "var(--bg-sidebar)"
      }}>
        <p>© 2026 KannadaAI Business OS Systems Pvt Ltd. All rights reserved.</p>
        <p style={{ marginTop: "8px" }}>Built in Phases for Outpero-grade AI Voice Calling.</p>
      </footer>

    </main>
  );
}

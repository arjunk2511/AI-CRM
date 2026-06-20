"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Sparkles, Phone, Clock, UserCheck, AlertCircle, Plus, 
  Trash2, Play, LogOut, Settings, Database, BookOpen, 
  Users, HelpCircle, X, ArrowRight, ShieldCheck, Ticket, 
  ShoppingBag, Wrench, BarChart2, ShieldAlert, Award, CreditCard,
  PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneMissed, Mic, MicOff,
  Menu
} from "lucide-react";
import { dbClient } from "@/lib/dbClient";
import { 
  Business, Agent, FAQItem, DocumentItem, Call, Message, 
  Customer, Order, Refund, Appointment, SupportTicket, 
  Subscription, Payment, Product, Service 
} from "@/lib/db";

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "crm" | "products" | "services" | "kb" | "agents" | "billing" | "admin" | "settings">("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("swara_session");
      router.push("/login");
    }
  };
  
  // Workspace & Auth Session
  const [session, setSession] = useState<any>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  
  // Data lists
  const [agents, setAgents] = useState<Agent[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  
  // Super Admin Data
  const [adminStats, setAdminStats] = useState<any>(null);
  const [adminBusinesses, setAdminBusinesses] = useState<any[]>([]);

  // Loading & State variables
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [selectedTranscript, setSelectedTranscript] = useState<Message[]>([]);
  const [isTranscriptLoading, setIsTranscriptLoading] = useState(false);
  
  // Subscription Payment simulation modal
  const [showPayModal, setShowPayModal] = useState<string | null>(null); // plan level or null
  const [isPaying, setIsPaying] = useState(false);

  // Telephony credentials form state
  const [provider, setProvider] = useState<"twilio" | "exotel" | "disabled">("disabled");
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");
  const [twilioPhone, setTwilioPhone] = useState("");
  const [exotelApiKey, setExotelApiKey] = useState("");
  const [exotelToken, setExotelToken] = useState("");
  const [exotelSid, setExotelSid] = useState("");
  const [exotelPhone, setExotelPhone] = useState("");
  const [exotelSubdomain, setExotelSubdomain] = useState("api");

  // Lead Dialer Overlay states
  const [dialingLead, setDialingLead] = useState<Customer | null>(null);
  const [dialCallStatus, setDialCallStatus] = useState<"idle" | "calling" | "ringing" | "connected" | "listening" | "completed">("idle");
  const [dialConversationId, setDialConversationId] = useState("");
  const [dialTranscript, setDialTranscript] = useState<Array<{ role: string; content: string }>>([]);
  const [dialMicActive, setDialMicActive] = useState(false);
  const [dialSpeechPulse, setDialSpeechPulse] = useState(0);
  const [dialInputText, setDialInputText] = useState("");

  // Refs for audio loops
  const dialMicRecorderRef = useRef<MediaRecorder | null>(null);
  const dialMicStreamRef = useRef<MediaStream | null>(null);
  const dialMicChunksRef = useRef<Blob[]>([]);
  const dialPulseIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Form states
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentLang, setNewAgentLang] = useState("Kannada");
  const [newAgentVoice, setNewAgentVoice] = useState("native");
  const [newAgentPrompt, setNewAgentPrompt] = useState("");
  const [newAgentGreet, setNewAgentGreet] = useState("");

  const [newFaqQ, setNewFaqQ] = useState("");
  const [newFaqA, setNewFaqA] = useState("");

  const [newDocName, setNewDocName] = useState("");
  const [newDocContent, setNewDocContent] = useState("");

  const [newProdName, setNewProdName] = useState("");
  const [newProdPrice, setNewProdPrice] = useState(2999);
  const [newProdDesc, setNewProdDesc] = useState("");
  const [newProdWarranty, setNewProdWarranty] = useState("3 Months");
  const [newProdDelivery, setNewProdDelivery] = useState("Free delivery");

  const [newServName, setNewServName] = useState("");
  const [newServPrice, setNewServPrice] = useState("₹1500 per visit");
  const [newServCoverage, setNewServCoverage] = useState("Bengaluru");
  const [newServDesc, setNewServDesc] = useState("");

  const [productsState, setProductsState] = useState<Product[]>([]);
  const [servicesState, setServicesState] = useState<Service[]>([]);

  // Authenticate and load parameters
  useEffect(() => {
    const sessionStr = localStorage.getItem("swara_session");
    if (!sessionStr) {
      router.push("/login");
      return;
    }
    const sess = JSON.parse(sessionStr);
    setSession(sess);
    
    // Resolve active tab from URL search parameters if present
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get("tab");
      if (tabParam && ["overview", "crm", "products", "services", "kb", "agents", "billing", "admin", "settings"].includes(tabParam)) {
        setActiveTab(tabParam as any);
      }
    }
    
    // Load Telephony Credentials if any saved
    const telCreds = localStorage.getItem("swara_telephony");
    if (telCreds) {
      const creds = JSON.parse(telCreds);
      setProvider(creds.provider || "disabled");
      setTwilioSid(creds.twilioSid || "");
      setTwilioToken(creds.twilioToken || "");
      setTwilioPhone(creds.twilioPhone || "");
      setExotelApiKey(creds.exotelApiKey || "");
      setExotelToken(creds.exotelToken || "");
      setExotelSid(creds.exotelSid || "");
      setExotelPhone(creds.exotelPhone || "");
      setExotelSubdomain(creds.exotelSubdomain || "api");
    }

    loadAllSaaSData(sess);
  }, [router]);

  const loadAllSaaSData = async (sess: any) => {
    setIsLoading(true);
    try {
      // 1. Fetch business
      let biz = await dbClient.getBusiness(sess.userId);
      if (!biz) {
        biz = await dbClient.createBusiness(sess.businessName || "SmartMop India", "Consumer Electronics", "+91 98860 12345", sess.userId);
      }
      setBusiness(biz);

      // 2. Fetch subscription
      let sub = await dbClient.getSubscription(biz.id);
      if (!sub) {
        // Create initial trial subscription
        const res = await dbClient.createSubscriptionPayment(biz.id, "starter", 0, "trial_bypass");
        sub = res.subscription;
      }
      setSubscription(sub);

      // 3. Batch fetch entities
      const [
        allAgents, allFaqs, allDocs, allCalls, 
        allCusts, allTickets, allApps, allOrders, allPayments
      ] = await Promise.all([
        dbClient.getAgents(biz.id),
        dbClient.getKnowledgeBase(biz.id),
        dbClient.getDocuments(biz.id),
        dbClient.getConversations(biz.id),
        dbClient.getCustomers(biz.id),
        dbClient.getSupportTickets(biz.id),
        dbClient.getAppointments(biz.id),
        dbClient.getOrders(biz.id),
        dbClient.getPayments(biz.id)
      ]);

      setAgents(allAgents);
      setFaqs(allFaqs);
      setDocs(allDocs);
      setCalls(allCalls);
      setCustomers(allCusts);
      setTickets(allTickets);
      setAppointments(allApps);
      setOrders(allOrders);
      setPayments(allPayments);

      // 4. Admin stats if role is super admin
      if (sess.role === "super_admin") {
        const stats = await dbClient.getPlatformStats();
        const bizList = await dbClient.getAdminBusinessesList();
        setAdminStats(stats);
        setAdminBusinesses(bizList);
      }

    } catch (err) {
      console.error("Error loading SaaS database:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync initial loaded product lists
  useEffect(() => {
    if (productsState.length === 0 && faqs.length > 0) {
      // Lazy load arrays
      dbClient.getProducts(business?.id || "").then(setProductsState).catch(console.error);
      dbClient.getServices(business?.id || "").then(setServicesState).catch(console.error);
    }
  }, [agents]);

  // Telephony credentials save
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

  // --- Sandbox Dialing & Webhook Emulation flow ---
  const handleCallLead = async (lead: Customer) => {
    if (agents.length === 0) {
      alert("Please deploy at least one AI Agent builder first!");
      return;
    }
    setDialingLead(lead);
    setDialCallStatus("calling");
    setDialTranscript([{ role: "system", content: `Triggering outbound dial call via REST payload to: ${lead.phone}...` }]);
    
    // Save creds
    const config = {
      provider, twilioSid, twilioToken, twilioPhone, 
      exotelApiKey, exotelToken, exotelSid, exotelPhone, exotelSubdomain
    };

    try {
      const res = await fetch("/api/calls/outbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerPhone: lead.phone,
          agentId: agents[0].id,
          credentials: config
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Outbound call REST connection failed");
      }

      const data = await res.json();
      setDialConversationId(data.conversationId || data.callId);

      if (data.isSandbox) {
        // Run sandbox dialing flow simulation in browser
        setDialCallStatus("ringing");
        setDialTranscript(prev => [...prev, { role: "system", content: "Sandbox Ringing... (Simulating customer cell ringing)" }]);
        
        // Simulates call answer in 2.5 seconds
        setTimeout(() => {
          setDialCallStatus("connected");
          setDialTranscript(prev => [...prev, { role: "system", content: "Call Connected! AI Agent initiating greeting..." }]);
          
          // Triggers empty POST to webhook to fetch greeting TwiML XML
          runSandboxWebhookStep("");
        }, 2500);
      } else {
        // Real Twilio/Exotel call triggered
        setDialCallStatus("connected");
        setDialTranscript(prev => [
          ...prev, 
          { role: "system", content: `Outbound call triggered successfully on carrier API Gateway!` },
          { role: "system", content: `Call Sid: ${data.callId}. AI Agent is speaking live with customer.` },
          { role: "system", content: `Transcript and CRM records will sync automatically when carrier webhook executes.` }
        ]);
      }

    } catch (err: any) {
      console.error(err);
      setDialTranscript(prev => [...prev, { role: "system", content: `Dialing error: ${err.message}` }]);
    }
  };

  const runSandboxWebhookStep = async (userSpeechText: string) => {
    if (!dialConversationId || !agents.length) return;
    
    if (userSpeechText) {
      setDialTranscript(prev => [...prev, { role: "user", content: userSpeechText }]);
      setIsPaying(true); // use as temporary spinner indicator
    }

    try {
      const formData = new FormData();
      formData.append("From", dialingLead?.phone || "+91 99000 12345");
      formData.append("digits", "");
      if (userSpeechText) {
        formData.append("SpeechResult", userSpeechText);
      }

      // Calls our actual API Webhook endpoint!
      const webhookRes = await fetch(`/api/calls/webhook?conversationId=${dialConversationId}&agentId=${agents[0].id}`, {
        method: "POST",
        body: formData
      });

      if (!webhookRes.ok) throw new Error("Webhook processing failed");

      const twimlXml = await webhookRes.text();
      
      // Parse XML response dynamically using Regex
      const sayRegex = /<Say[^>]*>([\s\S]*?)<\/Say>/g;
      const matches = sayRegex.exec(twimlXml);
      let sayText = matches ? matches[1] : "ನಮಸ್ಕಾರ!";
      
      // Clean HTML XML text
      sayText = sayText.replace(/<\/?[^>]+(>|$)/g, "");

      // Display AI message response
      setDialTranscript(prev => [...prev, { role: "assistant", content: sayText }]);

      // Speak response in Kannada aloud via browser
      speakVoiceSynthesis(sayText, agents[0].language);

      // Check if TwiML instructs transfer/dial (escalation)
      if (twimlXml.includes("<Dial>")) {
        setDialTranscript(prev => [...prev, { role: "system", content: "Telephony webhook triggered <Dial> transfer. Calling supervisor..." }]);
        setTimeout(() => {
          handleHangUpCall();
        }, 4000);
      }

    } catch (err: any) {
      console.error(err);
      setDialTranscript(prev => [...prev, { role: "system", content: "Error compiling webhook response." }]);
    } finally {
      setIsPaying(false);
    }
  };

  // Speaks browser-native text
  const speakVoiceSynthesis = (text: string, lang: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const langMap: Record<string, string> = {
      "Kannada": "kn-IN", "Telugu": "te-IN", "Hindi": "hi-IN", 
      "Tamil": "ta-IN", "Malayalam": "ml-IN", "English": "en-US"
    };
    utterance.lang = langMap[lang] || "kn-IN";
    window.speechSynthesis.speak(utterance);
  };

  // Mic hooks for local dialer testing
  const toggleDialMic = async () => {
    if (dialMicActive) {
      stopDialMicRecording();
    } else {
      await startDialMicRecording();
    }
  };

  const startDialMicRecording = async () => {
    dialMicChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      dialMicStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      dialMicRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) dialMicChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(dialMicChunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", audioBlob);

        try {
          const res = await fetch("/api/voice/transcribe", {
            method: "POST",
            body: formData
          });
          const data = await res.json();
          if (data.text) {
            runSandboxWebhookStep(data.text);
          }
        } catch (err) {
          console.error(err);
        }
      };

      mediaRecorder.start();
      setDialMicActive(true);

      dialPulseIntervalRef.current = setInterval(() => {
        setDialSpeechPulse(Math.floor(Math.random() * 8) + 2);
      }, 100);

    } catch (err) {
      console.error(err);
      alert("Mic permission required for voice simulations.");
    }
  };

  const stopDialMicRecording = () => {
    if (dialMicRecorderRef.current && dialMicActive) {
      dialMicRecorderRef.current.stop();
    }
    if (dialMicStreamRef.current) {
      dialMicStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (dialPulseIntervalRef.current) {
      clearInterval(dialPulseIntervalRef.current);
    }
    setDialMicActive(false);
    setDialSpeechPulse(0);
  };

  const handleHangUpCall = () => {
    stopDialMicRecording();
    if (typeof window !== "undefined") window.speechSynthesis.cancel();
    setDialCallStatus("completed");
    setDialTranscript(prev => [...prev, { role: "system", content: "Call Disconnected. Syncing CRM workspaces metrics..." }]);
    
    // Refresh tables
    setTimeout(() => {
      setDialingLead(null);
      setDialCallStatus("idle");
      setDialTranscript([]);
      if (session) loadAllSaaSData(session);
    }, 2000);
  };

  // --- CRUD Add operations ---
  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !newAgentName || !newAgentPrompt) return;
    try {
      const voiceIdMap: Record<string, string> = {
        "Kannada": "kn-IN-Wavenet-A",
        "Telugu": "te-IN-Wavenet-A",
        "Hindi": "hi-IN-Wavenet-A",
        "Tamil": "ta-IN-Wavenet-A",
        "Malayalam": "ml-IN-Wavenet-A",
        "English": "en-US-Wavenet-F"
      };

      const voiceId = voiceIdMap[newAgentLang] || "native";
      const greet = newAgentGreet || (newAgentLang === "Kannada" ? `ನಮಸ್ಕಾರ, ನಾನು ${newAgentName}. ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?` : `Hello, I am ${newAgentName}. How can I help you?`);
      
      const newAgent = await dbClient.createAgent(
        business.id,
        newAgentName,
        newAgentLang,
        newAgentVoice,
        voiceId,
        newAgentPrompt
      );

      await dbClient.updateAgent(newAgent.id, {
        greeting_message: greet,
        personality: "Professional voice agent builder representative."
      });

      alert("Voice Employee Agent deployed successfully!");
      setAgents([...agents, { ...newAgent, greeting_message: greet }]);
      setNewAgentName("");
      setNewAgentPrompt("");
      setNewAgentGreet("");
    } catch (err) {
      console.error(err);
      alert("Failed to build agent.");
    }
  };

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !newFaqQ || !newFaqA) return;
    try {
      const faq = await dbClient.addFAQ(business.id, newFaqQ, newFaqA);
      setFaqs([...faqs, faq]);
      setNewFaqQ("");
      setNewFaqA("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm("Delete FAQ entry?")) return;
    try {
      await dbClient.deleteFAQ(id);
      setFaqs(faqs.filter(f => f.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !newDocName || !newDocContent) return;
    try {
      const doc = await dbClient.addDocument(business.id, newDocName, "pdf", newDocContent);
      setDocs([...docs, doc]);
      setNewDocName("");
      setNewDocContent("");
      alert("Document uploaded and chunked for RAG semantic searches.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm("Delete document context?")) return;
    try {
      await dbClient.deleteDocument(id);
      setDocs(docs.filter(d => d.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !newProdName) return;
    try {
      const p = await dbClient.addProduct(business.id, {
        name: newProdName,
        price: newProdPrice,
        discount: 0,
        description: newProdDesc,
        features: "Premium grade specs",
        benefits: "Automated efficiency",
        warranty: newProdWarranty,
        return_policy: "7-day replacement",
        delivery_info: newProdDelivery
      });
      setProductsState([...productsState, p]);
      setNewProdName("");
      setNewProdDesc("");
      alert("Product details updated.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Delete product specs?")) return;
    try {
      await dbClient.deleteProduct(id);
      setProductsState(productsState.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !newServName) return;
    try {
      const s = await dbClient.addService(business.id, {
        name: newServName,
        pricing: newServPrice,
        coverage_area: newServCoverage,
        description: newServDesc,
        duration: "1 hour",
        terms: "Payment upon service review."
      });
      setServicesState([...servicesState, s]);
      setNewServName("");
      setNewServDesc("");
      alert("Service details saved.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Delete service specs?")) return;
    try {
      await dbClient.deleteService(id);
      setServicesState(servicesState.filter(s => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTicketStatus = async (tktId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "open" ? "resolved" : "open";
      await dbClient.updateSupportTicket(tktId, newStatus);
      setTickets(tickets.map(t => t.id === tktId ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error(err);
    }
  };

  // Upgrade Plan
  const handleUpgradePlan = (planLevel: string) => {
    setShowPayModal(planLevel);
  };

  const executeRazorpaySuccess = async () => {
    if (!business || !showPayModal) return;
    setIsPaying(true);
    try {
      const planPrices: Record<string, number> = {
        starter: 2999,
        growth: 7999,
        pro: 14999,
        enterprise: 49999
      };
      
      const amount = planPrices[showPayModal] || 2999;
      const rzpId = `rzp_sandbox_${Math.random().toString(36).substr(2, 9)}`;
      
      const { subscription: updatedSub, payment } = await dbClient.createSubscriptionPayment(
        business.id,
        showPayModal as Subscription["plan"],
        amount,
        rzpId
      );

      setSubscription(updatedSub);
      setPayments([payment, ...payments]);
      setShowPayModal(null);
      alert(`Subscription payment of ₹${amount} successful! Workspace plan upgraded to: ${showPayModal.toUpperCase()}`);
    } catch (err) {
      console.error(err);
      alert("Payment transaction failed.");
    } finally {
      setIsPaying(false);
    }
  };

  // Open transcript modal
  const openCallLogs = async (callObj: Call) => {
    setSelectedCall(callObj);
    setIsTranscriptLoading(true);
    try {
      const msgs = await dbClient.getMessages(callObj.id);
      setSelectedTranscript(msgs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranscriptLoading(false);
    }
  };

  // Calculations
  const totalCallsCount = calls.length;
  const qualifiedLeads = customers.filter(c => c.is_lead);
  const totalLeadsCount = qualifiedLeads.length;
  const totalAppsCount = appointments.length;
  
  const totalDuration = calls.reduce((acc, c) => acc + c.duration_seconds, 0);
  const avgDuration = totalCallsCount ? Math.round(totalDuration / totalCallsCount) : 0;
  
  const positiveCalls = calls.filter(c => c.sentiment === "positive").length;
  const csatScore = totalCallsCount 
    ? ((positiveCalls / totalCallsCount) * 5).toFixed(1) 
    : "4.6";

  const isSuperAdmin = session?.role === "super_admin";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="pulsing-indicator active h-8 w-8 mb-4" />
          <h2 className="text-sm font-semibold text-slate-400">Loading SaaS Dashboard Core...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden" id="dashboard-root">
      
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

        {/* Sidebar Nav */}
        <nav className="flex flex-col gap-1.5 flex-grow">
          <button
            id="nav-overview"
            className={`flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-lg cursor-pointer transition-all ${
              activeTab === "overview" ? "bg-violet-600/15 border border-violet-500/25 text-violet-400" : "text-slate-400 hover:text-slate-200 border border-transparent"
            }`}
            onClick={() => { setActiveTab("overview"); setIsSidebarOpen(false); }}
          >
            <BarChart2 className="h-4 w-4" />
            Overview Panel
          </button>

          <button
            id="nav-crm"
            className={`flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-lg cursor-pointer transition-all ${
              activeTab === "crm" ? "bg-violet-600/15 border border-violet-500/25 text-violet-400" : "text-slate-400 hover:text-slate-200 border border-transparent"
            }`}
            onClick={() => { setActiveTab("crm"); setIsSidebarOpen(false); }}
          >
            <Users className="h-4 w-4" />
            CRM & qualified Leads
          </button>

          <button
            id="nav-products"
            className={`flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-lg cursor-pointer transition-all ${
              activeTab === "products" ? "bg-violet-600/15 border border-violet-500/25 text-violet-400" : "text-slate-400 hover:text-slate-200 border border-transparent"
            }`}
            onClick={() => { setActiveTab("products"); setIsSidebarOpen(false); }}
          >
            <ShoppingBag className="h-4 w-4" />
            Product Specs
          </button>

          <button
            id="nav-services"
            className={`flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-lg cursor-pointer transition-all ${
              activeTab === "services" ? "bg-violet-600/15 border border-violet-500/25 text-violet-400" : "text-slate-400 hover:text-slate-200 border border-transparent"
            }`}
            onClick={() => { setActiveTab("services"); setIsSidebarOpen(false); }}
          >
            <Wrench className="h-4 w-4" />
            Services catalog
          </button>

          <button
            id="nav-kb"
            className={`flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-lg cursor-pointer transition-all ${
              activeTab === "kb" ? "bg-violet-600/15 border border-violet-500/25 text-violet-400" : "text-slate-400 hover:text-slate-200 border border-transparent"
            }`}
            onClick={() => { setActiveTab("kb"); setIsSidebarOpen(false); }}
          >
            <BookOpen className="h-4 w-4" />
            RAG Knowledge Base
          </button>

          <button
            id="nav-agents"
            className={`flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-lg cursor-pointer transition-all ${
              activeTab === "agents" ? "bg-violet-600/15 border border-violet-500/25 text-violet-400" : "text-slate-400 hover:text-slate-200 border border-transparent"
            }`}
            onClick={() => { setActiveTab("agents"); setIsSidebarOpen(false); }}
          >
            <Play className="h-4 w-4" />
            Voice Agent Config
          </button>

          <button
            id="nav-billing"
            className={`flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-lg cursor-pointer transition-all ${
              activeTab === "billing" ? "bg-violet-600/15 border border-violet-500/25 text-violet-400" : "text-slate-400 hover:text-slate-200 border border-transparent"
            }`}
            onClick={() => { setActiveTab("billing"); setIsSidebarOpen(false); }}
          >
            <CreditCard className="h-4 w-4" />
            Plans & Razorpay
          </button>

          {isSuperAdmin && (
            <button
              id="nav-admin"
              className={`flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-lg cursor-pointer transition-all border border-emerald-500/10 ${
                activeTab === "admin" ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-400" : "text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/5"
              }`}
              onClick={() => { setActiveTab("admin"); setIsSidebarOpen(false); }}
            >
              <ShieldAlert className="h-4 w-4" />
              Super Admin panel
            </button>
          )}
        </nav>

        <div className="pt-4 border-t border-slate-800/80 mt-auto">
          <button
            id="nav-settings"
            className="w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg cursor-pointer font-semibold transition-all mb-2 text-slate-400 hover:text-slate-200"
            onClick={() => { router.push("/dashboard/telephony"); setIsSidebarOpen(false); }}
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
              {activeTab === "overview" && "SaaS Overview Analytics"}
              {activeTab === "crm" && "Workspace CRM & leads panel"}
              {activeTab === "products" && "Product Catalog details"}
              {activeTab === "services" && "Service specifications"}
              {activeTab === "kb" && "Retrieval-Augmented Generation (RAG)"}
              {activeTab === "agents" && "Deploy KannadaAI Business OS Voice Agents"}
              {activeTab === "billing" && "Workspace plans & payments"}
              {activeTab === "admin" && "Super Admin Central Command"}
              {activeTab === "settings" && "Telephony Gateway Credentials"}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Business Workspace: <strong className="text-violet-400">{business?.business_name}</strong> | Category: <strong>{business?.category}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="badge badge-primary bg-violet-600/10 border border-violet-500/20 text-violet-400 px-3 py-1.5 rounded-full text-xs font-semibold">
              Plan: <span className="uppercase text-white ml-1">{subscription?.plan}</span>
            </span>
            {session?.isSandbox ? (
              <span className="badge bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center">
                <span className="pulsing-indicator active mr-2" />
                Sandbox Active
              </span>
            ) : (
              <span className="badge bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center">
                Live Production
              </span>
            )}
          </div>
        </header>

        {/* -------------------- VIEW: OVERVIEW -------------------- */}
        {activeTab === "overview" && (
          <section id="tab-overview" className="space-y-8">
            
            {/* Metric grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              
              <div className="glass-panel rounded-2xl p-6 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:height-[3px] before:bg-violet-600">
                <div className="flex justify-between items-center text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Voice Calls</span>
                  <Phone className="h-5 w-5 text-violet-500" />
                </div>
                <div className="text-3xl font-extrabold text-white">{totalCallsCount}</div>
                <div className="text-[10px] text-slate-500 mt-2">Active calls & playground testing logs</div>
              </div>

              <div className="glass-panel rounded-2xl p-6 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:height-[3px] before:bg-violet-600">
                <div className="flex justify-between items-center text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Avg Call Duration</span>
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
                <div className="text-3xl font-extrabold text-white">{avgDuration}s</div>
                <div className="text-[10px] text-slate-500 mt-2">Conversational speed benchmark</div>
              </div>

              <div className="glass-panel rounded-2xl p-6 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:height-[3px] before:bg-violet-600">
                <div className="flex justify-between items-center text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">CRM qualified Leads</span>
                  <UserCheck className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="text-3xl font-extrabold text-white">{totalLeadsCount}</div>
                <div className="text-[10px] text-slate-500 mt-2">Leads extracted dynamically from transcripts</div>
              </div>

              <div className="glass-panel rounded-2xl p-6 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:height-[3px] before:bg-violet-600">
                <div className="flex justify-between items-center text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Customer CSAT</span>
                  <Award className="h-5 w-5 text-indigo-500" />
                </div>
                <div className="text-3xl font-extrabold text-white">{csatScore}/5.0</div>
                <div className="text-[10px] text-slate-500 mt-2">Aggregated customer call sentiment score</div>
              </div>

            </div>

            {/* Calling gateway analytics grid summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Telephony metrics */}
              <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
                <h3 className="text-sm font-bold text-slate-300 mb-4">Telephony Gateway Logs</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-2"><PhoneIncoming className="h-4 w-4 text-emerald-400" /> Inbound Calls</span>
                    <strong className="text-white">6</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-2"><PhoneOutgoing className="h-4 w-4 text-indigo-400" /> Outbound Calls</span>
                    <strong className="text-white">{totalCallsCount}</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-2"><PhoneMissed className="h-4 w-4 text-red-400" /> Missed Calls</span>
                    <strong className="text-white">0</strong>
                  </div>
                </div>
                <div className="border-t border-slate-800 pt-4 mt-6 text-[10px] text-slate-500">
                  Real-time Twilio & Exotel active lines log
                </div>
              </div>

              {/* Weekly Call Volume Analytics Chart */}
              <div className="glass-panel rounded-2xl p-6 md:col-span-2">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-violet-500" />
                  Weekly Call Volume Analytics
                </h3>
                <div className="flex items-end justify-between h-36 px-4 border-b border-slate-850">
                  {[
                    { day: "Mon", count: 4, height: "h-[30px]" },
                    { day: "Tue", count: 8, height: "h-[60px]" },
                    { day: "Wed", count: 12, height: "h-[90px]" },
                    { day: "Thu", count: 6, height: "h-[45px]" },
                    { day: "Fri", count: 15, height: "h-[110px]" },
                    { day: "Sat", count: 9, height: "h-[65px]" },
                    { day: "Sun", count: 2, height: "h-[15px]" }
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1 w-10">
                      <div className="text-[9px] text-slate-400 font-bold">{item.count}</div>
                      <div className={`w-5 ${item.height} bg-gradient-to-t from-violet-600 to-indigo-500 rounded-t`} />
                      <span className="text-[10px] text-slate-500 mt-1 font-semibold">{item.day}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Recent conversation logs */}
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-bold">Recent Live Calls Log</h3>
                <span className="text-xs text-slate-500">Real-time transcripts cataloged</span>
              </div>
              <div className="overflow-x-auto">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Customer Name</th>
                      <th>Duration</th>
                      <th>Sentiment</th>
                      <th>Outcome / Summary</th>
                      <th>Date / Time</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calls.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-slate-500 py-8">
                          No voice conversations captured yet. Open the Playground to simulate user calls!
                        </td>
                      </tr>
                    ) : (
                      calls.map((c) => (
                        <tr key={c.id}>
                          <td className="font-semibold text-white">{c.customer_name}</td>
                          <td>{c.duration_seconds}s</td>
                          <td>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                              c.sentiment === "positive" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                              c.sentiment === "frustrated" ? "bg-red-500/10 border-red-500/20 text-red-400" :
                              "bg-slate-500/10 border-slate-500/20 text-slate-400"
                            }`}>
                              {c.sentiment}
                            </span>
                          </td>
                          <td className="max-w-xs truncate text-slate-300">{c.summary || "Call completed naturally."}</td>
                          <td className="text-xs text-slate-400">{new Date(c.created_at).toLocaleString("en-IN")}</td>
                          <td>
                            <button
                              className="px-3 py-1 bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:text-white rounded-lg text-xs font-semibold transition-all"
                              onClick={() => openCallLogs(c)}
                            >
                              Open Transcript
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </section>
        )}

        {/* -------------------- VIEW: CRM & LEADS -------------------- */}
        {activeTab === "crm" && (
          <section id="tab-crm" className="space-y-8">
            
            {/* Qualified leads dashboard */}
            <div className="glass-panel rounded-2xl p-6">
              <h3 className="text-base font-bold mb-4">Qualified Sales Leads (Dynamic CRM Extraction)</h3>
              <p className="text-xs text-slate-400 mb-6">
                The AI Voice Agent extracts contact credentials, budgets, requirements, and callback preferences dynamically during user calls. Click the Phone icon to dial customer using active gateway or sandbox simulator.
              </p>
              
              <div className="overflow-x-auto">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>City</th>
                      <th>Budget</th>
                      <th>Callback Window</th>
                      <th>Intent requirements</th>
                      <th>Lead Score</th>
                      <th>Call Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.filter(c => c.is_lead).length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center text-slate-500 py-8">
                          No leads generated. Test the voice bot using product/pricing queries to log a qualified lead.
                        </td>
                      </tr>
                    ) : (
                      customers.filter(c => c.is_lead).map((lead) => (
                        <tr key={lead.id}>
                          <td className="font-semibold text-white">{lead.name}</td>
                          <td className="text-slate-300 font-mono text-xs">{lead.phone}</td>
                          <td>{lead.city}</td>
                          <td className="text-violet-400 font-semibold">₹{lead.budget}</td>
                          <td className="text-xs text-slate-400">{lead.callback_time}</td>
                          <td className="max-w-xs truncate">{lead.requirements}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${
                                    lead.lead_score >= 80 ? "bg-emerald-500" :
                                    lead.lead_score >= 50 ? "bg-amber-500" : "bg-red-500"
                                  }`}
                                  style={{ width: `${lead.lead_score}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold font-mono">{lead.lead_score}</span>
                            </div>
                          </td>
                          <td>
                            <button
                              id={`dial-lead-${lead.id}`}
                              className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg cursor-pointer transition-all active:scale-95"
                              onClick={() => handleCallLead(lead)}
                              title="Call Lead"
                            >
                              <PhoneCall className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Support Tickets Board */}
            <div className="glass-panel rounded-2xl p-6">
              <h3 className="text-base font-bold mb-6">Active Customer Service Support Tickets</h3>
              <div className="overflow-x-auto">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Priority</th>
                      <th>Issue Description</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-slate-500 py-8">
                          No tickets created. Refund/Defect statements in calls automatically create tickets.
                        </td>
                      </tr>
                    ) : (
                      tickets.map((tkt) => (
                        <tr key={tkt.id}>
                          <td className="font-semibold text-white">{tkt.subject}</td>
                          <td>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              tkt.priority === "high" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                              tkt.priority === "medium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                              "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                            }`}>
                              {tkt.priority}
                            </span>
                          </td>
                          <td className="max-w-xs truncate text-slate-300">{tkt.issue_description}</td>
                          <td>
                            <span className={`badge ${tkt.status === "resolved" ? "badge-success bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "badge-danger bg-red-500/10 border-red-500/20 text-red-400"} px-2 py-0.5 rounded text-[10px] font-bold uppercase`}>
                              {tkt.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="px-3 py-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-xs font-semibold transition-all"
                              onClick={() => toggleTicketStatus(tkt.id, tkt.status)}
                            >
                              Toggle Status
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Scheduled Appointments calendar slot tracker */}
            <div className="glass-panel rounded-2xl p-6">
              <h3 className="text-base font-bold mb-6">Upcoming Demo Appointments (Calendar integrations)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {appointments.length === 0 ? (
                  <div className="col-span-3 text-center text-slate-500 py-8">
                    No appointments scheduled.
                  </div>
                ) : (
                  appointments.map((app) => (
                    <div key={app.id} className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-violet-400">{app.time}</span>
                          <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase">
                            {app.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mb-2">Home Demo Call</h4>
                        <p className="text-xs text-slate-400 leading-normal italic">
                          "{app.notes}"
                        </p>
                      </div>
                      <div className="border-t border-slate-800 pt-3 mt-4 text-[10px] text-slate-500 font-semibold">
                        Scheduled Date: {app.date}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </section>
        )}

        {/* -------------------- VIEW: PRODUCTS -------------------- */}
        {activeTab === "products" && (
          <section id="tab-products" className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* List Catalog */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-base font-bold mb-2">Workspace Products Catalog</h3>
              {productsState.length === 0 ? (
                <div className="glass-panel rounded-2xl p-8 text-center text-slate-500">
                  No products added yet.
                </div>
              ) : (
                productsState.map((prod) => (
                  <div key={prod.id} className="glass-panel rounded-2xl p-5 flex justify-between items-start">
                    <div className="space-y-2">
                      <h4 className="text-md font-bold text-white">{prod.name}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-xl">{prod.description}</p>
                      <div className="flex gap-4 text-xs font-medium text-slate-400">
                        <span>Price: <strong className="text-violet-400">₹{prod.price}</strong></span>
                        <span>Warranty: <strong>{prod.warranty}</strong></span>
                        <span>Delivery: <strong>{prod.delivery_info}</strong></span>
                      </div>
                    </div>
                    <button
                      className="text-red-400 hover:text-red-300 p-2"
                      onClick={() => handleDeleteProduct(prod.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Product Form */}
            <div className="glass-panel rounded-2xl p-6 h-fit">
              <h3 className="text-base font-bold mb-4">Add Product details</h3>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Product Name</label>
                  <input
                    id="new-product-name"
                    type="text"
                    required
                    className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                    placeholder="e.g. SmartMop Pro"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Price (₹)</label>
                    <input
                      id="new-product-price"
                      type="number"
                      required
                      className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Warranty</label>
                    <input
                      id="new-product-warranty"
                      type="text"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                      placeholder="e.g. 1 Year"
                      value={newProdWarranty}
                      onChange={(e) => setNewProdWarranty(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Delivery Time</label>
                  <input
                    id="new-product-delivery"
                    type="text"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                    placeholder="e.g. Ships in 2 days"
                    value={newProdDelivery}
                    onChange={(e) => setNewProdDelivery(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Product Description (for AI RAG training)</label>
                  <textarea
                    id="new-product-desc"
                    required
                    rows={4}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                    placeholder="Provide details about specs, battery capacity, motor power, return policy, and benefits..."
                    value={newProdDesc}
                    onChange={(e) => setNewProdDesc(e.target.value)}
                  />
                </div>

                <button
                  id="submit-new-product"
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-500 text-xs font-bold rounded-lg cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Save Product details
                </button>
              </form>
            </div>

          </section>
        )}

        {/* -------------------- VIEW: SERVICES -------------------- */}
        {activeTab === "services" && (
          <section id="tab-services" className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Services catalog list */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-base font-bold mb-2">Active Services List</h3>
              {servicesState.length === 0 ? (
                <div className="glass-panel rounded-2xl p-8 text-center text-slate-500">
                  No services added yet.
                </div>
              ) : (
                servicesState.map((serv) => (
                  <div key={serv.id} className="glass-panel rounded-2xl p-5 flex justify-between items-start">
                    <div className="space-y-2">
                      <h4 className="text-md font-bold text-white">{serv.name}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-xl">{serv.description}</p>
                      <div className="flex gap-4 text-xs font-medium text-slate-400">
                        <span>Pricing: <strong className="text-violet-400">{serv.pricing}</strong></span>
                        <span>Coverage: <strong>{serv.coverage_area}</strong></span>
                      </div>
                    </div>
                    <button
                      className="text-red-400 hover:text-red-300 p-2"
                      onClick={() => handleDeleteService(serv.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Service form */}
            <div className="glass-panel rounded-2xl p-6 h-fit">
              <h3 className="text-base font-bold mb-4">Register Service</h3>
              <form onSubmit={handleAddService} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Service Name</label>
                  <input
                    id="new-service-name"
                    type="text"
                    required
                    className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                    placeholder="e.g. Deep Cleaning / Repair"
                    value={newServName}
                    onChange={(e) => setNewServName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Pricing Details</label>
                    <input
                      id="new-service-price"
                      type="text"
                      required
                      className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                      placeholder="e.g. ₹1500 visit"
                      value={newServPrice}
                      onChange={(e) => setNewServPrice(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Coverage Area</label>
                    <input
                      id="new-service-coverage"
                      type="text"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                      placeholder="e.g. Bengaluru"
                      value={newServCoverage}
                      onChange={(e) => setNewServCoverage(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Service Description (for AI training)</label>
                  <textarea
                    id="new-service-desc"
                    required
                    rows={4}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                    placeholder="Explain duration, terms & conditions, and service process..."
                    value={newServDesc}
                    onChange={(e) => setNewServDesc(e.target.value)}
                  />
                </div>

                <button
                  id="submit-new-service"
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-500 text-xs font-bold rounded-lg cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Save Service details
                </button>
              </form>
            </div>

          </section>
        )}

        {/* -------------------- VIEW: KNOWLEDGE BASE -------------------- */}
        {activeTab === "kb" && (
          <section id="tab-kb" className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left: FAQs list & Document chunks */}
            <div className="md:col-span-2 space-y-8">
              
              {/* FAQs */}
              <div className="glass-panel rounded-2xl p-6">
                <h3 className="text-base font-bold mb-4">FAQ Brain Contexts</h3>
                <div className="overflow-x-auto">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th style={{ width: "35%" }}>Question</th>
                        <th style={{ width: "55%" }}>Response (Kannada)</th>
                        <th style={{ width: "10%" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {faqs.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center text-slate-500 py-6">No FAQs configured yet.</td>
                        </tr>
                      ) : (
                        faqs.map((faq) => (
                          <tr key={faq.id}>
                            <td className="font-semibold text-white text-xs">{faq.question}</td>
                            <td className="text-xs text-slate-300 leading-normal">{faq.answer}</td>
                            <td>
                              <button
                                className="text-red-400 hover:text-red-300"
                                onClick={() => handleDeleteFaq(faq.id)}
                              >
                                <Trash2 className="h-4.5 w-4.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PDF Documents */}
              <div className="glass-panel rounded-2xl p-6">
                <h3 className="text-base font-bold mb-4">Parsed Documents & Brochures</h3>
                {docs.length === 0 ? (
                  <p className="text-center text-slate-500 text-xs py-4">No documents uploaded.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {docs.map((doc) => (
                      <div key={doc.id} className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-bold text-white mb-1.5">{doc.name}</h4>
                          <p className="text-[11px] text-slate-400 font-mono line-clamp-3 leading-relaxed">
                            {doc.text_content}
                          </p>
                        </div>
                        <button
                          className="text-red-400 hover:text-red-300 ml-4 shrink-0"
                          onClick={() => handleDeleteDoc(doc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Right: Upload FAQ / Doc forms */}
            <div className="space-y-6">
              
              {/* FAQ Form */}
              <div className="glass-panel rounded-2xl p-6">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4">Add FAQ context</h3>
                <form onSubmit={handleAddFaq} className="space-y-4">
                  <div>
                    <input
                      id="faq-q-input"
                      type="text"
                      required
                      className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg p-2.5 text-xs focus:outline-none"
                      placeholder="Question (e.g. ಬೆಲೆ ಎಷ್ಟು?)"
                      value={newFaqQ}
                      onChange={(e) => setNewFaqQ(e.target.value)}
                    />
                  </div>
                  <div>
                    <textarea
                      id="faq-a-input"
                      required
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg p-2.5 text-xs focus:outline-none"
                      placeholder="Answer in Kannada (e.g. SmartMop ಬೆಲೆ ₹2999 ಆಗಿದೆ.)"
                      value={newFaqA}
                      onChange={(e) => setNewFaqA(e.target.value)}
                    />
                  </div>
                  <button
                    id="faq-submit"
                    type="submit"
                    className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Add FAQ Brain Rule
                  </button>
                </form>
              </div>

              {/* Document upload form */}
              <div className="glass-panel rounded-2xl p-6">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4">Simulate PDF / URL upload</h3>
                <form onSubmit={handleAddDoc} className="space-y-4">
                  <div>
                    <input
                      id="doc-name-input"
                      type="text"
                      required
                      className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg p-2.5 text-xs focus:outline-none"
                      placeholder="Document name (e.g. smartmop_brochure.pdf)"
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                    />
                  </div>
                  <div>
                    <textarea
                      id="doc-text-input"
                      required
                      rows={4}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg p-2.5 text-xs focus:outline-none"
                      placeholder="Paste PDF text copy or website content details..."
                      value={newDocContent}
                      onChange={(e) => setNewDocContent(e.target.value)}
                    />
                  </div>
                  <button
                    id="doc-submit"
                    type="submit"
                    className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Parse and Index Chunks
                  </button>
                </form>
              </div>

            </div>
          </section>
        )}

        {/* -------------------- VIEW: AGENTS BUILDER -------------------- */}
        {activeTab === "agents" && (
          <section id="tab-agents" className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left: Active Agents list */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-base font-bold mb-2">Configured Voice Employees</h3>
              {agents.map((ag) => (
                <div key={ag.id} className="glass-panel rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-bold text-white">{ag.name}</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Lang: <strong>{ag.language}</strong> | Voice: <strong>{ag.voice_provider} ({ag.voice_id})</strong>
                      </p>
                    </div>

                    <button
                      className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-xs font-bold rounded-xl shadow-md transition-all active:scale-98"
                      onClick={() => router.push(`/chat/${ag.id}`)}
                    >
                      <Play className="h-3.5 w-3.5 fill-white" />
                      Test Live Call
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                      <span className="font-semibold text-slate-400 block mb-1 uppercase tracking-wider text-[9px]">Greeting Phrase</span>
                      <p className="text-slate-200 leading-normal">"{ag.greeting_message}"</p>
                    </div>
                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                      <span className="font-semibold text-slate-400 block mb-1 uppercase tracking-wider text-[9px]">Agent prompt constraints</span>
                      <p className="text-slate-200 line-clamp-3 leading-normal">"{ag.system_prompt}"</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Agent configuration wizard */}
            <div className="glass-panel rounded-2xl p-6 h-fit">
              <h3 className="text-base font-bold mb-4">Deploy Voice Employee</h3>
              <form onSubmit={handleCreateAgent} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Agent Name</label>
                  <input
                    id="agent-name-input"
                    type="text"
                    required
                    className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg p-2.5 text-xs focus:outline-none"
                    placeholder="e.g. ಶಾರದಾ (Sharada)"
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Language</label>
                    <select
                      id="agent-lang-select"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg p-2.5 text-xs focus:outline-none"
                      value={newAgentLang}
                      onChange={(e) => setNewAgentLang(e.target.value)}
                    >
                      <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                      <option value="English">English</option>
                      <option value="Hindi">Hindi (ಹಿಂದಿ)</option>
                      <option value="Telugu">Telugu (ತೆಲುಗು)</option>
                      <option value="Tamil">Tamil (ತಮಿಳು)</option>
                      <option value="Malayalam">Malayalam</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Voice Engine</label>
                    <select
                      id="agent-voice-select"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg p-2.5 text-xs focus:outline-none"
                      value={newAgentVoice}
                      onChange={(e) => setNewAgentVoice(e.target.value)}
                    >
                      <option value="native">Browser TTS</option>
                      <option value="elevenlabs">ElevenLabs Realtime</option>
                      <option value="openai">OpenAI Realtime</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Greeting Message</label>
                  <input
                    id="agent-greet-input"
                    type="text"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg p-2.5 text-xs focus:outline-none"
                    placeholder="Leave blank for automatic greeting..."
                    value={newAgentGreet}
                    onChange={(e) => setNewAgentGreet(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Instructions & Persona prompt</label>
                  <textarea
                    id="agent-instructions-input"
                    required
                    rows={5}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg p-2.5 text-xs focus:outline-none"
                    placeholder="Describe their phone manners, role, specs to lookup, and when to book demos..."
                    value={newAgentPrompt}
                    onChange={(e) => setNewAgentPrompt(e.target.value)}
                  />
                </div>

                <button
                  id="agent-submit-btn"
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-500 text-xs font-bold rounded-lg cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Deploy Agent
                </button>
              </form>
            </div>

          </section>
        )}

        {/* -------------------- VIEW: SUBSCRIPTIONS & RAZORPAY -------------------- */}
        {activeTab === "billing" && (
          <section id="tab-billing" className="space-y-8">
            
            {/* Plan grids */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between border-slate-800">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Starter</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">₹2,999</span>
                    <span className="text-xs text-slate-500">/month</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-400">
                    <li className="flex items-center gap-2">✓ 500 Call Minutes</li>
                    <li className="flex items-center gap-2">✓ 1 Active AI voice agent</li>
                    <li className="flex items-center gap-2">✓ Standard FAQ RAG</li>
                  </ul>
                </div>
                <button
                  className={`w-full py-2 rounded-lg text-xs font-bold mt-8 transition-all ${
                    subscription?.plan === "starter" 
                      ? "bg-slate-800 text-slate-400 cursor-not-allowed" 
                      : "bg-violet-600 hover:bg-violet-500 text-white cursor-pointer"
                  }`}
                  onClick={() => handleUpgradePlan("starter")}
                  disabled={subscription?.plan === "starter"}
                >
                  {subscription?.plan === "starter" ? "Current Plan" : "Upgrade with Razorpay"}
                </button>
              </div>

              <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between border-violet-500/30 bg-violet-950/5 relative overflow-hidden">
                <div className="absolute top-3 right-3 bg-violet-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded uppercase">
                  Popular
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-violet-400 uppercase tracking-widest">Growth</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">₹7,999</span>
                    <span className="text-xs text-slate-500">/month</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-355">
                    <li className="flex items-center gap-2">✓ 2,000 Call Minutes</li>
                    <li className="flex items-center gap-2">✓ 3 Active AI agents</li>
                    <li className="flex items-center gap-2">✓ WhatsApp lead integration</li>
                    <li className="flex items-center gap-2">✓ Advanced vector documents</li>
                  </ul>
                </div>
                <button
                  className={`w-full py-2 rounded-lg text-xs font-bold mt-8 transition-all ${
                    subscription?.plan === "growth" 
                      ? "bg-slate-800 text-slate-400 cursor-not-allowed" 
                      : "bg-violet-600 hover:bg-violet-500 text-white cursor-pointer"
                  }`}
                  onClick={() => handleUpgradePlan("growth")}
                  disabled={subscription?.plan === "growth"}
                >
                  {subscription?.plan === "growth" ? "Current Plan" : "Upgrade with Razorpay"}
                </button>
              </div>

              <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between border-slate-800">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Pro</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">₹14,999</span>
                    <span className="text-xs text-slate-500">/month</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-400">
                    <li className="flex items-center gap-2">✓ Unlimited agents</li>
                    <li className="flex items-center gap-2">✓ CRM & API syncing integrations</li>
                    <li className="flex items-center gap-2">✓ Outbound call campaigns</li>
                    <li className="flex items-center gap-2">✓ Dedicated account supervisor</li>
                  </ul>
                </div>
                <button
                  className={`w-full py-2 rounded-lg text-xs font-bold mt-8 transition-all ${
                    subscription?.plan === "pro" 
                      ? "bg-slate-800 text-slate-400 cursor-not-allowed" 
                      : "bg-violet-600 hover:bg-violet-500 text-white cursor-pointer"
                  }`}
                  onClick={() => handleUpgradePlan("pro")}
                  disabled={subscription?.plan === "pro"}
                >
                  {subscription?.plan === "pro" ? "Current Plan" : "Upgrade with Razorpay"}
                </button>
              </div>

            </div>

            {/* Payments list history */}
            <div className="glass-panel rounded-2xl p-6">
              <h3 className="text-base font-bold mb-4">Workspace Billing & Payments Logs</h3>
              <div className="overflow-x-auto">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Payment ID</th>
                      <th>Plan Activated</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date / Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-slate-500 py-6">No payments recorded.</td>
                      </tr>
                    ) : (
                      payments.map((p) => (
                        <tr key={p.id}>
                          <td className="font-mono text-xs text-slate-300">{p.razorpay_payment_id}</td>
                          <td className="uppercase font-semibold text-white">{subscription?.plan}</td>
                          <td className="text-violet-400 font-bold">₹{p.amount}</td>
                          <td>
                            <span className="badge badge-success px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                              {p.status}
                            </span>
                          </td>
                          <td className="text-xs text-slate-400">{new Date(p.created_at).toLocaleString("en-IN")}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </section>
        )}

        {/* -------------------- VIEW: SETTINGS & TELEPHONY -------------------- */}
        {activeTab === "billing" && <></>} {/* redirect billing visual */}
        
        {/* Settings view */}
        {activeTab === "services" && <></>} {/* placeholder */}

        {/* -------------------- VIEW: SUPER ADMIN PANEL -------------------- */}
        {activeTab === "admin" && isSuperAdmin && (
          <section id="tab-admin" className="space-y-8">
            
            {/* Aggregated Platform Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Registered Workspaces</span>
                <div className="text-3xl font-extrabold mt-1 text-white">{adminStats?.totalBusinesses || 0}</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Platform Users</span>
                <div className="text-3xl font-extrabold mt-1 text-white">{adminStats?.totalUsers || 0}</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Cumulative SaaS Calls</span>
                <div className="text-3xl font-extrabold mt-1 text-white">{adminStats?.totalCalls || 0}</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Platform SaaS Revenue</span>
                <div className="text-3xl font-extrabold mt-1 text-emerald-400">₹{adminStats?.totalRevenue || 0}</div>
              </div>

            </div>

            {/* List all workspaces */}
            <div className="glass-panel rounded-2xl p-6">
              <h3 className="text-base font-bold mb-4">Active Business Workspaces List</h3>
              <div className="overflow-x-auto">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Workspace Name</th>
                      <th>Category</th>
                      <th>Contact Phone</th>
                      <th>Active Plan</th>
                      <th>Status</th>
                      <th>Registration Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminBusinesses.map((bizObj) => (
                      <tr key={bizObj.id}>
                        <td className="font-semibold text-white">{bizObj.name}</td>
                        <td>{bizObj.category}</td>
                        <td className="font-mono text-xs">{bizObj.phone}</td>
                        <td className="uppercase font-semibold text-violet-400">{bizObj.plan}</td>
                        <td>
                          <span className="badge badge-success px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            {bizObj.status}
                          </span>
                        </td>
                        <td className="text-xs text-slate-400">{new Date(bizObj.created_at).toLocaleDateString()}</td>
                        <td>
                          <button
                            className="px-3 py-1 bg-red-900/10 border border-red-500/20 hover:bg-red-500/15 text-red-400 rounded-lg text-xs font-semibold transition-all"
                            onClick={() => alert("Workspace suspension disabled for sandbox validation safety.")}
                          >
                            Suspend Business
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </section>
        )}

        {/* Settings integration */}
        {activeTab === "settings" && (
          <section className="space-y-6 max-w-4xl">
            <div className="glass-panel rounded-2xl p-6">
              <h3 className="text-base font-bold mb-4">India Telephony Integrations (Inbound & Outbound Calling)</h3>
              <p className="text-xs text-slate-400 mb-6">
                Configure your Exotel or Twilio phone numbers below to link your live voice agents.
              </p>

              <form onSubmit={handleSaveTelephony} className="space-y-6">
                
                {/* Provider choice */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">Telephony calling gateway</label>
                  <select
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as any)}
                  >
                    <option value="disabled">Sandbox Calling Dialer Emulator (No API keys required)</option>
                    <option value="twilio">Twilio Integration (International/India)</option>
                    <option value="exotel">Exotel Integration (India local gateway)</option>
                  </select>
                </div>

                {provider === "twilio" && (
                  <div className="space-y-4 border-t border-slate-800 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Twilio Account SID</label>
                        <input
                          type="text"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none"
                          value={twilioSid}
                          onChange={(e) => setTwilioSid(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Twilio Auth Token</label>
                        <input
                          type="password"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none"
                          value={twilioToken}
                          onChange={(e) => setTwilioToken(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Twilio Connected Phone Number (with code)</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none"
                        placeholder="e.g. +14159876543"
                        value={twilioPhone}
                        onChange={(e) => setTwilioPhone(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {provider === "exotel" && (
                  <div className="space-y-4 border-t border-slate-800 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Exotel API Key</label>
                        <input
                          type="text"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none"
                          value={exotelApiKey}
                          onChange={(e) => setExotelApiKey(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Exotel Auth Token</label>
                        <input
                          type="password"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none"
                          value={exotelToken}
                          onChange={(e) => setExotelToken(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Exotel Account SID</label>
                        <input
                          type="text"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none"
                          value={exotelSid}
                          onChange={(e) => setExotelSid(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Exotel Connected Number</label>
                        <input
                          type="text"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none"
                          value={exotelPhone}
                          onChange={(e) => setExotelPhone(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="py-2.5 px-6 bg-violet-600 hover:bg-violet-500 text-xs font-bold rounded-lg cursor-pointer transition-all"
                >
                  Save calling settings
                </button>
              </form>
            </div>
          </section>
        )}

      </main>

      {/* --- Phone Call Dialer Emulator Overlay Modal --- */}
      {dialingLead && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative">
            
            {/* Dialer Ringing Banner */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white text-center">
              <div className="inline-flex p-3 bg-white/10 rounded-full animate-bounce mb-3">
                <Phone className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">{dialingLead.name}</h3>
              <p className="text-xs text-white/80 font-mono mt-1">{dialingLead.phone}</p>
              
              <div className="mt-3 text-xs bg-black/20 py-1.5 px-3 rounded-full inline-block font-semibold">
                Status: <span className="uppercase text-yellow-300 animate-pulse font-bold">{dialCallStatus}</span>
              </div>
            </div>

            {/* Dialer Body - Transcript feed */}
            <div className="p-6">
              <div className="h-48 overflow-y-auto bg-slate-950 border border-slate-850 rounded-2xl p-4 mb-4 space-y-2 flex flex-col">
                {dialTranscript.map((t, idx) => (
                  <div key={idx} className={`text-xs max-w-[85%] ${
                    t.role === "system" ? "text-slate-500 mx-auto text-center font-mono py-1" :
                    t.role === "user" ? "ml-auto bg-violet-600 text-white p-2.5 rounded-2xl rounded-br-sm" :
                    "mr-auto bg-slate-850 border border-slate-800 text-slate-100 p-2.5 rounded-2xl rounded-bl-sm"
                  }`}>
                    {t.content}
                  </div>
                ))}
                {isPaying && (
                  <div className="text-[10px] text-slate-500 animate-pulse text-center">
                    AI Agent listening / transcribing Kannada speech...
                  </div>
                )}
              </div>

              {/* Call Simulator Interaction Controls */}
              {dialCallStatus === "connected" && (
                <div className="space-y-4">
                  {/* Waveform visualizer */}
                  {dialMicActive && (
                    <div className="flex justify-center items-center gap-1.5 h-6">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          style={{ height: `${(i % 2 === 0 ? dialSpeechPulse : dialSpeechPulse / 2) * 3 + 4}px` }}
                          className="w-1 bg-red-500 rounded-full transition-all duration-100"
                        />
                      ))}
                    </div>
                  )}

                  {/* Inputs */}
                  <div className="flex gap-2">
                    <button
                      id="dial-mic-toggle"
                      onClick={toggleDialMic}
                      className={`p-3 border rounded-xl cursor-pointer transition-all ${
                        dialMicActive 
                          ? "bg-red-500/20 border-red-500/40 text-red-500 mic-pulse-animation" 
                          : "bg-slate-950 border-slate-850 text-slate-400 hover:text-white"
                      }`}
                      title="Speak in Kannada"
                    >
                      {dialMicActive ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
                    </button>

                    <input
                      id="dial-input"
                      type="text"
                      className="flex-grow bg-slate-950 border border-slate-850 rounded-xl px-4 text-xs focus:outline-none"
                      placeholder="Type simulated caller response in Kannada (e.g. ಬೆಲೆ ಎಷ್ಟು?)..."
                      value={dialInputText}
                      onChange={(e) => setDialInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && dialInputText.trim()) {
                          runSandboxWebhookStep(dialInputText);
                          setDialInputText("");
                        }
                      }}
                    />

                    <button
                      id="dial-submit"
                      onClick={() => {
                        if (dialInputText.trim()) {
                          runSandboxWebhookStep(dialInputText);
                          setDialInputText("");
                        }
                      }}
                      className="p-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl cursor-pointer"
                    >
                      <ArrowRight className="h-4.5 w-4.5" />
                    </button>
                  </div>

                  {/* Suggestion buttons */}
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    <button 
                      onClick={() => runSandboxWebhookStep("ಬೆಲೆ ಎಷ್ಟು?")}
                      className="bg-slate-950 hover:bg-slate-850 border border-slate-850 text-[10px] font-semibold text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg"
                    >
                      Price?
                    </button>
                    <button 
                      onClick={() => runSandboxWebhookStep("ನನ್ನ ಹೆಸರು ರವಿ, ಬಜೆಟ್ ೩೦೦೦ ರುಪಾಯಿ")}
                      className="bg-slate-950 hover:bg-slate-850 border border-slate-850 text-[10px] font-semibold text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg"
                    >
                      Qualify Lead
                    </button>
                    <button 
                      onClick={() => runSandboxWebhookStep("ಮ್ಯಾನೇಜರ್‌ನೊಂದಿಗೆ ಮಾತನಾಡಬೇಕಾಗಿದೆ")}
                      className="bg-slate-950 hover:bg-slate-850 border border-slate-850 text-[10px] font-semibold text-red-400 px-2.5 py-1.5 rounded-lg"
                    >
                      Escalate
                    </button>
                  </div>
                </div>
              )}

              {/* Hangup button */}
              <button
                id="dial-hangup"
                onClick={handleHangUpCall}
                className="w-full mt-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-lg shadow-red-600/20 active:scale-98"
              >
                Disconnect Call
              </button>

            </div>

          </div>
        </div>
      )}

      {/* --- Razorpay Secure Payment Simulator --- */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-indigo-600 p-5 text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-80">Razorpay Secure Checkout</span>
                <h4 className="text-lg font-bold">Pay to KannadaAI Business OS</h4>
              </div>
              <button onClick={() => setShowPayModal(null)} className="text-white hover:opacity-85 text-xl font-bold">
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-xs text-slate-400">Selected plan:</span>
                <span className="text-sm font-bold uppercase text-white">{showPayModal}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-xs text-slate-400">Amount Due:</span>
                <span className="text-md font-bold text-emerald-400">
                  {showPayModal === "starter" && "₹2,999"}
                  {showPayModal === "growth" && "₹7,999"}
                  {showPayModal === "pro" && "₹14,999"}
                </span>
              </div>
              <button
                id="razorpay-confirm-btn"
                onClick={executeRazorpaySuccess}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl cursor-pointer transition-all"
                disabled={isPaying}
              >
                {isPaying ? "Authorizing checkout..." : "Authorize Sandbox Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Call Transcript Modal View --- */}
      {selectedCall && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedCall(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-md font-bold text-white">Call Transcript: {selectedCall.customer_name}</h3>
                <p className="text-[10px] text-slate-400 mt-1">
                  Duration: {selectedCall.duration_seconds}s | Date: {new Date(selectedCall.created_at).toLocaleDateString()}
                </p>
              </div>
              <button onClick={() => setSelectedCall(null)} className="text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 max-h-96 overflow-y-auto space-y-4">
              {isTranscriptLoading ? (
                <div className="text-center py-8">
                  <div className="pulsing-indicator active h-6 w-6 mr-2" />
                  <span className="text-xs text-slate-400">Loading transcript log...</span>
                </div>
              ) : selectedTranscript.length === 0 ? (
                <p className="text-center text-slate-500 text-xs py-4">No logged messages available.</p>
              ) : (
                selectedTranscript.map((m) => (
                  <div 
                    key={m.id}
                    className={`flex flex-col max-w-[80%] ${m.role === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}
                  >
                    <div className={`p-3 rounded-xl text-xs leading-normal ${
                      m.role === "user" ? "bg-violet-600 text-white" : "bg-slate-800 border border-slate-700/50 text-slate-200"
                    }`}>
                      {m.content}
                    </div>
                    <span className="text-[9px] text-slate-500 font-bold mt-1 px-1">
                      {m.role === "user" ? "Customer" : "AI Agent"}
                    </span>
                  </div>
                ))
              )}
            </div>

            {selectedCall.summary && (
              <div className="p-5 bg-slate-950 border-t border-slate-800/80">
                <h5 className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">AI Transcript Summary</h5>
                <p className="text-xs text-slate-355 leading-normal">{selectedCall.summary}</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Sparkles, Phone, Clock, UserCheck, AlertCircle, Plus, 
  Trash2, Play, LogOut, Settings, Database, BookOpen, 
  Users, HelpCircle, X, ArrowRight, ShieldCheck, Ticket, 
  ShoppingBag, Wrench, BarChart2, ShieldAlert, Award, CreditCard,
  PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneMissed, Mic, MicOff,
  Menu, Globe, FileText, Link2, Volume2, Calendar, Check, Info, LayoutDashboard,
  FolderOpen
} from "lucide-react";
import { dbClient } from "@/lib/dbClient";
import { 
  Business, Agent, FAQItem, DocumentItem, Call, Message, 
  Customer, Order, Refund, Appointment, SupportTicket, 
  Subscription, Payment, Product, Service 
} from "@/lib/db";

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"dashboard" | "employees" | "kb" | "history" | "leads" | "analytics" | "billing" | "settings">("dashboard");
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

  // Loading & detail states
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [selectedTranscript, setSelectedTranscript] = useState<Message[]>([]);
  const [isTranscriptLoading, setIsTranscriptLoading] = useState(false);
  const [audioPlayState, setAudioPlayState] = useState<string | null>(null); // callId of mock playing audio
  const [audioProgress, setAudioProgress] = useState(0);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Subscription Payment simulation modal
  const [showPayModal, setShowPayModal] = useState<string | null>(null); // plan level or null
  const [isPaying, setIsPaying] = useState(false);

  // Timezone and color palette states
  const [timezone, setTimezone] = useState("IST (UTC+05:30)");
  const [brandingColor, setBrandingColor] = useState("violet");
  const [brandingLogoText, setBrandingLogoText] = useState("VoiceOS AI Workspace");

  // Lead Dialer Overlay states
  const [dialingLead, setDialingLead] = useState<Customer | null>(null);
  const [dialCallStatus, setDialCallStatus] = useState<"idle" | "calling" | "ringing" | "connected" | "listening" | "completed">("idle");
  const [dialConversationId, setDialConversationId] = useState("");
  const [dialTranscript, setDialTranscript] = useState<Array<{ role: string; content: string }>>([]);
  const [dialMicActive, setDialMicActive] = useState(false);
  const [dialSpeechPulse, setDialSpeechPulse] = useState(0);
  const [dialInputText, setDialInputText] = useState("");
  const dialCallStartTimeRef = useRef<number>(0);
  const dialMessagesLogRef = useRef<Array<{ role: "user" | "assistant" | "system"; content: string }>>([]);

  // Mic hooks for local dialer testing
  const dialMicRecorderRef = useRef<MediaRecorder | null>(null);
  const dialMicStreamRef = useRef<MediaStream | null>(null);
  const dialMicChunksRef = useRef<Blob[]>([]);
  const dialPulseIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Form states (Add Agent)
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentLang, setNewAgentLang] = useState("Kannada");
  const [newAgentVoice, setNewAgentVoice] = useState("native"); // voice provider
  const [newAgentPrompt, setNewAgentPrompt] = useState("");
  const [newAgentGreet, setNewAgentGreet] = useState("");
  const [newAgentRole, setNewAgentRole] = useState("Sales Representative");

  // Edit Agent Modal states
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [editAgentName, setEditAgentName] = useState("");
  const [editAgentLang, setEditAgentLang] = useState("Kannada");
  const [editAgentVoice, setEditAgentVoice] = useState("native");
  const [editAgentPrompt, setEditAgentPrompt] = useState("");
  const [editAgentGreet, setEditAgentGreet] = useState("");
  const [editAgentRole, setEditAgentRole] = useState("Sales Representative");

  // Knowledge Base Form states
  const [newFaqQ, setNewFaqQ] = useState("");
  const [newFaqA, setNewFaqA] = useState("");
  const [newDocName, setNewDocName] = useState("");
  const [newDocContent, setNewDocContent] = useState("");
  const [newUrlImport, setNewUrlImport] = useState("");
  const [isUrlImporting, setIsUrlImporting] = useState(false);

  // Settings business edits
  const [settingsBizName, setSettingsBizName] = useState("");
  const [settingsCategory, setSettingsCategory] = useState("");
  const [settingsPhone, setSettingsPhone] = useState("");
  const [settingsDesc, setSettingsDesc] = useState("");

  // CRM Leads editable notes/status map stored in local storage
  const [leadsExtraMap, setLeadsExtraMap] = useState<Record<string, { status: string; notes: string }>>({});

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
      if (tabParam && ["dashboard", "employees", "kb", "history", "leads", "analytics", "billing", "settings"].includes(tabParam)) {
        setActiveTab(tabParam as any);
      }
      
      // Load custom branding details
      const storedTimezone = localStorage.getItem("voiceos_timezone");
      const storedBranding = localStorage.getItem("voiceos_branding");
      const storedLogo = localStorage.getItem("voiceos_logo");
      if (storedTimezone) setTimezone(storedTimezone);
      if (storedBranding) setBrandingColor(storedBranding);
      if (storedLogo) setBrandingLogoText(storedLogo);

      // Load CRM Extra status mapping
      const storedExtra = localStorage.getItem("voiceos_leads_extra");
      if (storedExtra) {
        try {
          setLeadsExtraMap(JSON.parse(storedExtra));
        } catch (e) {}
      }
    }
    
    loadAllSaaSData(sess);
  }, [router]);

  const loadAllSaaSData = async (sess: any) => {
    setIsLoading(true);
    try {
      // 1. Fetch business
      let biz = await dbClient.getBusiness(sess.userId);
      if (!biz) {
        biz = await dbClient.createBusiness(sess.businessName || "VoiceOS AI Workspace", "Real Estate", "+91 99000 12345", sess.userId);
      }
      setBusiness(biz);
      setSettingsBizName(biz.business_name);
      setSettingsCategory(biz.category);
      setSettingsPhone(biz.phone);
      setSettingsDesc(biz.description || "");

      // 2. Fetch subscription
      let sub = await dbClient.getSubscription(biz.id);
      if (!sub) {
        const res = await dbClient.createSubscriptionPayment(biz.id, "starter", 0, "trial_bypass");
        sub = res.subscription;
      }
      setSubscription(sub);

      // 3. Batch fetch entities
      const [
        allAgents, allFaqs, allDocs, allCalls, 
        allCusts, allTickets, allApps, allPayments
      ] = await Promise.all([
        dbClient.getAgents(biz.id),
        dbClient.getKnowledgeBase(biz.id),
        dbClient.getDocuments(biz.id),
        dbClient.getConversations(biz.id),
        dbClient.getCustomers(biz.id),
        dbClient.getSupportTickets(biz.id),
        dbClient.getAppointments(biz.id),
        dbClient.getPayments(biz.id)
      ]);

      setAgents(allAgents);
      setFaqs(allFaqs);
      setDocs(allDocs);
      
      // Sort calls by newest first
      const sortedCalls = allCalls.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setCalls(sortedCalls);
      setCustomers(allCusts);
      setTickets(allTickets);
      setAppointments(allApps);
      setPayments(allPayments);

    } catch (err) {
      console.error("Error loading SaaS database:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Voice Call Simulator Flow with direct DB logging ---
  const handleCallLead = async (lead: Customer) => {
    if (agents.length === 0) {
      alert("Please deploy at least one AI Employee Voice Agent first!");
      return;
    }
    const targetAgent = agents[0];
    setDialingLead(lead);
    setDialCallStatus("calling");
    dialCallStartTimeRef.current = Date.now();
    
    const greetingText = targetAgent.greeting_message || 
      (targetAgent.language === "Kannada" 
        ? `ನಮಸ್ಕಾರ, ನಾನು ${targetAgent.name}. ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?` 
        : `Hello, I am ${targetAgent.name}. How can I help you today?`);

    dialMessagesLogRef.current = [{ role: "system", content: `Initiating sandbox caller handshake...` }];
    setDialTranscript([{ role: "system", content: `Connecting VoiceOS AI Line to customer cell: ${lead.phone}...` }]);
    
    try {
      // 1. Create call session record in database
      const callRecord = await dbClient.createConversation(business?.id || "", targetAgent.id, lead.name);
      setDialConversationId(callRecord.id);

      // Simulates call answer in 2 seconds
      setTimeout(async () => {
        setDialCallStatus("connected");
        setDialTranscript(prev => [
          ...prev, 
          { role: "system", content: "Line Connected! Speech recognition active." },
          { role: "assistant", content: greetingText }
        ]);
        
        // Save initial agent greeting message to database
        await dbClient.createMessage(callRecord.id, "assistant", greetingText);
        speakVoiceSynthesis(greetingText, targetAgent.language);
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setDialTranscript(prev => [...prev, { role: "system", content: `Handshake error: ${err.message}` }]);
    }
  };

  const runSandboxWebhookStep = async (userSpeechText: string) => {
    if (!dialConversationId || !agents.length || !business) return;
    
    const targetAgent = agents[0];
    
    // Add user response to transcript UI
    setDialTranscript(prev => [...prev, { role: "user", content: userSpeechText }]);
    setIsPaying(true); // use as temporary loader indicator

    try {
      // 1. Write caller message to DB
      await dbClient.createMessage(dialConversationId, "user", userSpeechText);

      // 2. Generate contextual response based on the selected language and agent rules
      const botResponse = generateSimulatedAgentResponse(userSpeechText, targetAgent.language, targetAgent.name);

      // 3. Write bot response to DB
      await dbClient.createMessage(dialConversationId, "assistant", botResponse);

      // Display bot response
      setDialTranscript(prev => [...prev, { role: "assistant", content: botResponse }]);

      // Speak aloud via browser SpeechSynthesis
      speakVoiceSynthesis(botResponse, targetAgent.language);

    } catch (err: any) {
      console.error(err);
      setDialTranscript(prev => [...prev, { role: "system", content: "Error transcribing response." }]);
    } finally {
      setIsPaying(false);
    }
  };

  const generateSimulatedAgentResponse = (userText: string, lang: string, agentName: string): string => {
    const text = userText.toLowerCase();
    
    if (lang === "Kannada") {
      if (text.includes("ಬೆಲೆ") || text.includes("ಖರ್ಚು") || text.includes("ರೇಟು")) {
        return "ನಮ್ಮ VoiceOS AI ಸೇವೆಗಳು ತಿಂಗಳಿಗೆ ಕೇವಲ ೨,೯೯೯ ರೂಪಾಯಿಗಳಿಂದ ಪ್ರಾರಂಭವಾಗುತ್ತವೆ. ಇದು ನಿಮ್ಮ ವ್ಯವಹಾರಕ್ಕೆ ಸೂಕ್ತವಾಗಿದೆ.";
      }
      if (text.includes("ಯಾರು") || text.includes("ಹೆಸರು")) {
        return `ನನ್ನ ಹೆಸರು ${agentName}. ನಾನು VoiceOS AI ನಿಂದ ನಿಮ್ಮ ಸಹಾಯಕ್ಕೆ ನಿಯೋಜಿತವಾಗಿರುವ ಸ್ವಯಂಚಾಲಿತ ಧ್ವನಿ ನೌಕರ.`;
      }
      if (text.includes("ಬಜೆಟ್") || text.includes("ನನ್ನ ಬಜೆಟ್")) {
        return "ಉತ್ತಮ ಬಜೆಟ್! ನಾವು ನಿಮ್ಮ ಅವಶ್ಯಕತೆಗೆ ತಕ್ಕಂತೆ ಕಸ್ಟಮೈಸ್ ಪ್ಲಾನ್ ಸಹ ಒದಗಿಸುತ್ತೇವೆ. ನಮ್ಮ ತಂಡದ ಜೊತೆ ಉಚಿತ ಸಮಾಲೋಚನೆ ಬುಕ್ ಮಾಡಲಾ?";
      }
      if (text.includes("ಬುಕ್") || text.includes("ಮೀಟಿಂಗ್") || text.includes("ಮಾತನಾಡು")) {
        return "ಖಂಡಿತ! ನಾಳೆ ಮಧ್ಯಾಹ್ನ ೩ ಗಂಟೆಗೆ ನಮ್ಮ ತಜ್ಞರೊಂದಿಗೆ ಸಮಾಲೋಚನೆಯನ್ನು ನಿಗದಿಪಡಿಸಿದ್ದೇನೆ. ಧನ್ಯವಾದಗಳು!";
      }
      return "ತಿಳಿಸಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದಗಳು. ನಿಮ್ಮ ಬಜೆಟ್ ಅಥವಾ ಸೇವೆಯ ಅವಶ್ಯಕತೆಗಳ ಬಗ್ಗೆ ವಿವರವಾಗಿ ತಿಳಿಸಿದರೆ, ನಾನು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.";
    } else {
      // English / generic fallback
      if (text.includes("price") || text.includes("cost") || text.includes("pricing") || text.includes("how much")) {
        return "Our Starter package is just ₹2,999 per month, which includes 500 call minutes and full custom vector database RAG rules.";
      }
      if (text.includes("who") || text.includes("name")) {
        return `I am ${agentName}, your AI Voice employee from VoiceOS AI. I am trained to assist you 24/7.`;
      }
      if (text.includes("budget") || text.includes("my budget")) {
        return "That budget sounds perfect! We can schedule a free consultation callback with our account supervisor. Would you like to confirm?";
      }
      if (text.includes("book") || text.includes("schedule") || text.includes("call me") || text.includes("consultation")) {
        return "Excellent! I have scheduled a business demo appointment for you tomorrow at 3 PM. We will contact you soon.";
      }
      return "Got it. Could you please specify your business requirements, budget, or preferred language so I can customize the solution for you?";
    }
  };

  // Speaks browser-native text
  const speakVoiceSynthesis = (text: string, lang: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const langMap: Record<string, string> = {
      "Kannada": "kn-IN", 
      "Telugu": "te-IN", 
      "Hindi": "hi-IN", 
      "Tamil": "ta-IN", 
      "Malayalam": "ml-IN", 
      "English": "en-US"
    };
    utterance.lang = langMap[lang] || "en-US";
    window.speechSynthesis.speak(utterance);
  };

  const handleHangUpCall = async () => {
    stopDialMicRecording();
    if (typeof window !== "undefined") window.speechSynthesis.cancel();
    setDialCallStatus("completed");
    
    // Calculate actual call duration
    const callEndTime = Date.now();
    const durationSeconds = Math.max(8, Math.round((callEndTime - dialCallStartTimeRef.current) / 1000));
    
    setDialTranscript(prev => [...prev, { role: "system", content: `Call completed naturally. Syncing CRM records...` }]);
    
    try {
      // 1. Determine simulated classification outcomes
      const lastUserMsg = dialTranscript.filter(t => t.role === "user").pop()?.content || "";
      const text = lastUserMsg.toLowerCase();
      
      let sentiment: "positive" | "neutral" | "frustrated" = "neutral";
      let summary = "VoiceOS Agent outbound dial completed.";
      
      if (text.includes("ಬೆಲೆ") || text.includes("ಬುಕ್") || text.includes("budget") || text.includes("price") || text.includes("schedule")) {
        sentiment = "positive";
        summary = "Customer highly interested. Discussed budgets and requested consultation scheduling.";
        
        // Dynamically update CRM lead status & score
        if (dialingLead) {
          const newScore = Math.min(100, (dialingLead.lead_score || 50) + 20);
          await dbClient.upsertCustomer(business?.id || "", dialingLead.phone, {
            lead_score: newScore,
            is_lead: true,
            requirements: "Interested in demo consultation. Budget discussed: ₹3,000+"
          });
        }
      } else if (text.includes("ಬೇಡ") || text.includes("no") || text.includes("stop")) {
        sentiment = "frustrated";
        summary = "Lead requested exclusion or expressed frustration with automation.";
      }

      // 2. Update conversation log in Database
      if (dialConversationId) {
        await dbClient.updateConversation(dialConversationId, {
          duration_seconds: durationSeconds,
          sentiment: sentiment,
          summary: summary
        });
      }

    } catch (e) {
      console.error("Error saving call outcome to DB:", e);
    }

    setTimeout(() => {
      setDialingLead(null);
      setDialCallStatus("idle");
      setDialTranscript([]);
      setDialConversationId("");
      if (session) loadAllSaaSData(session);
    }, 2000);
  };

  // Mic local triggers
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
      alert("Microphone permission required for voice simulated responses.");
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

  // --- CRUD Functions ---

  // 1. Create Voice Employee Agent
  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !newAgentName || !newAgentPrompt) return;
    
    try {
      const voiceIdMap: Record<string, string> = {
        "Kannada": "kn-IN-Standard-A",
        "Telugu": "te-IN-Standard-A",
        "Hindi": "hi-IN-Standard-A",
        "Tamil": "ta-IN-Standard-A",
        "Malayalam": "ml-IN-Standard-A",
        "English": "en-US-Standard-C"
      };

      const voiceId = voiceIdMap[newAgentLang] || "native";
      const defaultGreet = newAgentGreet || 
        (newAgentLang === "Kannada" 
          ? `ನಮಸ್ಕಾರ, ನಾನು ${newAgentName}. VoiceOS AI ಸ್ವಯಂಚಾಲಿತ ನೌಕರ. ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?` 
          : `Hello, I am ${newAgentName}, your AI employee. How can I assist you today?`);

      const agent = await dbClient.createAgent(
        business.id,
        newAgentName,
        newAgentLang,
        newAgentVoice,
        voiceId,
        newAgentPrompt
      );

      await dbClient.updateAgent(agent.id, {
        greeting_message: defaultGreet,
        personality: newAgentRole
      });

      alert("AI Voice Employee Deployed successfully!");
      
      // Update local state list
      setAgents([...agents, { ...agent, greeting_message: defaultGreet, personality: newAgentRole }]);
      
      // Reset form
      setNewAgentName("");
      setNewAgentPrompt("");
      setNewAgentGreet("");
      setNewAgentRole("Sales Representative");
    } catch (err) {
      console.error(err);
      alert("Failed to build voice agent.");
    }
  };

  // 2. Open Edit Agent Modal
  const startEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setEditAgentName(agent.name);
    setEditAgentLang(agent.language);
    setEditAgentVoice(agent.voice_provider);
    setEditAgentPrompt(agent.system_prompt);
    setEditAgentGreet(agent.greeting_message || "");
    setEditAgentRole(agent.personality || "Sales Representative");
  };

  // 3. Save Edit Agent
  const handleSaveEditAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgent) return;
    
    try {
      const updated = await dbClient.updateAgent(editingAgent.id, {
        name: editAgentName,
        language: editAgentLang,
        voice_provider: editAgentVoice,
        system_prompt: editAgentPrompt,
        greeting_message: editAgentGreet,
        personality: editAgentRole
      });

      alert("Agent configurations updated!");
      
      setAgents(agents.map(a => a.id === editingAgent.id ? { ...a, ...updated } : a));
      setEditingAgent(null);
    } catch (e) {
      console.error(e);
      alert("Failed to save changes.");
    }
  };

  // 4. Delete Agent
  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm("Are you sure you want to deactivate and delete this AI voice employee?")) return;
    try {
      await dbClient.deleteAgent(agentId);
      setAgents(agents.filter(a => a.id !== agentId));
      alert("Agent removed successfully.");
    } catch (e) {
      console.error(e);
      alert("Failed to delete agent.");
    }
  };

  // FAQs
  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !newFaqQ || !newFaqA) return;
    try {
      const faq = await dbClient.addFAQ(business.id, newFaqQ, newFaqA);
      setFaqs([...faqs, faq]);
      setNewFaqQ("");
      setNewFaqA("");
      alert("FAQ entry logged in RAG system!");
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

  // Documents
  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !newDocName || !newDocContent) return;
    try {
      const doc = await dbClient.addDocument(business.id, newDocName, "pdf", newDocContent);
      setDocs([...docs, doc]);
      setNewDocName("");
      setNewDocContent("");
      alert("PDF document uploaded, chunked, and indexed for semantic search RAG.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm("Delete document content?")) return;
    try {
      await dbClient.deleteDocument(id);
      setDocs(docs.filter(d => d.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Mock URL import RAG
  const handleUrlImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !newUrlImport) return;
    setIsUrlImporting(true);
    try {
      // Simulate crawling & embedding
      setTimeout(async () => {
        const doc = await dbClient.addDocument(business.id, newUrlImport, "url", `Crawled website context matching URL rules from: ${newUrlImport}`);
        setDocs(prev => [...prev, doc]);
        setNewUrlImport("");
        setIsUrlImporting(false);
        alert("URL successfully crawled and vector embedded!");
      }, 1500);
    } catch (e) {
      console.error(e);
      setIsUrlImporting(false);
    }
  };

  // Editable Lead Status & Notes
  const handleLeadStatusChange = (leadId: string, newStatus: string) => {
    const updated = {
      ...leadsExtraMap,
      [leadId]: {
        ...leadsExtraMap[leadId],
        status: newStatus
      }
    };
    setLeadsExtraMap(updated);
    localStorage.setItem("voiceos_leads_extra", JSON.stringify(updated));
  };

  const handleLeadNotesChange = (leadId: string, newNotes: string) => {
    const updated = {
      ...leadsExtraMap,
      [leadId]: {
        ...leadsExtraMap[leadId],
        notes: newNotes
      }
    };
    setLeadsExtraMap(updated);
    localStorage.setItem("voiceos_leads_extra", JSON.stringify(updated));
  };

  // Save General settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    try {
      const updated = await dbClient.updateBusiness(business.id, {
        business_name: settingsBizName,
        category: settingsCategory,
        phone: settingsPhone,
        description: settingsDesc
      });
      setBusiness(updated);

      localStorage.setItem("voiceos_timezone", timezone);
      localStorage.setItem("voiceos_branding", brandingColor);
      localStorage.setItem("voiceos_logo", brandingLogoText);

      alert("Workspace settings saved successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to save profile.");
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
        pro: 14999
      };
      
      const amount = planPrices[showPayModal] || 2999;
      const rzpId = `rzp_checkout_${Math.random().toString(36).substr(2, 9)}`;
      
      const { subscription: updatedSub, payment } = await dbClient.createSubscriptionPayment(
        business.id,
        showPayModal as Subscription["plan"],
        amount,
        rzpId
      );

      setSubscription(updatedSub);
      setPayments([payment, ...payments]);
      setShowPayModal(null);
      alert(`Razorpay checkout authorization successful! Plan upgraded to: ${showPayModal.toUpperCase()}`);
    } catch (err) {
      console.error(err);
      alert("Checkout session authentication failed.");
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

  // Play mockup recording waveform
  const handlePlayMockRecording = (callId: string) => {
    if (audioPlayState === callId) {
      // Pause
      setAudioPlayState(null);
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    } else {
      // Play
      setAudioPlayState(callId);
      setAudioProgress(0);
      audioIntervalRef.current = setInterval(() => {
        setAudioProgress(prev => {
          if (prev >= 100) {
            setAudioPlayState(null);
            if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
            return 0;
          }
          return prev + 5;
        });
      }, 300);
    }
  };

  useEffect(() => {
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, []);

  // Metrics Calculations
  const totalCallsCount = calls.length;
  const leadCustomers = customers.filter(c => c.is_lead);
  const totalLeadsCount = leadCustomers.length;
  const totalAppsCount = appointments.length;
  
  const totalDuration = calls.reduce((acc, c) => acc + c.duration_seconds, 0);
  const avgDuration = totalCallsCount ? Math.round(totalDuration / totalCallsCount) : 0;
  
  const positiveCalls = calls.filter(c => c.sentiment === "positive").length;
  const csatScore = totalCallsCount 
    ? ((positiveCalls / totalCallsCount) * 5).toFixed(1) 
    : "4.8";
  
  const conversionRate = totalCallsCount 
    ? ((totalLeadsCount / totalCallsCount) * 100).toFixed(0) 
    : "45";

  // Active theme classes based on settings
  const themeGradients: Record<string, string> = {
    violet: "from-violet-600 to-indigo-600 bg-violet-600 hover:bg-violet-500 text-violet-400 border-violet-500/20 bg-violet-600/10",
    indigo: "from-indigo-600 to-blue-600 bg-indigo-600 hover:bg-indigo-500 text-indigo-400 border-indigo-500/20 bg-indigo-600/10",
    emerald: "from-emerald-600 to-teal-600 bg-emerald-600 hover:bg-emerald-500 text-emerald-400 border-emerald-500/20 bg-emerald-600/10",
    rose: "from-rose-600 to-pink-600 bg-rose-600 hover:bg-rose-500 text-rose-400 border-rose-500/20 bg-rose-600/10"
  };

  const activeGrad = themeGradients[brandingColor] || themeGradients.violet;
  const activeColorParts = activeGrad.split(" ");
  const headerGradient = activeColorParts[0] + " " + activeColorParts[1];
  const buttonBg = activeColorParts[2] + " " + activeColorParts[3];
  const textTint = activeColorParts[4];
  const borderTint = activeColorParts[5];
  const glassTint = activeColorParts[6];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center font-sans">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto mb-4" />
          <h2 className="text-sm font-semibold text-slate-400">Loading VoiceOS AI Enterprise Workspace...</h2>
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
          <div className={`bg-gradient-to-br ${headerGradient} p-2 rounded-lg shadow-lg`}>
            <Sparkles className="h-5 w-5 text-white animate-pulse" />
          </div>
          <span className="text-md font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent truncate max-w-[170px]" title={brandingLogoText}>
            {brandingLogoText}
          </span>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex flex-col gap-1 flex-grow overflow-y-auto">
          
          <button
            className={`flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
              activeTab === "dashboard" ? `${glassTint} border ${borderTint} ${textTint}` : "text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-800/50"
            }`}
            onClick={() => { setActiveTab("dashboard"); setIsSidebarOpen(false); }}
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview Dashboard
          </button>

          <button
            className={`flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
              activeTab === "employees" ? `${glassTint} border ${borderTint} ${textTint}` : "text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-800/50"
            }`}
            onClick={() => { setActiveTab("employees"); setIsSidebarOpen(false); }}
          >
            <Play className="h-4 w-4" />
            AI Voice Employees
          </button>

          <button
            className={`flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
              activeTab === "kb" ? `${glassTint} border ${borderTint} ${textTint}` : "text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-800/50"
            }`}
            onClick={() => { setActiveTab("kb"); setIsSidebarOpen(false); }}
          >
            <BookOpen className="h-4 w-4" />
            Knowledge Base (RAG)
          </button>

          <button
            className={`flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
              activeTab === "history" ? `${glassTint} border ${borderTint} ${textTint}` : "text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-800/50"
            }`}
            onClick={() => { setActiveTab("history"); setIsSidebarOpen(false); }}
          >
            <Clock className="h-4 w-4" />
            Call History
          </button>

          <button
            className={`flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
              activeTab === "leads" ? `${glassTint} border ${borderTint} ${textTint}` : "text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-800/50"
            }`}
            onClick={() => { setActiveTab("leads"); setIsSidebarOpen(false); }}
          >
            <Users className="h-4 w-4" />
            Leads CRM & Dialer
          </button>

          <button
            className={`flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
              activeTab === "analytics" ? `${glassTint} border ${borderTint} ${textTint}` : "text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-800/50"
            }`}
            onClick={() => { setActiveTab("analytics"); setIsSidebarOpen(false); }}
          >
            <BarChart2 className="h-4 w-4" />
            Analytics Console
          </button>

          <button
            className={`flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
              activeTab === "billing" ? `${glassTint} border ${borderTint} ${textTint}` : "text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-800/50"
            }`}
            onClick={() => { setActiveTab("billing"); setIsSidebarOpen(false); }}
          >
            <CreditCard className="h-4 w-4" />
            Subscription Billing
          </button>

          <button
            className={`flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
              activeTab === "settings" ? `${glassTint} border ${borderTint} ${textTint}` : "text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-800/50"
            }`}
            onClick={() => { setActiveTab("settings"); setIsSidebarOpen(false); }}
          >
            <Settings className="h-4 w-4" />
            General Settings
          </button>

        </nav>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-slate-800/80 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-xs text-red-400 hover:bg-red-500/5 rounded-lg cursor-pointer font-semibold transition-all border border-transparent hover:border-red-500/10"
          >
            <LogOut className="h-4 w-4" />
            Logout Session
          </button>
        </div>
      </aside>

      {/* Main Panel View */}
      <main className="flex-grow p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Mobile Header Bar */}
        <div className="flex md:hidden items-center justify-between p-3.5 border border-slate-850 bg-slate-900/80 backdrop-blur-md rounded-2xl mb-6 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className={`bg-gradient-to-br ${headerGradient} p-1.5 rounded-lg`}>
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white">{brandingLogoText}</span>
          </div>
          <button 
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/80 rounded-xl cursor-pointer"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
        
        {/* Workspace Title & Stats Badge */}
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8 pb-4 border-b border-slate-900">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white capitalize">
              {activeTab === "dashboard" && "Workspace Activity Dashboard"}
              {activeTab === "employees" && "AI Voice Employees Pool"}
              {activeTab === "kb" && "Retrieval-Augmented Generation (RAG)"}
              {activeTab === "history" && "Voice Call Conversations Logs"}
              {activeTab === "leads" && "Leads CRM & Simulator Dialer"}
              {activeTab === "analytics" && "Analytics & CSAT Console"}
              {activeTab === "billing" && "Workspace Plan & Razorpay Checkout"}
              {activeTab === "settings" && "General Workspace Settings"}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Active Workspace: <strong className="text-white">{business?.business_name}</strong> | Category: <strong className="text-slate-300">{business?.category}</strong> | Timezone: <strong className="text-indigo-400">{timezone}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            <span className={`badge bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-full text-xs font-semibold`}>
              Billing Plan: <span className={`uppercase font-extrabold ml-1 ${textTint}`}>{subscription?.plan || "Starter"}</span>
            </span>
            <span className="badge bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center">
              <span className="pulsing-indicator active mr-2" />
              Live Workspace Active
            </span>
          </div>
        </header>

        {/* -------------------- VIEW: DASHBOARD OVERVIEW -------------------- */}
        {activeTab === "dashboard" && (
          <section className="space-y-6">
            
            {/* Metric grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              
              <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-[3px] before:bg-violet-600">
                <div className="flex justify-between items-center text-slate-400 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Total Calls</span>
                  <Phone className="h-4.5 w-4.5 text-violet-500" />
                </div>
                <div className="text-2xl font-black text-white">{totalCallsCount}</div>
                <div className="text-[9px] text-slate-500 mt-1">Simulated & active campaigns</div>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-[3px] before:bg-indigo-500">
                <div className="flex justify-between items-center text-slate-400 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Avg Duration</span>
                  <Clock className="h-4.5 w-4.5 text-indigo-500" />
                </div>
                <div className="text-2xl font-black text-white">{avgDuration}s</div>
                <div className="text-[9px] text-slate-500 mt-1">Conversational speed average</div>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-[3px] before:bg-emerald-500">
                <div className="flex justify-between items-center text-slate-400 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">CRM Leads</span>
                  <UserCheck className="h-4.5 w-4.5 text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-white">{totalLeadsCount}</div>
                <div className="text-[9px] text-slate-500 mt-1">Extracted phone contacts</div>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-[3px] before:bg-amber-500">
                <div className="flex justify-between items-center text-slate-400 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">CSAT Score</span>
                  <Award className="h-4.5 w-4.5 text-amber-500" />
                </div>
                <div className="text-2xl font-black text-white">{csatScore}/5.0</div>
                <div className="text-[9px] text-slate-500 mt-1">Sentiment customer feedback</div>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-[3px] before:bg-purple-500">
                <div className="flex justify-between items-center text-slate-400 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Conversion</span>
                  <BarChart2 className="h-4.5 w-4.5 text-purple-500" />
                </div>
                <div className="text-2xl font-black text-white">{conversionRate}%</div>
                <div className="text-[9px] text-slate-500 mt-1">Lead acquisition ratio</div>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-[3px] before:bg-pink-500">
                <div className="flex justify-between items-center text-slate-400 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">AI Employees</span>
                  <Sparkles className="h-4.5 w-4.5 text-pink-500" />
                </div>
                <div className="text-2xl font-black text-white">{agents.length}</div>
                <div className="text-[9px] text-slate-500 mt-1">Deployed vocal bots</div>
              </div>

            </div>

            {/* Quick Analytics timeline grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                    <Volume2 className={`h-4 w-4 ${textTint}`} />
                    Voice Channels Active
                  </h3>
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="flex items-center gap-2 text-slate-400"><PhoneIncoming className="h-4 w-4 text-emerald-400" /> Inbound Calls routing</span>
                      <strong className="text-white font-mono">14</strong>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="flex items-center gap-2 text-slate-400"><PhoneOutgoing className="h-4 w-4 text-indigo-400" /> Outbound campaigns dials</span>
                      <strong className="text-white font-mono">{totalCallsCount}</strong>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="flex items-center gap-2 text-slate-400"><Calendar className="h-4 w-4 text-violet-400" /> Demos scheduled</span>
                      <strong className="text-white font-mono">{totalAppsCount}</strong>
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-800 pt-4 mt-6 text-[10px] text-slate-500">
                  Real-time visual telemetry syncing
                </div>
              </div>

              {/* Weekly volume bar visualizer */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 lg:col-span-2">
                <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                  <BarChart2 className={`h-4 w-4 ${textTint}`} />
                  Weekly Call Traffic Volume
                </h3>
                <div className="flex items-end justify-between h-32 px-4 border-b border-slate-800/60">
                  {[
                    { day: "Mon", count: 4, height: "h-[30px]" },
                    { day: "Tue", count: 8, height: "h-[60px]" },
                    { day: "Wed", count: 12, height: "h-[90px]" },
                    { day: "Thu", count: 6, height: "h-[45px]" },
                    { day: "Fri", count: 16, height: "h-[110px]" },
                    { day: "Sat", count: 9, height: "h-[65px]" },
                    { day: "Sun", count: 2, height: "h-[15px]" }
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1.5 w-10">
                      <div className="text-[10px] text-slate-300 font-bold">{item.count}</div>
                      <div className={`w-5 ${item.height} bg-gradient-to-t ${headerGradient} rounded-t transition-all duration-500`} />
                      <span className="text-[10px] text-slate-500 mt-1 font-semibold">{item.day}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Recent Conversations */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-slate-200">Recent Customer Voice Conversations</h3>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Synchronized Logs</span>
              </div>
              <div className="overflow-x-auto">
                <table className="custom-table w-full">
                  <thead>
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">Customer</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">Duration</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">Sentiment</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">Key Outcome Summary</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">Timestamp</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calls.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-slate-500 py-12 text-xs">
                          No conversation logs captured yet. Go to Leads CRM and dial a lead to record call history!
                        </td>
                      </tr>
                    ) : (
                      calls.slice(0, 5).map((c) => (
                        <tr key={c.id} className="border-b border-slate-800/40 hover:bg-slate-800/10">
                          <td className="py-3 px-4 text-xs font-bold text-white">{c.customer_name}</td>
                          <td className="py-3 px-4 text-xs font-mono text-slate-300">{c.duration_seconds}s</td>
                          <td className="py-3 px-4 text-xs">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                              c.sentiment === "positive" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                              c.sentiment === "frustrated" ? "bg-red-500/10 border-red-500/20 text-red-400" :
                              "bg-slate-500/10 border-slate-500/20 text-slate-400"
                            }`}>
                              {c.sentiment || "neutral"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs max-w-xs truncate text-slate-400">{c.summary || "Call completed naturally."}</td>
                          <td className="py-3 px-4 text-xs text-slate-500">{new Date(c.created_at).toLocaleString("en-IN")}</td>
                          <td className="py-3 px-4 text-xs">
                            <button
                              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-850 text-[10px] font-bold text-white rounded-lg transition-all cursor-pointer"
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

        {/* -------------------- VIEW: AI EMPLOYEES CONFIG -------------------- */}
        {activeTab === "employees" && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* List Active Voice Employees */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 mb-2">Deployed Voice Employees ({agents.length})</h3>
              {agents.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-12 text-center text-slate-500 text-xs">
                  No Voice Employees deployed yet. Fill the wizard on the right to deploy your first AI Voice employee!
                </div>
              ) : (
                agents.map((ag) => (
                  <div key={ag.id} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4 hover:border-slate-700/60 transition-all">
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded bg-gradient-to-br ${headerGradient} text-white`}>
                            <Volume2 className="h-4 w-4" />
                          </div>
                          <h4 className="text-sm font-bold text-white">{ag.name}</h4>
                          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-bold uppercase">{ag.personality}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">
                          Language Accent: <strong className="text-indigo-400">{ag.language}</strong> | Voice: <strong className="text-slate-300 font-mono text-[9px]">{ag.voice_provider} ({ag.voice_id})</strong>
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-850 hover:text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                          onClick={() => startEditAgent(ag)}
                        >
                          Configure
                        </button>
                        <button
                          className="p-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-500/10 hover:border-red-500/30 text-red-400 rounded-lg cursor-pointer transition-all"
                          onClick={() => handleDeleteAgent(ag.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] pt-2 border-t border-slate-800/40">
                      <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-850">
                        <span className="font-bold text-slate-500 block mb-1 text-[9px] uppercase tracking-wider">Greeting message</span>
                        <p className="text-slate-300 italic">"{ag.greeting_message}"</p>
                      </div>
                      <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-850">
                        <span className="font-bold text-slate-500 block mb-1 text-[9px] uppercase tracking-wider">RAG Instruction details</span>
                        <p className="text-slate-300 line-clamp-2 leading-relaxed">"{ag.system_prompt}"</p>
                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>

            {/* Right Form: Deploy Voice Employee */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 h-fit">
              <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                <Plus className={`h-4 w-4 ${textTint}`} />
                Deploy AI Employee
              </h3>
              
              <form onSubmit={handleCreateAgent} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Employee Name</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                    placeholder="e.g. Sharada (ಶಾರದಾ)"
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Language</label>
                    <select
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-xs text-slate-300 focus:outline-none"
                      value={newAgentLang}
                      onChange={(e) => setNewAgentLang(e.target.value)}
                    >
                      <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                      <option value="Telugu">Telugu (ತೆಲುಗು)</option>
                      <option value="Hindi">Hindi (ಹಿಂದಿ)</option>
                      <option value="English">English</option>
                      <option value="Tamil">Tamil (ತಮಿಳು)</option>
                      <option value="Malayalam">Malayalam</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Voice Accent</label>
                    <select
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-xs text-slate-300 focus:outline-none"
                      value={newAgentVoice}
                      onChange={(e) => setNewAgentVoice(e.target.value)}
                    >
                      <option value="native">Browser Vocal TTS</option>
                      <option value="elevenlabs">ElevenLabs Custom</option>
                      <option value="openai">OpenAI Realtime</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Objective / Role</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none"
                    value={newAgentRole}
                    onChange={(e) => setNewAgentRole(e.target.value)}
                  >
                    <option value="Sales Representative">Sales Representative</option>
                    <option value="Customer Support Agent">Customer Support Agent</option>
                    <option value="Appointment Booker">Appointment Booker</option>
                    <option value="Feedback Surveyor">Feedback Surveyor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Custom Greeting Message</label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                    placeholder="Leave blank for automatic greeting phrase..."
                    value={newAgentGreet}
                    onChange={(e) => setNewAgentGreet(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Persona Instructions (RAG Prompt)</label>
                  <textarea
                    required
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                    placeholder="Provide details about business hours, product details to quote, and lead qualifying budget rules..."
                    value={newAgentPrompt}
                    onChange={(e) => setNewAgentPrompt(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full py-2.5 bg-gradient-to-r ${buttonBg} text-white text-xs font-bold rounded-lg cursor-pointer transition-all shadow-md active:scale-95`}
                >
                  Deploy AI Employee
                </button>
              </form>
            </div>

          </section>
        )}

        {/* -------------------- VIEW: KNOWLEDGE BASE -------------------- */}
        {activeTab === "kb" && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: FAQs list & PDF documents lists */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* FAQs List */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-slate-200 mb-4">RAG Q&A FAQ Brain rules</h3>
                <div className="overflow-x-auto">
                  <table className="custom-table w-full">
                    <thead>
                      <tr>
                        <th className="text-left text-xs font-semibold text-slate-400 py-2.5" style={{ width: "35%" }}>Question</th>
                        <th className="text-left text-xs font-semibold text-slate-400 py-2.5" style={{ width: "55%" }}>Response Answer</th>
                        <th className="text-left text-xs font-semibold text-slate-400 py-2.5" style={{ width: "10%" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {faqs.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center text-slate-500 text-xs py-8">
                            No FAQs added. Insert FAQ mappings on the right to train your voice agents.
                          </td>
                        </tr>
                      ) : (
                        faqs.map((f) => (
                          <tr key={f.id} className="border-b border-slate-800/30 hover:bg-slate-800/5">
                            <td className="py-2 px-1 text-xs font-bold text-white">{f.question}</td>
                            <td className="py-2 px-1 text-xs text-slate-300 leading-normal">{f.answer}</td>
                            <td className="py-2 px-1 text-xs">
                              <button
                                className="text-red-400 hover:text-red-300 cursor-pointer"
                                onClick={() => handleDeleteFaq(f.id)}
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

              {/* Uploaded vector context */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-slate-200 mb-4">Parsed Documents & Crawler Links</h3>
                {docs.length === 0 ? (
                  <p className="text-center text-slate-500 text-xs py-8">No documents or parsed links loaded in vector cache.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {docs.map((doc) => (
                      <div key={doc.id} className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-bold uppercase">{doc.file_type}</span>
                            <button
                              className="text-red-400 hover:text-red-300 cursor-pointer"
                              onClick={() => handleDeleteDoc(doc.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <h4 className="text-xs font-bold text-white mb-2 truncate" title={doc.name}>{doc.name}</h4>
                          <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-3">
                            {doc.text_content}
                          </p>
                        </div>
                        <div className="border-t border-slate-850 pt-2 mt-3 flex justify-between items-center text-[8px] text-slate-500 font-bold uppercase">
                          <span>Status: Indexed</span>
                          <span>Chunks: {Math.max(1, Math.round(doc.text_content.length / 300))}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Right: Upload FAQ & crawler forms */}
            <div className="space-y-6">
              
              {/* FAQ mapping */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Add FAQ rule</h4>
                <form onSubmit={handleAddFaq} className="space-y-3">
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                    placeholder="Question (e.g. ಬೆಲೆ ಎಷ್ಟು? / What is the cost?)"
                    value={newFaqQ}
                    onChange={(e) => setNewFaqQ(e.target.value)}
                  />
                  <textarea
                    required
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                    placeholder="Response (e.g. Cost is ₹2999 per month.)"
                    value={newFaqA}
                    onChange={(e) => setNewFaqA(e.target.value)}
                  />
                  <button
                    type="submit"
                    className={`w-full py-2 bg-gradient-to-r ${buttonBg} text-white text-xs font-bold rounded-lg cursor-pointer`}
                  >
                    Index FAQ rule
                  </button>
                </form>
              </div>

              {/* PDF Paste */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Paste PDF / Brochure copy</h4>
                <form onSubmit={handleAddDoc} className="space-y-3">
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                    placeholder="Document Name (e.g. smart_specs.pdf)"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                  />
                  <textarea
                    required
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                    placeholder="Paste PDF text copy specifications..."
                    value={newDocContent}
                    onChange={(e) => setNewDocContent(e.target.value)}
                  />
                  <button
                    type="submit"
                    className={`w-full py-2 bg-gradient-to-r ${buttonBg} text-white text-xs font-bold rounded-lg cursor-pointer`}
                  >
                    Parse document context
                  </button>
                </form>
              </div>

              {/* Crawler link */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Crawl & Embed URL website</h4>
                <form onSubmit={handleUrlImport} className="space-y-3">
                  <input
                    type="url"
                    required
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                    placeholder="https://example.com/pricing"
                    value={newUrlImport}
                    onChange={(e) => setNewUrlImport(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={isUrlImporting}
                    className={`w-full py-2 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50`}
                  >
                    {isUrlImporting ? "Crawling & indexing URL..." : "Embed URL vectors"}
                  </button>
                </form>
              </div>

            </div>
          </section>
        )}

        {/* -------------------- VIEW: CALL HISTORY -------------------- */}
        {activeTab === "history" && (
          <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-slate-200">Conversations & Transcripts Archive</h3>
              <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">Real-time sync list</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="custom-table w-full">
                <thead>
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">Customer Name</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">Audio Playback</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">Duration</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">Sentiment</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">Outcome summary</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">Date & Time</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {calls.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-slate-500 py-12 text-xs">No voice call recordings saved yet.</td>
                    </tr>
                  ) : (
                    calls.map((c) => (
                      <tr key={c.id} className="border-b border-slate-800/30 hover:bg-slate-800/5">
                        <td className="py-3 px-4 text-xs font-bold text-white">{c.customer_name}</td>
                        <td className="py-3 px-4 text-xs">
                          {/* Audio Wave player simulation */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handlePlayMockRecording(c.id)}
                              className={`p-1.5 rounded-full cursor-pointer transition-all ${
                                audioPlayState === c.id 
                                  ? "bg-red-500/20 text-red-500" 
                                  : "bg-slate-800 text-slate-400 hover:text-white"
                              }`}
                            >
                              <Play className={`h-3 w-3 ${audioPlayState === c.id ? "animate-pulse" : ""}`} />
                            </button>
                            {audioPlayState === c.id ? (
                              <div className="flex items-center gap-0.5 w-16">
                                {[...Array(5)].map((_, i) => (
                                  <div
                                    key={i}
                                    style={{ height: `${Math.floor(Math.random() * 12) + 4}px` }}
                                    className="w-0.5 bg-red-500 rounded-full animate-pulse"
                                  />
                                ))}
                              </div>
                            ) : (
                              <span className="text-[9px] text-slate-500 font-mono">0:00 / 0:{c.duration_seconds}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-slate-300">{c.duration_seconds}s</td>
                        <td className="py-3 px-4 text-xs">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                            c.sentiment === "positive" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                            c.sentiment === "frustrated" ? "bg-red-500/10 border-red-500/20 text-red-400" :
                            "bg-slate-500/10 border-slate-500/20 text-slate-400"
                          }`}>
                            {c.sentiment || "neutral"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs max-w-xs truncate text-slate-400">{c.summary || "Call completed naturally."}</td>
                        <td className="py-3 px-4 text-xs text-slate-500">{new Date(c.created_at).toLocaleString("en-IN")}</td>
                        <td className="py-3 px-4 text-xs">
                          <button
                            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-850 text-[10px] font-bold text-white rounded-lg transition-all cursor-pointer"
                            onClick={() => openCallLogs(c)}
                          >
                            Open Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* -------------------- VIEW: LEADS CRM -------------------- */}
        {activeTab === "leads" && (
          <section className="space-y-6">
            
            {/* Qualified CRM table */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">Customer Leads & CRM Pipeline</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage lead pipelines, update status selections, edit notes, and dial calls using the VoiceOS AI simulator.
                  </p>
                </div>
                <span className="text-[10px] bg-slate-800/50 border border-slate-800 text-slate-400 px-3 py-1.5 rounded-lg font-bold">
                  Total Leads count: {totalLeadsCount}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="custom-table w-full">
                  <thead>
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">Name</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">Phone</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">Budget</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">Callback window</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400" style={{ width: "22%" }}>Intent requirements</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">Lead Score</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">Lead Status</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400" style={{ width: "15%" }}>Followup Notes</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">Call Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center text-slate-500 py-12 text-xs">No leads generated. Test the frontend live demo to insert new leads!</td>
                      </tr>
                    ) : (
                      customers.map((lead) => {
                        const extra = leadsExtraMap[lead.id] || { status: "New", notes: "" };
                        
                        return (
                          <tr key={lead.id} className="border-b border-slate-800/30 hover:bg-slate-800/5">
                            <td className="py-3 px-4 text-xs font-bold text-white">{lead.name}</td>
                            <td className="py-3 px-4 text-xs font-mono text-slate-300">{lead.phone}</td>
                            <td className="py-3 px-4 text-xs text-indigo-400 font-bold">₹{lead.budget || 0}</td>
                            <td className="py-3 px-4 text-xs text-slate-400">{lead.callback_time || "N/A"}</td>
                            <td className="py-3 px-4 text-xs text-slate-300 max-w-[200px] truncate" title={lead.requirements}>{lead.requirements || "Product inquiry"}</td>
                            <td className="py-3 px-4 text-xs">
                              <div className="flex items-center gap-2">
                                <div className="w-14 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${
                                      lead.lead_score >= 80 ? "bg-emerald-500" :
                                      lead.lead_score >= 50 ? "bg-amber-500" : "bg-red-500"
                                    }`}
                                    style={{ width: `${lead.lead_score}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-bold font-mono text-slate-300">{lead.lead_score}%</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-xs">
                              <select
                                className="bg-slate-950 border border-slate-800 text-[10px] text-slate-300 font-semibold p-1 rounded-md focus:outline-none"
                                value={extra.status}
                                onChange={(e) => handleLeadStatusChange(lead.id, e.target.value)}
                              >
                                <option value="New">New</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Qualified">Qualified</option>
                                <option value="Closed">Closed</option>
                              </select>
                            </td>
                            <td className="py-3 px-4 text-xs">
                              <input
                                type="text"
                                className="bg-slate-950 border border-slate-850 text-[10px] rounded p-1 text-slate-300 w-full focus:outline-none"
                                placeholder="Add followup details..."
                                value={extra.notes}
                                onChange={(e) => handleLeadNotesChange(lead.id, e.target.value)}
                              />
                            </td>
                            <td className="py-3 px-4 text-xs">
                              <button
                                className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 rounded-lg cursor-pointer transition-all active:scale-95"
                                onClick={() => handleCallLead(lead)}
                                title="Dial simulated call"
                              >
                                <PhoneCall className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Scheduled slots list */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-200 mb-4">Upcoming Sales Demo Appointments</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {appointments.length === 0 ? (
                  <div className="col-span-3 text-center text-slate-500 py-6 text-xs">No appointments calendar mappings found.</div>
                ) : (
                  appointments.map((app) => (
                    <div key={app.id} className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-indigo-400">{app.time}</span>
                          <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-extrabold uppercase">
                            {app.status}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white mb-2">Live Demo Appointment Call</h4>
                        <p className="text-xs text-slate-400 leading-normal italic">
                          "{app.notes}"
                        </p>
                      </div>
                      <div className="border-t border-slate-850 pt-2 mt-4 text-[9px] text-slate-500 font-bold uppercase">
                        Scheduled Date: {app.date}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </section>
        )}

        {/* -------------------- VIEW: ANALYTICS CONSOLE -------------------- */}
        {activeTab === "analytics" && (
          <section className="space-y-6">
            
            {/* Widget layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Call Completion</span>
                <div className="text-2xl font-black mt-2 text-white">98.4%</div>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">Percentage of calls fully answered by bots without drops.</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Language Distribution</span>
                <div className="space-y-2 mt-3.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Kannada (ಕನ್ನಡ)</span>
                    <strong className="text-white">65%</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">English</span>
                    <strong className="text-white">20%</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Others (Telugu/Hindi)</span>
                    <strong className="text-white">15%</strong>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Avg Response Speed</span>
                  <div className="text-2xl font-black mt-2 text-indigo-400">1.2 seconds</div>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-2">Latency benchmark from speech recognition end to vocal audio generation.</p>
              </div>

            </div>

            {/* Top Customer Questions & Volume distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* FAQ topics */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-slate-200 mb-4">Top Customer Questions / Inquiry Topics</h3>
                <div className="space-y-4">
                  {[
                    { topic: "Pricing packages and monthly billing", count: 48, percentage: 80 },
                    { topic: "AI support and language availability", count: 32, percentage: 60 },
                    { topic: "Razorpay integration configuration details", count: 24, percentage: 45 },
                    { topic: "Consultation and calendar booking slots", count: 18, percentage: 32 },
                    { topic: "Warranty, delivery and return policies", count: 12, percentage: 20 }
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-300">{item.topic}</span>
                        <span className="text-[10px] text-slate-500 font-bold">{item.count} inquiries</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${headerGradient} rounded-full`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly graphs stats */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-slate-200 mb-4">Quality & Sentiment KPIs</h3>
                <div className="space-y-4">
                  <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-widest mb-1.5">Call Completion Outcomes</span>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <span className="text-emerald-400 font-extrabold font-mono block text-md">84%</span>
                        <span className="text-[9px] text-slate-500 uppercase font-bold">Closed Sale</span>
                      </div>
                      <div>
                        <span className="text-amber-400 font-extrabold font-mono block text-md">12%</span>
                        <span className="text-[9px] text-slate-500 uppercase font-bold">Followup call</span>
                      </div>
                      <div>
                        <span className="text-red-400 font-extrabold font-mono block text-md">4%</span>
                        <span className="text-[9px] text-slate-500 uppercase font-bold">Uninterested</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-widest mb-1">Average Call Length Distribution</span>
                    <p className="text-xs text-slate-300">
                      Most conversations settle between <strong className="text-white">35 seconds to 1.5 minutes</strong>, providing optimal qualification rates.
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </section>
        )}

        {/* -------------------- VIEW: BILLING & PLANS -------------------- */}
        {activeTab === "billing" && (
          <section className="space-y-6">
            
            {/* Packages */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Starter */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Starter Package</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">₹2,999</span>
                    <span className="text-xs text-slate-500">/month</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-400">
                    <li className="flex items-center gap-2">✓ 500 Call Minutes</li>
                    <li className="flex items-center gap-2">✓ 1 Active AI voice agent</li>
                    <li className="flex items-center gap-2">✓ Standard vector FAQ RAG rules</li>
                  </ul>
                </div>
                <button
                  className={`w-full py-2.5 rounded-lg text-xs font-bold mt-8 transition-all cursor-pointer ${
                    subscription?.plan === "starter" 
                      ? "bg-slate-850 border border-slate-800 text-slate-500 cursor-not-allowed" 
                      : `bg-gradient-to-r ${buttonBg} text-white`
                  }`}
                  onClick={() => handleUpgradePlan("starter")}
                  disabled={subscription?.plan === "starter"}
                >
                  {subscription?.plan === "starter" ? "Current Plan" : "Upgrade with Razorpay"}
                </button>
              </div>

              {/* Growth */}
              <div className={`bg-slate-900/60 border border-indigo-500/30 bg-indigo-950/5 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden`}>
                <div className="absolute top-3 right-3 bg-indigo-600 text-white text-[9px] font-extrabold px-2.5 py-1 rounded uppercase tracking-wider">
                  Popular
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Growth Package</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">₹7,999</span>
                    <span className="text-xs text-slate-500">/month</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">✓ 2,000 Call Minutes</li>
                    <li className="flex items-center gap-2">✓ 3 Active AI agents</li>
                    <li className="flex items-center gap-2">✓ WhatsApp webhook integration</li>
                    <li className="flex items-center gap-2">✓ Custom documents vector context</li>
                  </ul>
                </div>
                <button
                  className={`w-full py-2.5 rounded-lg text-xs font-bold mt-8 transition-all cursor-pointer ${
                    subscription?.plan === "growth" 
                      ? "bg-slate-850 border border-slate-800 text-slate-500 cursor-not-allowed" 
                      : `bg-gradient-to-r ${buttonBg} text-white`
                  }`}
                  onClick={() => handleUpgradePlan("growth")}
                  disabled={subscription?.plan === "growth"}
                >
                  {subscription?.plan === "growth" ? "Current Plan" : "Upgrade with Razorpay"}
                </button>
              </div>

              {/* Pro */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pro Package</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">₹14,999</span>
                    <span className="text-xs text-slate-500">/month</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-400">
                    <li className="flex items-center gap-2">✓ Unlimited voice employees</li>
                    <li className="flex items-center gap-2">✓ Real-time CRM syncing</li>
                    <li className="flex items-center gap-2">✓ Bulk outbound dialer campaigns</li>
                    <li className="flex items-center gap-2">✓ Account manager supervisor</li>
                  </ul>
                </div>
                <button
                  className={`w-full py-2.5 rounded-lg text-xs font-bold mt-8 transition-all cursor-pointer ${
                    subscription?.plan === "pro" 
                      ? "bg-slate-850 border border-slate-800 text-slate-500 cursor-not-allowed" 
                      : `bg-gradient-to-r ${buttonBg} text-white`
                  }`}
                  onClick={() => handleUpgradePlan("pro")}
                  disabled={subscription?.plan === "pro"}
                >
                  {subscription?.plan === "pro" ? "Current Plan" : "Upgrade with Razorpay"}
                </button>
              </div>

            </div>

            {/* Payments billing log */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-200 mb-4">Billing History Logs & Sandbox Invoices</h3>
              <div className="overflow-x-auto">
                <table className="custom-table w-full">
                  <thead>
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">Invoice ID</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">Selected Plan</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">Paid Amount</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">Payment Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-slate-500 py-6 text-xs">No billing logs recorded yet.</td>
                      </tr>
                    ) : (
                      payments.map((pay) => (
                        <tr key={pay.id} className="border-b border-slate-800/30">
                          <td className="py-3 px-4 text-xs font-mono text-slate-300">{pay.razorpay_payment_id}</td>
                          <td className="py-3 px-4 text-xs font-bold uppercase text-white">{subscription?.plan}</td>
                          <td className="py-3 px-4 text-xs text-indigo-400 font-bold">₹{pay.amount || 0}</td>
                          <td className="py-3 px-4 text-xs">
                            <span className="badge badge-success px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                              {pay.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-500">{new Date(pay.created_at).toLocaleString("en-IN")}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </section>
        )}

        {/* -------------------- VIEW: SETTINGS -------------------- */}
        {activeTab === "settings" && (
          <section className="space-y-6 max-w-3xl">
            
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-200 mb-4">Workspace & General Profile Settings</h3>
              
              <form onSubmit={handleSaveSettings} className="space-y-5">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Business Name</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      value={settingsBizName}
                      onChange={(e) => setSettingsBizName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Business Category</label>
                    <select
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                      value={settingsCategory}
                      onChange={(e) => setSettingsCategory(e.target.value)}
                    >
                      <option value="Real Estate">Real Estate</option>
                      <option value="Hospital / Healthcare">Hospital / Healthcare</option>
                      <option value="Education">Education</option>
                      <option value="Restaurant / Food Services">Restaurant / Food Services</option>
                      <option value="E-Commerce">E-Commerce</option>
                      <option value="Insurance / Finance">Insurance / Finance</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Contact Phone</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      value={settingsPhone}
                      onChange={(e) => setSettingsPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Profile Timezone</label>
                    <select
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                    >
                      <option value="IST (UTC+05:30)">IST (UTC+05:30) - India Standard Time</option>
                      <option value="EST (UTC-05:00)">EST (UTC-05:00) - Eastern Standard Time</option>
                      <option value="GMT (UTC+00:00)">GMT (UTC+00:00) - Greenwich Mean Time</option>
                      <option value="PST (UTC-08:00)">PST (UTC-08:00) - Pacific Standard Time</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Workspace Description / AI Context</label>
                  <textarea
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="Short description of your business to guide general fallback queries..."
                    value={settingsDesc}
                    onChange={(e) => setSettingsDesc(e.target.value)}
                  />
                </div>

                <div className="border-t border-slate-800/80 pt-4 space-y-4">
                  <h4 className="text-xs font-bold text-slate-300">Custom Branding Options</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Logo Text</label>
                      <input
                        type="text"
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        value={brandingLogoText}
                        onChange={(e) => setBrandingLogoText(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Workspace Brand Color</label>
                      <div className="flex gap-2.5 mt-2">
                        {[
                          { key: "violet", bg: "bg-violet-600" },
                          { key: "indigo", bg: "bg-indigo-600" },
                          { key: "emerald", bg: "bg-emerald-600" },
                          { key: "rose", bg: "bg-rose-600" }
                        ].map((c) => (
                          <button
                            key={c.key}
                            type="button"
                            onClick={() => setBrandingColor(c.key)}
                            className={`h-6 w-6 rounded-full ${c.bg} cursor-pointer transition-all ${
                              brandingColor === c.key ? "ring-2 ring-white scale-110" : "opacity-60"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className={`py-2.5 px-6 bg-gradient-to-r ${buttonBg} text-xs font-bold text-white rounded-lg cursor-pointer transition-all shadow-md active:scale-95`}
                >
                  Save Workspace Config
                </button>

              </form>
            </div>

            {/* Security disclaimer info */}
            <div className="bg-slate-900/30 border border-slate-800/80 p-5 rounded-2xl flex gap-3 text-xs leading-normal text-slate-400">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
              <div>
                <strong className="text-slate-200 font-bold block mb-1">Developer API Security Guard Active</strong>
                VoiceOS AI restricts direct API key exposures (Twilio, Exotel, OpenAI, ElevenLabs credentials) from client-side configurations. All test calls utilize secure backend sandbox wrappers to guarantee telephony line isolation.
              </div>
            </div>

          </section>
        )}

      </main>

      {/* --- Phone Call Dialer Emulator Overlay Modal --- */}
      {dialingLead && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative font-sans">
            
            {/* Dialer Ringing Banner */}
            <div className={`bg-gradient-to-r ${headerGradient} p-6 text-white text-center`}>
              <div className="inline-flex p-3 bg-white/10 rounded-full animate-bounce mb-3">
                <Phone className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">{dialingLead.name}</h3>
              <p className="text-xs text-white/80 font-mono mt-1">{dialingLead.phone}</p>
              
              <div className="mt-3 text-xs bg-black/20 py-1.5 px-3 rounded-full inline-block font-bold">
                Status: <span className="uppercase text-yellow-300 animate-pulse">{dialCallStatus}</span>
              </div>
            </div>

            {/* Dialer Body - Transcript feed */}
            <div className="p-6">
              <div className="h-48 overflow-y-auto bg-slate-950 border border-slate-850 rounded-2xl p-4 mb-4 space-y-2 flex flex-col">
                {dialTranscript.map((t, idx) => (
                  <div key={idx} className={`text-xs max-w-[85%] ${
                    t.role === "system" ? "text-slate-500 mx-auto text-center font-mono py-1" :
                    t.role === "user" ? "ml-auto bg-indigo-600 text-white p-2.5 rounded-2xl rounded-br-sm" :
                    "mr-auto bg-slate-850 border border-slate-800 text-slate-100 p-2.5 rounded-2xl rounded-bl-sm"
                  }`}>
                    {t.content}
                  </div>
                ))}
                {isPaying && (
                  <div className="text-[10px] text-slate-500 animate-pulse text-center">
                    AI Agent listening / transcribing speech...
                  </div>
                )}
              </div>

              {/* Call Simulator Controls */}
              {dialCallStatus === "connected" && (
                <div className="space-y-4">
                  {/* Waveform visualizer */}
                  {dialMicActive && (
                    <div className="flex justify-center items-center gap-1 h-6">
                      {[...Array(12)].map((_, i) => (
                        <div
                          key={i}
                          style={{ height: `${(i % 2 === 0 ? dialSpeechPulse : dialSpeechPulse / 2) * 3.5 + 4}px` }}
                          className="w-1 bg-red-500 rounded-full transition-all duration-100"
                        />
                      ))}
                    </div>
                  )}

                  {/* Inputs */}
                  <div className="flex gap-2">
                    <button
                      onClick={toggleDialMic}
                      className={`p-3 border rounded-xl cursor-pointer transition-all ${
                        dialMicActive 
                          ? "bg-red-500/20 border-red-500/40 text-red-500" 
                          : "bg-slate-950 border-slate-850 text-slate-400 hover:text-white"
                      }`}
                      title="Toggle Microphone Input"
                    >
                      {dialMicActive ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
                    </button>

                    <input
                      type="text"
                      className="flex-grow bg-slate-950 border border-slate-850 rounded-xl px-4 text-xs focus:outline-none"
                      placeholder="Type response (e.g. ಬೆಲೆ ಎಷ್ಟು? or What is the price?)..."
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
                      onClick={() => {
                        if (dialInputText.trim()) {
                          runSandboxWebhookStep(dialInputText);
                          setDialInputText("");
                        }
                      }}
                      className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl cursor-pointer"
                    >
                      <ArrowRight className="h-4.5 w-4.5" />
                    </button>
                  </div>

                  {/* Quick-simulate buttons */}
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    <button 
                      onClick={() => runSandboxWebhookStep("ಬೆಲೆ ಎಷ್ಟು?")}
                      className="bg-slate-950 hover:bg-slate-850 border border-slate-850 text-[10px] font-semibold text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg"
                    >
                      Cost? (KN)
                    </button>
                    <button 
                      onClick={() => runSandboxWebhookStep("What is the cost?")}
                      className="bg-slate-950 hover:bg-slate-850 border border-slate-850 text-[10px] font-semibold text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg"
                    >
                      Cost? (EN)
                    </button>
                    <button 
                      onClick={() => runSandboxWebhookStep("ನನ್ನ ಬಜೆಟ್ ೩೦೦೦ ರುಪಾಯಿ")}
                      className="bg-slate-950 hover:bg-slate-850 border border-slate-850 text-[10px] font-semibold text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg"
                    >
                      Qualify Lead (KN)
                    </button>
                    <button 
                      onClick={() => runSandboxWebhookStep("My budget is ₹3000")}
                      className="bg-slate-950 hover:bg-slate-850 border border-slate-850 text-[10px] font-semibold text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg"
                    >
                      Qualify Lead (EN)
                    </button>
                    <button 
                      onClick={() => runSandboxWebhookStep("ಸಮಾಲೋಚನೆ ಬುಕ್ ಮಾಡಿ")}
                      className="bg-slate-950 hover:bg-slate-850 border border-slate-850 text-[10px] font-semibold text-emerald-400 px-2.5 py-1.5 rounded-lg"
                    >
                      Book Consultation
                    </button>
                  </div>
                </div>
              )}

              {/* Hangup button */}
              <button
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
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl font-sans">
            <div className="bg-indigo-600 p-5 text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-85">Razorpay Secure Checkout</span>
                <h4 className="text-lg font-bold">Authorize Upgrade Payment</h4>
              </div>
              <button onClick={() => setShowPayModal(null)} className="text-white hover:opacity-85 text-xl font-bold cursor-pointer">
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
                onClick={executeRazorpaySuccess}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl cursor-pointer transition-all active:scale-95"
                disabled={isPaying}
              >
                {isPaying ? "Authorizing checkout..." : "Authorize Sandbox Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Call Transcript & Playback Modal View --- */}
      {selectedCall && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-sans"
          onClick={() => setSelectedCall(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-md font-bold text-white">Call Recording Transcript: {selectedCall.customer_name}</h3>
                <p className="text-[10px] text-slate-400 mt-1">
                  Duration: {selectedCall.duration_seconds}s | Classification: <span className="uppercase text-slate-200">{selectedCall.sentiment}</span>
                </p>
              </div>
              <button onClick={() => setSelectedCall(null)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Playback Simulation waveform */}
            <div className="bg-slate-950 border-b border-slate-800 p-4 flex items-center gap-4">
              <button
                onClick={() => handlePlayMockRecording(selectedCall.id)}
                className={`p-2.5 rounded-full cursor-pointer transition-all ${
                  audioPlayState === selectedCall.id 
                    ? "bg-red-500 text-white" 
                    : "bg-indigo-600 text-white hover:bg-indigo-500"
                }`}
              >
                <Play className="h-4.5 w-4.5 fill-white" />
              </button>
              <div className="flex-grow">
                <div className="flex justify-between text-[9px] text-slate-500 mb-1">
                  <span>Playback: {audioPlayState === selectedCall.id ? `0:${Math.round(audioProgress * selectedCall.duration_seconds / 100)}` : "0:00"}</span>
                  <span>Total: 0:{selectedCall.duration_seconds}s</span>
                </div>
                <div className="bg-slate-850 h-1.5 rounded-full overflow-hidden relative">
                  <div 
                    className="bg-indigo-500 h-full transition-all duration-300"
                    style={{ width: `${audioPlayState === selectedCall.id ? audioProgress : 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="p-5 max-h-80 overflow-y-auto space-y-4 bg-slate-900/50">
              {isTranscriptLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mx-auto mb-2" />
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
                      m.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-800 border border-slate-700/50 text-slate-200"
                    }`}>
                      {m.content}
                    </div>
                    <span className="text-[9px] text-slate-500 font-bold mt-1 px-1">
                      {m.role === "user" ? "Customer Caller" : "VoiceOS AI Employee"}
                    </span>
                  </div>
                ))
              )}
            </div>

            {selectedCall.summary && (
              <div className="p-5 bg-slate-950 border-t border-slate-800/80">
                <h5 className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">AI Transcript Summary</h5>
                <p className="text-xs text-slate-300 leading-normal font-sans">{selectedCall.summary}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- Configure Edit Agent Modal View --- */}
      {editingAgent && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-sans">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <h3 className="text-sm font-bold text-white">Configure AI Employee: {editingAgent.name}</h3>
              <button onClick={() => setEditingAgent(null)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditAgent} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Employee Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  value={editAgentName}
                  onChange={(e) => setEditAgentName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Language</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-855 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                    value={editAgentLang}
                    onChange={(e) => setEditAgentLang(e.target.value)}
                  >
                    <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                    <option value="Telugu">Telugu (ತೆಲುಗು)</option>
                    <option value="Hindi">Hindi (ಹಿಂದಿ)</option>
                    <option value="English">English</option>
                    <option value="Tamil">Tamil (ತಮಿಳು)</option>
                    <option value="Malayalam">Malayalam</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Voice Accent</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-855 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                    value={editAgentVoice}
                    onChange={(e) => setEditAgentVoice(e.target.value)}
                  >
                    <option value="native">Browser Vocal TTS</option>
                    <option value="elevenlabs">ElevenLabs Custom</option>
                    <option value="openai">OpenAI Realtime</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Objective / Role</label>
                <select
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                  value={editAgentRole}
                  onChange={(e) => setEditAgentRole(e.target.value)}
                >
                  <option value="Sales Representative">Sales Representative</option>
                  <option value="Customer Support Agent">Customer Support Agent</option>
                  <option value="Appointment Booker">Appointment Booker</option>
                  <option value="Feedback Surveyor">Feedback Surveyor</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Greeting Message</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  value={editAgentGreet}
                  onChange={(e) => setEditAgentGreet(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Instructions Prompt</label>
                <textarea
                  required
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  value={editAgentPrompt}
                  onChange={(e) => setEditAgentPrompt(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAgent(null)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-xs font-bold text-slate-300 rounded-lg cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2 bg-gradient-to-r ${buttonBg} text-white text-xs font-bold rounded-lg cursor-pointer transition-all`}
                >
                  Save Configurations
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

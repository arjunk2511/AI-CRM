"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Sparkles, Phone, Clock, UserCheck, Award, ArrowRight, 
  CheckCircle, MessageSquare, Shield, Building, PhoneCall, 
  Database, Upload, Share2, Zap, BarChart, TrendingUp, Users,
  BookOpen, ChevronRight, HelpCircle, PhoneOutgoing, Headphones, Volume2
} from "lucide-react";
import { dbClient } from "@/lib/dbClient";


// Demo configurations
const INDUSTRIES = [
  { id: "real-estate", name: "Real Estate", icon: Building },
  { id: "hospital", name: "Hospital", icon: HelpCircle },
  { id: "education", name: "Education", icon: BookOpen },
  { id: "restaurant", name: "Restaurant", icon: Users },
  { id: "ecommerce", name: "E-Commerce", icon: TrendingUp },
  { id: "finance", name: "Finance", icon: BarChart },
  { id: "travel", name: "Travel", icon: Share2 },
  { id: "insurance", name: "Insurance", icon: Shield }
];

const LANGUAGES = [
  { id: "telugu", name: "Telugu", code: "te-IN" },
  { id: "kannada", name: "Kannada", code: "kn-IN" },
  { id: "hindi", name: "Hindi", code: "hi-IN" },
  { id: "english", name: "English", code: "en-US" },
  { id: "tamil", name: "Tamil", code: "ta-IN" },
  { id: "malayalam", name: "Malayalam", code: "ml-IN" }
];

const SAMPLE_DIALOGUES: Record<string, Record<string, string[]>> = {
  "real-estate": {
    "telugu": [
      "AI: నమస్కారం! వాయిస్ఓఎస్ రియల్ ఎస్టేట్ అసిస్టెంట్ మాట్లాడటం జరుగుతోంది. మీకు ఎలా సహాయపడగలను?",
      "Customer: నాకొక ప్లాట్ కావాలి హైదరాబాద్ లో.",
      "AI: తప్పకుండా అండి. మీరు హైదరాబాద్ లో ఏ ప్రాంతంలో చూస్తున్నారు మరియు మీ బడ్జెట్ ఎంత అని తెలుసుకోవచ్చా?",
      "Customer: గచ్చిబౌలి ఏరియా లో 50 లక్షల బడ్జెట్ అండి.",
      "AI: మంచిదండి. గచ్చిబౌలి పరిసరాలలో మా దగ్గర కొన్ని అద్భుతమైన ప్రాజెక్ట్స్ ఉన్నాయి. రేపు ఉదయం సైట్ విజిట్ కోసం సమయం కేటాయించాలా?"
    ],
    "kannada": [
      "AI: ನಮಸ್ಕಾರ! ವಾಯ್ಸ್ ಓಎಸ್ ರಿಯಲ್ ಎస్టೇಟ್ ಸಹಾಯಕ ಮಾತನಾಡುತ್ತಿದ್ದೇನೆ. ತಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
      "Customer: ನನಗೆ ಬೆಂಗಳೂರಿನಲ್ಲಿ ಒಂದು ಫ್ಲಾಟ್ ಬೇಕಿತ್ತು.",
      "AI: ಖಂಡಿತ ಸರ್. ಬೆಂಗಳೂರಿನ ಯಾವ ಭಾಗದಲ್ಲಿ ಹುಡುಕುತ್ತಿದ್ದೀರಾ ಮತ್ತು ನಿಮ್ಮ ಬಜೆಟ್ ಎಷ್ಟಿದೆ?",
      "Customer: ವೈಟ್‌ಫೀಲ್ಡ್ ಹತ್ತಿರ 80 ಲಕ್ಷದೊಳಗೆ.",
      "AI: ಉತ್ತಮ ಆಯ್ಕೆ. ವೈಟ್‌ಫೀಲ್ಡ್ ಸುತ್ತಮುತ್ತ ನಮ್ಮ ಬಳಿ ಉತ್ತಮ 2BHK ಮನೆಗಳಿವೆ. ಈ ವಾರಾಂತ್ಯದಲ್ಲಿ ಸೈಟ್ ಭೇಟಿಗಾಗಿ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಮಾಡಲಾ?"
    ],
    "hindi": [
      "AI: नमस्कार! वॉइसओएस रियल एस्टेट असिस्टेंट में आपका स्वागत है। मैं आपकी क्या मदद कर सकती हूँ?",
      "Customer: मुझे दिल्ली में 2 BHK फ्लैट चाहिए।",
      "AI: जी बिल्कुल। आप दिल्ली में किस इलाके में देख रहे हैं और आपका बजट कितना है?",
      "Customer: द्वारका के पास, बजट लगभग 60 लाख है।",
      "AI: धन्यवाद। द्वारका में हमारे पास बेहतरीन विकल्प हैं। क्या मैं कल शाम को आपके लिए एक साइट विजिट शेड्यूल कर दूँ?"
    ],
    "english": [
      "AI: Hello! Welcome to VoiceOS Real Estate. How can I assist you today?",
      "Customer: I'm looking for a premium villa in Bangalore.",
      "AI: Certainly! Which specific locations are you considering, and what is your budget range?",
      "Customer: Sarjapur road, around 2.5 crores.",
      "AI: Great choice. We have a few luxury villa options matching your preferences. Would you like me to book a site visit for this Saturday?"
    ],
    "tamil": [
      "AI: வணக்கம்! வாய்ஸ்ஓஎஸ் ரியல் எஸ்டேட் அசிஸ்டண்ட் பேசுகிறேன். உங்களுக்கு எப்படி உதவ முடியும்?",
      "Customer: எனக்கு சென்னையில் ஒரு பிளாட் வேண்டும்.",
      "AI: நிச்சயமாக. சென்னையில் எந்த பகுதியில் பார்க்கிறீர்கள் மற்றும் உங்கள் பட்ஜெட் என்ன?",
      "Customer: ஓஎம்ஆர் சாலையில் 60 லட்சம் பட்ஜெட்டில்.",
      "AI: ஓஎம்ஆர் பகுதியில் எங்களிடம் சிறந்த திட்டங்கள் உள்ளன. நாளை நேரில் பார்க்க ஒரு அப்பாயிண்ட்மெண்ட் பதிவு செய்யலாமா?"
    ],
    "malayalam": [
      "AI: നമസ്കാരം! വോയ്‌സ്ഓഎസ് റിയൽ എസ്റ്റേറ്റ് അസിസ്റ്റന്റിലേക്ക് സ്വാഗതം. ഞാൻ എങ്ങനെയാണ് സഹായിക്കേണ്ടത്?",
      "Customer: എനിക്ക് കൊച്ചിയിൽ ഒരു പ്ലോട്ട് വേണം.",
      "AI: തീർച്ചയായും. കൊച്ചിയിൽ ഏത് സ്ഥലത്താണ് നിങ്ങൾ നോക്കുന്നത്, നിങ്ങളുടെ ബജറ്റ് എത്രയാണ്?",
      "Customer: ഇടപ്പള്ളിയിൽ 40 ലക്ഷം ബജറ്റിൽ.",
      "AI: ഇടപ്പള്ളിയിൽ മികച്ച പ്ലോട്ടുകൾ ലഭ്യമാണ്. സൈറ്റ് സന്ദർശനത്തിനായി നാളെ സമയം ബുക്ക് ചെയ്യട്ടെയോ?"
    ]
  },
  "hospital": {
    "english": [
      "AI: Hello, welcome to VoiceOS Healthcare support. Are you calling to book an appointment today?",
      "Customer: Yes, I want to see Dr. Sharma tomorrow.",
      "AI: Sure. Dr. Sharma is available at 10 AM and 3 PM. Which slot works best for you?",
      "Customer: 10 AM is fine.",
      "AI: Perfect. I have booked your slot for tomorrow at 10 AM. You will receive a confirmation message shortly."
    ]
  },
  "education": {
    "english": [
      "AI: Welcome to VoiceOS Admissions Helpdesk. How can I guide you regarding our courses?",
      "Customer: What is the fee structure for the Data Science program?",
      "AI: The Data Science program fee is 1.5 lakhs per year, with flexible EMI options. Would you like to connect with a counselor?",
      "Customer: Yes, that would be helpful.",
      "AI: I am scheduling a callback with our lead academic counselor for today at 4 PM. Have a nice day!"
    ]
  },
  "restaurant": {
    "english": [
      "AI: Hi! Welcome to VoiceOS Bistro. Would you like to reserve a table for tonight?",
      "Customer: Yes, table for four at 8 PM.",
      "AI: Let me check... Yes, we have a table available in our lounge area at 8 PM. Shall I confirm the booking under your name?",
      "Customer: Yes, please do.",
      "AI: Excellent. Reservation is confirmed for 4 guests tonight at 8 PM. See you soon!"
    ]
  },
  "ecommerce": {
    "english": [
      "AI: Hello, thank you for calling VoiceOS Retail support. How can I help with your order today?",
      "Customer: Can you track my order SM-9087?",
      "AI: One moment... Your order has been dispatched and is currently in transit. It is expected to be delivered by tomorrow afternoon.",
      "Customer: Thanks! Is Cash on Delivery accepted?",
      "AI: Yes, Cash on Delivery is accepted for your location at no extra charge. Is there anything else I can check?"
    ]
  },
  "finance": {
    "english": [
      "AI: Hello, thank you for calling VoiceOS Financial Consulting. How can I assist with your loan inquiry?",
      "Customer: I want to apply for a home loan. What is the interest rate?",
      "AI: Our current home loan interest rates start at 8.4% per annum. What is the loan amount you are looking for?",
      "Customer: Around 50 lakhs.",
      "AI: Understood. I can schedule a call with our home loan expert to discuss eligibility. Would tomorrow morning work?"
    ]
  },
  "travel": {
    "english": [
      "AI: Hello, thank you for calling VoiceOS Holidays. Are you looking to plan a trip?",
      "Customer: Yes, I want to book a package for Kerala.",
      "AI: We have exciting 4-night packages to Munnar and Alleppey starting at ₹15,000 per person. Would you like to receive the itinerary?",
      "Customer: Yes, send it on WhatsApp.",
      "AI: Sure. I will send the complete Kerala travel itinerary to your registered phone number immediately."
    ]
  },
  "insurance": {
    "english": [
      "AI: Hello, welcome to VoiceOS Insurance Advisor. How can I help secure your assets today?",
      "Customer: I want a quote for car insurance.",
      "AI: I can certainly help with that. Could you share your vehicle's make, model, and registration year?",
      "Customer: Maruti Swift, 2022 model.",
      "AI: Thank you. Our premium for Swift 2022 starts at approximately ₹6,500 per year. Let me connect you with an agent for a detailed quote."
    ]
  }
};

export default function LandingPage() {
  const [selectedIndustry, setSelectedIndustry] = useState("real-estate");
  const [selectedLanguage, setSelectedLanguage] = useState("english");
  const [selectedVoice, setSelectedVoice] = useState("female");
  
  // Interactive simulator states
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [demoTranscript, setDemoTranscript] = useState<string[]>([]);
  
  // Lead Form states
  const [bizName, setBizName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [bizType, setBizType] = useState("Real Estate");
  const [reqInbound, setReqInbound] = useState(true);
  const [reqOutbound, setReqOutbound] = useState(false);
  const [reqWhatsApp, setReqWhatsApp] = useState(false);
  const [reqChatbot, setReqChatbot] = useState(true);
  const [callVolume, setCallVolume] = useState("100+");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  // Play browser speech synthesis for simulated dialogue
  const speakText = (text: string, langCode: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    // Extract only the spoken text (removing 'AI: ' or 'Customer: ')
    const cleanText = text.replace(/^(AI|Customer):\s*/i, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = langCode;
    
    // Try to adjust voice based on gender
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => {
      const name = v.name.toLowerCase();
      const isFemaleSelected = selectedVoice === "female";
      const isVoiceFemale = name.includes("female") || name.includes("zira") || name.includes("google us english") || name.includes("karen") || name.includes("samantha");
      return v.lang.startsWith(langCode.substring(0, 2)) && (isFemaleSelected ? isVoiceFemale : !isVoiceFemale);
    });
    
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  };

  // Run the dialogue sequence simulation
  useEffect(() => {
    if (!isPlayingDemo) return;
    
    // Resolve dialogue array for chosen industry and language (fallback to English if specific language is missing)
    const indDialogues = SAMPLE_DIALOGUES[selectedIndustry] || SAMPLE_DIALOGUES["real-estate"];
    const dialogues = indDialogues[selectedLanguage] || indDialogues["english"];
    const currentLang = LANGUAGES.find(l => l.id === selectedLanguage) || LANGUAGES[3];

    if (demoStep < dialogues.length) {
      const textLine = dialogues[demoStep];
      setDemoTranscript(prev => [...prev, textLine]);
      
      // If AI speaks, run speech synthesis
      if (textLine.startsWith("AI:")) {
        speakText(textLine, currentLang.code);
      }

      // Progress to next line after delay
      const delay = textLine.length * 70 + 1500;
      const timer = setTimeout(() => {
        setDemoStep(prev => prev + 1);
      }, delay);

      return () => clearTimeout(timer);
    } else {
      setIsPlayingDemo(false);
    }
  }, [isPlayingDemo, demoStep, selectedIndustry, selectedLanguage]);

  const handleStartDemo = () => {
    if (typeof window !== "undefined") {
      window.speechSynthesis?.cancel();
    }
    setDemoTranscript([]);
    setDemoStep(0);
    setIsPlayingDemo(true);
  };

  const handleStopDemo = () => {
    if (typeof window !== "undefined") {
      window.speechSynthesis?.cancel();
    }
    setIsPlayingDemo(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // 1. Fetch current workspace ID dynamically
      let workspaceId = "demo-business-id";
      try {
        const wsRes = await fetch("/api/debug/workspace");
        if (wsRes.ok) {
          const wsData = await wsRes.json();
          if (wsData.workspace_id) {
            workspaceId = wsData.workspace_id;
          }
        }
      } catch (wsErr) {
        console.warn("Could not fetch debug workspace ID:", wsErr);
      }

      // 2. Format requirements text
      const reqList = [];
      if (reqInbound) reqList.push("Preferred Language");
      if (reqOutbound) reqList.push("Male/Female Voice Accent");
      if (reqWhatsApp) reqList.push("Inbound Calls Support");
      if (reqChatbot) reqList.push("Outbound Calls Dialer");
      
      const reqText = `Business Name: ${bizName} | Owner: ${ownerName} | Type: ${bizType} | Volume: ${callVolume} | Reqs: ${reqList.join(", ") || "None selected"} | Notes: ${notes || "No custom instructions"}`;

      // 3. Estimate budget from selected volume
      const budgetMap: Record<string, number> = {
        "100+": 1500,
        "500+": 2999,
        "1000+": 7999,
        "5000+": 14999
      };
      const calculatedBudget = budgetMap[callVolume] || 1500;

      // 4. Save lead customer to DB
      await dbClient.upsertCustomer(workspaceId, phone, {
        name: ownerName,
        city: bizType + " Client",
        budget: calculatedBudget,
        requirements: reqText,
        lead_score: 85,
        is_lead: true
      });

      setShowThankYou(true);
      
      // Reset form fields
      setBizName("");
      setOwnerName("");
      setPhone("");
      setEmail("");
      setNotes("");
    } catch (err) {
      console.error("Failed to save landing page lead to DB:", err);
      alert("There was an issue saving your request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans bg-radial from-slate-900/50 via-slate-950 to-black relative overflow-x-hidden" id="landing-root">
      
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="glass-panel w-11/12 max-w-6xl mx-auto my-6 px-6 py-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-950/70 border border-slate-800/60 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-2.5 rounded-lg shadow-lg">
            <Sparkles className="h-5 w-5 text-white animate-pulse" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent font-display tracking-tight">
            VoiceOS AI
          </span>
        </div>

        <nav className="flex items-center gap-6 text-xs font-semibold text-slate-400">
          <a href="#demo" className="hover:text-slate-200 transition-colors">Demo</a>
          <a href="#industries" className="hover:text-slate-200 transition-colors">Industries</a>
          <a href="#how-it-works" className="hover:text-slate-200 transition-colors">Process</a>
          <a href="#features" className="hover:text-slate-200 transition-colors">Features</a>
          <a href="#book" className="hover:text-slate-200 transition-colors">Contact</a>
        </nav>

        <Link 
          href="/login" 
          id="nav-console-login"
          className="px-5 py-2 text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white rounded-xl cursor-pointer transition-all active:scale-95 shadow-md shadow-violet-600/10"
        >
          Console Login
        </Link>
      </header>

      {/* SECTION 1: HERO */}
      <section className="relative px-4 py-20 max-w-5xl mx-auto text-center z-10 flex flex-col items-center justify-center">
        <div className="bg-violet-600/10 border border-violet-500/20 text-violet-400 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 flex items-center gap-2">
          <span className="pulsing-indicator active mr-1" />
          Enterprise-Grade Autonomous AI Voice Agents
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6 font-display text-white max-w-4xl">
          Your AI Employee That Answers Calls, <span className="gradient-text glow-text">Qualifies Leads</span>, and Books Appointments 24/7
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-3xl leading-relaxed mb-8">
          Deploy AI Voice Employees in Telugu, Kannada, Hindi, English, Tamil, Malayalam and more. Never miss a customer call again.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center mb-16">
          <a
            href="#demo"
            className="px-6 py-3.5 text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white rounded-xl shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            Try Live Demo
            <ArrowRight className="h-4.5 w-4.5" />
          </a>
          
          <a
            href="#book"
            className="px-6 py-3.5 text-sm font-bold bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:text-white rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            Book Free Consultation
          </a>
        </div>

        {/* Trust Badges */}
        <div className="w-full border-t border-slate-900 pt-8">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-6">Platform Capabilities</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { text: "24/7 Availability", icon: Clock },
              { text: "Multi-Language", icon: Sparkles },
              { text: "AI-Powered", icon: Volume2 },
              { text: "Lead Generation", icon: UserCheck },
              { text: "Appointment Booking", icon: Award }
            ].map((badge, idx) => (
              <div key={idx} className="glass-panel py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-slate-300">
                <badge.icon className="h-4 w-4 text-violet-400 shrink-0" />
                <span>{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: LIVE DEMO EXPERIENCE */}
      <section id="demo" className="px-4 py-16 max-w-5xl mx-auto w-full z-10">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">Experience a Live Call Simulator</h2>
          <p className="text-xs text-slate-400 mt-2">Configure an AI voice employee profile and watch it answer simulated customer requests live.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls Card */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-fit">
            <h3 className="text-sm font-bold text-slate-200 mb-6 flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <Headphones className="h-4.5 w-4.5 text-violet-400" />
              Configure AI Employee
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Select Industry Focus</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-violet-500 transition-all"
                  value={selectedIndustry}
                  onChange={(e) => { setSelectedIndustry(e.target.value); handleStopDemo(); }}
                  disabled={isPlayingDemo}
                >
                  {INDUSTRIES.map(ind => (
                    <option key={ind.id} value={ind.id}>{ind.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Select Language</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-violet-500 transition-all"
                  value={selectedLanguage}
                  onChange={(e) => { setSelectedLanguage(e.target.value); handleStopDemo(); }}
                  disabled={isPlayingDemo}
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.id} value={lang.id}>{lang.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Select Voice Accent</label>
                <div className="grid grid-cols-2 gap-3">
                  {["female", "male"].map(v => (
                    <button
                      key={v}
                      type="button"
                      className={`py-2.5 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                        selectedVoice === v 
                          ? "bg-violet-600/10 border-violet-500/40 text-violet-400" 
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                      onClick={() => { setSelectedVoice(v); handleStopDemo(); }}
                      disabled={isPlayingDemo}
                    >
                      {v} Voice
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-800/80 pt-6">
              {isPlayingDemo ? (
                <button
                  type="button"
                  onClick={handleStopDemo}
                  className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  Hang Up Call
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartDemo}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/10 animate-bounce"
                >
                  <PhoneCall className="h-4 w-4" />
                  Talk To AI Employee
                </button>
              )}
            </div>
          </div>

          {/* Transcript / Visualizer Card */}
          <div className="glass-panel p-6 rounded-2xl lg:col-span-2 flex flex-col justify-between min-h-[380px]">
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Simulation Terminal</span>
              {isPlayingDemo ? (
                <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Call Connected
                </span>
              ) : (
                <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-500 px-2 py-0.5 rounded font-bold uppercase">
                  Inactive Line
                </span>
              )}
            </div>

            {/* Conversation Log area */}
            <div className="flex-grow bg-slate-950/60 border border-slate-900 rounded-xl p-4 overflow-y-auto max-h-[260px] space-y-3 font-sans text-xs flex flex-col scroll-smooth">
              {demoTranscript.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 py-16">
                  <Volume2 className="h-10 w-10 text-slate-800 mb-3" />
                  <p>Click "Talk To AI Employee" to launch audio simulation.</p>
                </div>
              ) : (
                demoTranscript.map((line, idx) => {
                  const isAI = line.startsWith("AI:");
                  return (
                    <div 
                      key={idx} 
                      className={`flex flex-col max-w-[80%] rounded-2xl px-4 py-2.5 leading-relaxed transition-all duration-300 ${
                        isAI 
                          ? "bg-violet-600/10 border border-violet-500/15 text-violet-300 self-start" 
                          : "bg-slate-900 text-slate-200 self-end"
                      }`}
                    >
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        {isAI ? "AI Voice Agent" : "Customer Client"}
                      </span>
                      <span>{line.replace(/^(AI|Customer):\s*/, "")}</span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Waveform Visualizer */}
            {isPlayingDemo && (
              <div className="flex items-center justify-center gap-1.5 pt-4 border-t border-slate-900 mt-4">
                <span className="text-[10px] text-slate-500 uppercase font-bold mr-2">Audio Stream:</span>
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-1 bg-violet-500 rounded-full transition-all duration-150"
                    style={{ 
                      height: `${Math.floor(Math.random() * 24) + 6}px`,
                      animation: `pulseGlow ${0.8 + i*0.05}s infinite ease-in-out`
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 3: INDUSTRIES WE SERVE */}
      <section id="industries" className="px-4 py-16 max-w-5xl mx-auto w-full z-10 border-t border-slate-900/60">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">Industries We Serve</h2>
          <p className="text-xs text-slate-400 mt-2">Tailored conversations and workflows optimized for high-value business actions.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Real Estate",
              points: ["Lead Qualification", "Site Visit Booking", "Property Information"],
              icon: Building
            },
            {
              title: "Hospitals",
              points: ["Appointment Booking", "Patient FAQs", "Follow-Up Calls"],
              icon: Clock
            },
            {
              title: "Education",
              points: ["Admissions", "Course Information", "Student Support"],
              icon: BookOpen
            },
            {
              title: "Restaurants",
              points: ["Reservations", "Orders", "Customer Support"],
              icon: Users
            },
            {
              title: "E-Commerce",
              points: ["Product Questions", "Order Tracking", "Customer Service"],
              icon: TrendingUp
            },
            {
              title: "Insurance",
              points: ["Lead Qualification", "Policy Information", "Follow-Ups"],
              icon: Shield
            }
          ].map((item, idx) => (
            <div key={idx} className="glass-panel p-6 rounded-2xl flex flex-col gap-4 bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/60 transition-all">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">{item.title}</h3>
              <ul className="space-y-2">
                {item.points.map((pt, pIdx) => (
                  <li key={pIdx} className="flex items-center gap-2 text-xs text-slate-400">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: HOW IT WORKS */}
      <section id="how-it-works" className="px-4 py-16 max-w-5xl mx-auto w-full z-10 border-t border-slate-900/60">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">How It Works</h2>
          <p className="text-xs text-slate-400 mt-2">Deploying your custom voice assistant is simple and takes less than a day.</p>
        </div>

        <div className="relative border-l border-slate-800/80 ml-4 md:ml-32 space-y-12">
          {[
            { step: "Step 1", title: "Tell Us About Your Business", desc: "Define your company profile, focus industry, and specific calling workflows." },
            { step: "Step 2", title: "Choose Language & Voice", desc: "Select native accents from Kannada, Telugu, Hindi, Tamil, Malayalam, and English." },
            { step: "Step 3", title: "Upload FAQs & Documents", desc: "Provide PDFs, web URLs, or FAQs. The platform auto-chunks them for semantic context searches." },
            { step: "Step 4", title: "We Build Your AI Employee", desc: "Our engine optimizes system instructions and response synthesis for human-like speed." },
            { step: "Step 5", title: "Go Live Within 24 Hours", desc: "Link the agent to active phone lines. Outbound dialing and inbound answering are immediately live." }
          ].map((item, idx) => (
            <div key={idx} className="relative pl-8 md:pl-12">
              {/* Timeline marker */}
              <div className="absolute -left-[9px] top-1.5 w-4.5 h-4.5 rounded-full bg-violet-600 border border-slate-950 flex items-center justify-center text-[8px] font-bold text-white">
                {idx + 1}
              </div>
              
              <div className="glass-panel p-5 rounded-2xl max-w-2xl bg-slate-900/30">
                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">{item.step}</span>
                <h3 className="text-base font-bold text-white mt-1 mb-2">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5: FEATURES */}
      <section id="features" className="px-4 py-16 max-w-5xl mx-auto w-full z-10 border-t border-slate-900/60">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">Platform Features</h2>
          <p className="text-xs text-slate-400 mt-2">Enterprise capabilities built to manage scalable customer interactions.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            "AI Voice Employees", "Multi-Language Support", "Lead Qualification", 
            "Appointment Booking", "CRM Integration", "Call Recording", 
            "Conversation Summaries", "Knowledge Base Training", "FAQ Brain", 
            "Analytics Dashboard", "Outbound Calling", "Inbound Calling", 
            "WhatsApp Integration", "Website Voice Widget"
          ].map((feat, idx) => (
            <div key={idx} className="glass-panel p-4 rounded-xl flex items-center gap-3 bg-slate-900/20 border-slate-800/40">
              <Zap className="h-4 w-4 text-violet-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-200">{feat}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 6: BENEFITS */}
      <section className="px-4 py-16 max-w-5xl mx-auto w-full z-10 border-t border-slate-900/60">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-white mb-6">Built to Grow Sales & Automate Support</h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-8">
              VoiceOS AI removes wait times, guarantees 24/7 client response, and eliminates the need for large manual calling centers.
            </p>
            <div className="space-y-4">
              {[
                { title: "Reduce Missed Calls", desc: "Every call is answered on the first ring, handling spikes in volume effortlessly." },
                { title: "Save Staff Costs", desc: "Automate lead registration and booking, routing only qualified escalations to staff." },
                { title: "Automatic Follow-Ups", desc: "Trigger SMS, WhatsApp, or callbacks instantly based on conversation outcomes." }
              ].map((b, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{b.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-normal">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-slate-900/40 to-slate-950/60 space-y-4 border-slate-800/80">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
              <CheckCircle className="h-4.5 w-4.5 text-violet-400" />
              Core Benefits Checklist
            </h3>
            {[
              "Reduce Missed Calls",
              "Generate More Leads",
              "Save Staff Costs",
              "24/7 Availability",
              "Instant Responses",
              "Automatic Follow-Ups",
              "Better Customer Experience"
            ].map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs font-semibold text-slate-300">
                <CheckCircle className="h-4.5 w-4.5 text-violet-400 shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7: CUSTOMER JOURNEY */}
      <section className="px-4 py-16 max-w-5xl mx-auto w-full z-10 border-t border-slate-900/60">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">The Customer Journey</h2>
          <p className="text-xs text-slate-400 mt-2">The path from landing on our website to running custom speech-AI employees live.</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 max-w-4xl mx-auto">
          {[
            "Business Owner Visits Website",
            "Tries Demo",
            "Submits Requirements",
            "Team Consultation",
            "AI Employee Setup",
            "Knowledge Base Training",
            "Phone Number Integration",
            "Go Live"
          ].map((step, idx) => (
            <React.Fragment key={idx}>
              <div className="glass-panel px-4 py-3 rounded-xl bg-slate-900/40 text-xs font-semibold text-slate-200 border-slate-800/80">
                {step}
              </div>
              {idx < 7 && (
                <ChevronRight className="h-4 w-4 text-slate-600 hidden md:block shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* SECTION 8: LEAD CAPTURE FORM */}
      <section id="book" className="px-4 py-16 max-w-3xl mx-auto w-full z-10 border-t border-slate-900/60">
        <div className="glass-panel p-8 rounded-3xl bg-slate-950/60 backdrop-blur-xl border border-slate-800/80 shadow-2xl relative overflow-hidden">
          
          {showThankYou ? (
            /* SECTION 9: THANK YOU STATE */
            <div className="text-center py-12 space-y-6 animate-fade-in" id="thank-you-view">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/25 rounded-full flex items-center justify-center text-emerald-400 mx-auto mb-4 animate-pulse">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">Thank You For Your Interest</h2>
              <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
                Our AI Consultant will contact you within 24 hours to understand your requirements and create your AI Employee.
              </p>
              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => setShowThankYou(false)}
                  className="px-6 py-2.5 text-xs font-bold bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 rounded-xl transition-all"
                >
                  Submit Another Request
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold font-display text-white">Book Your AI Employee Consultation</h2>
                <p className="text-xs text-slate-400 mt-1">Submit your requirements below and our team will build your custom voice configuration.</p>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-6">
                {/* Business Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Business Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-violet-500 transition-all"
                      placeholder="e.g. SmartMop India"
                      value={bizName}
                      onChange={(e) => setBizName(e.target.value)}
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Owner Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-violet-500 transition-all"
                      placeholder="e.g. Ramesh Kumar"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Phone Number</label>
                    <input 
                      type="tel" 
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-violet-500 transition-all"
                      placeholder="e.g. +91 98860 12345"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Email Address</label>
                    <input 
                      type="email" 
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-violet-500 transition-all"
                      placeholder="e.g. ramesh@smartmop.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                {/* Business Type dropdown */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Business Type</label>
                  <select 
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-violet-500 transition-all"
                    value={bizType}
                    onChange={(e) => setBizType(e.target.value)}
                  >
                    <option value="Real Estate">Real Estate</option>
                    <option value="Hospital">Hospital</option>
                    <option value="Education">Education</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="E-Commerce">E-Commerce</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Finance">Finance</option>
                    <option value="Travel">Travel</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* AI Requirements checkboxes */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-3">AI Requirements</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { label: "Preferred Language (Kannada/Telugu/etc.)", checked: reqInbound, setChecked: setReqInbound },
                      { label: "Male/Female Voice", checked: reqOutbound, setChecked: setReqOutbound },
                      { label: "Inbound Calls Support", checked: reqWhatsApp, setChecked: setReqWhatsApp },
                      { label: "Outbound Calls Dialer", checked: reqChatbot, setChecked: setReqChatbot },
                      { label: "WhatsApp Support Integration", checked: false, setChecked: () => {} },
                      { label: "Website Voice Chatbot Widget", checked: false, setChecked: () => {} }
                    ].map((req, rIdx) => (
                      <label key={rIdx} className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-800 bg-slate-900 accent-violet-600"
                          checked={req.checked} 
                          onChange={(e) => req.setChecked(e.target.checked)} 
                        />
                        <span>{req.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Monthly Call Volume radio buttons */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Monthly Call Volume</label>
                  <div className="grid grid-cols-4 gap-3">
                    {["100+", "500+", "1000+", "5000+"].map((vol) => (
                      <label 
                        key={vol} 
                        className={`flex items-center justify-center p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                          callVolume === vol 
                            ? "bg-violet-600/10 border-violet-500/40 text-violet-400 shadow-sm" 
                            : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="volume" 
                          className="sr-only" 
                          value={vol} 
                          checked={callVolume === vol}
                          onChange={() => setCallVolume(vol)}
                        />
                        <span>{vol}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Additional Notes / Custom Instructions</label>
                  <textarea 
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-violet-500 min-h-[80px] transition-all"
                    placeholder="Describe any custom integrations or system features you require..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-900 disabled:text-slate-600 text-white font-bold rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-violet-600/15"
                >
                  {isSubmitting ? "Submitting requirements..." : "Book My AI Employee"}
                </button>
              </form>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 text-center py-8 text-xs text-slate-500 mt-auto px-4">
        <p>© 2026 VoiceOS AI Systems Inc. All rights reserved.</p>
        <p className="text-[10px] text-slate-600 mt-1">Built to help global businesses automate phone operations using speech AI.</p>
      </footer>

    </main>
  );
}

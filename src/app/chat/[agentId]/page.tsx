"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Send, Mic, MicOff, Volume2, VolumeX, Sparkles, 
  HelpCircle, ArrowRight, Activity, Phone, PhoneOff, User, Clock, 
  ClipboardList, CheckCircle2, AlertCircle, RefreshCw
} from "lucide-react";
import { dbClient } from "@/lib/dbClient";
import { Agent, Call, Message } from "@/lib/db";

export default function ChatPlayground() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.agentId as string;

  // Simulator Call States
  const [callState, setCallState] = useState<"ringing" | "active" | "declined" | "ended">("ringing");
  const [callDuration, setCallDuration] = useState(0);
  const [lastResponseData, setLastResponseData] = useState<{
    summary?: string;
    outcome?: string;
    sentiment?: string;
    escalated?: boolean;
  }>({});

  // Core Agent States
  const [agent, setAgent] = useState<Agent | null>(null);
  const [conversation, setConversation] = useState<Call | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  
  // Voice Recording parameters
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [pulseLevel, setPulseLevel] = useState(0);

  // Web Audio Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const pulseIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Refs for async loops to prevent closure stale states
  const callStateRef = useRef<"ringing" | "active" | "declined" | "ended">("ringing");
  const isMutedRef = useRef(false);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Call duration counter
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callState === "active") {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [callState]);

  // Ringtone synthesizer loop (Indian standard dual tone: 440Hz + 480Hz)
  useEffect(() => {
    if (callState !== "ringing") return;

    let audioCtx: AudioContext | null = null;
    let ringInterval: NodeJS.Timeout | null = null;

    const startRingtone = () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtx = new AudioContextClass();
        
        const playBeep = () => {
          if (!audioCtx || audioCtx.state === "closed" || callStateRef.current !== "ringing") return;
          
          const osc1 = audioCtx.createOscillator();
          const osc2 = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          
          osc1.type = "sine";
          osc2.type = "sine";
          
          osc1.frequency.setValueAtTime(440, audioCtx.currentTime);
          osc2.frequency.setValueAtTime(480, audioCtx.currentTime);
          
          gain.gain.setValueAtTime(0, audioCtx.currentTime);
          gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.05);
          gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.8);
          gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.0);
          
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(audioCtx.destination);
          
          osc1.start();
          osc2.start();
          
          osc1.stop(audioCtx.currentTime + 1.1);
          osc2.stop(audioCtx.currentTime + 1.1);
        };

        playBeep();
        ringInterval = setInterval(playBeep, 2500);

      } catch (err) {
        console.warn("Ringtone context blocked:", err);
      }
    };

    const triggerAudio = () => {
      if (!audioCtx && callStateRef.current === "ringing") {
        startRingtone();
      }
    };

    window.addEventListener("click", triggerAudio);
    startRingtone();

    return () => {
      window.removeEventListener("click", triggerAudio);
      if (ringInterval) clearInterval(ringInterval);
      if (audioCtx && audioCtx.state !== "closed") {
        audioCtx.close().catch(console.error);
      }
    };
  }, [callState]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load agent details
  useEffect(() => {
    if (!agentId) return;
    
    const initAgent = async () => {
      setIsPageLoading(true);
      try {
        const activeAgent = await dbClient.getAgent(agentId);
        if (!activeAgent) {
          router.push("/dashboard");
          return;
        }
        setAgent(activeAgent);
      } catch (err) {
        console.error("Error setting up agent playground:", err);
      } finally {
        setIsPageLoading(false);
      }
    };

    initAgent();
  }, [agentId, router]);

  const handleAnswerCall = async () => {
    if (!agent) return;
    
    setCallState("active");
    setMessages([]);
    setLastResponseData({});
    
    try {
      const conv = await dbClient.createConversation(
        agent.business_id,
        agent.id,
        `Inbound Sim (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
      );
      setConversation(conv);

      const greetText = agent.greeting_message || (agent.language === "Kannada" 
        ? "ನಮಸ್ಕಾರ! ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?" 
        : "Hello! How can I assist you today?");

      const greetMsg = await dbClient.createMessage(conv.id, "assistant", greetText);
      setMessages([greetMsg]);
      
      speakText(greetText, agent.language, () => {
        if (callStateRef.current === "active") {
          startRecording();
        }
      });

    } catch (err) {
      console.error("Error initializing call conversation:", err);
      setCallState("ringing");
    }
  };

  const handleDeclineCall = () => {
    setCallState("declined");
  };

  const handleHangUp = () => {
    stopRecording();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setCallState("ended");
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
  };

  // Browser-Native Text-to-Speech synthesis with Callback Support
  const speakText = (text: string, lang: string, onEndCallback?: () => void) => {
    if (isMutedRef.current || typeof window === "undefined" || !window.speechSynthesis) {
      if (onEndCallback) {
        setTimeout(onEndCallback, 1500); // Simulate talking duration
      }
      return;
    }

    try {
      window.speechSynthesis.resume();
      window.speechSynthesis.cancel();
    } catch (e) {}

    const utterance = new SpeechSynthesisUtterance(text);
    
    const langMap: Record<string, string> = {
      "Kannada": "kn-IN",
      "Telugu": "te-IN",
      "Hindi": "hi-IN",
      "Tamil": "ta-IN",
      "Malayalam": "ml-IN",
      "English": "en-US"
    };

    utterance.lang = langMap[lang] || "kn-IN";

    // Select suitable voice
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(utterance.lang));
    if (voice) {
      utterance.voice = voice;
    }

    if (onEndCallback) {
      let timeoutId: NodeJS.Timeout | null = null;
      let hasExecuted = false;

      const triggerCallbackOnce = () => {
        if (hasExecuted) return;
        hasExecuted = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (callStateRef.current === "active") {
          onEndCallback();
        }
      };

      utterance.onend = triggerCallbackOnce;
      utterance.onerror = triggerCallbackOnce;
      
      // Fail-safe trigger: even if browser TTS hangs or is blocked, execute callback in max 6 seconds
      const wordCount = text.split(/\s+/).length;
      const estimatedMs = Math.max(1500, Math.min(6000, wordCount * 250));
      timeoutId = setTimeout(triggerCallbackOnce, estimatedMs + 500);
    }

    try {
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis trigger failed:", err);
    }
  };

  // Submit chat logic
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || !conversation || !agent || isLoading) return;

    setIsLoading(true);
    setInputText("");

    try {
      // 1. Log customer message
      const userMsg = await dbClient.createMessage(conversation.id, "user", textToSend);
      setMessages(prev => [...prev, userMsg]);

      // 2. Call chat api with RAG retrieval
      const chatResponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          agentId: agent.id,
          conversationId: conversation.id
        })
      });

      if (!chatResponse.ok) {
        throw new Error("Chat completion failed");
      }

      const chatData = await chatResponse.json();
      const replyText = chatData.reply;

      // Update response outcomes
      setLastResponseData({
        summary: chatData.summary,
        outcome: chatData.outcome,
        sentiment: chatData.sentiment,
        escalated: chatData.escalated
      });

      // 3. Log agent message response
      const aiMsg = await dbClient.createMessage(conversation.id, "assistant", replyText);
      setMessages(prev => [...prev, aiMsg]);

      // 4. Update Conversation Duration & Status details
      await dbClient.updateConversation(conversation.id, {
        duration_seconds: callDuration + 15,
        status: chatData.escalated ? "escalated" : "completed",
        summary: chatData.summary || "Customer enquired and call logged.",
        outcome: chatData.outcome || "Support ticket created"
      });

      // If call is escalated, hang up the call automatically after speaking!
      if (chatData.escalated) {
        speakText(replyText, agent.language, () => {
          setCallState("ended");
        });
      } else {
        // 5. Speak response text in Kannada and auto-start recording
        speakText(replyText, agent.language, () => {
          if (callStateRef.current === "active") {
            startRecording();
          }
        });
      }

    } catch (err) {
      console.error(err);
      const errBubble: Message = {
        id: `err-${Date.now()}`,
        conversation_id: conversation.id,
        role: "assistant",
        content: "ಕ್ಷಮಿಸಿ, ಪ್ರತಿಕ್ರಿಯೆ ಪಡೆಯಲು ದೋಷ ಸಂಭವಿಸಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.",
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errBubble]);
      setIsLoading(false);
      
      speakText("ಕ್ಷಮಿಸಿ, ದೋಷ ಸಂಭವಿಸಿದೆ.", agent.language, () => {
        if (callStateRef.current === "active") {
          startRecording();
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  // Web Audio MediaRecorder Mic functions
  const startRecording = async () => {
    if (callStateRef.current !== "active") return;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      return;
    }
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (callStateRef.current !== "active") return;
        
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", audioBlob, "user_voice.webm");

        setIsLoading(true);
        try {
          const transcribeRes = await fetch("/api/voice/transcribe", {
            method: "POST",
            body: formData
          });

          if (!transcribeRes.ok) throw new Error("Transcription server failed");

          const data = await transcribeRes.json();
          if (data.text && data.text.trim()) {
            handleSendMessage(data.text);
          } else {
            // Nothing transcribed: stop loading and restart recording to wait for user
            setIsLoading(false);
            if (callStateRef.current === "active") {
              startRecording();
            }
          }
        } catch (err) {
          console.error("Transcription failure:", err);
          setIsLoading(false);
          if (callStateRef.current === "active") {
            startRecording();
          }
        }
      };

      mediaRecorder.start();
      setIsListening(true);

      // Animate waveform indicator
      if (pulseIntervalRef.current) clearInterval(pulseIntervalRef.current);
      pulseIntervalRef.current = setInterval(() => {
        setPulseLevel(Math.floor(Math.random() * 8) + 2);
      }, 100);

    } catch (err) {
      console.warn("Microphone access denied / not available:", err);
      // Degrade gracefully - let the user use text input fallback
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (pulseIntervalRef.current) {
      clearInterval(pulseIntervalRef.current);
    }
    setIsListening(false);
    setPulseLevel(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pulseIntervalRef.current) clearInterval(pulseIntervalRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  if (isPageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center animate-pulse">
          <div className="pulsing-indicator active h-8 w-8 mb-4 bg-violet-500" />
          <h2 className="text-sm font-semibold text-slate-400">Loading Agent Voice Core...</h2>
        </div>
      </div>
    );
  }

  // 1. Ringing Overlay Screen
  if (callState === "ringing") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 bg-radial from-slate-900/50 via-slate-950 to-black text-slate-100 font-display">
        <div className="w-full max-w-md p-6 glass-panel rounded-3xl border border-slate-800 text-center relative overflow-hidden flex flex-col items-center justify-between min-h-[500px]">
          {/* Top details */}
          <div className="w-full flex justify-between items-center mb-6">
            <button 
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-800 hover:bg-slate-900 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-all"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Console Dashboard
            </button>
            <span className="bg-violet-500/10 border border-violet-500/20 text-violet-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center">
              <Sparkles className="h-3 w-3 mr-1 text-violet-400" />
              RAG Active
            </span>
          </div>

          {/* Central Pulsing Avatar */}
          <div className="my-auto space-y-6">
            <div className="relative flex justify-center">
              <div className="absolute inset-0 bg-violet-600/20 rounded-full blur-xl scale-75 animate-pulse" />
              <div className="h-28 w-28 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center relative z-10">
                <Phone className="h-12 w-12 text-violet-400 animate-bounce" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">{agent?.name}</h2>
              <p className="text-xs text-violet-400 font-semibold tracking-wider uppercase">{agent?.language} Voice Assistant</p>
              <p className="text-[11px] text-slate-400">Incoming call to business line</p>
            </div>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/60 border border-slate-850 rounded-2xl text-[11px] text-slate-400">
              <Clock className="h-3.5 w-3.5 text-violet-400" />
              Personality: <span className="font-semibold text-slate-300 truncate max-w-[200px] inline-block align-bottom">{agent?.personality || "Helpful customer assistant"}</span>
            </div>
          </div>

          {/* Bottom Accept / Decline Buttons */}
          <div className="w-full mt-8 flex gap-6 justify-center">
            <button 
              id="decline-call"
              onClick={handleDeclineCall}
              className="h-16 w-16 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-900/30 hover:scale-105 cursor-pointer transition-all"
              title="Decline Call"
            >
              <PhoneOff className="h-6 w-6" />
            </button>
            
            <button 
              id="accept-call"
              onClick={handleAnswerCall}
              className="h-16 w-16 bg-green-600 hover:bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-green-900/30 hover:scale-105 cursor-pointer transition-all relative"
              title="Answer Call"
            >
              <span className="absolute inset-0 bg-green-500/25 rounded-full scale-125 animate-ping" />
              <Phone className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Declined / Missed Call Screen
  if (callState === "declined") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 bg-radial from-slate-900/50 via-slate-950 to-black text-slate-100 font-display">
        <div className="w-full max-w-md p-6 glass-panel rounded-3xl border border-slate-800 text-center flex flex-col items-center justify-between min-h-[400px]">
          <div className="w-full flex justify-start">
            <button 
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-800 hover:bg-slate-900 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-all"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Exit to Dashboard
            </button>
          </div>

          <div className="my-auto space-y-4">
            <div className="inline-flex p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full mb-2">
              <PhoneOff className="h-10 w-10" />
            </div>
            <h2 className="text-xl font-bold text-white">Call Declined</h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              You declined the inbound simulated call. You can retry dialing or return to the main dashboard.
            </p>
          </div>

          <div className="w-full mt-6 flex gap-3">
            <button
              onClick={() => setCallState("ringing")}
              className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs rounded-xl cursor-pointer shadow-lg hover:shadow-violet-600/15 flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              Retry Call Simulator
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Finished / Summary Call Screen
  if (callState === "ended") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 bg-radial from-slate-900/50 via-slate-950 to-black text-slate-100 font-display">
        <div className="w-full max-w-xl p-6 glass-panel rounded-3xl border border-slate-800 flex flex-col gap-6">
          
          {/* Header */}
          <div className="flex justify-between items-center border-b border-slate-850 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-md font-bold text-white leading-none mb-1">Simulator Call Completed</h2>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{agent?.name} ({agent?.language})</p>
              </div>
            </div>
            
            <button 
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-800 hover:bg-slate-900 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-all"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Exit to Dashboard
            </button>
          </div>

          {/* Call Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-2xl text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Duration</span>
              <span className="text-sm font-bold text-slate-200">{formatDuration(callDuration)}</span>
            </div>
            <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-2xl text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Outcome</span>
              <span className="text-xs font-bold text-violet-400 truncate block">
                {lastResponseData.outcome || "General Inquiry"}
              </span>
            </div>
            <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-2xl text-center col-span-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Sentiment</span>
              <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full inline-block ${
                lastResponseData.sentiment === "positive" ? "bg-green-500/10 border border-green-500/20 text-green-400" :
                lastResponseData.sentiment === "frustrated" ? "bg-red-500/10 border border-red-500/20 text-red-400" :
                "bg-slate-800 border border-slate-750 text-slate-400"
              }`}>
                {lastResponseData.sentiment || "neutral"}
              </span>
            </div>
          </div>

          {/* CRM Log Outcome Details */}
          <div className="space-y-4">
            
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1.5 font-sans">
                <ClipboardList className="h-4 w-4 text-violet-400 font-sans" />
                AI Call Summary & CRM logs
              </h3>
              <div className="p-4 bg-slate-900/60 border border-slate-850 rounded-2xl text-xs text-slate-300 leading-relaxed font-sans">
                {lastResponseData.summary || "Call completed with default support info query. Customer details recorded in lead pipelines."}
              </div>
            </div>

            {/* If lead was qualified in this call simulator session */}
            {(lastResponseData.outcome === "Lead Qualified" || lastResponseData.outcome === "Appointment Confirmed" || lastResponseData.outcome === "Support Ticket Created") && (
              <div className="p-4 border border-violet-500/10 bg-violet-600/5 rounded-2xl space-y-2">
                <span className="bg-violet-500/20 border border-violet-500/30 text-violet-300 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                  🔥 Pipeline Activity Registered
                </span>
                <p className="text-xs text-slate-300 font-sans">
                  The simulated customer details, requirements, and scheduled events were successfully upserted into the central SaaS CRM database.
                </p>
              </div>
            )}
            
          </div>

          {/* Bottom Actions */}
          <div className="flex gap-3 mt-2 border-t border-slate-850 pt-4">
            <button
              onClick={() => {
                router.push("/dashboard?tab=leads");
              }}
              className="w-1/2 py-2.5 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl cursor-pointer text-center transition-all"
            >
              Check CRM Leads
            </button>
            
            <button
              onClick={() => setCallState("ringing")}
              className="w-1/2 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              Call Back Simulator
            </button>
          </div>

        </div>
      </div>
    );
  }

  // 4. Active Calling Playground Interface
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 bg-radial from-slate-900/50 via-slate-950 to-black text-slate-100 font-sans" id="chat-root">
      
      <div className="w-full max-w-2xl space-y-4">
        
        {/* Navigation Bar */}
        <div className="flex justify-between items-center">
          <button 
            className="flex items-center gap-2 px-4 py-2 border border-slate-800 hover:bg-slate-900 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-all"
            onClick={handleHangUp}
          >
            <ArrowLeft className="h-4 w-4" />
            Hang Up & Exit
          </button>
          
          <div className="flex items-center gap-2">
            <button
              className="p-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl cursor-pointer"
              onClick={() => {
                setIsMuted(!isMuted);
                if (typeof window !== "undefined") window.speechSynthesis.cancel();
              }}
              title={isMuted ? "Unmute sound" : "Mute sound"}
            >
              {isMuted ? <VolumeX className="h-4.5 w-4.5 text-red-500" /> : <Volume2 className="h-4.5 w-4.5" />}
            </button>
            
            <button
              className="flex items-center gap-1.5 px-3 py-2 bg-red-600/10 border border-red-600/30 hover:bg-red-600/20 text-red-400 rounded-xl text-xs font-semibold cursor-pointer transition-all"
              onClick={handleHangUp}
            >
              <PhoneOff className="h-4 w-4" />
              Hang Up
            </button>
          </div>
        </div>

        {/* Live Call Simulator Banner */}
        <div className="glass-panel rounded-2xl p-4 flex justify-between items-center border border-red-500/10">
          <div className="flex items-center gap-3">
            <span className="pulsing-indicator active bg-red-500" />
            <div>
              <h2 className="text-sm font-bold text-white leading-none mb-1">CONNECTED WITH {agent?.name?.toUpperCase()}</h2>
              <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                <Clock className="h-3 w-3 text-red-400 animate-pulse" /> Live Simulator call Duration: {formatDuration(callDuration)}
              </span>
            </div>
          </div>

          <span className="bg-violet-500/10 border border-violet-500/20 text-violet-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center">
            <Activity className="h-3 w-3 mr-1 text-violet-400" />
            {agent?.language} Assistant
          </span>
        </div>

        {/* Chat window frame */}
        <div className="h-[480px] flex flex-col rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-xl overflow-hidden relative">
          
          {/* Header */}
          <div className="px-5 py-3 border-b border-slate-800/60 flex justify-between items-center bg-slate-950/40">
            <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Live Call Simulator Log</span>
            {isListening ? (
              <span className="badge bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
                🎙 Customer Speaking... (Mic Active)
              </span>
            ) : isLoading ? (
              <span className="badge bg-violet-500/10 border border-violet-500/20 text-violet-400 px-2 py-0.5 rounded text-[10px] font-bold">
                ⚙ AI Thinking...
              </span>
            ) : (
              <span className="badge bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded text-[10px] font-bold">
                ✓ Call Active
              </span>
            )}
          </div>

          {/* Messages scroll panel */}
          <div className="flex-grow p-5 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col max-w-[75%] relative group ${
                  msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                }`}
              >
                <div className={`p-3.5 rounded-2xl text-sm leading-normal font-sans ${
                  msg.role === "user" 
                    ? "bg-violet-600 text-white rounded-br-sm" 
                    : "bg-slate-800 border border-slate-700/60 text-slate-100 rounded-bl-sm"
                }`}>
                  {msg.content}

                  {msg.role === "assistant" && (
                    <button
                      className="absolute right-[-32px] top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white cursor-pointer"
                      onClick={() => speakText(msg.content, agent?.language || "Kannada")}
                      title="Read aloud"
                    >
                      <Volume2 className="h-3.5 w-3.5 text-slate-500" />
                    </button>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 mt-1 font-bold px-1 font-sans">
                  {msg.role === "user" ? "Customer (You)" : agent?.name}
                </span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-1.5 bg-slate-850 border border-slate-800 p-3 rounded-2xl w-16 mr-auto">
                <span className="pulsing-indicator active h-2 w-2 bg-violet-400" />
                <span className="pulsing-indicator active h-2 w-2 delay-100 bg-violet-400" />
                <span className="pulsing-indicator active h-2 w-2 delay-200 bg-violet-400" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Web Audio waveforms when mic active */}
          {isListening && (
            <div className="bg-slate-950 p-4 border-t border-slate-850 flex flex-col items-center justify-center gap-3 h-28">
              <div className="flex gap-1.5 items-center h-8">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: "3px",
                      height: `${(i % 2 === 0 ? pulseLevel : pulseLevel / 2) * 3 + 4}px`
                    }}
                    className="bg-red-500 rounded-full transition-all duration-100"
                  />
                ))}
              </div>
              <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider font-sans">
                System is listening. Speak in {agent?.language} now.
              </p>
            </div>
          )}

          {/* Form Actions */}
          {!isListening && (
            <div className="p-4 bg-slate-950/60 border-t border-slate-800/80">
              <form onSubmit={onSubmit} className="flex gap-3">
                <button
                  id="mic-record"
                  type="button"
                  onClick={startRecording}
                  className="p-3 bg-red-500/10 hover:bg-red-500/15 border border-red-500/30 text-red-500 rounded-xl cursor-pointer shadow-lg hover:shadow-red-500/5 transition-all animate-pulse"
                  title="Speak now"
                  disabled={isLoading}
                >
                  <Mic className="h-5 w-5" />
                </button>

                <input
                  id="chat-input"
                  type="text"
                  className="flex-grow bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-xl px-4 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500/20"
                  placeholder={agent?.language === "Kannada" ? "Type in Kannada (e.g. ಬೆಲೆ ಎಷ್ಟು?)..." : "Type query..."}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={isLoading}
                />

                <button
                  id="chat-submit"
                  type="submit"
                  className="p-3 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-900 disabled:text-slate-600 text-white rounded-xl cursor-pointer transition-all"
                  disabled={isLoading || !inputText.trim()}
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          )}

          {isListening && (
            <div className="p-4 bg-slate-950 border-t border-slate-850 flex justify-center">
              <button
                id="mic-stop"
                type="button"
                onClick={stopRecording}
                className="p-3 bg-red-600 hover:bg-red-500 text-white rounded-full cursor-pointer shadow-lg animate-pulse"
                title="Stop recording / Transcribe"
              >
                <MicOff className="h-5 w-5" />
              </button>
            </div>
          )}

        </div>

        {/* Suggestion triggers */}
        <div className="glass-panel rounded-2xl p-5">
          <h4 className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-1.5 font-sans">
            <HelpCircle className="h-4 w-4 text-slate-400" />
            Quick RAG & Lead Qualification Triggers:
          </h4>
          <div className="flex flex-wrap gap-2">
            <button
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 font-sans"
              onClick={() => handleSendMessage("ಬೆಲೆ ಎಷ್ಟು?")}
              disabled={isLoading || isListening}
            >
              ಬೆಲೆ ಎಷ್ಟು? (Price?)
              <ArrowRight className="h-3 w-3 text-slate-500" />
            </button>
            <button
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 font-sans"
              onClick={() => handleSendMessage("ನನ್ನ ಹೆಸರು ರಾಜು, ಬಜೆಟ್ ೫೦೦೦ ರುಪಾಯಿ, ಬೆಂಗಳೂರಿನಲ್ಲಿದ್ದೇನೆ.")}
              disabled={isLoading || isListening}
            >
              Qualify Lead (ರಾಜು, ಬೆಂಗಳೂರು, ೫೦೦೦ ರೂ ಬಜೆಟ್)
              <ArrowRight className="h-3 w-3 text-slate-500" />
            </button>
            <button
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 font-sans"
              onClick={() => handleSendMessage("ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ")}
              disabled={isLoading || isListening}
            >
              Demo Appointment (ಬುಕ್ ಡೆಮೊ)
              <ArrowRight className="h-3 w-3 text-slate-500" />
            </button>
            <button
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 text-red-400 border-red-500/10 font-sans"
              onClick={() => handleSendMessage("ಹಣ ವಾಪಸ್ ನೀಡಿ")}
              disabled={isLoading || isListening}
            >
              Escalate Refund (ಹಣ ವಾಪಸ್ / ದೂರು)
              <ArrowRight className="h-3 w-3 text-red-500" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

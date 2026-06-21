import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

// 1. Interfaces for All 17 Database Tables
export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: "user" | "super_admin";
  created_at: string;
}

export interface Business {
  id: string;
  user_id: string;
  business_name: string;
  description: string;
  category: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  working_hours: string;
  service_locations: string;
  created_at: string;
}

export interface Agent {
  id: string;
  business_id: string;
  name: string;
  personality: string;
  language: string;
  greeting_message: string;
  working_hours: string;
  voice_provider: string; // 'native', 'elevenlabs', 'openai'
  voice_id: string;
  system_prompt: string;
  escalation_rules: string;
  fallback_response: string;
  created_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  description: string;
  price: number;
  discount: number;
  features: string;
  benefits: string;
  warranty: string;
  return_policy: string;
  delivery_info: string;
  created_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description: string;
  pricing: string;
  coverage_area: string;
  duration: string;
  terms: string;
  created_at: string;
}

export interface FAQItem {
  id: string;
  business_id: string;
  question: string;
  answer: string;
  created_at: string;
}

export interface DocumentItem {
  id: string;
  business_id: string;
  name: string;
  file_type: string;
  text_content: string;
  created_at: string;
}

export interface Call {
  id: string;
  business_id: string;
  agent_id: string;
  customer_id: string;
  customer_name: string;
  duration_seconds: number;
  status: "completed" | "active" | "escalated";
  summary: string;
  sentiment: "positive" | "neutral" | "frustrated";
  outcome: string;
  recording_url: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  audio_url?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  business_id: string;
  name: string;
  phone: string;
  city: string;
  budget: number;
  requirements: string;
  callback_time: string;
  lead_score: number; // 0 to 100
  is_lead: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  business_id: string;
  customer_id: string;
  product_id: string;
  status: "pending" | "shipped" | "delivered" | "cancelled";
  tracking_number: string;
  delivery_date: string;
  created_at: string;
}

export interface Refund {
  id: string;
  business_id: string;
  order_id: string;
  status: "pending" | "approved" | "rejected";
  amount: number;
  reason: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  business_id: string;
  customer_id: string;
  agent_id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: "pending" | "confirmed" | "cancelled";
  notes: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  business_id: string;
  customer_id: string;
  subject: string;
  issue_description: string;
  status: "open" | "resolved" | "escalated";
  priority: "low" | "medium" | "high";
  created_at: string;
}

export interface Subscription {
  id: string;
  business_id: string;
  plan: "starter" | "growth" | "pro" | "enterprise";
  status: "active" | "inactive" | "trial";
  billing_cycle_start: string;
  billing_cycle_end: string;
  created_at: string;
}

export interface Payment {
  id: string;
  business_id: string;
  subscription_id: string;
  amount: number;
  status: "success" | "failed";
  razorpay_payment_id: string;
  created_at: string;
}

export interface AnalyticsSummary {
  id: string;
  business_id: string;
  date: string;
  total_calls: number;
  leads_count: number;
  appointments_count: number;
  escalations_count: number;
  satisfaction_score: number; // 0 to 5
  revenue: number;
  created_at: string;
}

// 2. Setup Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const isSupabaseConfigured = supabaseUrl !== "" && 
                             supabaseUrl.startsWith("http") && 
                             (supabaseAnonKey !== "" || supabaseServiceKey !== "");

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey) 
  : null;

// 3. Local JSON Database Path
const MOCK_DB_FILE = path.join(process.cwd(), "src/lib/mock_db.json");

interface MockSchema {
  users: User[];
  businesses: Business[];
  agents: Agent[];
  products: Product[];
  services: Service[];
  knowledge_base: FAQItem[];
  documents: DocumentItem[];
  calls: Call[];
  messages: Message[];
  customers: Customer[];
  orders: Order[];
  refunds: Refund[];
  appointments: Appointment[];
  support_tickets: SupportTicket[];
  subscriptions: Subscription[];
  payments: Payment[];
  analytics: AnalyticsSummary[];
}

const DEFAULT_MOCK_DB: MockSchema = {
  users: [
    {
      id: "demo-user-id",
      email: "owner@smartmop.in",
      password_hash: "mock_password",
      role: "user",
      created_at: new Date().toISOString(),
    },
    {
      id: "admin-user-id",
      email: "admin@swara.ai",
      password_hash: "mock_admin_password",
      role: "super_admin",
      created_at: new Date().toISOString(),
    }
  ],
  businesses: [
    {
      id: "demo-business-id",
      user_id: "demo-user-id",
      business_name: "SmartMop India",
      description: "Next-generation smart mopping appliances and home cleaning robots.",
      category: "Consumer Electronics",
      address: "12, 100 Feet Rd, Indiranagar, Bengaluru, KA 560038",
      phone: "+91 98860 12345",
      email: "support@smartmop.in",
      website: "https://smartmop.in",
      working_hours: "09:00 - 18:00",
      service_locations: "Bengaluru, Mysuru, Hubballi, Mangaluru",
      created_at: new Date().toISOString(),
    }
  ],
  agents: [
    {
      id: "demo-agent-id",
      business_id: "demo-business-id",
      name: "ಕುಮಾರ್ (Kumar)",
      personality: "Helpful, energetic, polite and professional sales representative.",
      language: "Kannada",
      greeting_message: "ನಮಸ್ಕಾರ! ನಾನು ಸ್ಮಾರ್ಟ್ ಮ್ಯಾಪ್ ಇಂಡಿಯಾ ಕಂಪನಿಯಿಂದ ಕುಮಾರ್ ಮಾತನಾಡುತ್ತಿದ್ದೇನೆ. ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
      working_hours: "09:00 - 18:00",
      voice_provider: "native",
      voice_id: "kn-IN-Wavenet-A",
      system_prompt: "You are Kumar, a professional AI customer executive for SmartMop India. Speak polite Kannada. Keep answers extremely short (1-2 sentences) and look up product specifications like Price (₹2999), battery, and warranty. Offer appointment booking if the customer wants a live product demonstration.",
      escalation_rules: "Transfer to supervisor if the customer gets angry, demands a refund, or asks specifically for a manager.",
      fallback_response: "ಕ್ಷಮಿಸಿ, ಈ ವಿವರ ನನ್ನ ಬಳಿ ಇಲ್ಲ. ನನ್ನ ಮ್ಯಾನೇಜರ್‌ನೊಂದಿಗೆ ಮಾತನಾಡಲು ವರ್ಗಾಯಿಸಲೇ?",
      created_at: new Date().toISOString(),
    }
  ],
  products: [
    {
      id: "prod-1",
      business_id: "demo-business-id",
      name: "SmartMop Pro",
      description: "Automatic cleaning robot with dynamic mapping and laser guides.",
      price: 2999,
      discount: 10,
      features: "45 min battery life, auto-docking charger, 3 cleaning speed levels",
      benefits: "Completely hands-free floor cleaning, quiet operation, works on marble and wood",
      warranty: "3 Months warranty on motor and battery",
      return_policy: "7-day replacement guarantee if defect is found",
      delivery_info: "Free delivery within 2 days in Karnataka",
      created_at: new Date().toISOString(),
    },
    {
      id: "prod-2",
      business_id: "demo-business-id",
      name: "SmartMop Ultra Brush",
      description: "Double scrubbing spin attachment for cleaning wet spillages.",
      price: 999,
      discount: 0,
      features: "Spinning microfibers, washable cloth pads, extendable handle",
      benefits: "Easy wet mopping, washable pads save money, cleans deep corners",
      warranty: "No warranty on accessories",
      return_policy: "Non-returnable item",
      delivery_info: "Shipped within 24 hours of order confirmation",
      created_at: new Date().toISOString(),
    }
  ],
  services: [
    {
      id: "serv-1",
      business_id: "demo-business-id",
      name: "Mop Deep Repair Service",
      description: "Full service overhaul of the robot including battery replacement and motor cleaning.",
      pricing: "₹1500 per visit",
      coverage_area: "Bengaluru City limits only",
      duration: "1 to 2 hours",
      terms: "Parts replacement cost will be charged separately if out of warranty",
      created_at: new Date().toISOString(),
    }
  ],
  knowledge_base: [
    {
      id: "faq-1",
      business_id: "demo-business-id",
      question: "ಬೆಲೆ ಎಷ್ಟು?",
      answer: "SmartMop Pro ಮಾದರಿಯ ಬೆಲೆ ಕೇವಲ ₹2999 ಆಗಿದೆ. ಇದರಲ್ಲಿ ಶೇಕಡಾ 10 ರಷ್ಟು ರಿಯಾಯಿತಿ ಇದೆ.",
      created_at: new Date().toISOString(),
    },
    {
      id: "faq-2",
      business_id: "demo-business-id",
      question: "ಬ್ಯಾಟರಿ ಚಾರ್ಜ್ ಎಷ್ಟು ಸಮಯ ಬರುತ್ತದೆ?",
      answer: "ಪೂರ್ಣ ಚಾರ್ಜ್‌ನಲ್ಲಿ ಸ್ಮಾರ್ಟ್ ಮಾಪ್ ರೋಬೋಟ್ 45 ನಿಮಿಷಗಳ ಕಾಲ ನಿರಂತರವಾಗಿ ಕ್ಲೀನ್ ಮಾಡುತ್ತದೆ.",
      created_at: new Date().toISOString(),
    },
    {
      id: "faq-3",
      business_id: "demo-business-id",
      question: "ಖರೀದಿಸಲು ಡೆಮೊ ಸಿಗುತ್ತದೆಯೇ?",
      answer: "ಖಂಡಿತ! ನಿಮ್ಮ ಹೆಸರು ಮತ್ತು ದೂರವಾಣಿ ಸಂಖ್ಯೆ ನೀಡಿದರೆ, ಬೆಂಗಳೂರಿನಲ್ಲಿ ನಮ್ಮ ಸೇವಾ ಪ್ರತಿನಿಧಿಯಿಂದ ಉಚಿತ ಡೆಮೊ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಮಾಡಬಹುದು.",
      created_at: new Date().toISOString(),
    }
  ],
  documents: [
    {
      id: "doc-1",
      business_id: "demo-business-id",
      name: "SmartMop Brochure.pdf",
      file_type: "pdf",
      text_content: "SmartMop Pro brochure containing technical parameters: motor power 120W, charger input 220V, tank capacity 350ml, noise level 60dB. Operating temperatures 5-45C.",
      created_at: new Date().toISOString(),
    }
  ],
  calls: [
    {
      id: "call-1",
      business_id: "demo-business-id",
      agent_id: "demo-agent-id",
      customer_id: "cust-1",
      customer_name: "ರವಿ ವರ್ಮಾ (Ravi Verma)",
      duration_seconds: 145,
      status: "completed",
      summary: "Inquired about price and battery. Satisfied and ready to buy Mop Pro.",
      sentiment: "positive",
      outcome: "Lead Qualified / Demo Booked",
      recording_url: "/recordings/call-1.wav",
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: "call-2",
      business_id: "demo-business-id",
      agent_id: "demo-agent-id",
      customer_id: "cust-2",
      customer_name: "ಗೀತಾ ಹೆಗಡೆ (Geetha Hegde)",
      duration_seconds: 90,
      status: "escalated",
      summary: "Refund required for defective item. Escalated to billing supervisor.",
      sentiment: "frustrated",
      outcome: "Support Escalation",
      recording_url: "/recordings/call-2.wav",
      created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    }
  ],
  messages: [
    {
      id: "m-1",
      conversation_id: "call-1",
      role: "user",
      content: "ನಮಸ್ಕಾರ, ಸ್ಮಾರ್ಟ್ ಮಾಪ್ ಪ್ರೊ ಬೆಲೆ ಎಷ್ಟು?",
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: "m-2",
      conversation_id: "call-1",
      role: "assistant",
      content: "ನಮಸ್ಕಾರ! SmartMop Pro ಬೆಲೆ ಕೇವಲ ₹2999 ಆಗಿದೆ. ಕರ್ನಾಟಕದಾದ್ಯಂತ ಉಚಿತ ಹೋಮ್ ಡೆಲಿವರಿ ಸಿಗುತ್ತದೆ.",
      created_at: new Date(Date.now() - 3600000 * 2 + 15000).toISOString(),
    }
  ],
  customers: [
    {
      id: "cust-1",
      business_id: "demo-business-id",
      name: "ರವಿ ವರ್ಮಾ (Ravi Verma)",
      phone: "+91 94480 98765",
      city: "Bengaluru",
      budget: 3000,
      requirements: "Wants a demo of SmartMop Pro at home",
      callback_time: "Evening 5 PM",
      lead_score: 85,
      is_lead: true,
      created_at: new Date().toISOString(),
    },
    {
      id: "cust-2",
      business_id: "demo-business-id",
      name: "ಗೀತಾ ಹೆಗಡೆ (Geetha Hegde)",
      phone: "+91 99800 11223",
      city: "Mysuru",
      budget: 0,
      requirements: "Refund inquiry on order SM-985",
      callback_time: "Immediate callback",
      lead_score: 30,
      is_lead: false,
      created_at: new Date().toISOString(),
    }
  ],
  orders: [
    {
      id: "ord-1",
      business_id: "demo-business-id",
      customer_id: "cust-1",
      product_id: "prod-1",
      status: "shipped",
      tracking_number: "TRK-SM-987541",
      delivery_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    }
  ],
  refunds: [
    {
      id: "ref-1",
      business_id: "demo-business-id",
      order_id: "ord-1",
      status: "pending",
      amount: 2999,
      reason: "Product not powering on upon delivery",
      created_at: new Date().toISOString(),
    }
  ],
  appointments: [
    {
      id: "app-1",
      business_id: "demo-business-id",
      customer_id: "cust-1",
      agent_id: "demo-agent-id",
      date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      time: "15:30",
      status: "confirmed",
      notes: "Ravi Verma requested a live product demonstration at their home location.",
      created_at: new Date().toISOString(),
    }
  ],
  support_tickets: [],
  subscriptions: [],
  payments: [],
  analytics: []
};

// 4. CRUD DB Operations for all 17 Tables querying production Supabase
export const dbService = {
  isMock: () => !isSupabaseConfigured,

  // Helper check to enforce Supabase connection
  _ensureSupabase() {
    if (!supabase) {
      throw new Error("[Supabase Database Failure] Component: Supabase Database Client - Supabase credentials are not configured. NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) are required.");
    }
  },

  // --- Users & Workspace Auth ---
  async getUserByEmail(email: string): Promise<User | null> {
    this._ensureSupabase();
    const { data, error } = await supabase!
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async createUser(email: string, passwordHash: string, role: "user" | "super_admin"): Promise<User> {
    this._ensureSupabase();
    const id = randomUUID();
    const { data, error } = await supabase!
      .from("users")
      .insert({
        id,
        email,
        password_hash: passwordHash,
        role
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getPlatformStats(): Promise<any> {
    this._ensureSupabase();
    const [usersRes, businessesRes, callsRes, leadsRes, subscriptionsRes, paymentsRes] = await Promise.all([
      supabase!.from("users").select("id", { count: "exact", head: true }),
      supabase!.from("businesses").select("id", { count: "exact", head: true }),
      supabase!.from("calls").select("id", { count: "exact", head: true }),
      supabase!.from("customers").select("id", { count: "exact", head: true }).eq("is_lead", true),
      supabase!.from("subscriptions").select("id", { count: "exact", head: true }),
      supabase!.from("payments").select("amount, status").eq("status", "success")
    ]);
    
    if (usersRes.error) throw usersRes.error;
    if (businessesRes.error) throw businessesRes.error;
    if (callsRes.error) throw callsRes.error;
    if (leadsRes.error) throw leadsRes.error;
    if (subscriptionsRes.error) throw subscriptionsRes.error;
    if (paymentsRes.error) throw paymentsRes.error;

    const totalRevenue = (paymentsRes.data || []).reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);
    return {
      totalUsers: usersRes.count || 0,
      totalBusinesses: businessesRes.count || 0,
      totalCalls: callsRes.count || 0,
      totalLeads: leadsRes.count || 0,
      totalSubscriptions: subscriptionsRes.count || 0,
      totalRevenue
    };
  },

  async deleteUser(userId: string): Promise<void> {
    this._ensureSupabase();
    const { error } = await supabase!.from("users").delete().eq("id", userId);
    if (error) throw error;
  },

  // --- Businesses ---
  async getBusiness(userId: string): Promise<Business | null> {
    const DEFAULT_SMARTMOP_BUSINESS: Business = {
      id: "demo-business-id",
      user_id: "demo-user-id",
      business_name: "SmartMop India",
      description: "Next-generation smart mopping appliances and home cleaning robots.",
      category: "Consumer Electronics",
      address: "12, 100 Feet Rd, Indiranagar, Bengaluru, KA 560038",
      phone: "+91 98860 12345",
      email: "support@smartmop.in",
      website: "https://smartmop.in",
      working_hours: "09:00 - 18:00",
      service_locations: "Bengaluru, Mysuru, Hubballi, Mangaluru",
      created_at: new Date().toISOString()
    };

    try {
      this._ensureSupabase();
      const { data, error } = await supabase!
        .from("businesses")
        .select("*")
        .or(`user_id.eq.${userId},id.eq.${userId}`)
        .maybeSingle();
      if (error) throw error;
      return data || DEFAULT_SMARTMOP_BUSINESS;
    } catch (err) {
      console.warn("getBusiness query failed or threw, falling back to default SmartMop business:", err);
      return DEFAULT_SMARTMOP_BUSINESS;
    }
  },

  async createBusiness(businessName: string, category: string, phone: string, userId: string): Promise<Business> {
    this._ensureSupabase();
    const id = randomUUID();
    const { data, error } = await supabase!
      .from("businesses")
      .insert({
        id,
        user_id: userId,
        business_name: businessName,
        description: `Customer service line for ${businessName}.`,
        category,
        address: "India",
        phone,
        email: `contact@${businessName.toLowerCase().replace(/\s+/g, "")}.com`,
        website: `https://${businessName.toLowerCase().replace(/\s+/g, "")}.com`,
        working_hours: "09:00 - 18:00",
        service_locations: "All India"
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateBusiness(id: string, updates: Partial<Business>): Promise<Business> {
    this._ensureSupabase();
    const { data, error } = await supabase!
      .from("businesses")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // --- Agents ---
  async getAgents(businessId: string): Promise<Agent[]> {
    this._ensureSupabase();
    const { data, error } = await supabase!
      .from("agents")
      .select("*")
      .eq("business_id", businessId);
    if (error) throw error;
    return data || [];
  },

  async getAgent(agentId: string): Promise<Agent | null> {
    this._ensureSupabase();
    const { data, error } = await supabase!
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async createAgent(businessId: string, name: string, language: string, voiceProvider: string, voiceId: string, systemPrompt: string): Promise<Agent> {
    this._ensureSupabase();
    const id = randomUUID();
    const { data, error } = await supabase!
      .from("agents")
      .insert({
        id,
        business_id: businessId,
        name,
        personality: "Polite customer assistant.",
        language,
        greeting_message: language === "Kannada" ? `ನಮಸ್ಕಾರ! ನಾನು ${name}. ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?` : `Hello! I am ${name}. How can I assist you?`,
        working_hours: "09:00 - 18:00",
        voice_provider: voiceProvider,
        voice_id: voiceId,
        system_prompt: systemPrompt,
        escalation_rules: "Transfer to manager on anger or refund request.",
        fallback_response: "Let me check with a live agent."
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateAgent(agentId: string, updates: Partial<Agent>): Promise<Agent> {
    this._ensureSupabase();
    const { data, error } = await supabase!
      .from("agents")
      .update(updates)
      .eq("id", agentId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteAgent(agentId: string): Promise<void> {
    this._ensureSupabase();
    const { error } = await supabase!.from("agents").delete().eq("id", agentId);
    if (error) throw error;
  },

  // --- Products ---
  async getProducts(businessId: string): Promise<Product[]> {
    this._ensureSupabase();
    const { data, error } = await supabase!
      .from("products")
      .select("*")
      .eq("business_id", businessId);
    if (error) throw error;
    return data || [];
  },

  async addProduct(businessId: string, product: Omit<Product, "id" | "business_id" | "created_at">): Promise<Product> {
    this._ensureSupabase();
    const id = randomUUID();
    const { data, error } = await supabase!
      .from("products")
      .insert({
        id,
        business_id: businessId,
        ...product
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteProduct(productId: string): Promise<void> {
    this._ensureSupabase();
    const { error } = await supabase!.from("products").delete().eq("id", productId);
    if (error) throw error;
  },

  // --- Services ---
  async getServices(businessId: string): Promise<Service[]> {
    this._ensureSupabase();
    const { data, error } = await supabase!
      .from("services")
      .select("*")
      .eq("business_id", businessId);
    if (error) throw error;
    return data || [];
  },

  async addService(businessId: string, service: Omit<Service, "id" | "business_id" | "created_at">): Promise<Service> {
    this._ensureSupabase();
    const id = randomUUID();
    const { data, error } = await supabase!
      .from("services")
      .insert({
        id,
        business_id: businessId,
        ...service
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteService(serviceId: string): Promise<void> {
    this._ensureSupabase();
    const { error } = await supabase!.from("services").delete().eq("id", serviceId);
    if (error) throw error;
  },

  // --- Knowledge Base & Documents ---
  async getKnowledgeBase(businessId: string): Promise<FAQItem[]> {
    this._ensureSupabase();
    const { data, error } = await supabase!
      .from("knowledge_base")
      .select("*")
      .eq("business_id", businessId);
    if (error) throw error;
    return data || [];
  },

  async addFAQ(businessId: string, question: string, answer: string): Promise<FAQItem> {
    this._ensureSupabase();
    const id = randomUUID();
    const { data, error } = await supabase!
      .from("knowledge_base")
      .insert({
        id,
        business_id: businessId,
        question,
        answer
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteFAQ(faqId: string): Promise<void> {
    this._ensureSupabase();
    const { error } = await supabase!.from("knowledge_base").delete().eq("id", faqId);
    if (error) throw error;
  },

  async getDocuments(businessId: string): Promise<DocumentItem[]> {
    this._ensureSupabase();
    const { data, error } = await supabase!
      .from("documents")
      .select("*")
      .eq("business_id", businessId);
    if (error) throw error;
    return data || [];
  },

  async addDocument(businessId: string, name: string, fileType: string, textContent: string): Promise<DocumentItem> {
    this._ensureSupabase();
    const id = randomUUID();
    const { data, error } = await supabase!
      .from("documents")
      .insert({
        id,
        business_id: businessId,
        name,
        file_type: fileType,
        text_content: textContent
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteDocument(docId: string): Promise<void> {
    this._ensureSupabase();
    const { error } = await supabase!.from("documents").delete().eq("id", docId);
    if (error) throw error;
  },

  // --- Call Logs & Transcripts ---
  async getConversations(businessId: string): Promise<Call[]> {
    this._ensureSupabase();
    const { data, error } = await supabase!
      .from("calls")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createConversation(businessId: string, agentId: string, customerName: string): Promise<Call> {
    this._ensureSupabase();
    const callId = randomUUID();
    const { data, error } = await supabase!
      .from("calls")
      .insert({
        id: callId,
        business_id: businessId,
        agent_id: agentId,
        customer_id: "cust-temp",
        customer_name: customerName,
        duration_seconds: 0,
        status: "active",
        summary: "",
        sentiment: "neutral",
        outcome: "Call Active",
        recording_url: ""
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateConversation(conversationId: string, updates: Partial<Call>): Promise<Call> {
    this._ensureSupabase();
    const { data, error } = await supabase!
      .from("calls")
      .update(updates)
      .eq("id", conversationId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // --- Messages ---
  async getMessages(conversationId: string): Promise<Message[]> {
    this._ensureSupabase();
    const { data, error } = await supabase!
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  },
  async createMessage(conversationId: string, role: "user" | "assistant" | "system", content: string, audioUrl?: string): Promise<Message> {
    this._ensureSupabase();
    
    // First, try inserting without generating an ID (relying on DB default)
    try {
      const { data, error } = await supabase!
        .from("messages")
        .insert({
          conversation_id: conversationId,
          role,
          content,
          audio_url: audioUrl
        })
        .select()
        .single();
      
      if (!error && data) {
        return data;
      }
      
      if (error && !error.message.includes('column "id"') && !error.message.includes('violates not-null constraint')) {
        throw error;
      }
    } catch (err: any) {
      if (!err.message?.includes('column "id"') && !err.message?.includes('violates not-null constraint')) {
        throw err;
      }
    }

    // Fallback to client-side UUID generation
    const messageId = randomUUID();
    const { data, error } = await supabase!
      .from("messages")
      .insert({
        id: messageId,
        conversation_id: conversationId,
        role,
        content,
        audio_url: audioUrl
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  // --- Customers & Leads CRM ---
  async getCustomers(businessId: string): Promise<Customer[]> {
    this._ensureSupabase();
    const { data, error } = await supabase!
      .from("customers")
      .select("*")
      .eq("business_id", businessId);
    if (error) throw error;
    return data || [];
  },

  async getLeads(businessId: string): Promise<Customer[]> {
    this._ensureSupabase();
    const { data, error } = await supabase!
      .from("customers")
      .select("*")
      .eq("business_id", businessId)
      .eq("is_lead", true);
    if (error) throw error;
    return data || [];
  },

  async upsertCustomer(businessId: string, phone: string, updates: Partial<Omit<Customer, "id" | "business_id" | "phone" | "created_at">>): Promise<Customer> {
    this._ensureSupabase();
    const { data: existing, error: getErr } = await supabase!
      .from("customers")
      .select("*")
      .eq("business_id", businessId)
      .eq("phone", phone)
      .maybeSingle();
    if (getErr) throw getErr;

    if (existing) {
      const { data, error } = await supabase!
        .from("customers")
        .update(updates)
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const id = randomUUID();
      const { data, error } = await supabase!
        .from("customers")
        .insert({
          id,
          business_id: businessId,
          phone,
          name: updates.name || "Unknown Customer",
          city: updates.city || "Unknown City",
          budget: updates.budget || 0,
          requirements: updates.requirements || "",
          callback_time: updates.callback_time || "",
          lead_score: updates.lead_score || 50,
          is_lead: updates.is_lead !== undefined ? updates.is_lead : true
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  // --- Orders & Refunds ---
  async getOrders(businessId: string): Promise<Order[]> {
    this._ensureSupabase();
    const { data, error } = await supabase!
      .from("orders")
      .select("*")
      .eq("business_id", businessId);
    if (error) throw error;
    return data || [];
  },

  async getOrder(businessId: string, orderId: string): Promise<Order | null> {
    this._ensureSupabase();
    const { data, error } = await supabase!
      .from("orders")
      .select("*")
      .eq("business_id", businessId)
      .eq("id", orderId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async createOrder(businessId: string, customerId: string, productId: string, status: Order["status"]): Promise<Order> {
    this._ensureSupabase();
    const id = randomUUID();
    const { data, error } = await supabase!
      .from("orders")
      .insert({
        id,
        business_id: businessId,
        customer_id: customerId,
        product_id: productId,
        status,
        tracking_number: `TRK-SM-${Math.floor(100000 + Math.random() * 900000)}`,
        delivery_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getRefunds(businessId: string): Promise<Refund[]> {
    this._ensureSupabase();
    const { data, error } = await supabase!
      .from("refunds")
      .select("*")
      .eq("business_id", businessId);
    if (error) throw error;
    return data || [];
  },

  async createRefund(businessId: string, orderId: string, amount: number, reason: string): Promise<Refund> {
    this._ensureSupabase();
    const id = randomUUID();
    const { data, error } = await supabase!
      .from("refunds")
      .insert({
        id,
        business_id: businessId,
        order_id: orderId,
        status: "pending",
        amount,
        reason
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateRefund(refundId: string, status: Refund["status"]): Promise<Refund> {
    this._ensureSupabase();
    const { data, error } = await supabase!
      .from("refunds")
      .update({ status })
      .eq("id", refundId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // --- Appointments ---
  async getAppointments(businessId: string): Promise<Appointment[]> {
    this._ensureSupabase();
    const { data, error } = await supabase!
      .from("appointments")
      .select("*")
      .eq("business_id", businessId);
    if (error) throw error;
    return data || [];
  },

  async createAppointment(businessId: string, customerId: string, agentId: string, date: string, time: string, notes: string): Promise<Appointment> {
    this._ensureSupabase();
    const id = randomUUID();
    const { data, error } = await supabase!
      .from("appointments")
      .insert({
        id,
        business_id: businessId,
        customer_id: customerId,
        agent_id: agentId,
        date,
        time,
        status: "confirmed",
        notes
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // --- Support Tickets ---
  async getSupportTickets(businessId: string): Promise<SupportTicket[]> {
    this._ensureSupabase();
    const { data, error } = await supabase!
      .from("support_tickets")
      .select("*")
      .eq("business_id", businessId);
    if (error) throw error;
    return data || [];
  },

  async createSupportTicket(businessId: string, customerId: string, subject: string, desc: string, priority: SupportTicket["priority"]): Promise<SupportTicket> {
    this._ensureSupabase();
    const id = randomUUID();
    const { data, error } = await supabase!
      .from("support_tickets")
      .insert({
        id,
        business_id: businessId,
        customer_id: customerId,
        subject,
        issue_description: desc,
        status: "open",
        priority
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateSupportTicket(ticketId: string, status: SupportTicket["status"]): Promise<SupportTicket> {
    this._ensureSupabase();
    const { data, error } = await supabase!
      .from("support_tickets")
      .update({ status })
      .eq("id", ticketId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // --- Subscriptions & Razorpay Simulated Payments ---
  async getSubscription(businessId: string): Promise<Subscription | null> {
    this._ensureSupabase();
    const { data, error } = await supabase!
      .from("subscriptions")
      .select("*")
      .eq("business_id", businessId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getPayments(businessId: string): Promise<Payment[]> {
    this._ensureSupabase();
    const { data, error } = await supabase!
      .from("payments")
      .select("*")
      .eq("business_id", businessId);
    if (error) throw error;
    return data || [];
  },

  async createSubscriptionPayment(businessId: string, plan: Subscription["plan"], amount: number, razorpayPaymentId: string): Promise<{ subscription: Subscription; payment: Payment }> {
    this._ensureSupabase();
    
    // Create/Update subscription
    const existing = await this.getSubscription(businessId);
    let sub;
    if (existing) {
      const { data, error } = await supabase!
        .from("subscriptions")
        .update({
          plan,
          status: "active",
          billing_cycle_start: new Date().toISOString(),
          billing_cycle_end: new Date(Date.now() + 86400000 * 30).toISOString()
        })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;
      sub = data;
    } else {
      const subId = randomUUID();
      const { data, error } = await supabase!
        .from("subscriptions")
        .insert({
          id: subId,
          business_id: businessId,
          plan,
          status: "active",
          billing_cycle_start: new Date().toISOString(),
          billing_cycle_end: new Date(Date.now() + 86400000 * 30).toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      sub = data;
    }

    // Record Payment
    const paymentId = randomUUID();
    const { data: paymentData, error: payError } = await supabase!
      .from("payments")
      .insert({
        id: paymentId,
        business_id: businessId,
        subscription_id: sub.id,
        amount,
        status: "success",
        razorpay_payment_id: razorpayPaymentId
      })
      .select()
      .single();
    if (payError) throw payError;
    
    return { subscription: sub, payment: paymentData };
  },

  // --- Admin Analytics & Management ---
  async getAdminBusinessesList(): Promise<any[]> {
    this._ensureSupabase();
    const { data: businesses, error: busError } = await supabase!
      .from("businesses")
      .select("id, business_name, category, phone, created_at");
    if (busError) throw busError;

    const { data: subscriptions, error: subError } = await supabase!
      .from("subscriptions")
      .select("business_id, plan, status");
    if (subError) throw subError;

    return (businesses || []).map(b => {
      const sub = (subscriptions || []).find(s => s.business_id === b.id);
      return {
        id: b.id,
        name: b.business_name,
        category: b.category,
        phone: b.phone,
        plan: sub ? sub.plan : "starter",
        status: sub ? sub.status : "trial",
        created_at: b.created_at
      };
    });
  }
};

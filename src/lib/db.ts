import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

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
const isSupabaseConfigured = supabaseUrl !== "" && supabaseAnonKey !== "";

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
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
  support_tickets: [
    {
      id: "tkt-1",
      business_id: "demo-business-id",
      customer_id: "cust-2",
      subject: "Charger port not working",
      issue_description: "Charging station pins are damaged. The mop does not connect properly.",
      status: "escalated",
      priority: "high",
      created_at: new Date().toISOString(),
    }
  ],
  subscriptions: [
    {
      id: "sub-1",
      business_id: "demo-business-id",
      plan: "pro",
      status: "active",
      billing_cycle_start: new Date().toISOString(),
      billing_cycle_end: new Date(Date.now() + 86400000 * 30).toISOString(),
      created_at: new Date().toISOString(),
    }
  ],
  payments: [
    {
      id: "pay-1",
      business_id: "demo-business-id",
      subscription_id: "sub-1",
      amount: 14999,
      status: "success",
      razorpay_payment_id: "pay_mock_razorpay_12345",
      created_at: new Date().toISOString(),
    }
  ],
  analytics: [
    {
      id: "an-1",
      business_id: "demo-business-id",
      date: new Date().toISOString().split('T')[0],
      total_calls: 15,
      leads_count: 8,
      appointments_count: 3,
      escalations_count: 2,
      satisfaction_score: 4.6,
      revenue: 14999,
      created_at: new Date().toISOString(),
    }
  ]
};

// --- JSON Persistence Helpers ---
function getMockDb(): MockSchema {
  let db: MockSchema;
  if (typeof window !== "undefined") {
    const localData = localStorage.getItem("swara_saas_db");
    if (localData) {
      try {
        db = JSON.parse(localData);
      } catch (e) {
        db = DEFAULT_MOCK_DB;
      }
    } else {
      db = DEFAULT_MOCK_DB;
    }
  } else {
    try {
      if (!fs.existsSync(MOCK_DB_FILE)) {
        const dir = path.dirname(MOCK_DB_FILE);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(MOCK_DB_FILE, JSON.stringify(DEFAULT_MOCK_DB, null, 2), "utf8");
        db = DEFAULT_MOCK_DB;
      } else {
        const data = fs.readFileSync(MOCK_DB_FILE, "utf8");
        db = JSON.parse(data);
      }
    } catch (err) {
      console.error("Error reading mock DB file:", err);
      db = DEFAULT_MOCK_DB;
    }
  }

  // Self-healing / Schema migration: ensure all fields from MockSchema are defined
  const keys = Object.keys(DEFAULT_MOCK_DB) as Array<keyof MockSchema>;
  let updated = false;
  for (const key of keys) {
    if (!db[key] || !Array.isArray(db[key])) {
      db[key] = (DEFAULT_MOCK_DB[key] || []) as any;
      updated = true;
    }
  }
  if (updated) {
    saveMockDb(db);
  }

  return db;
}

function saveMockDb(db: MockSchema) {
  if (typeof window !== "undefined") {
    localStorage.setItem("swara_saas_db", JSON.stringify(db));
    return;
  }
  try {
    fs.writeFileSync(MOCK_DB_FILE, JSON.stringify(db, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing mock DB file:", err);
  }
}

// 4. CRUD DB Operations for all 17 Tables
export const dbService = {
  isMock: () => !isSupabaseConfigured,

  // --- Users & Workspace Auth ---
  async getUserByEmail(email: string): Promise<User | null> {
    const db = getMockDb();
    return db.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async createUser(email: string, passwordHash: string, role: "user" | "super_admin"): Promise<User> {
    const db = getMockDb();
    const newUser: User = {
      id: `usr-${Math.random().toString(36).substr(2, 9)}`,
      email,
      password_hash: passwordHash,
      role,
      created_at: new Date().toISOString()
    };
    db.users.push(newUser);
    saveMockDb(db);
    return newUser;
  },

  async getPlatformStats(): Promise<any> {
    const db = getMockDb();
    return {
      totalUsers: db.users.length,
      totalBusinesses: db.businesses.length,
      totalCalls: db.calls.length,
      totalLeads: db.customers.filter(c => c.is_lead).length,
      totalSubscriptions: db.subscriptions.length,
      totalRevenue: db.payments.reduce((acc, p) => acc + (p.status === "success" ? p.amount : 0), 0)
    };
  },

  async deleteUser(userId: string): Promise<void> {
    const db = getMockDb();
    db.users = db.users.filter(u => u.id !== userId);
    saveMockDb(db);
  },

  // --- Businesses ---
  async getBusiness(userId: string): Promise<Business | null> {
    const db = getMockDb();
    return db.businesses.find(b => b.user_id === userId) || null;
  },

  async createBusiness(businessName: string, category: string, phone: string, userId: string): Promise<Business> {
    const db = getMockDb();
    const newBusiness: Business = {
      id: `bus-${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      business_name: businessName,
      description: `Customer service line for ${businessName}.`,
      category,
      address: "India",
      phone,
      email: `contact@${businessName.toLowerCase().replace(/\s+/g, "")}.com`,
      website: `https://${businessName.toLowerCase().replace(/\s+/g, "")}.com`,
      working_hours: "09:00 - 18:00",
      service_locations: "All India",
      created_at: new Date().toISOString()
    };
    db.businesses.push(newBusiness);
    saveMockDb(db);
    return newBusiness;
  },

  async updateBusiness(id: string, updates: Partial<Business>): Promise<Business> {
    const db = getMockDb();
    const index = db.businesses.findIndex(b => b.id === id);
    if (index === -1) throw new Error("Business not found");
    db.businesses[index] = { ...db.businesses[index], ...updates };
    saveMockDb(db);
    return db.businesses[index];
  },

  // --- Agents ---
  async getAgents(businessId: string): Promise<Agent[]> {
    const db = getMockDb();
    return db.agents.filter(a => a.business_id === businessId);
  },

  async getAgent(agentId: string): Promise<Agent | null> {
    const db = getMockDb();
    return db.agents.find(a => a.id === agentId) || null;
  },

  async createAgent(businessId: string, name: string, language: string, voiceProvider: string, voiceId: string, systemPrompt: string): Promise<Agent> {
    const db = getMockDb();
    const newAgent: Agent = {
      id: `agent-${Math.random().toString(36).substr(2, 9)}`,
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
      fallback_response: "Let me check with a live agent.",
      created_at: new Date().toISOString()
    };
    db.agents.push(newAgent);
    saveMockDb(db);
    return newAgent;
  },

  async updateAgent(agentId: string, updates: Partial<Agent>): Promise<Agent> {
    const db = getMockDb();
    const index = db.agents.findIndex(a => a.id === agentId);
    if (index === -1) throw new Error("Agent not found");
    db.agents[index] = { ...db.agents[index], ...updates };
    saveMockDb(db);
    return db.agents[index];
  },

  // --- Products ---
  async getProducts(businessId: string): Promise<Product[]> {
    const db = getMockDb();
    return db.products.filter(p => p.business_id === businessId);
  },

  async addProduct(businessId: string, product: Omit<Product, "id" | "business_id" | "created_at">): Promise<Product> {
    const db = getMockDb();
    const newProd: Product = {
      id: `prod-${Math.random().toString(36).substr(2, 9)}`,
      business_id: businessId,
      ...product,
      created_at: new Date().toISOString()
    };
    db.products.push(newProd);
    saveMockDb(db);
    return newProd;
  },

  async deleteProduct(productId: string): Promise<void> {
    const db = getMockDb();
    db.products = db.products.filter(p => p.id !== productId);
    saveMockDb(db);
  },

  // --- Services ---
  async getServices(businessId: string): Promise<Service[]> {
    const db = getMockDb();
    return db.services.filter(s => s.business_id === businessId);
  },

  async addService(businessId: string, service: Omit<Service, "id" | "business_id" | "created_at">): Promise<Service> {
    const db = getMockDb();
    const newServ: Service = {
      id: `serv-${Math.random().toString(36).substr(2, 9)}`,
      business_id: businessId,
      ...service,
      created_at: new Date().toISOString()
    };
    db.services.push(newServ);
    saveMockDb(db);
    return newServ;
  },

  async deleteService(serviceId: string): Promise<void> {
    const db = getMockDb();
    db.services = db.services.filter(s => s.id !== serviceId);
    saveMockDb(db);
  },

  // --- Knowledge Base & Documents ---
  async getKnowledgeBase(businessId: string): Promise<FAQItem[]> {
    const db = getMockDb();
    return db.knowledge_base.filter(kb => kb.business_id === businessId);
  },

  async addFAQ(businessId: string, question: string, answer: string): Promise<FAQItem> {
    const db = getMockDb();
    const newFAQ: FAQItem = {
      id: `faq-${Math.random().toString(36).substr(2, 9)}`,
      business_id: businessId,
      question,
      answer,
      created_at: new Date().toISOString()
    };
    db.knowledge_base.push(newFAQ);
    saveMockDb(db);
    return newFAQ;
  },

  async deleteFAQ(faqId: string): Promise<void> {
    const db = getMockDb();
    db.knowledge_base = db.knowledge_base.filter(kb => kb.id !== faqId);
    saveMockDb(db);
  },

  async getDocuments(businessId: string): Promise<DocumentItem[]> {
    const db = getMockDb();
    return db.documents.filter(d => d.business_id === businessId);
  },

  async addDocument(businessId: string, name: string, fileType: string, textContent: string): Promise<DocumentItem> {
    const db = getMockDb();
    const newDoc: DocumentItem = {
      id: `doc-${Math.random().toString(36).substr(2, 9)}`,
      business_id: businessId,
      name,
      file_type: fileType,
      text_content: textContent,
      created_at: new Date().toISOString()
    };
    db.documents.push(newDoc);
    saveMockDb(db);
    return newDoc;
  },

  async deleteDocument(docId: string): Promise<void> {
    const db = getMockDb();
    db.documents = db.documents.filter(d => d.id !== docId);
    saveMockDb(db);
  },

  // --- Call Logs & Transcripts ---
  async getConversations(businessId: string): Promise<Call[]> {
    const db = getMockDb();
    return db.calls
      .filter(c => c.business_id === businessId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async createConversation(businessId: string, agentId: string, customerName: string): Promise<Call> {
    const db = getMockDb();
    const newCall: Call = {
      id: `call-${Math.random().toString(36).substr(2, 9)}`,
      business_id: businessId,
      agent_id: agentId,
      customer_id: "cust-temp",
      customer_name: customerName,
      duration_seconds: 0,
      status: "active",
      summary: "",
      sentiment: "neutral",
      outcome: "Call Active",
      recording_url: "",
      created_at: new Date().toISOString()
    };
    db.calls.push(newCall);
    saveMockDb(db);
    return newCall;
  },

  async updateConversation(conversationId: string, updates: Partial<Call>): Promise<Call> {
    const db = getMockDb();
    const index = db.calls.findIndex(c => c.id === conversationId);
    if (index === -1) throw new Error("Conversation not found");
    db.calls[index] = { ...db.calls[index], ...updates };
    saveMockDb(db);
    return db.calls[index];
  },

  // --- Messages ---
  async getMessages(conversationId: string): Promise<Message[]> {
    const db = getMockDb();
    return db.messages
      .filter(m => m.conversation_id === conversationId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  async createMessage(conversationId: string, role: "user" | "assistant" | "system", content: string, audioUrl?: string): Promise<Message> {
    const db = getMockDb();
    const newMsg: Message = {
      id: `msg-${Math.random().toString(36).substr(2, 9)}`,
      conversation_id: conversationId,
      role,
      content,
      audio_url: audioUrl,
      created_at: new Date().toISOString()
    };
    db.messages.push(newMsg);
    saveMockDb(db);
    return newMsg;
  },

  // --- Customers & Leads CRM ---
  async getCustomers(businessId: string): Promise<Customer[]> {
    const db = getMockDb();
    return db.customers.filter(c => c.business_id === businessId);
  },

  async getLeads(businessId: string): Promise<Customer[]> {
    const db = getMockDb();
    return db.customers.filter(c => c.business_id === businessId && c.is_lead);
  },

  async upsertCustomer(businessId: string, phone: string, updates: Partial<Omit<Customer, "id" | "business_id" | "phone" | "created_at">>): Promise<Customer> {
    const db = getMockDb();
    let custIndex = db.customers.findIndex(c => c.business_id === businessId && c.phone === phone);
    
    if (custIndex === -1) {
      const newCust: Customer = {
        id: `cust-${Math.random().toString(36).substr(2, 9)}`,
        business_id: businessId,
        name: updates.name || "Unknown Customer",
        phone,
        city: updates.city || "Unknown City",
        budget: updates.budget || 0,
        requirements: updates.requirements || "",
        callback_time: updates.callback_time || "",
        lead_score: updates.lead_score || 50,
        is_lead: updates.is_lead !== undefined ? updates.is_lead : true,
        created_at: new Date().toISOString()
      };
      db.customers.push(newCust);
      saveMockDb(db);
      return newCust;
    } else {
      db.customers[custIndex] = { ...db.customers[custIndex], ...updates };
      saveMockDb(db);
      return db.customers[custIndex];
    }
  },

  // --- Orders & Refunds ---
  async getOrders(businessId: string): Promise<Order[]> {
    const db = getMockDb();
    return db.orders.filter(o => o.business_id === businessId);
  },

  async getOrder(businessId: string, orderId: string): Promise<Order | null> {
    const db = getMockDb();
    return db.orders.find(o => o.business_id === businessId && o.id === orderId) || null;
  },

  async createOrder(businessId: string, customerId: string, productId: string, status: Order["status"]): Promise<Order> {
    const db = getMockDb();
    const newOrder: Order = {
      id: `ord-${Math.random().toString(36).substr(2, 9)}`,
      business_id: businessId,
      customer_id: customerId,
      product_id: productId,
      status,
      tracking_number: `TRK-SM-${Math.floor(100000 + Math.random() * 900000)}`,
      delivery_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };
    db.orders.push(newOrder);
    saveMockDb(db);
    return newOrder;
  },

  async getRefunds(businessId: string): Promise<Refund[]> {
    const db = getMockDb();
    return db.refunds.filter(r => r.business_id === businessId);
  },

  async createRefund(businessId: string, orderId: string, amount: number, reason: string): Promise<Refund> {
    const db = getMockDb();
    const newRefund: Refund = {
      id: `ref-${Math.random().toString(36).substr(2, 9)}`,
      business_id: businessId,
      order_id: orderId,
      status: "pending",
      amount,
      reason,
      created_at: new Date().toISOString()
    };
    db.refunds.push(newRefund);
    saveMockDb(db);
    return newRefund;
  },

  async updateRefund(refundId: string, status: Refund["status"]): Promise<Refund> {
    const db = getMockDb();
    const index = db.refunds.findIndex(r => r.id === refundId);
    if (index === -1) throw new Error("Refund not found");
    db.refunds[index].status = status;
    saveMockDb(db);
    return db.refunds[index];
  },

  // --- Appointments ---
  async getAppointments(businessId: string): Promise<Appointment[]> {
    const db = getMockDb();
    return db.appointments.filter(a => a.business_id === businessId);
  },

  async createAppointment(businessId: string, customerId: string, agentId: string, date: string, time: string, notes: string): Promise<Appointment> {
    const db = getMockDb();
    const newApp: Appointment = {
      id: `app-${Math.random().toString(36).substr(2, 9)}`,
      business_id: businessId,
      customer_id: customerId,
      agent_id: agentId,
      date,
      time,
      status: "confirmed",
      notes,
      created_at: new Date().toISOString()
    };
    db.appointments.push(newApp);
    saveMockDb(db);
    return newApp;
  },

  // --- Support Tickets ---
  async getSupportTickets(businessId: string): Promise<SupportTicket[]> {
    const db = getMockDb();
    return db.support_tickets.filter(t => t.business_id === businessId);
  },

  async createSupportTicket(businessId: string, customerId: string, subject: string, desc: string, priority: SupportTicket["priority"]): Promise<SupportTicket> {
    const db = getMockDb();
    const newTkt: SupportTicket = {
      id: `tkt-${Math.random().toString(36).substr(2, 9)}`,
      business_id: businessId,
      customer_id: customerId,
      subject,
      issue_description: desc,
      status: "open",
      priority,
      created_at: new Date().toISOString()
    };
    db.support_tickets.push(newTkt);
    saveMockDb(db);
    return newTkt;
  },

  async updateSupportTicket(ticketId: string, status: SupportTicket["status"]): Promise<SupportTicket> {
    const db = getMockDb();
    const index = db.support_tickets.findIndex(t => t.id === ticketId);
    if (index === -1) throw new Error("Ticket not found");
    db.support_tickets[index].status = status;
    saveMockDb(db);
    return db.support_tickets[index];
  },

  // --- Subscriptions & Razorpay Simulated Payments ---
  async getSubscription(businessId: string): Promise<Subscription | null> {
    const db = getMockDb();
    return db.subscriptions.find(s => s.business_id === businessId) || null;
  },

  async getPayments(businessId: string): Promise<Payment[]> {
    const db = getMockDb();
    return db.payments.filter(p => p.business_id === businessId);
  },

  async createSubscriptionPayment(businessId: string, plan: Subscription["plan"], amount: number, razorpayPaymentId: string): Promise<{ subscription: Subscription; payment: Payment }> {
    const db = getMockDb();
    
    // Create or update subscription
    let subIndex = db.subscriptions.findIndex(s => s.business_id === businessId);
    let sub: Subscription;
    
    if (subIndex === -1) {
      sub = {
        id: `sub-${Math.random().toString(36).substr(2, 9)}`,
        business_id: businessId,
        plan,
        status: "active",
        billing_cycle_start: new Date().toISOString(),
        billing_cycle_end: new Date(Date.now() + 86400000 * 30).toISOString(),
        created_at: new Date().toISOString()
      };
      db.subscriptions.push(sub);
    } else {
      db.subscriptions[subIndex].plan = plan;
      db.subscriptions[subIndex].status = "active";
      db.subscriptions[subIndex].billing_cycle_start = new Date().toISOString();
      db.subscriptions[subIndex].billing_cycle_end = new Date(Date.now() + 86400000 * 30).toISOString();
      sub = db.subscriptions[subIndex];
    }

    // Record Payment
    const payment: Payment = {
      id: `pay-${Math.random().toString(36).substr(2, 9)}`,
      business_id: businessId,
      subscription_id: sub.id,
      amount,
      status: "success",
      razorpay_payment_id: razorpayPaymentId,
      created_at: new Date().toISOString()
    };
    db.payments.push(payment);
    
    saveMockDb(db);
    return { subscription: sub, payment };
  },

  // --- Admin Analytics & Management ---
  async getAdminBusinessesList(): Promise<any[]> {
    const db = getMockDb();
    return db.businesses.map(b => {
      const sub = db.subscriptions.find(s => s.business_id === b.id);
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

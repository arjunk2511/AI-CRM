import { 
  Business, Agent, FAQItem, DocumentItem, Call, Message, 
  Customer, Order, Refund, Appointment, SupportTicket, 
  Subscription, Payment, User, Product, Service 
} from "./db";

async function callDbApi(action: string, params: any = {}) {
  const res = await fetch("/api/db", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action, params }),
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Database call failed");
  }
  
  return res.json();
}

export const dbClient = {
  async isMock(): Promise<boolean> {
    return callDbApi("isMock");
  },

  // --- Users & Platform Admin ---
  async getUserByEmail(email: string): Promise<User | null> {
    return callDbApi("getUserByEmail", { email });
  },

  async createUser(email: string, passwordHash: string, role: "user" | "super_admin"): Promise<User> {
    return callDbApi("createUser", { email, passwordHash, role });
  },

  async getPlatformStats(): Promise<any> {
    return callDbApi("getPlatformStats");
  },

  async deleteUser(userId: string): Promise<void> {
    return callDbApi("deleteUser", { userId });
  },

  // --- Businesses ---
  async getBusiness(userId: string): Promise<Business | null> {
    return callDbApi("getBusiness", { userId });
  },

  async createBusiness(businessName: string, category: string, phone: string, userId: string): Promise<Business> {
    return callDbApi("createBusiness", { businessName, category, phone, userId });
  },

  async updateBusiness(id: string, updates: Partial<Business>): Promise<Business> {
    return callDbApi("updateBusiness", { id, updates });
  },

  // --- Agents ---
  async getAgents(businessId: string): Promise<Agent[]> {
    return callDbApi("getAgents", { businessId });
  },

  async getAgent(agentId: string): Promise<Agent | null> {
    return callDbApi("getAgent", { agentId });
  },

  async createAgent(businessId: string, name: string, language: string, voiceProvider: string, voiceId: string, systemPrompt: string): Promise<Agent> {
    return callDbApi("createAgent", { businessId, name, language, voiceProvider, voiceId, systemPrompt });
  },

  async updateAgent(agentId: string, updates: Partial<Agent>): Promise<Agent> {
    return callDbApi("updateAgent", { agentId, updates });
  },

  async deleteAgent(agentId: string): Promise<void> {
    return callDbApi("deleteAgent", { agentId });
  },

  // --- Products ---
  async getProducts(businessId: string): Promise<Product[]> {
    return callDbApi("getProducts", { businessId });
  },

  async addProduct(businessId: string, product: Omit<Product, "id" | "business_id" | "created_at">): Promise<Product> {
    return callDbApi("addProduct", { businessId, product });
  },

  async deleteProduct(productId: string): Promise<void> {
    return callDbApi("deleteProduct", { productId });
  },

  // --- Services ---
  async getServices(businessId: string): Promise<Service[]> {
    return callDbApi("getServices", { businessId });
  },

  async addService(businessId: string, service: Omit<Service, "id" | "business_id" | "created_at">): Promise<Service> {
    return callDbApi("addService", { businessId, service });
  },

  async deleteService(serviceId: string): Promise<void> {
    return callDbApi("deleteService", { serviceId });
  },

  // --- Knowledge Base ---
  async getKnowledgeBase(businessId: string): Promise<FAQItem[]> {
    return callDbApi("getKnowledgeBase", { businessId });
  },

  async addFAQ(businessId: string, question: string, answer: string): Promise<FAQItem> {
    return callDbApi("addFAQ", { businessId, question, answer });
  },

  async deleteFAQ(faqId: string): Promise<void> {
    return callDbApi("deleteFAQ", { faqId });
  },

  async getDocuments(businessId: string): Promise<DocumentItem[]> {
    return callDbApi("getDocuments", { businessId });
  },

  async addDocument(businessId: string, name: string, fileType: string, textContent: string): Promise<DocumentItem> {
    return callDbApi("addDocument", { businessId, name, fileType, textContent });
  },

  async deleteDocument(docId: string): Promise<void> {
    return callDbApi("deleteDocument", { docId });
  },

  // --- Call Logs ---
  async getConversations(businessId: string): Promise<Call[]> {
    return callDbApi("getConversations", { businessId });
  },

  async createConversation(businessId: string, agentId: string, customerName: string): Promise<Call> {
    return callDbApi("createConversation", { businessId, agentId, customerName });
  },

  async updateConversation(conversationId: string, updates: Partial<Call>): Promise<Call> {
    return callDbApi("updateConversation", { conversationId, updates });
  },

  // --- Messages ---
  async getMessages(conversationId: string): Promise<Message[]> {
    return callDbApi("getMessages", { conversationId });
  },

  async createMessage(conversationId: string, role: "user" | "assistant" | "system", content: string, audioUrl?: string): Promise<Message> {
    return callDbApi("createMessage", { conversationId, role, content, audioUrl });
  },

  // --- Customers & Leads CRM ---
  async getCustomers(businessId: string): Promise<Customer[]> {
    return callDbApi("getCustomers", { businessId });
  },

  async getLeads(businessId: string): Promise<Customer[]> {
    return callDbApi("getLeads", { businessId });
  },

  async upsertCustomer(businessId: string, phone: string, updates: Partial<Omit<Customer, "id" | "business_id" | "phone" | "created_at">>): Promise<Customer> {
    return callDbApi("upsertCustomer", { businessId, phone, updates });
  },

  // --- Orders & Refunds ---
  async getOrders(businessId: string): Promise<Order[]> {
    return callDbApi("getOrders", { businessId });
  },

  async getOrder(businessId: string, orderId: string): Promise<Order | null> {
    return callDbApi("getOrder", { businessId, orderId });
  },

  async createOrder(businessId: string, customerId: string, productId: string, status: Order["status"]): Promise<Order> {
    return callDbApi("createOrder", { businessId, customerId, productId, status });
  },

  async getRefunds(businessId: string): Promise<Refund[]> {
    return callDbApi("getRefunds", { businessId });
  },

  async createRefund(businessId: string, orderId: string, amount: number, reason: string): Promise<Refund> {
    return callDbApi("createRefund", { businessId, orderId, amount, reason });
  },

  async updateRefund(refundId: string, status: Refund["status"]): Promise<Refund> {
    return callDbApi("updateRefund", { refundId, status });
  },

  // --- Appointments ---
  async getAppointments(businessId: string): Promise<Appointment[]> {
    return callDbApi("getAppointments", { businessId });
  },

  async createAppointment(businessId: string, customerId: string, agentId: string, date: string, time: string, notes: string): Promise<Appointment> {
    return callDbApi("createAppointment", { businessId, customerId, agentId, date, time, notes });
  },

  // --- Support Tickets ---
  async getSupportTickets(businessId: string): Promise<SupportTicket[]> {
    return callDbApi("getSupportTickets", { businessId });
  },

  async createSupportTicket(businessId: string, customerId: string, subject: string, desc: string, priority: SupportTicket["priority"]): Promise<SupportTicket> {
    return callDbApi("createSupportTicket", { businessId, customerId, subject, desc, priority });
  },

  async updateSupportTicket(ticketId: string, status: SupportTicket["status"]): Promise<SupportTicket> {
    return callDbApi("updateSupportTicket", { ticketId, status });
  },

  // --- Subscriptions & Payments ---
  async getSubscription(businessId: string): Promise<Subscription | null> {
    return callDbApi("getSubscription", { businessId });
  },

  async getPayments(businessId: string): Promise<Payment[]> {
    return callDbApi("getPayments", { businessId });
  },

  async createSubscriptionPayment(businessId: string, plan: Subscription["plan"], amount: number, razorpayPaymentId: string): Promise<{ subscription: Subscription; payment: Payment }> {
    return callDbApi("createSubscriptionPayment", { businessId, plan, amount, razorpayPaymentId });
  },

  // --- Admin functions ---
  async getAdminBusinessesList(): Promise<any[]> {
    return callDbApi("getAdminBusinessesList");
  }
};

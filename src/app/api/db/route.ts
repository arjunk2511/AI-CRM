import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params } = body;

    if (!action) {
      return NextResponse.json({ error: "Missing database action" }, { status: 400 });
    }

    let result;

    switch (action) {
      case "isMock":
        result = dbService.isMock();
        break;

      // --- Users & Platform admin ---
      case "getUserByEmail":
        result = await dbService.getUserByEmail(params.email);
        break;
      case "createUser":
        result = await dbService.createUser(params.email, params.passwordHash, params.role);
        break;
      case "getPlatformStats":
        result = await dbService.getPlatformStats();
        break;
      case "deleteUser":
        await dbService.deleteUser(params.userId);
        result = { success: true };
        break;

      // --- Businesses ---
      case "getBusiness":
        result = await dbService.getBusiness(params.userId);
        break;
      case "createBusiness":
        result = await dbService.createBusiness(
          params.businessName,
          params.category,
          params.phone,
          params.userId
        );
        break;
      case "updateBusiness":
        result = await dbService.updateBusiness(params.id, params.updates);
        break;

      // --- Agents ---
      case "getAgents":
        result = await dbService.getAgents(params.businessId);
        break;
      case "getAgent":
        result = await dbService.getAgent(params.agentId);
        break;
      case "createAgent":
        result = await dbService.createAgent(
          params.businessId,
          params.name,
          params.language,
          params.voiceProvider,
          params.voiceId,
          params.systemPrompt
        );
        break;
      case "updateAgent":
        result = await dbService.updateAgent(params.agentId, params.updates);
        break;

      // --- Products ---
      case "getProducts":
        result = await dbService.getProducts(params.businessId);
        break;
      case "addProduct":
        result = await dbService.addProduct(params.businessId, params.product);
        break;
      case "deleteProduct":
        await dbService.deleteProduct(params.productId);
        result = { success: true };
        break;

      // --- Services ---
      case "getServices":
        result = await dbService.getServices(params.businessId);
        break;
      case "addService":
        result = await dbService.addService(params.businessId, params.service);
        break;
      case "deleteService":
        await dbService.deleteService(params.serviceId);
        result = { success: true };
        break;

      // --- Knowledge Base ---
      case "getKnowledgeBase":
        result = await dbService.getKnowledgeBase(params.businessId);
        break;
      case "addFAQ":
        result = await dbService.addFAQ(params.businessId, params.question, params.answer);
        break;
      case "deleteFAQ":
        await dbService.deleteFAQ(params.faqId);
        result = { success: true };
        break;
      case "getDocuments":
        result = await dbService.getDocuments(params.businessId);
        break;
      case "addDocument":
        result = await dbService.addDocument(params.businessId, params.name, params.fileType, params.textContent);
        break;
      case "deleteDocument":
        await dbService.deleteDocument(params.docId);
        result = { success: true };
        break;

      // --- Call Logs ---
      case "getConversations":
        result = await dbService.getConversations(params.businessId);
        break;
      case "createConversation":
        result = await dbService.createConversation(
          params.businessId,
          params.agentId,
          params.customerName
        );
        break;
      case "updateConversation":
        result = await dbService.updateConversation(params.conversationId, params.updates);
        break;

      // --- Messages ---
      case "getMessages":
        result = await dbService.getMessages(params.conversationId);
        break;
      case "createMessage":
        result = await dbService.createMessage(
          params.conversationId,
          params.role,
          params.content,
          params.audioUrl
        );
        break;

      // --- Customers & Leads CRM ---
      case "getCustomers":
        result = await dbService.getCustomers(params.businessId);
        break;
      case "getLeads":
        result = await dbService.getLeads(params.businessId);
        break;
      case "upsertCustomer":
        result = await dbService.upsertCustomer(params.businessId, params.phone, params.updates);
        break;

      // --- Orders & Refunds ---
      case "getOrders":
        result = await dbService.getOrders(params.businessId);
        break;
      case "getOrder":
        result = await dbService.getOrder(params.businessId, params.orderId);
        break;
      case "createOrder":
        result = await dbService.createOrder(params.businessId, params.customerId, params.productId, params.status);
        break;
      case "getRefunds":
        result = await dbService.getRefunds(params.businessId);
        break;
      case "createRefund":
        result = await dbService.createRefund(params.businessId, params.orderId, params.amount, params.reason);
        break;
      case "updateRefund":
        result = await dbService.updateRefund(params.refundId, params.status);
        break;

      // --- Appointments ---
      case "getAppointments":
        result = await dbService.getAppointments(params.businessId);
        break;
      case "createAppointment":
        result = await dbService.createAppointment(
          params.businessId,
          params.customerId,
          params.agentId,
          params.date,
          params.time,
          params.notes
        );
        break;

      // --- Support Tickets ---
      case "getSupportTickets":
        result = await dbService.getSupportTickets(params.businessId);
        break;
      case "createSupportTicket":
        result = await dbService.createSupportTicket(
          params.businessId,
          params.customerId,
          params.subject,
          params.desc,
          params.priority
        );
        break;
      case "updateSupportTicket":
        result = await dbService.updateSupportTicket(params.ticketId, params.status);
        break;

      // --- Subscriptions & Payments ---
      case "getSubscription":
        result = await dbService.getSubscription(params.businessId);
        break;
      case "getPayments":
        result = await dbService.getPayments(params.businessId);
        break;
      case "createSubscriptionPayment":
        result = await dbService.createSubscriptionPayment(
          params.businessId,
          params.plan,
          params.amount,
          params.razorpayPaymentId
        );
        break;

      // --- Admin functions ---
      case "getAdminBusinessesList":
        result = await dbService.getAdminBusinessesList();
        break;

      default:
        return NextResponse.json({ error: `Unknown database action: ${action}` }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Database API router error:", error);
    return NextResponse.json({ error: error.message || "Database action failed" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

const geminiKey = process.env.GEMINI_API_KEY || "";
const openaiKey = process.env.OPENAI_API_KEY || "";

const genAI = geminiKey ? new GoogleGenerativeAI(geminiKey) : null;
const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

// Support Escalation keyword dictionary
const ESCALATION_KEYWORDS = [
  "ಮ್ಯಾನೇಜರ್", "ವರ್ಗಾಯಿಸಿ", "ಲೈವ್", "ಪ್ರತಿನಿಧಿ", "Refund", "ಹಣ ವಾಪಸ್", 
  "complaint", "angry", "bad service", "supervisor", "agent", "human", "transfer",
  "ಮಾತನಾಡು", "ಕೋಪ", "ಮ್ಯಾನೇಜರ್ ಕರೆ", "representative"
];

// Ticket generation trigger keywords
const COMPLAINT_KEYWORDS = [
  "broken", "damaged", "defect", "not working", "charger", "battery issue", 
  "ದೋಷ", "ಕೆಲಸ ಮಾಡ್ತಿಲ್ಲ", "ಸಮಸ್ಯೆ", "ಖರಬು", "ಡ್ಯಾಮೇಜ್"
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, agentId, conversationId } = body;

    if (!message || !agentId || !conversationId) {
      return NextResponse.json({ error: "Missing message, agentId, or conversationId" }, { status: 400 });
    }

    // 1. Load Agent
    const agent = await dbService.getAgent(agentId);
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const businessId = agent.business_id;

    // 2. Query Business products, services, FAQs, and documents for RAG context
    const [business, products, services, faqs, docs, conversations] = await Promise.all([
      dbService.getBusiness(businessId),
      dbService.getProducts(businessId),
      dbService.getServices(businessId),
      dbService.getKnowledgeBase(businessId),
      dbService.getDocuments(businessId),
      dbService.getConversations(businessId) // to find current conversation details
    ]);

    const businessName = business ? business.business_name : "our company";
    const industry = business ? business.category : "Consumer Services";

    // 3. Simple Keyword Overlap RAG matching across all sources
    let ragContexts: string[] = [];
    const queryLower = message.toLowerCase();

    // Scan Products
    for (const prod of products) {
      if (queryLower.includes(prod.name.toLowerCase()) || queryLower.includes("price") || queryLower.includes("ಬೆಲೆ") || queryLower.includes("ಖರೀದಿ")) {
        ragContexts.push(`Product: ${prod.name}\nPrice: ₹${prod.price}\nWarranty: ${prod.warranty}\nDescription: ${prod.description}\nDelivery: ${prod.delivery_info}`);
      }
    }

    // Scan Services
    for (const serv of services) {
      if (queryLower.includes(serv.name.toLowerCase()) || queryLower.includes("service") || queryLower.includes("ಸೇವೆ") || queryLower.includes("ರಿಪೇರಿ")) {
        ragContexts.push(`Service: ${serv.name}\nPricing: ${serv.pricing}\nCoverage: ${serv.coverage_area}\nDescription: ${serv.description}`);
      }
    }

    // Scan FAQs
    for (const faq of faqs) {
      const qTerms = faq.question.toLowerCase().split(/\s+/).filter(t => t.length > 2);
      const matches = qTerms.some(term => queryLower.includes(term));
      if (matches || queryLower.includes(faq.question.toLowerCase())) {
        ragContexts.push(`FAQ Question: ${faq.question}\nAnswer: ${faq.answer}`);
      }
    }

    // Scan Documents
    for (const doc of docs) {
      if (queryLower.includes(doc.name.toLowerCase()) || queryLower.includes("manual") || queryLower.includes("ಮಾಹಿತಿ")) {
        ragContexts.push(`Document (${doc.name}): ${doc.text_content.substring(0, 300)}`);
      }
    }

    const contextBlock = ragContexts.length > 0 
      ? ragContexts.join("\n\n") 
      : "No direct matching knowledge base details found. Maintain general polite behavior.";

    // 4. Scans for Ticket or Escalation conditions
    const isEscalationRequested = ESCALATION_KEYWORDS.some(kw => queryLower.includes(kw.toLowerCase()));
    const isComplaintDetected = COMPLAINT_KEYWORDS.some(kw => queryLower.includes(kw.toLowerCase()));

    // 5. Structure LLM or local response
    let reply = "";
    let escalated = false;
    let sentiment: "positive" | "neutral" | "frustrated" = "neutral";
    let summary = "Customer conversation turnover.";
    let outcome = "Information provided";

    // Simulate structured return parameters
    let leadName = "";
    let leadPhone = "";
    let leadCity = "";
    let leadBudget = 0;
    let leadReqs = "";
    let callbackTime = "Immediate";

    let bookDate = "";
    let bookTime = "";
    let bookNotes = "";

    if (isEscalationRequested) {
      reply = agent.language === "Kannada" 
        ? "ಖಂಡಿತ, ನಿಮ್ಮ ಆತುರದ ಕರೆಯನ್ನು ನಮ್ಮ ಹಿರಿಯ ಮ್ಯಾನೇಜರ್‌ಗೆ ವರ್ಗಾಯಿಸುತ್ತಿದ್ದೇನೆ. ದಯವಿಟ್ಟು ಲೈನ್‌ನಲ್ಲಿಯೇ ಇರಿ." 
        : "Understood. Transferring your call to our service supervisor immediately. Please hold.";
      escalated = true;
      sentiment = "frustrated";
      outcome = "Human Escalation";
      summary = "Customer requested human supervisor.";
    } 
    else if (genAI || openai) {
      // Structured AI parsing prompt
      const systemInstruction = `
You are ${agent.name}, a professional AI voice agent representing ${businessName} in the ${industry} sector.
You speak polite, conversational, and natural ${agent.language}.
Keep your responses short (1-2 sentences) and helpful. 

Knowledge Base context facts to use:
${contextBlock}

Escalation rules:
- If customer wants manager, refund, or displays high frustration, trigger escalation.

You must respond in ${agent.language}.

Also evaluate if the customer has provided lead qualification details:
- Name (e.g. Raju, Ravi)
- Budget (in rupees)
- City (e.g. Bengaluru, Mysuru)
- Product/Service requirement
- Preferred callback window

And check if they scheduled an appointment demo:
- Date & Time details (e.g. tomorrow at 3 PM)

You will format your complete response as a JSON string with the following fields:
{
  "reply": "Your Kannada response text to read to customer",
  "sentiment": "positive", "neutral", or "frustrated",
  "summary": "Short English summary of user message",
  "escalated": false,
  "lead": {
    "name": "extracted name or empty",
    "phone": "extracted phone or empty",
    "city": "extracted city or empty",
    "budget": 0,
    "requirements": "extracted product requirement or empty",
    "callback": "extracted callback slot or empty"
  },
  "appointment": {
    "date": "YYYY-MM-DD or empty",
    "time": "HH:MM or empty",
    "notes": "demo notes or empty"
  }
}
`;

      const userPrompt = `Customer: "${message}"`;
      let jsonText = "";

      try {
        if (genAI) {
          const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
          });
          const result = await model.generateContent([
            { text: systemInstruction },
            { text: userPrompt }
          ]);
          jsonText = result.response.text();
        } else if (openai) {
          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: userPrompt }
            ]
          });
          jsonText = response.choices[0].message.content || "{}";
        }

        const parsed = JSON.parse(jsonText);
        reply = parsed.reply || "";
        sentiment = parsed.sentiment || "neutral";
        summary = parsed.summary || "General inquiry.";
        escalated = !!parsed.escalated;

        if (parsed.lead) {
          leadName = parsed.lead.name;
          leadCity = parsed.lead.city;
          leadBudget = Number(parsed.lead.budget || 0);
          leadReqs = parsed.lead.requirements;
          callbackTime = parsed.lead.callback;
        }

        if (parsed.appointment) {
          bookDate = parsed.appointment.date;
          bookTime = parsed.appointment.time;
          bookNotes = parsed.appointment.notes;
        }

      } catch (err) {
        console.error("AI JSON parse failure, falling back to regex: ", err);
        // Fallback simple parsing
        reply = agent.language === "Kannada" 
          ? "ಪ್ರತಿಕ್ರಿಯೆ ನೀಡಲು ತಾಂತ್ರಿಕ ತೊಂದರೆಯಾಗಿದೆ, ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಹೇಳಿ." 
          : "Sorry, I encountered an issue. Can you repeat that?";
      }
    } 
    else {
      // Local Sandbox mock engine - smart rule-based parser
      sentiment = "neutral";
      
      // Order status tracking check
      if (queryLower.includes("order") || queryLower.includes("status") || queryLower.includes("ಆರ್ಡರ್") || queryLower.includes("ಟ್ರ್ಯಾಕ್")) {
        reply = agent.language === "Kannada"
          ? "ನಿಮ್ಮ ಆರ್ಡರ್ TRK-SM-987541 ಈಗಾಗಲೇ ರವಾನೆಯಾಗಿದೆ ಮತ್ತು ಇದು ಸೋಮವಾರ ಮಧ್ಯಾಹ್ನ ತಲುಪಲಿದೆ."
          : "Your order TRK-SM-987541 has been shipped and will be delivered by Monday afternoon.";
        summary = "Checked order tracking.";
      } 
      else if (queryLower.includes("ಡೆಮೊ") || queryLower.includes("demo") || queryLower.includes("ಅಪಾಯಿಂಟ್ಮೆಂಟ್")) {
        // Mock appointment extraction
        bookDate = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
        bookTime = "11:30";
        bookNotes = "Customer requested live smart mop demo.";
        
        reply = agent.language === "Kannada"
          ? `ಖಂಡಿತ! ನಿಮ್ಮ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಆಗಿದೆ. ದಿನಾಂಕ ${bookDate} ರಂದು ಬೆಳಗ್ಗೆ 11:30 ಕ್ಕೆ ನಮ್ಮ ಪ್ರತಿನಿಧಿ ಭೇಟಿ ನೀಡುತ್ತಾರೆ.`
          : `Absolutely. Your demo is scheduled on ${bookDate} at 11:30 AM. Representative will visit.`;
        summary = "Booked home demo appointment.";
        outcome = "Demo Booked";
      }
      else if (queryLower.includes("ಬೆಲೆ") || queryLower.includes("price")) {
        // Product specs
        const mopPrice = products.length > 0 ? products[0].price : 2999;
        reply = agent.language === "Kannada"
          ? `ಸ್ಮಾರ್ಟ್ ಮಾಪ್ ಪ್ರೊ ಬೆಲೆ ಕೇವಲ ₹${mopPrice} ಆಗಿದೆ. ಇದರಲ್ಲಿ ಶೇಕಡಾ 10 ರಷ್ಟು ರಿಯಾಯಿತಿ ಇದೆ.`
          : `SmartMop Pro price is just ₹${mopPrice}. It has a 10% discount currently.`;
        summary = "Inquired about product pricing.";
        
        // Extract lead parameters if price query includes buyer info
        if (queryLower.includes("raju") || queryLower.includes("ರಾಜು")) {
          leadName = "ರಾಜು (Raju)";
          leadCity = "Bengaluru";
          leadBudget = mopPrice;
          leadReqs = "Wants Mop Pro sales demo";
        }
      }
      else if (queryLower.includes("ಬ್ಯಾಟರಿ") || queryLower.includes("battery")) {
        reply = agent.language === "Kannada"
          ? "ಸ್ಮಾರ್ಟ್ ಮಾಪ್ ಒಮ್ಮೆ ಚಾರ್ಜ್ ಮಾಡಿದರೆ 45 ನಿಮಿಷಗಳ ಕಾಲ ನಿರಂತರವಾಗಿ ಕೆಲಸ ಮಾಡುತ್ತದೆ."
          : "The SmartMop runs for 45 minutes continuously on a full charge.";
        summary = "Inquired about battery specs.";
      }
      else {
        reply = agent.language === "Kannada"
          ? "ನಮಸ್ಕಾರ! ಸ್ಮಾರ್ಟ್ ಮಾಪ್ ಇಂಡಿಯಾ ಕುಮಾರ್ ಮಾತನಾಡ್ತಿದ್ದೇನೆ. ಬೆಲೆ, ಬ್ಯಾಟರಿ ಅಥವಾ ವಾರಂಟಿ ಬಗ್ಗೆ ಕೇಳಿ."
          : "Hello, Kumar representing SmartMop. Please ask about pricing, warranty, or battery life.";
        summary = "General greetings.";
      }
    }

    // 7. Write CRM Qualified Lead if credentials extracted
    if (leadName || leadCity || leadBudget) {
      const leadPhone = "+91 94480 " + Math.floor(10000 + Math.random() * 90000);
      const score = leadBudget >= 2500 ? 85 : 55;
      
      const leadProfile = await dbService.upsertCustomer(businessId, leadPhone, {
        name: leadName || "Web Customer",
        city: leadCity || "Bengaluru",
        budget: leadBudget || 2999,
        requirements: leadReqs || "AI voice assistant qualification lead",
        callback_time: callbackTime || "Evening 6 PM",
        lead_score: score,
        is_lead: true
      });
      
      summary = `Lead Qualified: ${leadProfile.name} (City: ${leadProfile.city}, Budget: ₹${leadProfile.budget})`;
      outcome = "Lead Qualified";
    }

    // 8. Create Support Ticket if complaint keyword found
    if (isComplaintDetected && !escalated) {
      const mockPhone = "+91 99800 " + Math.floor(10000 + Math.random() * 90000);
      const cust = await dbService.upsertCustomer(businessId, mockPhone, {
        name: "Complaint Caller",
        is_lead: false,
        lead_score: 30
      });
      
      await dbService.createSupportTicket(
        businessId,
        cust.id,
        "Charger port / Motor failure",
        `User reported charging hardware issue: "${message}"`,
        "medium"
      );
      
      reply = agent.language === "Kannada"
        ? "ನಿಮ್ಮ ದೂರಿನ ವಿವರಗಳನ್ನು ನಾನು ದಾಖಲಿಸಿದ್ದೇನೆ. ಸೇವಾ ತಂಡದವರು ಶೀಘ್ರದಲ್ಲೇ ಭೇಟಿ ನೀಡುತ್ತಾರೆ."
        : "I have registered your service ticket. Our tech repair team will visit shortly.";
      summary = "Support ticket registered.";
      outcome = "Support Ticket Created";
    }

    // 9. Schedule Appointment if requested
    if (bookDate && bookTime) {
      const mockPhone = "+91 97760 " + Math.floor(10000 + Math.random() * 90000);
      const cust = await dbService.upsertCustomer(businessId, mockPhone, {
        name: "Booking Caller",
        is_lead: true,
        lead_score: 75
      });
      
      await dbService.createAppointment(
        businessId,
        cust.id,
        agent.id,
        bookDate,
        bookTime,
        bookNotes || "Demo booking from call"
      );
      
      outcome = "Appointment Confirmed";
    }

    return NextResponse.json({
      reply,
      escalated,
      sentiment,
      summary,
      outcome
    });

  } catch (error: any) {
    console.error("Chat backend failure:", error);
    return NextResponse.json({ reply: "ಕ್ಷಮಿಸಿ, ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.", error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db";
import OpenAI from "openai";

const openaiKey = process.env.OPENAI_API_KEY || "";
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

    // Verify OpenAI integration early check bypassed for offline fallback support


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
    else {
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
        if (!openaiKey || !openai) {
          throw { status: 429, message: "OpenAI API Key is missing. Triggering offline local FAQ/RAG matching fallback mode." };
        }
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: userPrompt }
          ]
        });
        jsonText = response.choices[0].message.content || "{}";

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

      } catch (err: any) {
        const isQuotaErr = err.status === 429 || 
                           (err.message && (
                             err.message.includes("429") || 
                             err.message.toLowerCase().includes("quota") || 
                             err.message.toLowerCase().includes("exceeded") ||
                             err.message.toLowerCase().includes("limit")
                           ));
        
        if (isQuotaErr) {
          console.log("openai_fallback_mode = true");
          console.warn("[OpenAI Quota Limit Hit] Entering offline local FAQ fallback mode.");

          // Search FAQs for matching answer
          let bestMatchFaq = null;
          let maxOverlap = 0;
          const userWords = queryLower.split(/\s+/).filter((w: string) => w.length > 1);

          for (const faq of faqs) {
            let overlap = 0;
            const faqQ = faq.question.toLowerCase();
            if (queryLower.includes(faqQ) || faqQ.includes(queryLower)) {
              overlap += 10;
            }
            for (const word of userWords) {
              if (faqQ.includes(word)) {
                overlap++;
              }
            }
            if (overlap > maxOverlap) {
              maxOverlap = overlap;
              bestMatchFaq = faq;
            }
          }

          if (bestMatchFaq && maxOverlap > 0) {
            reply = bestMatchFaq.answer;
            summary = `Offline FAQ Match: ${bestMatchFaq.question}`;
            outcome = "Information provided (local FAQ)";
          } else {
            // Conversational Intent Matching fallback
            const isGreeting = ["hello", "hi", "namaskara", "namaskar", "namaste", "ಹಲೋ", "ನಮಸ್ಕಾರ", "ಹಾಯ್", "హలో", "నమస్కారం", "హాయ్", "வணக்கம்", "नमस्ते", "നമസ്കാരം", "ഹലോ"].some(k => queryLower.includes(k));
            const isIdentity = ["who are you", "what is your name", "name", "ನಿಮ್ಮ ಹೆಸರು", "ನೀವು ಯಾರು", "ನಿಮ್ಮ ಹೆಸರೇನು", "மீ പേరేంటి", "మీరెవరు", "మీ పేరు", "तुम्हारा नाम क्या है", "உன் பெயர் என்ன", "പേര്"].some(k => queryLower.includes(k));
            const isTransfer = ["transfer", "manager", "human", "talk to human", "representative", "ಲೈವ್", "ವರ್ಗಾಯಿಸಿ", "ಮ್ಯಾನೇಜರ್", "ಲೈವ್ ಏಜೆಂಟ್", "ಮ್ಯಾನೇಜರ್", "మాట్లాడాలి", "లైవ్ ఏజెంట్", "மேலாளர்", "മനേജർ"].some(k => queryLower.includes(k));
            const isScheduling = ["book", "schedule", "meeting", "consultation", "demo", "ಮೀಟಿಂಗ್", "ಬುಕ್", "ಮೀಟಿಂಗ್ ಬುಕ್", "மீட்டிங்", "బుకింగ్", "అపాయింట్‌మెంట్", "परामर्श", "अपॉइंटमेंट", "முன்பதிவு", "ബുക്കിംഗ്"].some(k => queryLower.includes(k));
            const isBusiness = ["what is this", "how does it work", "voiceos", "voice os", "ಹೇಗೆ ಕೆಲಸ", "ಏನಿದು", "ಏನ್ ಇದು", "ఏంటిది", "ఎలా పనిచేస్తుంది", "ఎలా పని చేస్తుంది", "काम कैसे करता है", "எப்படி செயல்படுகிறது"].some(k => queryLower.includes(k));

            if (isGreeting) {
              if (agent.language === "Kannada") {
                reply = "ನಮಸ್ಕಾರ! ನಿಮ್ಮೊಂದಿಗೆ ಮಾತನಾಡಲು ಸಂತೋಷವಾಗಿದೆ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?";
              } else if (agent.language === "Telugu") {
                reply = "నమస్కారం! మీతో మాట్లాడటం చాలా సంతోషంగా ఉంది. ఈ రోజు నేను మీకు ఎలా సహాయపడగలను?";
              } else if (agent.language === "Tamil") {
                reply = "வணக்கம்! உங்களுடன் பேசுவதில் மிக்க மகிழ்ச்சி. இன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?";
              } else if (agent.language === "Hindi") {
                reply = "नमस्ते! आपसे बात करके बहुत खुशी हुई। आज मैं आपकी क्या सहायता कर सकता हूँ?";
              } else if (agent.language === "Malayalam") {
                reply = "നമസ്കാരം! നിങ്ങളോട് സംസാരിക്കുന്നതിൽ വളരെ സന്തോഷമുണ്ട്. ഇന്ന് ഞാൻ എങ്ങനെയാണ് സഹായിക്കേണ്ടത്?";
              } else {
                reply = "Hello! It is a pleasure speaking with you. How can I assist you today?";
              }
              summary = "Simulated intent matching: Greeting";
              outcome = "Information provided";
            } 
            else if (isIdentity) {
              if (agent.language === "Kannada") {
                reply = `ನನ್ನ ಹೆಸರು ${agent.name}. ನಾನು VoiceOS AI ನಿಂದ ನಿಮ್ಮ ಸಹಾಯಕ್ಕೆ ನಿಯೋಜಿತವಾಗಿರುವ ಸ್ವಯಂಚಾಲಿತ ಧ್ವನಿ ನೌಕರ.`;
              } else if (agent.language === "Telugu") {
                reply = `నా పేరు ${agent.name}. నేను VoiceOS AI ద్వారా మీ సహాయం కోసం నియమించబడిన వర్చువల్ వాయిస్ ఎంప్లాయ్.`;
              } else if (agent.language === "Tamil") {
                reply = `என் பெயர் ${agent.name}. நான் VoiceOS AI ஆல் உருவாக்கப்பட்ட ஒரு மெய்நிகர் குரல் பணியாளர்.`;
              } else if (agent.language === "Hindi") {
                reply = `मेरा नाम ${agent.name} है। मैं VoiceOS AI द्वारा निर्मित एक वर्चुअल वॉयस कर्मचारी हूँ।`;
              } else if (agent.language === "Malayalam") {
                reply = `എന്റെ പേര് ${agent.name} എന്നാണ്. ഞാൻ VoiceOS AI രൂപകൽപ്പന ചെയ്ത ഒരു വെർച്വൽ ജീവനക്കാരനാണ്.`;
              } else {
                reply = `My name is ${agent.name}. I am an automated voice employee created by VoiceOS AI to assist you.`;
              }
              summary = "Simulated intent matching: Identity";
              outcome = "Information provided";
            }
            else if (isTransfer) {
              if (agent.language === "Kannada") {
                reply = "ಖಂಡಿತ, ನಿಮ್ಮ ಆತುರದ ಕರೆಯನ್ನು ನಮ್ಮ ಹಿರಿಯ ಮ್ಯಾನೇಜರ್‌ಗೆ ವರ್ಗಾಯಿಸುತ್ತಿದ್ದೇನೆ. ದಯವಿಟ್ಟು ಲೈನ್‌ನಲ್ಲಿಯೇ ಇರಿ.";
              } else if (agent.language === "Telugu") {
                reply = "తప్పకుండా, మీ కాల్‌ను మా సీనియర్ మేనేజర్‌కు బదిలీ చేస్తున్నాను. దయచేసి లైన్‌లో ఉండండి.";
              } else if (agent.language === "Tamil") {
                reply = "நிச்சயமாக, உங்கள் அழைப்பை எங்கள் மூத்த மேலாளருக்கு மாற்றுகிறேன். தயவுசெய்து லைனில் காத்திருங்கள்.";
              } else if (agent.language === "Hindi") {
                reply = "बिल्कुल, मैं आपकी कॉल हमारे सीनियर मैनेजर को ट्रांसफर कर रहा हूँ। कृपया लाइन पर बने रहें।";
              } else if (agent.language === "Malayalam") {
                reply = "തീർച്ചയായും, ഞാൻ നിങ്ങളുടെ കോൾ ഞങ്ങളുടെ സീനിയർ മാനേജർക്ക് കൈമാറാം. ദയവായി ലൈനിൽ തുടരുക.";
              } else {
                reply = "Certainly. I am transferring your call to our service supervisor immediately. Please hold.";
              }
              escalated = true;
              summary = "Simulated intent matching: Human Transfer Escalation";
              outcome = "Human Escalation";
            }
            else if (isScheduling) {
              if (agent.language === "Kannada") {
                reply = "ಖಂಡಿತ! ನಿಮ್ಮ ಅನುಕೂಲಕ್ಕೆ ತಕ್ಕಂತೆ ಉಚಿತ ಸಮಾಲೋಚನೆ ಹಾಗೂ ಡೆಮೊ ಸಮಯವನ್ನು ನಿಗದಿಪಡಿಸೋಣವೇ? ನಾಳೆ ಮಧ್ಯಾಹ್ನ ೩ ಗಂಟೆ ಓಕೆನಾ?";
              } else if (agent.language === "Telugu") {
                reply = "తప్పకుండా! మీ అనుకూలత ప్రకారం ఒక ఉచిత సంప్రదింపు మరియు డెమో సమయాన్ని షెడ్యూల్ చేద్దామా? రేపు మధ్యాహ్నం 3 గంటలకు ఓకేనా?";
              } else if (agent.language === "Tamil") {
                reply = "நிச்சயமாக! உங்கள் வசதிக்கேற்ப இலவச ஆலோசனையையும் டெமோவையும் பதிவு செய்யலாமா? நாளை मதியம் 3 மணி உங்களுக்கு வசதியாக இருக்குமா?";
              } else if (agent.language === "Hindi") {
                reply = "ज़रूर! क्या हम आपकी सुविधा के अनुसार एक मुफ्त परामर्श और डेमो बुक करें? क्या कल दोपहर 3 बजे का समय सही रहेगा?";
              } else if (agent.language === "Malayalam") {
                reply = "തീർച്ചയായും! നിങ്ങളുടെ സൗകര്യാനുസരണം ഒരു സൌജന്യ ഡെമോ ബുക്ക് ചെയ്യട്ടെയോ? നാളെ ഉച്ചയ്ക്ക് 3 മണിക്ക് സൗകര്യപ്രദമാണോ?";
              } else {
                reply = "Absolutely! Let's schedule a free demo and consultation callback for your business. Does tomorrow at 3 PM work for you?";
              }
              bookDate = new Date(Date.now() + 86400000).toISOString().split("T")[0]; // tomorrow
              bookTime = "15:00";
              bookNotes = "Demo booking requested from call simulator.";
              summary = "Simulated intent matching: Demo Booking";
              outcome = "Appointment Confirmed";
            }
            else if (isBusiness) {
              if (agent.language === "Kannada") {
                reply = "VoiceOS AI ಎಂಬುದು ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ ಆಧಾರಿತ ಧ್ವನಿ ನೌಕರರ ವೇದಿಕೆಯಾಗಿದೆ. ಇದು ಗ್ರಾಹಕರ ಕರೆಗಳಿಗೆ ಉತ್ತರಿಸಲು, ಲೀಡ್‌ಗಳನ್ನು ಕ್ವಾಲಿಫೈ ಮಾಡಲು ಮತ್ತು ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳನ್ನು ಬುಕ್ ಮಾಡಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.";
              } else if (agent.language === "Telugu") {
                reply = "VoiceOS AI అనేది ఆర్టిఫిషియల్ ఇంటెలిజెన్స్ ఆధారిత వాయిస్ ఎంప్లాయ్ ప్లాట్‌ఫారమ్. ఇది మీ కస్టమర్ల కాల్స్ ఆన్సర్ చేయడానికి మరియు మీటింగ్‌లు బుక్ చేయడానికి సహాయపడుతుంది.";
              } else if (agent.language === "Tamil") {
                reply = "VoiceOS AI என்பது செயற்கை நுண்ணறிவு அடிப்படையிலான குரல் பணியாளர் தளமாகும். இது வாடிக்கையாளர் அழைப்புகளுக்கு பதிலளிக்கவும், முன்பதிవు செய்யவும் உதவுகிறது.";
              } else if (agent.language === "Hindi") {
                reply = "VoiceOS AI एक आर्टिफ़िशियल इंटेलिजेंस आधारित वॉयस कर्मचारी प्लेटफ़ॉर्म है। यह आपके ग्राहकों की कॉल का उत्तर देने और लीड्स बुक करने में मदद करता है।";
              } else if (agent.language === "Malayalam") {
                reply = "VoiceOS AI എന്നത് ആർട്ടിഫിഷ്യൽ ഇന്റലിജൻസ് അടിസ്ഥാനമാക്കിയുള്ള ഒരു വോയ്സ് പ്ലാറ്റ്ഫോമാണ്. ഇത് ഉപഭോക്താക്കളുടെ കോളുകൾക്ക് മറുപടി നൽകാനും മീറ്റിംഗുകൾ ബുക്ക് ചെയ്യാനും സഹായിക്കുന്നു.";
              } else {
                reply = "VoiceOS AI provides automated conversational voice employees that answer customer calls, qualify leads, and book appointments 24/7.";
              }
              summary = "Simulated intent matching: Platform Inquiry";
              outcome = "Information provided";
            }
            else {
              // Fallback to default
              if (agent.language === "Kannada") {
                reply = agent.fallback_response || "ಕ್ಷಮಿಸಿ, ಆ ಬಗ್ಗೆ ನನ್ನ ಹತ್ತಿರ ಮಾಹಿತಿ ಇಲ್ಲ. ಬೇರೆ ಸಹಾಯ ಬೇಕಾಗಿದೆಯೇ?";
              } else if (agent.language === "Telugu") {
                reply = agent.fallback_response || "క్షమించండి, ఆ సమాచారం నా దగ్గర లేదు. మరి ఏదైనా సహాయం కావాలా?";
              } else if (agent.language === "Tamil") {
                reply = agent.fallback_response || "மன்னிக்கவும், அந்த தகவல் என்னிடம் இல்லை. வேறு ஏதேனும் உதவி தேவையா?";
              } else if (agent.language === "Hindi") {
                reply = agent.fallback_response || "माफ़ कीजिये, मेरे पास वह जानकारी नहीं है। क्या कोई अन्य सहायता चाहिए?";
              } else if (agent.language === "Malayalam") {
                reply = agent.fallback_response || "ക്ഷമിക്കണം, ആ വിവരങ്ങൾ എന്റെ പക്കലില്ല. മറ്റ് എന്തെങ്കിലും സഹായം ആവശ്യമുണ്ടോ?";
              } else {
                reply = agent.fallback_response || "I'm sorry, I don't have that information. How else can I assist you?";
              }
              summary = "Offline Fallback: No matching FAQ found.";
              outcome = "General Fallback";
            }
          }
          
          sentiment = "neutral";
          escalated = false;
        } else {
          console.error("[OpenAI API Failure] Component: OpenAI GPT-4o - Execution error details: ", err);
          throw new Error(`OpenAI GPT-4o API execution error: ${err.message || err}`);
        }
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

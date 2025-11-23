import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { messages, language = 'en' } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Check for Gemini API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY environment variable is not set' },
        { status: 500 }
      );
    }

    const languageDescriptor = language === 'zh' ? 'Simplified Chinese' : 'English';

    // Banking system prompt with detailed descriptions
    const bankingSystemPrompt = `You are an AI assistant for OCBC Bank's AI Smart Inquiry System (OASIS). Your role is to help customers with banking enquiries in a friendly, professional, and helpful manner. Always respond in ${languageDescriptor} unless the user explicitly requests another language.

${language === 'zh' ? `CRITICAL TRANSLATION REQUIREMENT - READ CAREFULLY:
When responding in Chinese, you MUST translate EVERY English word and phrase to Chinese. DO NOT leave any English words in your response except for:
- Phone numbers (e.g., 1800 363 3333, +65 6363 3333)
- URLs and website addresses
- Specific codes (e.g., 72327)
- The bank name "OCBC" (but translate "OCBC Bank" to "OCBC 银行")

MANDATORY TRANSLATIONS - Use these exact translations:
- "OCBC Mobile" → "OCBC 手机银行" (NEVER write "OCBC Mobile" in Chinese responses)
- "Mobile Banking" → "手机银行"
- "Internet Banking" → "网上银行" (NEVER write "Internet Banking" in Chinese responses)
- "SMS Banking" → "短信银行" (NEVER write "SMS Banking" in Chinese responses)
- "SMS" → "短信"
- "ATM" → "自动提款机" or "ATM机"
- "Phone Banking" → "电话银行"
- "Customer Service" → "客户服务"
- "Hotline" → "热线"
- "Branch" → "分行"
- "Password" → "密码"
- "Two-step verification" → "两步验证"
- "QR code" → "二维码"
- "persists" → "持续" or "仍然存在"
- "account" → "账户" or "户口"
- "login" → "登录"
- "reset password" → "重置密码"
- "forgot password" → "忘记密码"
- "browser cache" → "浏览器缓存"
- "network connection" → "网络连接"
- "security settings" → "安全设置"
- "contact" → "联系"
- "human support" → "人工支持"

BAD EXAMPLES (DO NOT DO THIS):
❌ "使用 OCBC Mobile 进行登录" 
❌ "使用 SMS Banking 进行登录"
❌ "如果问题 persists"
❌ "联系我们的 Customer Service"

GOOD EXAMPLES (DO THIS):
✅ "使用 OCBC 手机银行进行登录"
✅ "使用短信银行进行登录"
✅ "如果问题仍然存在"
✅ "联系我们的客户服务"

Remember: Your entire response must be in Chinese. If you find yourself writing English words, translate them immediately.` : ''}

ABOUT OCBC BANK:
- OCBC Bank is one of the largest and most established banks in Singapore
- Founded in 1932, serving customers for over 90 years
- Offers comprehensive banking services including personal banking, wealth management, insurance, and investment services
- Committed to providing excellent customer service and innovative banking solutions

YOUR CAPABILITIES:
You can help customers with:
- Account Management: Balance inquiries, account opening, account types, statements, profile updates
- Card Services: Lost/stolen card reporting, card activation, blocking/unblocking, card features
- Money Transfers: Local transfers (OCBC to OCBC, FAST transfers), overseas remittances, payment services
- Loans: Personal loans, home loans, loan applications, loan calculators, interest rates
- Investments: Investment accounts, trading platforms, investment products, market information
- Digital Banking: Mobile Banking app, Internet Banking, digital services, security features
- General Banking: Branch locations, ATM locator, contact information, banking hours

IMPORTANT CONTACT INFORMATION:
- 24/7 Customer Service Hotline: 1800 363 3333 (from Singapore) or +65 6363 3333 (from overseas)
- Lost Card Hotline: 1800 363 3333 (available 24/7)
- SMS Banking: Text commands to 72327
- Branch Locator: Available on OCBC website
- Email Support: Available via OCBC website

RESPONSE GUIDELINES:
1. Always be polite, professional, and empathetic
2. Provide clear, detailed, and accurate information
3. Use step-by-step instructions when explaining processes
4. Mention relevant self-service options and digital channels
5. Include important notes, fees, or requirements when relevant
6. If you cannot fully resolve an issue, suggest escalating to human support
7. Always emphasize security best practices
8. Provide specific contact numbers, URLs, or branch information when relevant
${language === 'zh' ? `9. CRITICAL: When responding in Chinese, your response must be 100% in Chinese. Before sending your response, review it and translate ANY remaining English words to Chinese. Common mistakes to avoid:
   - Never write "OCBC Mobile" - always write "OCBC 手机银行"
   - Never write "Internet Banking" - always write "网上银行"
   - Never write "SMS Banking" - always write "短信银行"
   - Never write English verbs like "persists", "contact", "login" - translate them all
   - If you catch yourself writing English, stop and translate it immediately` : ''}

COMMON QUERIES - DETAILED RESPONSES:
- Balance Checks: Explain multiple methods (Mobile Banking, Internet Banking, ATM, SMS, Phone Banking) with specific instructions
- Lost Cards: Emphasize immediate reporting, provide hotline number, explain replacement process and timeline
- Account Opening: Detail account types, required documents, minimum deposits, online vs branch options
- Money Transfers: Explain different transfer types (OCBC to OCBC, FAST, overseas), fees, processing times, daily limits
- Loans: Provide information on loan types, eligibility, interest rates, application process, required documents
- Investments: Explain investment account types, account opening process, trading platforms, risk assessment requirements

Always provide comprehensive, helpful responses that empower customers to take action. Maintain a warm, professional tone throughout.`;

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      systemInstruction: bankingSystemPrompt,
    });

    // Build conversation history for Gemini
    // Convert messages to Gemini format (excluding the last user message which we'll send separately)
    // Gemini requires history to start with 'user' role and alternate between 'user' and 'model'
    const history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    
    // Process all messages except the last one
    // Find the first user message to start the history
    let startIndex = 0;
    while (startIndex < messages.length - 1 && messages[startIndex].sender !== 'user') {
      startIndex++; // Skip any leading bot messages
    }
    
    // Build history starting from the first user message
    for (let i = startIndex; i < messages.length - 1; i++) {
      const msg = messages[i];
      const role = msg.sender === 'user' ? 'user' : 'model';
      
      // Skip if the last message in history has the same role (merge consecutive messages)
      if (history.length > 0 && history[history.length - 1].role === role) {
        // Merge with previous message
        history[history.length - 1].parts[0].text += '\n' + msg.text;
        continue;
      }
      
      history.push({
        role,
        parts: [{ text: msg.text }],
      });
    }

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.sender !== 'user') {
      return NextResponse.json(
        { error: 'Last message must be from user' },
        { status: 400 }
      );
    }

    // Start chat with history (only include if we have valid history starting with user)
    const chatConfig: any = {
      generationConfig: {
        temperature: 0.4,
      },
    };
    
    if (history.length > 0 && history[0].role === 'user') {
      chatConfig.history = history;
    }
    
    const chat = model.startChat(chatConfig);

    // Send the last user message to Gemini
    const result = await chat.sendMessage(lastMessage.text);
    const response = await result.response;
    let fullResponse = response.text();
    
    // Post-process Chinese responses to replace common English terms
    if (language === 'zh' && fullResponse) {
      const translations: { [key: string]: string } = {
        'OCBC Mobile': 'OCBC 手机银行',
        'Mobile Banking': '手机银行',
        'Internet Banking': '网上银行',
        'SMS Banking': '短信银行',
        'SMS': '短信',
        'Phone Banking': '电话银行',
        'Customer Service': '客户服务',
        'Hotline': '热线',
        'Branch': '分行',
        'Password': '密码',
        'Two-step verification': '两步验证',
        'QR code': '二维码',
        'persists': '仍然存在',
        'contact': '联系',
        'human support': '人工支持',
        'reset password': '重置密码',
        'forgot password': '忘记密码',
        'browser cache': '浏览器缓存',
        'network connection': '网络连接',
        'security settings': '安全设置',
      };
      
      // Replace English terms with Chinese translations
      // Use word boundaries to avoid partial matches
      for (const [english, chinese] of Object.entries(translations)) {
        // Create regex with word boundaries, case insensitive
        const regex = new RegExp(`\\b${english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        fullResponse = fullResponse.replace(regex, chinese);
      }
    }
    
    return NextResponse.json({
      message: fullResponse || 'Sorry, I could not generate a response.',
    });
  } catch (error) {
    console.error('Chat API error:', error);
    
    // Check for Gemini API specific errors
    if (error instanceof Error) {
      // Network/connectivity errors
      if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        return NextResponse.json(
          {
            error: 'Network error: Unable to connect to Gemini API. Please check your internet connection and try again.',
            hint: 'If the problem persists, verify your GEMINI_API_KEY is correct in .env',
          },
          { status: 503 }
        );
      }
      
      // API key errors
      if (error.message.includes('API_KEY') || error.message.includes('API key')) {
        return NextResponse.json(
          {
            error: 'Invalid GEMINI_API_KEY. Please check your API key in .env',
            hint: 'Get your API key from https://makersuite.google.com/app/apikey',
          },
          { status: 401 }
        );
      }
      
      // Quota/rate limit errors
      if (error.message.includes('quota') || error.message.includes('rate limit') || error.message.includes('429')) {
        return NextResponse.json(
          {
            error: 'Gemini API quota exceeded or rate limit reached. Please try again later.',
          },
          { status: 429 }
        );
      }
      
      // Permission errors
      if (error.message.includes('PERMISSION_DENIED') || error.message.includes('403')) {
        return NextResponse.json(
          {
            error: 'Permission denied. Please check your Gemini API key permissions.',
          },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


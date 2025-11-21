import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages, language = 'en' } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const languageDescriptor = language === 'zh' ? 'Simplified Chinese' : 'English';

    // Banking system prompt with detailed descriptions
    const bankingSystemPrompt = `You are an AI assistant for OCBC Bank's AI Smart Inquiry System (OASIS). Your role is to help customers with banking enquiries in a friendly, professional, and helpful manner. Always respond in ${languageDescriptor} unless the user explicitly requests another language.

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

COMMON QUERIES - DETAILED RESPONSES:
- Balance Checks: Explain multiple methods (Mobile Banking, Internet Banking, ATM, SMS, Phone Banking) with specific instructions
- Lost Cards: Emphasize immediate reporting, provide hotline number, explain replacement process and timeline
- Account Opening: Detail account types, required documents, minimum deposits, online vs branch options
- Money Transfers: Explain different transfer types (OCBC to OCBC, FAST, overseas), fees, processing times, daily limits
- Loans: Provide information on loan types, eligibility, interest rates, application process, required documents
- Investments: Explain investment account types, account opening process, trading platforms, risk assessment requirements

Always provide comprehensive, helpful responses that empower customers to take action. Maintain a warm, professional tone throughout.`;

    // Format messages for Ollama API with system prompt
    const formattedMessages = [
      {
        role: 'system',
        content: bankingSystemPrompt,
      },
      ...messages.map((msg: { sender: string; text: string }) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
      })),
    ];

    // Get Ollama URL from environment or use default
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    const model = process.env.OLLAMA_MODEL || 'llama3.2'; // Default to llama3.2 (smaller, faster)

    // Call Ollama API
    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: formattedMessages,
        stream: false, // Set to true if you want streaming responses
        options: {
          temperature: 0.4,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ollama API error:', errorText);
      
      // If Ollama is not running, provide helpful error message
      if (response.status === 0 || response.status === 500) {
        return NextResponse.json(
          {
            error: 'Ollama is not running. Please make sure Ollama is installed and running on your machine.',
            hint: 'Install from https://ollama.com and run: ollama pull llama3.2',
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: `Ollama API error: ${errorText}` },
        { status: response.status }
      );
    }

    // Ollama returns newline-delimited JSON stream even with stream: false
    // We need to read it as text and parse each line
    const text = await response.text();
    const lines = text.trim().split('\n');
    
    let fullResponse = '';
    for (const line of lines) {
      if (line.trim()) {
        try {
          const json = JSON.parse(line);
          if (json.message?.content) {
            fullResponse += json.message.content;
          }
        } catch (e) {
          // Skip invalid JSON lines
          console.warn('Failed to parse line:', line);
        }
      }
    }
    
    return NextResponse.json({
      message: fullResponse || 'Sorry, I could not generate a response.',
    });
  } catch (error) {
    console.error('Chat API error:', error);
    
    // Check if it's a connection error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        {
          error: 'Cannot connect to Ollama. Please make sure Ollama is running on your machine.',
          hint: 'Install from https://ollama.com and run: ollama pull llama3.2',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


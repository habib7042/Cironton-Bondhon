
// Client-side service that calls our internal Next.js API route
// This prevents exposing the API key to the browser and solves CORS/Referrer issues

export const getFinancialAdvice = async (
  query: string,
  context: string
): Promise<string> => {
  try {
    // Create a timeout controller to prevent infinite loading
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `User Query: ${query}\n\nContext (User Data): ${context}`,
        systemInstruction: "You are 'Fund Buddy', a helpful and respectful AI community assistant for 'চিরন্তন বন্ধন' (Chiroton Bondhon). You follow Islamic etiquette and values. Always start conversations with 'Assalamu Alaikum' or a polite Islamic greeting. Your goal is to encourage community savings (Samity), explain how the fund works, and help with deposit/withdraw queries. Use Bangladeshi Taka (BDT). Keep answers concise, ethical, and motivating."
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch AI response');
    }

    const data = await response.json();
    return data.text || "I couldn't generate a response right now.";

  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    if (error.name === 'AbortError') {
        return "The connection is taking too long. Please check your internet or try again.";
    }
    return "I'm having trouble connecting to the assistant. Please try again later.";
  }
};

export const getLoginHelp = async (topic: string): Promise<string> => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const response = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: `User is having trouble with: ${topic} during login.`,
                systemInstruction: "You are a support bot for চিরন্তন বন্ধন. You are polite and follow Islamic etiquette. Start with 'Assalamu Alaikum'. Explain how to access the community savings account securely. Keep it reassuring."
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            return "Please contact your group admin for help logging in.";
        }

        const data = await response.json();
        return data.text || "Please contact support.";

    } catch (error) {
        return "Please contact your group admin.";
    }
}

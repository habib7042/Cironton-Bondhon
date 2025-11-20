
import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key not found");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const getFinancialAdvice = async (
  query: string,
  context: string
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "AI services are currently unavailable. Please check your connection.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `User Query: ${query}\n\nContext (User Data): ${context}`,
      config: {
        systemInstruction: "You are 'Fund Buddy', a friendly AI community manager for 'চিরন্তন বন্ধন' (Chiroton Bondhon), a group savings app in Bangladesh. Users pool money together monthly. Your goal is to encourage saving, explain how the fund works (everyone contributes equally), and help with deposit/withdraw queries. Use Bangladeshi Taka (BDT). Keep answers concise, motivating, and fun.",
      },
    });
    return response.text || "I couldn't generate a response right now.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having trouble connecting to the secure server.";
  }
};

export const getLoginHelp = async (topic: string): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "Help services unavailable.";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User is having trouble with: ${topic} during login.`,
            config: {
                systemInstruction: "You are a support bot for চিরন্তন বন্ধন. Explain how to access the community savings account. Keep it reassuring.",
            }
        });
        return response.text || "Please contact support.";
    } catch (error) {
        return "Please contact your group admin.";
    }
}
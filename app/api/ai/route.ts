
import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
  try {
    // 1. Verify API Key exists on the server
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key is missing in server environment.' },
        { status: 500 }
      );
    }

    // 2. Parse request
    const body = await request.json();
    const { prompt, systemInstruction } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // 3. Initialize Gemini Client (Server-side)
    const ai = new GoogleGenAI({ apiKey });
    
    // 4. Generate Content
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    // 5. Return text
    return NextResponse.json({ text: response.text });

  } catch (error: any) {
    console.error("Gemini Server Error:", error);
    
    // Handle specific Google API errors
    if (error.message?.includes('403')) {
       return NextResponse.json(
         { error: 'Permission Denied: Please enable "Generative Language API" in your Google Cloud Console.' },
         { status: 403 }
       );
    }

    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

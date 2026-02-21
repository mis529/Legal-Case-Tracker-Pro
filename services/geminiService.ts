import { GoogleGenAI, Type } from "@google/genai";

// FIX: Use lazy initialization to prevent crashing on startup if API key is missing.
let aiInstance: GoogleGenAI | null = null;

function getAi() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set. Please configure it in your environment variables.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function suggestCourseOfAction(caseTypeName: string): Promise<string[]> {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert legal strategist. Based on a legal case of type "${caseTypeName}", suggest three potential next strategic courses of action. 
      Focus on actionable legal steps such as filing specific applications, preparing evidence, or procedural maneuvers. 
      Keep each suggestion concise (under 15 words) and highly professional.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
                description: 'A single, concise course of action.'
              }
            }
          }
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
      console.warn("Gemini API returned an empty response.");
      return [];
    }
    
    const result = JSON.parse(jsonText.trim());
    
    if (result && Array.isArray(result.suggestions)) {
        return result.suggestions;
    }

    return [];
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to fetch suggestions from Gemini API.");
  }
}
import { GoogleGenAI, Type } from "@google/genai";

// FIX: Per @google/genai guidelines, use process.env.GEMINI_API_KEY for the Gemini API.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function suggestCourseOfAction(caseTypeName: string): Promise<string[]> {
  // FIX: Per @google/genai guidelines, removed check for API_KEY and mock data fallback.
  // The guidelines state to assume the API key is always available from the environment.
  try {
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
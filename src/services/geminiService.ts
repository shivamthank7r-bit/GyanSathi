import { GoogleGenAI } from "@google/genai";

let aiInstance: any = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("MISSING_API_KEY");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export interface GenerationParams {
  subject: string;
  prompt: string;
  image?: {
    mimeType: string;
    data: string;
  };
}

export async function solveProblem({ subject, prompt, image }: GenerationParams) {
  const parts = [];
  
  if (image) {
    parts.push({
      inlineData: {
        mimeType: image.mimeType,
        data: image.data,
      },
    });
  }
  
  parts.push({ text: `Subject: ${subject}\n\nQuestion/Problem: ${prompt}` });

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: { parts },
      config: {
        temperature: 0.7,
        topP: 0.95,
      },
    });

    if (!response.text) {
      throw new Error("EMPTY_RESPONSE");
    }

    return response.text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    const message = error.message || "";
    
    if (message === "MISSING_API_KEY") throw error;
    if (message.includes("quota") || message.includes("429")) {
      throw new Error("QUOTA_EXCEEDED");
    }
    if (message.includes("API key not valid") || message.includes("403")) {
      throw new Error("INVALID_API_KEY");
    }
    if (message.includes("safety")) {
      throw new Error("SAFETY_VIOLATION");
    }
    
    throw new Error("GENERIC_API_ERROR");
  }
}

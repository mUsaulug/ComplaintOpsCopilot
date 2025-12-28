
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, ComplaintCategory, Priority, Sentiment, Suggestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function analyzeComplaint(text: string): Promise<{ analysis: AnalysisResult; suggestion: Suggestion }> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze this banking complaint and provide structured feedback. Complaint: "${text}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          analysis: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, enum: Object.values(ComplaintCategory) },
              priority: { type: Type.STRING, enum: Object.values(Priority) },
              sentiment: { type: Type.STRING, enum: Object.values(Sentiment) },
              confidenceScore: { type: Type.NUMBER },
              reasoning: { type: Type.STRING }
            },
            required: ["category", "priority", "sentiment", "confidenceScore", "reasoning"]
          },
          suggestion: {
            type: Type.OBJECT,
            properties: {
              responseDraft: { type: Type.STRING },
              actions: { type: Type.ARRAY, items: { type: Type.STRING } },
              kbArticles: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    relevance: { type: Type.NUMBER }
                  },
                  required: ["id", "title", "relevance"]
                }
              }
            },
            required: ["responseDraft", "actions", "kbArticles"]
          }
        },
        required: ["analysis", "suggestion"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function chatWithAI(history: { role: string; parts: { text: string }[] }[], message: string) {
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
        systemInstruction: "You are ComplaintOps Copilot, an advanced banking expert assistant. Help the operator with deep policy questions or complex cases."
    }
  });
  
  // Note: Standard sendMessage doesn't take history in this wrapper conveniently, but we can manage local history state
  const result = await chat.sendMessage({ message });
  return result.text;
}

export async function generateHighQualityImage(prompt: string, size: "1K" | "2K" | "4K" = "1K") {
    // Requires key selection per guidelines
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: {
            imageConfig: {
                aspectRatio: "1:1",
                imageSize: size
            }
        },
    });
    
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    return null;
}

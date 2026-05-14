import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface DocumentData {
  name: string;
  mimeType: string;
  data: string; // base64 for PDF, text for others
}

export async function askGemini(prompt: string, document?: DocumentData, history: { role: 'user' | 'model', content: string }[] = []) {
  const modelName = "gemini-3-flash-preview";
  
  const contents: any[] = history.map(h => ({
    role: h.role === 'model' ? 'model' : 'user',
    parts: [{ text: h.content }]
  }));

  const parts: Part[] = [];
  
  if (document) {
    if (document.mimeType === 'application/pdf') {
      parts.push({
        inlineData: {
          mimeType: document.mimeType,
          data: document.data
        }
      });
    } else {
      parts.push({ text: `Document Context (${document.name}):\n${document.data}\n\n` });
    }
  }

  parts.push({ text: prompt });
  contents.push({ role: 'user', parts });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction: "You are ROBYY, an elite AI assistant by Ash AI. Your mission is to provide high-fidelity intelligence. If a document is provided, analyze it deeply. If no document is present, use your vast general knowledge and real-time reasoning to help the user. Be concise, authoritative, and helpful.",
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

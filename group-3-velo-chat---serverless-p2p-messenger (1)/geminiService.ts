import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  /**
   * Fetches a response from the Gemini model using the provided environment API_KEY.
   */
  async getChatResponse(prompt: string): Promise<string | undefined> {
    // API key must be obtained from process.env.API_KEY
    const apiKey = process.env.API_KEY;
    if (!apiKey) return "Nexus AI is offline. Missing API Handshake Key.";

    try {
      // Must use new GoogleGenAI({ apiKey: process.env.API_KEY })
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: 'You are Velo AI, a sovereign P2P networking assistant. Be extremely concise, highly technical yet accessible, and prioritize privacy-first language.',
        }
      });
      // Correct usage: Access response.text property directly (not a method)
      return response.text;
    } catch (error) {
      console.error("Gemini Handshake Error:", error);
      return "The AI synchronization failed. Retrying node link...";
    }
  }
}
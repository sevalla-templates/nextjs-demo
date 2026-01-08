
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  // Client instance should be created per request to ensure latest API key is used

  async getChatResponse(prompt: string): Promise<string | undefined> {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return "Velo AI is currently offline. Please ensure a valid environment configuration.";

    try {
      // Create new instance before call as per guidelines
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: 'You are Velo AI, a high-speed assistant integrated into Velo Chat, a distributed P2P messenger. Be extremely concise, helpful, and use technical yet friendly language. Always emphasize privacy and distributed networking when asked.',
        }
      });
      // Correct usage: Access response.text property directly
      return response.text;
    } catch (error) {
      console.error("Gemini Error:", error);
      return "The connection to Velo AI was interrupted.";
    }
  }

  async summarizeChat(history: string): Promise<string | undefined> {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return undefined;

    try {
      // Create new instance before call
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide a 3-bullet point summary of this distributed conversation:\n\n${history}`,
      });
      // Correct usage: Access response.text property directly
      return response.text;
    } catch (error) {
      console.error("Summary Error:", error);
      return undefined;
    }
  }
}

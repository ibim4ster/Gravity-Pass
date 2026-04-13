import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateSecurePassword(requirements: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a highly secure, memorable password or passphrase based on these requirements: ${requirements}. 
    Return ONLY the password string, nothing else. No markdown, no explanations.`,
    config: {
      temperature: 0.7,
    }
  });
  return response.text?.trim() || "";
}

export async function analyzePasswordStrength(password: string): Promise<{ score: number; feedback: string; vulnerabilities: string[] }> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the strength of the following password: "${password}". 
    Provide a score from 0 to 100, constructive feedback, and a list of potential vulnerabilities (e.g., "dictionary word", "too short", "predictable substitution").`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: {
            type: Type.NUMBER,
            description: "A score from 0 to 100 representing password strength."
          },
          feedback: {
            type: Type.STRING,
            description: "Constructive feedback on how to improve the password."
          },
          vulnerabilities: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of detected vulnerabilities."
          }
        },
        required: ["score", "feedback", "vulnerabilities"]
      }
    }
  });

  try {
    const jsonStr = response.text?.trim() || "{}";
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return { score: 0, feedback: "Error analyzing password.", vulnerabilities: [] };
  }
}

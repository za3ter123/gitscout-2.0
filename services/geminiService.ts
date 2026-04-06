import { GoogleGenAI, Type } from "@google/genai";
import { GitHubRepo, AIRating } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to check if key exists
const checkKey = () => {
  if (!apiKey) throw new Error("API Key is missing in environment variables.");
};

/**
 * The "Google-like" Search Brain.
 * Translates natural language into GitHub's strict search syntax.
 */
export const optimizeSearchQuery = async (userQuery: string): Promise<string> => {
  if (!apiKey) return userQuery;
  
  // If user is already using advanced syntax, leave it alone
  if (userQuery.includes(':') || userQuery.includes('user:')) return userQuery;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        You are a search query optimizer for GitHub. 
        Convert the user's natural language request into a precise GitHub Search API query string.
        
        Rules:
        1. Use OR for synonyms (e.g., "react" -> "(react OR reactjs)").
        2. Target fields: \`in:name,description,topics,readme\`.
        3. Add \`language:X\` if a language is mentioned.
        4. Add \`sort:stars\` if words like "best", "top", "popular" are used.
        5. Add \`created:>YYYY-MM-DD\` if "new" or "recent" is used (assume current year is ${new Date().getFullYear()}).
        
        User Input: "${userQuery}"
        
        Output ONLY the raw query string. No markdown, no explanations.
      `,
    });
    
    const optimized = response.text?.trim();
    return optimized || userQuery;
  } catch (error) {
    console.error("AI Search Optimization Failed:", error);
    return userQuery; // Fallback to raw query
  }
};

/**
 * Rates a repository out of 10 based on metadata.
 */
export const rateRepository = async (repo: GitHubRepo): Promise<AIRating> => {
  checkKey();
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Analyze this GitHub Repo:
        Name: ${repo.full_name}
        Desc: ${repo.description}
        Stars: ${repo.stargazers_count}
        Language: ${repo.language}
        Topics: ${repo.topics.join(', ')}
        Last Update: ${repo.updated_at}
        
        Task: Rate it out of 10. Be critical.
        Return JSON matching this schema:
        {
          "score": number (0-10),
          "summary": "A single, punchy, actionable verdict summarizing the repo (e.g., 'A robust, production-ready React framework for building fast static sites.').",
          "pros": ["string", "string", "string"],
          "cons": ["string", "string", "string"],
          "useCases": ["string", "string", "string", "string", "string"],
          "relatedTech": ["string", "string", "string", "string", "string"],
          "tutorial": "A concise, step-by-step tutorial on how to use, launch, or install the project. Use numbered lists."
        }
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            pros: { type: Type.ARRAY, items: { type: Type.STRING } },
            cons: { type: Type.ARRAY, items: { type: Type.STRING } },
            useCases: { type: Type.ARRAY, items: { type: Type.STRING } },
            relatedTech: { type: Type.ARRAY, items: { type: Type.STRING } },
            tutorial: { type: Type.STRING },
          },
          required: ["score", "summary", "pros", "cons", "useCases", "relatedTech", "tutorial"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text) as AIRating;
  } catch (error) {
    console.error("AI Rating Failed:", error);
    throw error;
  }
};

/**
 * Chat Assistant
 */
export const sendChatMessage = async (history: {role: string, content: string}[], context?: string): Promise<string> => {
  checkKey();
  
  let systemPrompt = "You are GitScout, an elite software engineer assistant. Help the user debug, understand, or find repositories.";
  if (context) {
    systemPrompt += `\n\nCURRENT REPO CONTEXT:\n${context}`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] }, // System instruction as first user message works well for context
        ...history.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }]
        }))
      ]
    });
    
    return response.text || "I'm having trouble thinking right now.";
  } catch (error) {
    console.error("Chat Failed:", error);
    return "Error connecting to AI service.";
  }
};
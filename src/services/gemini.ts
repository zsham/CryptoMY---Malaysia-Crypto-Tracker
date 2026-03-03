import { GoogleGenAI, Type } from "@google/genai";
import { Coin } from "../types/crypto";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getMarketAnalysis(coins: Coin[]) {
  const coinSummary = coins.slice(0, 10).map(c => 
    `${c.name} (${c.symbol.toUpperCase()}): RM${c.current_price.toLocaleString()} (${c.price_change_percentage_24h.toFixed(2)}% 24h)`
  ).join(", ");

  const prompt = `As a senior crypto strategist for the Malaysian market, provide a sophisticated market briefing. 
  Current data for top assets: ${coinSummary}.
  
  Include:
  1. A "Market Sentiment" rating (e.g., Bullish, Bearish, Neutral).
  2. Key observations on price action.
  3. Potential impact of global trends on the Malaysian Ringgit (MYR) crypto pairs.
  
  Keep it concise (max 200 words). Use professional financial terminology. Format with clear headings.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    return response.text || "Unable to generate analysis at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Market analysis temporarily unavailable.";
  }
}

export async function getCoinDeepDive(coin: Coin) {
  const prompt = `Analyze ${coin.name} (${coin.symbol.toUpperCase()}) currently trading at RM${coin.current_price.toLocaleString()}.
  24h Change: ${coin.price_change_percentage_24h.toFixed(2)}%.
  Market Cap: RM${coin.market_cap.toLocaleString()}.
  
  Provide a "Quick Intelligence" report:
  - Technical Outlook (Short-term)
  - Risk Level (1-10)
  - One key fundamental factor to watch.
  
  Format as a compact list. Be objective.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "No deep dive available.";
  } catch (error) {
    return "Intelligence module offline.";
  }
}

export async function askAnalyst(query: string, contextCoins: Coin[]) {
  const context = contextCoins.slice(0, 5).map(c => `${c.name}: RM${c.current_price}`).join(", ");
  
  const prompt = `User Question: "${query}"
  Current Market Context (MYR): ${context}
  
  Answer as a helpful, intelligent crypto advisor. Use search grounding if the question is about recent news or specific events. 
  Keep it under 100 words. Focus on clarity and actionable insights.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    return response.text || "I'm not sure how to answer that right now.";
  } catch (error) {
    return "Connection to analyst lost.";
  }
}

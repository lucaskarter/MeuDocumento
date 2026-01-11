import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export interface AnalysisResult {
  suggestedTitle: string;
  summary: string;
  category: string;
}

export const analyzeDocumentImage = async (base64Image: string): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    console.warn("API Key missing, returning mock data");
    return {
      suggestedTitle: "Documento Digitalizado",
      summary: "Análise indisponível (Sem API Key)",
      category: "Geral"
    };
  }

  try {
    // Remove header from base64 string if present (data:image/jpeg;base64,...)
    const base64Data = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Data
          }
        },
        {
          text: "Analise esta imagem de documento. Identifique: 1. Um título curto e sugestivo. 2. Um resumo de 1 frase. 3. A melhor categoria (Identidade, Finanças, Saúde, Educação, Outros). Responda em JSON."
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedTitle: { type: Type.STRING },
            summary: { type: Type.STRING },
            category: { type: Type.STRING }
          }
        }
      }
    });

    const jsonText = response.text || "{}";
    const result = JSON.parse(jsonText) as AnalysisResult;
    return result;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
        suggestedTitle: "Documento Novo",
        summary: "Não foi possível analisar automaticamente.",
        category: "Geral"
    };
  }
};
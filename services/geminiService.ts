
import { GoogleGenAI, Type } from "@google/genai";
import { NodeType, NodeStatus, EdgeIntensity } from "../types";

// Schema definition for structured investigation data extraction following Google GenAI guidelines
const investigationSchema = {
  type: Type.OBJECT,
  properties: {
    nodes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          type: { type: Type.STRING, enum: Object.values(NodeType) },
          description: { type: Type.STRING },
          date: { type: Type.STRING, description: "Formato YYYY-MM-DD" },
          status: { type: Type.STRING, enum: Object.values(NodeStatus) },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["title", "type", "description", "status"]
      }
    },
    edges: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          sourceTitle: { type: Type.STRING },
          targetTitle: { type: Type.STRING },
          label: { type: Type.STRING },
          intensity: { type: Type.STRING, enum: Object.values(EdgeIntensity) },
          notes: { type: Type.STRING }
        },
        required: ["sourceTitle", "targetTitle", "label", "intensity"]
      }
    }
  },
  required: ["nodes", "edges"]
};

// Extracts investigative entities and connections using gemini-3-flash-preview
export const processInvestigativeText = async (text: string) => {
  // Use process.env.API_KEY exclusively as per requirements
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Extraia entidades investigativas e conexões do seguinte texto: "${text}". 
    Crie nós para pessoas, locais, eventos, pistas, provas e hipóteses. 
    Estabeleça conexões (edges) entre eles baseando-se na narrativa.
    Use o idioma Português para descrições e títulos.
    Garanta que as datas estejam no formato YYYY-MM-DD quando mencionadas.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: investigationSchema,
    }
  });

  // Access text property directly (not a method)
  return JSON.parse(response.text || '{"nodes": [], "edges": []}');
};

// Suggests hidden patterns and connections using gemini-3-pro-preview for advanced reasoning
export const suggestPatterns = async (caseData: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analise estes dados de investigação e sugira conexões ocultas, pistas não exploradas, contradições ou padrões suspeitos: ${JSON.stringify(caseData)}`,
    config: {
        systemInstruction: "Você é um analista forense sênior. Procure por lacunas na linha do tempo, depoimentos conflitantes e elos de prova perdidos. Responda em Português."
    }
  });

  // Access text property directly
  return response.text;
};

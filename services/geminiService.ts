
import { GoogleGenAI, Type } from "@google/genai";
import { NodeType, NodeStatus, EdgeIntensity } from "../types";

// Função auxiliar para lidar com retentativas em caso de erro 429 (Cota Excedida)
const fetchWithRetry = async (fn: () => Promise<any>, maxRetries = 3) => {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isRateLimit = error?.message?.includes('429') || error?.status === 429 || error?.message?.toLowerCase().includes('quota');
      
      if (isRateLimit && i < maxRetries - 1) {
        // Espera progressiva: 2s, 4s, 8s...
        const waitTime = Math.pow(2, i + 1) * 1000;
        console.warn(`[True Detective] Cota atingida. Tentando novamente em ${waitTime/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};

// Schema for investigative entities and edges extraction
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
  }
};

// Schema for single node detailed data extraction
const singleNodeSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    date: { type: Type.STRING, description: "YYYY-MM-DD" },
    status: { type: Type.STRING, enum: Object.values(NodeStatus) },
    personFields: {
      type: Type.OBJECT,
      properties: {
        cpf: { type: Type.STRING },
        dob: { type: Type.STRING },
        age: { type: Type.STRING }
      }
    },
    locationFields: {
      type: Type.OBJECT,
      properties: {
        cep: { type: Type.STRING },
        estado: { type: Type.STRING },
        municipio: { type: Type.STRING },
        logradouro: { type: Type.STRING },
        bairro: { type: Type.STRING },
        complemento: { type: Type.STRING },
        numero: { type: Type.STRING }
      }
    },
    customFields: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING },
          value: { type: Type.STRING }
        }
      }
    }
  }
};

const MAIN_MODEL = "gemini-flash-lite-latest";

export const processInvestigativeText = async (text: string) => {
  return fetchWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: MAIN_MODEL,
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
    return JSON.parse(response.text);
  });
};

export const extractNodeData = async (text: string, nodeType: string) => {
  return fetchWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: MAIN_MODEL,
      contents: `Analise o texto a seguir e extraia informações para preencher um registro do tipo "${nodeType}": "${text}".
      Identifique o título mais adequado, uma descrição resumida, datas importantes e status provável.
      Se for uma pessoa, extraia CPF, idade e data de nascimento.
      Se for um local, extraia o endereço completo.
      Extraia outros fatos relevantes como campos customizados.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: singleNodeSchema,
      }
    });
    return JSON.parse(response.text);
  });
};

export const suggestPatterns = async (caseData: any) => {
  return fetchWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: MAIN_MODEL,
      contents: `Analise estes dados de investigação e sugira conexões ocultas, pistas não exploradas, contradições ou padrões suspeitos: ${JSON.stringify(caseData)}`,
      config: {
          systemInstruction: "Você é um analista forense sênior. Procure por lacunas na linha do tempo, depoimentos conflitantes e elos de prova perdidos. Responda em Português."
      }
    });
    return response.text;
  });
};

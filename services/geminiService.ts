
import { GoogleGenAI, Type } from "@google/genai";
import { SuggestionResponse, Task } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getTaskBreakdown = async (taskTitle: string, taskDescription?: string): Promise<SuggestionResponse | null> => {
  try {
    const prompt = `Como um mentor de estudos, ajude o estudante a quebrar esta tarefa em passos acionáveis: "${taskTitle}". 
    Descrição adicional: "${taskDescription || 'Nenhuma'}". 
    Forneça uma lista de no máximo 5 passos curtos e objetivos e uma dica de produtividade.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de passos para completar a tarefa"
            },
            tips: {
              type: Type.STRING,
              description: "Uma dica curta de estudo"
            }
          },
          required: ["steps", "tips"]
        }
      }
    });

    return JSON.parse(response.text.trim()) as SuggestionResponse;
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};

export const getDailyMotivation = async (taskCount: number): Promise<string> => {
  try {
    const prompt = `Gere uma frase curta (máximo 15 palavras), motivadora e amigável para um estudante que tem ${taskCount} tarefas para hoje. Use uma linguagem inspiradora e focada em superação.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text.trim().replace(/^"|"$/g, '');
  } catch (error) {
    console.error("Gemini Motivation Error:", error);
    return "O sucesso é a soma de pequenos esforços repetidos dia após dia.";
  }
};

export const getSmartPriorities = async (tasks: Task[]): Promise<string> => {
  if (tasks.length === 0) return "Você não tem tarefas pendentes. Aproveite para descansar ou planejar o amanhã!";
  
  const tasksSummary = tasks.map(t => `- ${t.title} (Prioridade: ${t.priority}, Prazo: ${t.dueDate})`).join('\n');
  
  try {
    const prompt = `Analise as seguintes tarefas de um estudante e sugira um "Plano de Ataque" rápido (máximo 50 palavras). 
    Diga qual tarefa ele deve focar primeiro e por quê, de forma curta e direta:
    ${tasksSummary}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Gemini Priority Error:", error);
    return "Foque nas tarefas com maior prioridade e prazos mais curtos primeiro.";
  }
};

export const createStudyChatSession = () => {
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: 'Você é o FocusFlow AI, um tutor de estudos amigável e altamente eficiente. Sua missão é ajudar estudantes a entender matérias complexas, dar dicas de memorização, organizar horários e motivá-los. Seja conciso, use markdown para formatação e sempre incentive o foco.',
    },
  });
};

import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { TimeOfDay } from "../types";

// Define the tools (functions) the model can call to control the game
const changeTimeFunction: FunctionDeclaration = {
  name: 'changeTime',
  description: 'Change the time of day in the game world to either DAY or NIGHT.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      time: {
        type: Type.STRING,
        enum: ['DAY', 'NIGHT'],
        description: 'The target time of day.',
      },
    },
    required: ['time'],
  },
};

const setFogFunction: FunctionDeclaration = {
  name: 'setFogDensity',
  description: 'Adjust the underwater fog density to change visibility.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      density: {
        type: Type.NUMBER,
        description: 'Fog density value between 0.01 (clear) and 0.1 (murky).',
      },
    },
    required: ['density'],
  },
};

const narrateFunction: FunctionDeclaration = {
  name: 'narrateLore',
  description: 'Provide a short lore description or story about the current underwater ruins.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const sendMessageToGameMaster = async (
  message: string,
  history: { role: string; parts: { text: string }[] }[],
  applySettings: (settings: { time?: TimeOfDay; fog?: number; lore?: string }) => void
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    
    // Construct the request
    const response = await ai.models.generateContent({
        model,
        contents: [
            { role: 'user', parts: [{ text: message }] } // Simplified history for this demo to avoid complex state management issues
        ],
        config: {
            systemInstruction: `You are the AI Game Master of a voxel underwater exploration game. 
            Your goal is to immerse the player. You can control the environment (time, fog) using tools.
            If the user asks to change the world, use a tool. 
            If the user asks about the world, use your creativity to invent lore about the "Sunken Temple of Aethelgard".
            Keep responses concise and atmospheric.`,
            tools: [{ functionDeclarations: [changeTimeFunction, setFogFunction, narrateFunction] }],
        }
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) return "The spirits of the ocean are silent.";

    const content = candidates[0].content;
    let textResponse = "";

    // Check for function calls
    const parts = content.parts;
    for (const part of parts) {
        if (part.text) {
            textResponse += part.text;
        }
        if (part.functionCall) {
            const { name, args } = part.functionCall;
            console.log("AI triggered function:", name, args);

            if (name === 'changeTime') {
                applySettings({ time: args.time as TimeOfDay });
                textResponse += ` [Time changed to ${args.time}]`;
            } else if (name === 'setFogDensity') {
                applySettings({ fog: args.density as number });
                textResponse += ` [Visibility adjusted]`;
            } else if (name === 'narrateLore') {
                // For narrate, we might just append the text if the model generated it, 
                // but if it called the function, we can inject a specific formatted event.
                // In this simple loop, we rely on the model's text output or a second generation.
                // To keep it simple:
                textResponse += "\n(The currents whisper ancient secrets...)";
            }
        }
    }

    return textResponse || "Done.";

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The connection to the surface is weak. (API Error)";
  }
};

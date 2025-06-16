
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY for Gemini is not set. Description generation will be disabled.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const fetchParameterDescriptionFromAPI = async (parameterName: string): Promise<string> => {
  if (!ai) {
    return Promise.resolve("La generación de descripciones está deshabilitada (API Key no configurada).");
  }

  const prompt = `Explica brevemente en español y en un solo párrafo conciso (máximo 4-5 frases) por qué se mide el parámetro de análisis de sangre '${parameterName}', qué indica principalmente, y qué implicaciones generales para la salud pueden tener sus valores si están alterados (altos o bajos). No incluyas rangos de referencia en esta explicación, solo la descripción médica general.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: [{ role: "user", parts: [{text: prompt}] }],
    });
    
    const text = response.text;
    if (text) {
      return text.trim();
    }
    return "No se pudo obtener la descripción del parámetro.";

  } catch (error) {
    console.error("Error fetching description from Gemini API:", error);
    if (error instanceof Error) {
        if (error.message.includes("API key not valid")) {
             return "Error: La clave API de Gemini no es válida. Por favor, verifica la configuración.";
        }
         return `Error al contactar el servicio de IA: ${error.message}`;
    }
    return "Error al cargar la descripción. Por favor, inténtalo de nuevo más tarde.";
  }
};

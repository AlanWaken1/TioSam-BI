import { GoogleGenerativeAI } from '@google/generative-ai';

// Función para obtener la instancia de Gemini AI
function getGeminiAI(): GoogleGenerativeAI {
  // Intentar obtener la API key desde variables de entorno del cliente
  const apiKey = typeof window !== 'undefined' 
    ? (window as any).__GEMINI_API_KEY__ 
    : '';
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no está configurada. Por favor, configura tu API key de Google Gemini.');
  }
  
  return new GoogleGenerativeAI(apiKey);
}

export async function analyzeDataWithAI(data: any[], dimensionName: string): Promise<string> {
  try {
    const genAI = getGeminiAI();
    // Usar el modelo sin el prefijo "models/"
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    const prompt = `
Eres un analista de Business Intelligence experto. Analiza los siguientes datos de la dimensión "${dimensionName}" y proporciona un resumen ejecutivo en español con:

1. Insights clave (3-5 puntos principales)
2. Tendencias identificadas
3. Recomendaciones accionables

Datos:
${JSON.stringify(data, null, 2)}

Formatea tu respuesta en bullet points claros y concisos.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error('Error analyzing with AI:', error);
    
    if (error.message?.includes('API_KEY') || error.message?.includes('not configured')) {
      throw new Error('⚠️ API Key de Gemini no configurada. Configura GEMINI_API_KEY en el icono de configuración (⚙️) del header.');
    }
    
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      throw new Error('⚠️ Verifica que tu API key de Gemini sea válida. Obtén una gratis en https://makersuite.google.com/app/apikey');
    }
    
    throw new Error(`Error al analizar datos: ${error.message || 'Error desconocido'}`);
  }
}

export async function interpretNaturalLanguageQuery(query: string): Promise<{
  dimension: string;
  filters: Record<string, any>;
}> {
  try {
    const genAI = getGeminiAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    const prompt = `
Eres un asistente de BI. El usuario busca: "${query}"

Interpreta esta búsqueda y devuelve SOLO un JSON con esta estructura:
{
  "dimension": "finanzas|produccion|rrhh|desarrollo",
  "filters": {
    "categoria": "valor si aplica",
    "periodo": "valor si aplica",
    "año": numero si aplica
  }
}

Ejemplos:
- "gastos de marketing en septiembre" → {"dimension":"finanzas","filters":{"categoria":"marketing","periodo":"septiembre"}}
- "contrataciones en 2024" → {"dimension":"rrhh","filters":{"año":2024}}

Responde SOLO con el JSON, sin texto adicional.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Extraer JSON de la respuesta
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('No se pudo interpretar la consulta');
  } catch (error) {
    console.error('Error interpreting query:', error);
    throw error;
  }
}

// Función para configurar la API key desde el cliente
export function setGeminiAPIKey(apiKey: string) {
  if (typeof window !== 'undefined') {
    (window as any).__GEMINI_API_KEY__ = apiKey;
  }
}

// Función para verificar si la API key está configurada
export function isGeminiConfigured(): boolean {
  return typeof window !== 'undefined' && !!(window as any).__GEMINI_API_KEY__;
}

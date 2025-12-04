import OpenAI from 'openai';

// Función para obtener la instancia de OpenAI
function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY no está configurada en las variables de entorno.');
  }
  
  return new OpenAI({
    apiKey: apiKey,
  });
}

export async function analyzeDataWithAI(data: any[], dimensionName: string): Promise<string> {
  try {
    const openai = getOpenAI();
    
    const prompt = `
Eres un analista de Business Intelligence experto. Analiza los siguientes datos de la dimensión "${dimensionName}" y proporciona un resumen ejecutivo en español con:

1. Insights clave (3-5 puntos principales)
2. Tendencias identificadas
3. Recomendaciones accionables

Datos:
${JSON.stringify(data.slice(0, 50), null, 2)}
(Nota: Se muestran los primeros 50 registros para optimizar el contexto. Analiza tendencias generales basadas en esta muestra representativa.)

Formatea tu respuesta en bullet points claros y concisos. Usa markdown básico (negritas) para resaltar puntos importantes.
`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
    });

    return completion.choices[0].message.content || 'No se pudo generar el análisis.';
  } catch (error: any) {
    console.error('Error analyzing with OpenAI:', error);
    throw new Error(`Error al analizar datos: ${error.message || 'Error desconocido'}`);
  }
}

export async function interpretNaturalLanguageQuery(query: string): Promise<{
  dimension: string;
  filters: Record<string, any>;
}> {
  try {
    const openai = getOpenAI();

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

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
    });

    const text = completion.choices[0].message.content?.trim() || '';
    
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

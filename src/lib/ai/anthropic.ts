import Anthropic from '@anthropic-ai/sdk';

// Función para obtener la instancia de Anthropic
function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY no está configurada en las variables de entorno.');
  }
  
  return new Anthropic({
    apiKey: apiKey,
  });
}

export async function analyzeDataWithAI(data: any[], dimensionName: string): Promise<string> {
  try {
    const anthropic = getAnthropic();
    
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

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    // Handle the content block correctly
    const contentBlock = message.content[0];
    if (contentBlock.type === 'text') {
        return contentBlock.text;
    }
    return 'No se pudo generar el análisis (formato inesperado).';

  } catch (error: any) {
    console.error('Error analyzing with Anthropic:', error);
    throw new Error(`Error al analizar datos: ${error.message || 'Error desconocido'}`);
  }
}

export async function interpretNaturalLanguageQuery(query: string): Promise<{
  dimension: string;
  filters: Record<string, any>;
}> {
  try {
    const anthropic = getAnthropic();

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

    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const contentBlock = message.content[0];
    let text = '';
    if (contentBlock.type === 'text') {
        text = contentBlock.text.trim();
    }
    
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

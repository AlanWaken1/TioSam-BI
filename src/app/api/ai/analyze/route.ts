import { NextRequest, NextResponse } from 'next/server';
import { analyzeDataWithAI } from '@/lib/ai/gemini';

export async function POST(req: NextRequest) {
  try {
    const { data, dimensionName } = await req.json();

    if (!data || !dimensionName) {
      return NextResponse.json({ error: 'Data and dimensionName are required' }, { status: 400 });
    }

    const analysis = await analyzeDataWithAI(data, dimensionName);

    return NextResponse.json({ analysis });

  } catch (error: any) {
    console.error('AI Analysis Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

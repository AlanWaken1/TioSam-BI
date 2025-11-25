'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { analyzeDataWithAI } from '@/lib/ai/gemini';
import { motion } from 'motion/react';

interface AIAnalystCardProps {
  data: any[];
  dimensionName: string;
}

export function AIAnalystCard({ data, dimensionName }: AIAnalystCardProps) {
  const [analysis, setAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [displayedText, setDisplayedText] = useState('');

  const handleAnalyze = async () => {
    if (data.length === 0) {
      alert('No hay datos para analizar');
      return;
    }

    setIsAnalyzing(true);
    setAnalysis('');
    setDisplayedText('');

    try {
      const result = await analyzeDataWithAI(data, dimensionName);
      setAnalysis(result);

      // Typewriter effect
      let index = 0;
      const interval = setInterval(() => {
        if (index < result.length) {
          setDisplayedText((prev) => prev + result[index]);
          index++;
        } else {
          clearInterval(interval);
        }
      }, 20);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Analyst
            </CardTitle>
            <CardDescription>Análisis inteligente de tus datos</CardDescription>
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || data.length === 0}
            className="gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analizar
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      {displayedText && (
        <CardContent>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="prose prose-sm max-w-none"
          >
            <div className="whitespace-pre-wrap text-sm text-gray-700">
              {displayedText}
            </div>
          </motion.div>
        </CardContent>
      )}
    </Card>
  );
}

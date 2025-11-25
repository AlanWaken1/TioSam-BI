'use client';

import { useState, useEffect } from 'react';
import { Settings, Key, Database, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { setGeminiAPIKey, isGeminiConfigured } from '@/lib/ai/gemini';

export function ConfigModal() {
  const [open, setOpen] = useState(false);
  const [geminiKey, setGeminiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    setIsConfigured(isGeminiConfigured());
  }, []);

  const handleSaveGemini = () => {
    if (geminiKey.trim()) {
      setGeminiAPIKey(geminiKey);
      setIsConfigured(true);
      alert('✅ API Key de Gemini configurada correctamente');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings className="w-4 h-4" />
          Configuración
          {isConfigured && <Check className="w-4 h-4 text-green-600" />}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuración del Sistema
          </DialogTitle>
          <DialogDescription>
            Configura las credenciales necesarias para usar todas las funcionalidades de TioSam BI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Gemini API Key */}
          <Card className={isConfigured ? 'border-green-300 bg-green-50' : 'border-blue-300 bg-blue-50'}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Google Gemini API
                </div>
                {isConfigured ? (
                  <span className="flex items-center gap-1 text-xs font-normal text-green-700">
                    <Check className="w-3 h-3" />
                    Configurado
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-normal text-orange-700">
                    <X className="w-3 h-3" />
                    No configurado
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Necesaria para el AI Analyst y búsqueda en lenguaje natural
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gemini-key">API Key</Label>
                <Input
                  id="gemini-key"
                  type="password"
                  placeholder="AIza..."
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                />
                <p className="text-xs text-gray-600">
                  Obtén tu API key gratuita en{' '}
                  <a
                    href="https://makersuite.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>
              <Button onClick={handleSaveGemini} className="w-full">
                Guardar API Key de Gemini
              </Button>
            </CardContent>
          </Card>

          {/* Supabase Info */}
          <Card className="border-gray-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="w-4 h-4" />
                Supabase (Próximamente)
              </CardTitle>
              <CardDescription>
                Base de datos y almacenamiento en tiempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                La integración con Supabase se configurará cuando conectes tu base de datos.
                Por ahora, los datos se almacenan en memoria local.
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

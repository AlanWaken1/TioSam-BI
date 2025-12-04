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
// import { setGeminiAPIKey, isGeminiConfigured } from '@/lib/ai/gemini';

export function ConfigModal() {
  const [open, setOpen] = useState(false);
  // Configuración gestionada por variables de entorno del servidor

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
          {/* Gemini Info */}
          <Card className="border-blue-300 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Key className="w-4 h-4" />
                Google Gemini API (GenAI SDK)
              </CardTitle>
              <CardDescription>
                Motor de inteligencia artificial para análisis y predicciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-2">
                La integración con Gemini 2.0 Flash está configurada a nivel de servidor.
              </p>
              <div className="bg-white p-3 rounded border border-blue-200 text-xs font-mono text-gray-600">
                Asegúrate de tener <strong>GEMINI_API_KEY</strong> en tu archivo <strong>.env.local</strong>
              </div>
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

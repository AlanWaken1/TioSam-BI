'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Papa from 'papaparse';

interface CSVUploaderProps {
  onDataParsed: (data: any[]) => void;
  expectedColumns?: string[];
  dimensionName?: string;
}

export function CSVUploader({ onDataParsed, expectedColumns, dimensionName }: CSVUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'text/csv') {
      processFile(droppedFile);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  }, []);

  const processFile = (file: File) => {
    setFile(file);
    setIsProcessing(true);
    setSuccess(false);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        console.log('CSV Parsed:', results.data);
        onDataParsed(results.data);
        setIsProcessing(false);
        setSuccess(true);
        
        // Reset después de 3 segundos
        setTimeout(() => {
          setFile(null);
          setSuccess(false);
        }, 3000);
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        setIsProcessing(false);
        alert('Error al procesar el archivo CSV');
      },
    });
  };

  const handleRemove = () => {
    setFile(null);
    setSuccess(false);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 transition-colors',
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300',
          success && 'border-green-500 bg-green-50'
        )}
      >
        <div className="flex flex-col items-center justify-center gap-4">
          {success ? (
            <>
              <CheckCircle className="w-12 h-12 text-green-600" />
              <div className="text-center">
                <p className="font-medium text-green-700">¡Archivo cargado exitosamente!</p>
                <p className="text-sm text-green-600">Los datos se están importando...</p>
              </div>
            </>
          ) : file ? (
            <>
              <FileText className="w-12 h-12 text-blue-600" />
              <div className="text-center">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {isProcessing ? 'Procesando...' : 'Listo para importar'}
                </p>
              </div>
              {!isProcessing && (
                <Button variant="ghost" size="sm" onClick={handleRemove}>
                  <X className="w-4 h-4 mr-1" />
                  Remover
                </Button>
              )}
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400" />
              <div className="text-center">
                <p className="font-medium">Arrastra tu archivo CSV aquí</p>
                <p className="text-sm text-gray-500">o haz clic para seleccionar</p>
              </div>
              <label htmlFor="file-upload">
                <Button type="button" variant="outline" asChild>
                  <span>Seleccionar Archivo</span>
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            </>
          )}
        </div>
      </div>

      {expectedColumns && (
        <div className="text-xs text-gray-500">
          <p className="font-medium mb-1">Columnas esperadas:</p>
          <p>{expectedColumns.join(', ')}</p>
        </div>
      )}
    </div>
  );
}

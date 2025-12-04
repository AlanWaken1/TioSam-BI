'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface FileUploaderProps {
  onDataParsed: (data: any[], fileName?: string) => void;
  expectedColumns?: string[];
  dimensionName?: string;
}

export function FileUploader({ onDataParsed, expectedColumns, dimensionName }: FileUploaderProps) {
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
    if (droppedFile && isValidFile(droppedFile)) {
      processFile(droppedFile);
    } else {
      alert('Por favor, sube un archivo CSV o Excel (.xlsx, .xls)');
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && isValidFile(selectedFile)) {
      processFile(selectedFile);
    } else {
      alert('Por favor, sube un archivo CSV o Excel (.xlsx, .xls)');
    }
  }, []);

  const isValidFile = (file: File): boolean => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    const validExtensions = ['.csv', '.xls', '.xlsx'];
    
    return validTypes.includes(file.type) || 
           validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  };

  const processFile = async (file: File) => {
    setFile(file);
    setIsProcessing(true);
    setSuccess(false);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('dimension', dimensionName || 'General');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      console.log('Upload success:', result);
      
      // Notify parent that upload is complete. 
      // We pass empty array because data is now in DB.
      onDataParsed([], file.name); 
      
      setIsProcessing(false);
      setSuccess(true);
      resetAfterDelay();
    } catch (error) {
      console.error('Error uploading file:', error);
      setIsProcessing(false);
      alert('Error al subir el archivo');
    }
  };

  const resetAfterDelay = () => {
    setTimeout(() => {
      setFile(null);
      setSuccess(false);
    }, 3000);
  };

  const handleRemove = () => {
    setFile(null);
    setSuccess(false);
  };

  const getFileIcon = () => {
    if (!file) return <Upload className="w-12 h-12 text-gray-400" />;
    
    const extension = file.name.toLowerCase().split('.').pop();
    if (extension === 'csv') {
      return <FileText className="w-12 h-12 text-blue-600" />;
    }
    return <FileSpreadsheet className="w-12 h-12 text-green-600" />;
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
              {getFileIcon()}
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
                <p className="font-medium">Arrastra tu archivo CSV o Excel aquí</p>
                <p className="text-sm text-gray-500">Formatos soportados: .csv, .xlsx, .xls</p>
              </div>
              <label htmlFor="file-upload">
                <Button type="button" variant="outline" asChild>
                  <span>Seleccionar Archivo</span>
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            </>
          )}
        </div>
      </div>

      {expectedColumns && (
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
          <p className="font-medium mb-1">📋 Columnas esperadas en tu archivo:</p>
          <p className="font-mono">{expectedColumns.join(', ')}</p>
          <p className="mt-2 text-gray-600">
            💡 Tip: Asegúrate de que tu archivo Excel/CSV tenga exactamente estas columnas en la primera fila
          </p>
        </div>
      )}
    </div>
  );
}
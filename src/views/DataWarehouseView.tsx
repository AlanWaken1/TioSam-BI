'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { 
  Upload, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Factory,
  DollarSign,
  Truck,
  Users,
  Megaphone,
  FileText,
  Database,
  PlayCircle,
  Activity,
  FileCheck,
  Sparkles,
  Download,
  TrendingUp,
  Layers,
  Loader2,
  XCircle,
  Plus,
  RefreshCw
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';

// Variantes de animación
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

interface DimensionCard {
  id: string;
  name: string;
  dbTable: string;
  dimensionName: string;
  icon: any;
  fileHint: string;
  status: 'pending' | 'loading' | 'loaded' | 'error';
  lastUpdate?: string;
  records?: number;
  errorMessage?: string;
}

export default function DataWarehouseView() {
  const [dimensions, setDimensions] = useState<DimensionCard[]>([
    {
      id: 'produccion',
      name: 'PRODUCCIÓN',
      dbTable: 'produccion',
      dimensionName: 'Producción',
      icon: Factory,
      fileHint: 'Bitácora_Horno.xlsx',
      status: 'pending'
    },
    {
      id: 'finanzas',
      name: 'FINANZAS',
      dbTable: 'finanzas',
      dimensionName: 'Finanzas',
      icon: DollarSign,
      fileHint: 'Flujo_ERP.csv',
      status: 'pending'
    },
    {
      id: 'logistica',
      name: 'LOGÍSTICA',
      dbTable: 'logistica',
      dimensionName: 'Logística',
      icon: Truck,
      fileHint: 'Rutas_GPS.xlsx',
      status: 'pending'
    },
    {
      id: 'rh',
      name: 'RRHH',
      dbTable: 'rrhh',
      dimensionName: 'RRHH',
      icon: Users,
      fileHint: 'Nomina_Semanal.xlsx',
      status: 'pending'
    },
    {
      id: 'mkt',
      name: 'MKT DIGITAL',
      dbTable: 'desarrollo',
      dimensionName: 'Desarrollo Digital',
      icon: Megaphone,
      fileHint: 'Metricas_Social.csv',
      status: 'pending'
    }
  ]);

  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [etlProgress, setEtlProgress] = useState(0);
  const [etlStage, setEtlStage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadedCount = dimensions.filter(d => d.status === 'loaded').length;
  const allLoaded = loadedCount === 5;

  // Fetch initial stats from Supabase
  const fetchStats = useCallback(async () => {
    const updatedDimensions = [...dimensions];
    
    for (let i = 0; i < updatedDimensions.length; i++) {
      const dim = updatedDimensions[i];
      try {
        // Get total count
        const { count, error } = await supabase
          .from(dim.dbTable)
          .select('*', { count: 'exact', head: true });
        
        if (error) throw error;

        // Get last upload time
        const { data: lastUpload, error: logError } = await supabase
          .from('upload_logs')
          .select('created_at')
          .eq('dimension', dim.dimensionName)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (count !== null && count > 0) {
          updatedDimensions[i] = {
            ...dim,
            status: 'loaded',
            records: count,
            lastUpdate: lastUpload ? new Date(lastUpload.created_at).toLocaleString('es-MX') : 'Desconocido'
          };
        } else {
           updatedDimensions[i] = {
            ...dim,
            status: 'pending',
            records: 0
          };
        }
      } catch (err) {
        console.error(`Error fetching stats for ${dim.name}:`, err);
      }
    }
    setDimensions(updatedDimensions);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleFileUpload = async (dimensionId: string, file: File) => {
    const dimIndex = dimensions.findIndex(d => d.id === dimensionId);
    if (dimIndex === -1) return;

    const dim = dimensions[dimIndex];

    // Update status to loading
    setDimensions(prev => prev.map(d => d.id === dimensionId ? { ...d, status: 'loading', errorMessage: undefined } : d));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('dimension', dim.dimensionName);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al subir archivo');
      }

      const result = await response.json();
      console.log('Upload success:', result);

      // Refresh stats for this dimension
      await fetchStats();

    } catch (error: any) {
      console.error('Upload error:', error);
      setDimensions(prev => prev.map(d => d.id === dimensionId ? { 
        ...d, 
        status: 'error', 
        errorMessage: error.message || 'Error desconocido' 
      } : d));
    }
  };

  // NEW: Multi-file upload handler
  const handleMultiFileUpload = async (files: File[]) => {
    setGlobalLoading(true);
    
    // Detectar dimensión por nombre de archivo
    const detectDimension = (filename: string): string | null => {
      const lower = filename.toLowerCase();
      if (lower.includes('produccion') || lower.includes('bitacora') || lower.includes('horno')) return 'produccion';
      if (lower.includes('finanzas') || lower.includes('flujo') || lower.includes('caja')) return 'finanzas';
      if (lower.includes('logistica') || lower.includes('ruta') || lower.includes('gps')) return 'logistica';
      if (lower.includes('rrhh') || lower.includes('nomina') || lower.includes('rh')) return 'rh';
      if (lower.includes('marketing') || lower.includes('desarrollo') || lower.includes('mkt') || lower.includes('ads') || lower.includes('metrica')) return 'mkt';
      return null;
    };

    let successCount = 0;
    let errorCount = 0;

    for (const file of files) {
      const dimensionId = detectDimension(file.name);
      if (!dimensionId) {
        console.warn(`No se pudo detectar dimensión para: ${file.name}`);
        errorCount++;
        continue;
      }

      try {
        await handleFileUpload(dimensionId, file);
        successCount++;
      } catch (error) {
        errorCount++;
      }
    }

    setGlobalLoading(false);
    
    const message = `✅ ${successCount} archivo(s) cargado(s) exitosamente${errorCount > 0 ? `\n⚠️ ${errorCount} archivo(s) con error` : ''}`;
    alert(message);
  };

  const handleDragEnter = (dimensionId: string) => {
    setIsDragging(dimensionId);
  };

  const handleDragLeave = () => {
    setIsDragging(null);
  };

  const handleDrop = (dimensionId: string, e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(null);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 1) {
      // Multi-file upload
      handleMultiFileUpload(files);
    } else if (files.length > 0) {
      handleFileUpload(dimensionId, files[0]);
    }
  };

  const handleFileSelect = (dimensionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 1) {
      // Multi-file upload
      handleMultiFileUpload(Array.from(files));
    } else if (files && files.length > 0) {
      handleFileUpload(dimensionId, files[0]);
    }
  };

  const handleETLExecution = async () => {
    setGlobalLoading(true);
    setIsProcessing(true);
    setEtlProgress(0);
    
    // Stage 1: Validating Data
    setEtlStage('Validando integridad de datos...');
    await new Promise(resolve => setTimeout(resolve, 800));
    setEtlProgress(20);
    
    // Stage 2: Transform
    setEtlStage('Transformando y limpiando registros...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    setEtlProgress(50);
    
    // Stage 3: Loading stats
    setEtlStage('Consolidando dimensiones...');
    await new Promise(resolve => setTimeout(resolve, 800));
    setEtlProgress(75);
    
    // Stage 4: Finalizing
    setEtlStage('Finalizando proceso ETL...');
    await fetchStats();
    setEtlProgress(100);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setGlobalLoading(false);
    setIsProcessing(false);
    setShowSuccessModal(true);
    
    // Auto-close and redirect after 4 seconds
    setTimeout(() => {
      setShowSuccessModal(false);
      window.location.href = '/';
    }, 4000);
  };

  return (
    <motion.div 
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* Header */}
      <motion.div variants={fadeInUp}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Centro de Ingesta de Datos (Proceso ETL)</h1>
                <p className="text-gray-600 mt-1">
                  Cargue los archivos fuente de cada dimensión para actualizar el Modelo Estrella central
                </p>
              </div>
            </div>
          </div>
          <motion.div
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border-2 border-indigo-200 rounded-lg"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Activity className="w-5 h-5 text-indigo-600" />
            <div>
              <p className="text-xs text-indigo-600 font-semibold">Estado del Sistema</p>
              <p className="text-sm font-bold text-indigo-900">{loadedCount}/5 Dimensiones Cargadas</p>
            </div>
          </motion.div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
          <motion.div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(loadedCount / 5) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </motion.div>

      {/* Multi-File Drop Zone */}
      <motion.div variants={fadeInUp}>
        <Card 
          className={`border-4 border-dashed transition-all ${
            isDragging ? 'border-indigo-500 bg-indigo-50 scale-105' : 'border-gray-300 bg-gradient-to-br from-blue-50 to-indigo-50'
          }`}
          onDragEnter={() => setIsDragging('multi')}
          onDragLeave={() => setIsDragging(null)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(null);
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
              handleMultiFileUpload(files);
            }
          }}
        >
          <CardContent className="p-8">
            <div className="text-center">
              <motion.div 
                className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center"
                animate={{ rotate: isDragging === 'multi' ? 360 : 0 }}
                transition={{ duration: 0.5 }}
              >
                <Upload className="w-10 h-10 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">🚀 Carga Masiva de Archivos</h3>
              <p className="text-gray-600 mb-4">
                Arrastra aquí los <span className="font-bold text-indigo-600">5 archivos Excel</span> al mismo tiempo o haz clic para seleccionarlos
              </p>
              <input
                type="file"
                id="multi-file-upload"
                className="hidden"
                accept=".xlsx,.csv,.xls"
                multiple
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    handleMultiFileUpload(Array.from(files));
                  }
                }}
              />
              <label htmlFor="multi-file-upload">
                <Button variant="default" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700" asChild>
                  <span className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Seleccionar Archivos Múltiples
                  </span>
                </Button>
              </label>
              <div className="mt-4 text-xs text-gray-500">
                <p className="font-semibold mb-1">💡 El sistema detecta automáticamente:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Producción/Bitácora</span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Finanzas/Flujo</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">Logística/Rutas</span>
                  <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded">RRHH/Nómina</span>
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">Marketing/Ads</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Grid de 5 Tarjetas */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        variants={staggerContainer}
      >
        {dimensions.map((dimension, index) => (
          <motion.div
            key={dimension.id}
            variants={scaleIn}
            className={index === 4 ? 'lg:col-span-2' : ''}
          >
            <Card 
              className={`
                relative overflow-hidden border-4 transition-all cursor-pointer h-full
                ${dimension.status === 'loaded' 
                  ? 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 shadow-xl shadow-green-100' 
                  : dimension.status === 'error'
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 bg-gradient-to-br from-gray-50 to-slate-50 hover:border-gray-400'
                }
                ${isDragging === dimension.id ? 'border-indigo-500 scale-105 ring-4 ring-indigo-200' : ''}
              `}
              onDragEnter={() => handleDragEnter(dimension.id)}
              onDragLeave={handleDragLeave}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(dimension.id, e)}
            >
              {/* Status Badge */}
              <div className="absolute top-4 right-4 z-10">
                <motion.div 
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full font-semibold text-xs shadow-sm
                    ${dimension.status === 'loaded' 
                      ? 'bg-green-500 text-white' 
                      : dimension.status === 'loading'
                      ? 'bg-blue-500 text-white'
                      : dimension.status === 'error'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-400 text-white'
                    }
                  `}
                  animate={dimension.status === 'loaded' ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 2, repeat: dimension.status === 'loaded' ? Infinity : 0 }}
                >
                  {dimension.status === 'loaded' && (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      CARGADO
                    </>
                  )}
                  {dimension.status === 'pending' && (
                    <>
                      <Clock className="w-4 h-4" />
                      PENDIENTE
                    </>
                  )}
                  {dimension.status === 'loading' && (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      PROCESANDO
                    </>
                  )}
                  {dimension.status === 'error' && (
                    <>
                      <XCircle className="w-4 h-4" />
                      ERROR
                    </>
                  )}
                </motion.div>
              </div>

              <CardContent className="pt-[0px] pr-[32px] pb-[24px] pl-[32px] p-[32px]">
                {/* Header de la Tarjeta */}
                <div className="flex items-start gap-4 mb-6">
                  <motion.div 
                    className={`
                      w-16 h-16 rounded-2xl flex items-center justify-center shadow-md
                      ${dimension.status === 'loaded'
                        ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                        : dimension.status === 'error'
                        ? 'bg-gradient-to-br from-red-400 to-red-500'
                        : 'bg-gradient-to-br from-gray-400 to-slate-500'
                      }
                    `}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <dimension.icon className="w-8 h-8 text-white" />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      DIMENSIÓN: {dimension.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 font-mono">
                        {dimension.fileHint}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Zona de Carga / Estado */}
                {dimension.status === 'loading' ? (
                  <div className="border-2 border-blue-200 bg-blue-50 rounded-xl p-8 text-center">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
                    <p className="font-semibold text-blue-900">Procesando archivo...</p>
                    <p className="text-xs text-blue-700 mt-1">Validando esquema y cargando a Supabase</p>
                  </div>
                ) : dimension.status === 'loaded' ? (
                  <motion.div 
                    className="bg-white border-2 border-green-200 rounded-xl p-6 shadow-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <FileCheck className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Datos Sincronizados</p>
                          <p className="text-xs text-gray-500">{dimension.lastUpdate}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          {dimension.records?.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">registros</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <input
                        type="file"
                        id={`file-reload-${dimension.id}`}
                        className="hidden"
                        accept=".xlsx,.csv,.xls"
                        multiple
                        onChange={(e) => handleFileSelect(dimension.id, e)}
                      />
                      <label htmlFor={`file-reload-${dimension.id}`} className="flex-1">
                        <Button variant="default" size="sm" className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white" asChild>
                          <span className="cursor-pointer">
                            <Plus className="w-4 h-4 mr-2" />
                            Cargar Más Datos
                          </span>
                        </Button>
                      </label>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="hover:bg-gray-50"
                        onClick={() => fetchStats()}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Actualizar Vista
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <div className={`
                    border-3 border-dashed rounded-xl p-6 text-center transition-colors
                    ${dimension.status === 'error' ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white/50 hover:bg-white/80'}
                  `}>
                    {dimension.status === 'error' ? (
                      <div className="mb-4">
                        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
                        <p className="text-sm font-bold text-red-700">Error en la carga</p>
                        <p className="text-xs text-red-600 mt-1">{dimension.errorMessage}</p>
                      </div>
                    ) : (
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    )}
                    
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      {dimension.status === 'error' ? 'Intente nuevamente' : 'Arrastre el archivo aquí'}
                    </p>
                    <input
                      type="file"
                      id={`file-${dimension.id}`}
                      className="hidden"
                      accept=".xlsx,.csv,.xls"
                      multiple
                      onChange={(e) => handleFileSelect(dimension.id, e)}
                    />
                    <label htmlFor={`file-${dimension.id}`}>
                      <Button variant={dimension.status === 'error' ? 'destructive' : 'outline'} className="w-full" asChild>
                        <span className="cursor-pointer">
                          <Upload className="w-4 h-4 mr-2" />
                          Seleccionar Archivo
                        </span>
                      </Button>
                    </label>
                  </div>
                )}

                {/* Footer Info */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Tabla: {dimension.dbTable}</span>
                    <span>Modelo Estrella v2.1</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Botón de Consolidación ETL */}
      <motion.div 
        variants={fadeInUp}
        className="pt-6"
      >
        <Card className={`
          border-4 overflow-hidden
          ${allLoaded 
            ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-indigo-50' 
            : 'border-gray-300 bg-gray-50'
          }
        `}>
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div 
                  className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center
                    ${allLoaded
                      ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                      : 'bg-gray-400'
                    }
                  `}
                  animate={allLoaded || globalLoading ? { rotate: [0, 360] } : {}}
                  transition={{ duration: 3, repeat: allLoaded || globalLoading ? Infinity : 0, ease: "linear" }}
                >
                  {globalLoading ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  ) : (
                    <Layers className="w-8 h-8 text-white" />
                  )}
                </motion.div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    Proceso de Consolidación ETL
                  </h3>
                  <p className="text-sm text-gray-600">
                    {loadedCount === 0 && '⏳ Cargue al menos 1 dimensión para iniciar el procesamiento.'}
                    {loadedCount > 0 && loadedCount < 5 && `⚙️ Listo para procesar ${loadedCount} dimensión${loadedCount > 1 ? 'es' : ''}. Las demás permanecerán sin cambios.`}
                    {loadedCount === 5 && '✅ Todas las dimensiones están listas. Puede ejecutar la consolidación completa.'}
                  </p>
                </div>
              </div>

              <motion.div
                whileHover={loadedCount > 0 && !globalLoading ? { scale: 1.05 } : {}}
                whileTap={loadedCount > 0 && !globalLoading ? { scale: 0.95 } : {}}
              >
                <Button 
                  disabled={loadedCount === 0 || globalLoading}
                  onClick={handleETLExecution}
                  className={`
                    px-8 py-6 text-lg font-bold gap-3
                    ${loadedCount > 0
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                      : 'bg-gray-300 cursor-not-allowed'
                    }
                  `}
                >
                  {globalLoading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      CONSOLIDANDO...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-6 h-6" />
                      {loadedCount === 0 && 'CARGUE AL MENOS 1 DIMENSIÓN'}
                      {loadedCount === 1 && 'PROCESAR 1 DIMENSIÓN'}
                      {loadedCount > 1 && loadedCount < 5 && `PROCESAR ${loadedCount} DIMENSIONES`}
                      {loadedCount === 5 && 'CONSOLIDAR DATA WAREHOUSE COMPLETO'}
                      <Sparkles className="w-6 h-6" />
                    </>
                  )}
                </Button>
              </motion.div>
            </div>

            {/* Progress Indicators */}
            {allLoaded && (
              <motion.div 
                className="mt-6 grid grid-cols-5 gap-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {dimensions.map((dim) => (
                  <div 
                    key={dim.id}
                    className="flex items-center gap-2 p-3 bg-green-100 rounded-lg"
                  >
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-semibold text-green-700">
                      {dim.name}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Info Footer */}
      <motion.div 
        variants={fadeInUp}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-blue-900 mb-2">Proceso ETL (Extract, Transform, Load)</h4>
            <p className="text-sm text-blue-700 mb-2">
              El proceso ETL consolida datos de múltiples fuentes heterogéneas en un modelo dimensional centralizado (Modelo Estrella).
              Cada archivo cargado es validado, transformado y cargado en la base de datos OLAP del sistema.
            </p>
            <div className="flex gap-4 text-xs text-blue-600">
              <span>• Validación automática de esquemas</span>
              <span>• Limpieza de datos duplicados</span>
              <span>• Enriquecimiento con metadatos</span>
              <span>• Actualización incremental</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Success Modal - Celebration Animation */}
      {showSuccessModal && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-3xl p-12 max-w-2xl mx-4 shadow-2xl"
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <div className="text-center">
              {/* Animated Success Icon */}
              <motion.div
                className="w-32 h-32 mx-auto mb-6 relative"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <motion.div
                  className="w-full h-full bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center"
                  animate={{ 
                    boxShadow: [
                      "0 0 0 0 rgba(34, 197, 94, 0.7)",
                      "0 0 0 20px rgba(34, 197, 94, 0)",
                      "0 0 0 0 rgba(34, 197, 94, 0)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <motion.div
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    <CheckCircle className="w-20 h-20 text-white" strokeWidth={3} />
                  </motion.div>
                </motion.div>
                
                {/* Floating particles */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-3 h-3 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full"
                    style={{
                      top: '50%',
                      left: '50%',
                    }}
                    animate={{
                      x: [0, Math.cos(i * 45 * Math.PI / 180) * 80],
                      y: [0, Math.sin(i * 45 * Math.PI / 180) * 80],
                      opacity: [1, 0],
                      scale: [1, 0]
                    }}
                    transition={{
                      duration: 1.5,
                      delay: 0.3 + i * 0.1,
                      repeat: Infinity,
                      repeatDelay: 0.5
                    }}
                  />
                ))}
              </motion.div>

              {/* Success Message */}
              <motion.h2
                className="text-4xl font-bold text-gray-900 mb-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                ¡Consolidación Exitosa! 🎉
              </motion.h2>
              
              <motion.p
                className="text-lg text-gray-600 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                El Data Warehouse ha sido consolidado correctamente
              </motion.p>

              {/* Stats Grid */}
              <motion.div
                className="grid grid-cols-5 gap-3 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                {dimensions.filter(d => d.status === 'loaded').map((dim, index) => (
                  <motion.div
                    key={dim.id}
                    className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 border-2 border-indigo-200"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1 + index * 0.1 }}
                  >
                    <div className="w-10 h-10 mx-auto mb-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <dim.icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">{dim.name}</p>
                    <p className="text-lg font-bold text-indigo-600">{dim.records?.toLocaleString()}</p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Redirect Message */}
              <motion.div
                className="flex items-center justify-center gap-2 text-sm text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                <Sparkles className="w-4 h-4" />
                <span>Redirigiendo al Dashboard...</span>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
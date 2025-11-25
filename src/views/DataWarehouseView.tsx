'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
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
  Layers
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

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
  icon: any;
  file: string;
  status: 'pending' | 'loaded';
  lastUpdate?: string;
  records?: number;
}

export default function DataWarehouseView() {
  const [dimensions, setDimensions] = useState<DimensionCard[]>([
    {
      id: 'produccion',
      name: 'PRODUCCIÓN',
      icon: Factory,
      file: 'Bitácora_Horno.xlsx',
      status: 'pending'
    },
    {
      id: 'finanzas',
      name: 'FINANZAS',
      icon: DollarSign,
      file: 'Flujo_ERP.csv',
      status: 'loaded',
      lastUpdate: 'Hace 2 horas',
      records: 1847
    },
    {
      id: 'logistica',
      name: 'LOGÍSTICA',
      icon: Truck,
      file: 'Rutas_GPS.xlsx',
      status: 'pending'
    },
    {
      id: 'rh',
      name: 'RH',
      icon: Users,
      file: 'Nomina_Semanal.xlsx',
      status: 'pending'
    },
    {
      id: 'mkt',
      name: 'MKT DIGITAL',
      icon: Megaphone,
      file: 'Metricas_Social.csv',
      status: 'loaded',
      lastUpdate: 'Hace 4 horas',
      records: 523
    }
  ]);

  const [isDragging, setIsDragging] = useState<string | null>(null);

  const allLoaded = dimensions.every(d => d.status === 'loaded');
  const loadedCount = dimensions.filter(d => d.status === 'loaded').length;

  const handleFileUpload = (dimensionId: string, file: File) => {
    console.log(`Archivo subido para ${dimensionId}:`, file.name);
    
    // Simular carga exitosa
    setDimensions(prev => prev.map(dim => 
      dim.id === dimensionId 
        ? { 
            ...dim, 
            status: 'loaded', 
            lastUpdate: 'Hace 1 minuto',
            records: Math.floor(Math.random() * 2000) + 100
          }
        : dim
    ));
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
    if (files.length > 0) {
      handleFileUpload(dimensionId, files[0]);
    }
  };

  const handleFileSelect = (dimensionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(dimensionId, files[0]);
    }
  };

  const handleETLExecution = () => {
    const loadedDimensions = dimensions.filter(d => d.status === 'loaded');
    const dimensionNames = loadedDimensions.map(d => d.name).join(', ');
    
    if (loadedCount === 5) {
      alert(`🚀 Consolidación Completa Iniciada\n\nSe procesarán las 5 dimensiones:\n${dimensionNames}\n\nEl Data Warehouse será actualizado completamente.`);
    } else if (loadedCount > 0) {
      alert(`✅ Carga Parcial Exitosa\n\nSe actualizaron los datos de: ${dimensionNames}\n\nLas demás áreas permanecen sin cambios hasta que cargues sus archivos.`);
    }
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
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
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
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(loadedCount / 5) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
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
                relative overflow-hidden border-4 transition-all cursor-pointer
                ${dimension.status === 'loaded' 
                  ? 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 shadow-xl shadow-green-100' 
                  : 'border-gray-300 bg-gradient-to-br from-gray-50 to-slate-50 hover:border-gray-400'
                }
                ${isDragging === dimension.id ? 'border-indigo-500 scale-105' : ''}
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
                    flex items-center gap-2 px-3 py-1.5 rounded-full font-semibold text-xs
                    ${dimension.status === 'loaded' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-400 text-white'
                    }
                  `}
                  animate={dimension.status === 'loaded' ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1, repeat: dimension.status === 'loaded' ? Infinity : 0 }}
                >
                  {dimension.status === 'loaded' ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      CARGADO
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4" />
                      PENDIENTE
                    </>
                  )}
                </motion.div>
              </div>

              <CardContent className="pt-[0px] pr-[32px] pb-[24px] pl-[32px] p-[32px]">
                {/* Header de la Tarjeta */}
                <div className="flex items-start gap-4 mb-6">
                  <motion.div 
                    className={`
                      w-16 h-16 rounded-2xl flex items-center justify-center
                      ${dimension.status === 'loaded'
                        ? 'bg-gradient-to-br from-green-400 to-emerald-500'
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
                        {dimension.file}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Zona de Carga */}
                {dimension.status === 'pending' ? (
                  <div className="border-3 border-dashed border-gray-300 rounded-xl p-6 text-center bg-white/50">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Arrastre el archivo aquí o haga clic para seleccionar
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                      Formatos soportados: .xlsx, .csv
                    </p>
                    <input
                      type="file"
                      id={`file-${dimension.id}`}
                      className="hidden"
                      accept=".xlsx,.csv,.xls"
                      onChange={(e) => handleFileSelect(dimension.id, e)}
                    />
                    <label htmlFor={`file-${dimension.id}`}>
                      <Button variant="outline" className="w-full" asChild>
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Seleccionar Archivo
                        </span>
                      </Button>
                    </label>
                  </div>
                ) : (
                  <motion.div 
                    className="bg-white border-2 border-green-200 rounded-xl p-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <FileCheck className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Archivo Cargado</p>
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
                        onChange={(e) => handleFileSelect(dimension.id, e)}
                      />
                      <label htmlFor={`file-reload-${dimension.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full" asChild>
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            Recargar
                          </span>
                        </Button>
                      </label>
                      <Button variant="ghost" size="sm" className="flex-1">
                        <Download className="w-4 h-4 mr-2" />
                        Ver Datos
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Footer Info */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>ID Dimensión: {dimension.id.toUpperCase()}</span>
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
                  animate={allLoaded ? { rotate: [0, 360] } : {}}
                  transition={{ duration: 3, repeat: allLoaded ? Infinity : 0, ease: "linear" }}
                >
                  <Layers className="w-8 h-8 text-white" />
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
                whileHover={loadedCount > 0 ? { scale: 1.05 } : {}}
                whileTap={loadedCount > 0 ? { scale: 0.95 } : {}}
              >
                <Button 
                  disabled={loadedCount === 0}
                  onClick={handleETLExecution}
                  className={`
                    px-8 py-6 text-lg font-bold gap-3
                    ${loadedCount > 0
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                      : 'bg-gray-300 cursor-not-allowed'
                    }
                  `}
                >
                  <PlayCircle className="w-6 h-6" />
                  {loadedCount === 0 && 'CARGUE AL MENOS 1 DIMENSIÓN'}
                  {loadedCount === 1 && 'PROCESAR 1 DIMENSIÓN'}
                  {loadedCount > 1 && loadedCount < 5 && `PROCESAR ${loadedCount} DIMENSIONES`}
                  {loadedCount === 5 && 'CONSOLIDAR DATA WAREHOUSE COMPLETO'}
                  <Sparkles className="w-6 h-6" />
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
    </motion.div>
  );
}
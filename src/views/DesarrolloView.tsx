'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Upload, 
  Sparkles,
  Smartphone,
  Globe,
  TrendingUp,
  Users,
  MousePointerClick,
  Eye,
  Share2,
  BarChart3,
  Activity,
  Target,
  Zap,
  FileText,
  Trash2,
  Download,
  CheckCircle,
  MessageCircle,
  DollarSign
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { FileUploader } from '../components/dashboard/FileUploader';
import { DataTable } from '../components/dashboard/DataTable';
import { AIAnalystCard } from '../components/dashboard/AIAnalystCard';
import { DynamicChart } from '../components/dashboard/DynamicChart';

interface DigitalRecord {
  id?: string;
  fecha: string;
  canal: string;
  campana: string;
  inversion: number;
  alcance: number;
  clics: number;
  mensajes: number;
  fecha_registro?: string;
  fileId?: string;
}

interface ProcessedFile {
  id: string;
  fileName: string;
  periodoInicio: string;
  periodoFin: string;
  fechaCarga: string;
  totalProcesado: number;
  totalRegistros: number;
  status: 'integrado' | 'error';
  records: DigitalRecord[];
}

export default function DesarrolloView() {
  const [allRecords, setAllRecords] = useState<DigitalRecord[]>([]);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [showUploader, setShowUploader] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ProcessedFile | null>(null);

  const handleDataParsed = (data: any[], fileName?: string) => {
    console.log('Datos CSV parseados:', data);
    
    const fileId = `file-${Date.now()}`;
    
    const newRecords: DigitalRecord[] = data.map((row, index) => {
      const findValue = (variants: string[]) => {
        for (const key of variants) {
          if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
            return row[key];
          }
        }
        return null;
      };

      // Mapeo basado en el esquema del usuario (Marketing Ads):
      // ['Fecha Reporte', 'Plataforma', 'Campaña', 'Inversión', 'Alcance', 'Clics', 'Mensajes']
      const fecha = findValue(['Fecha Reporte', 'Fecha', 'date', 'Date']) || new Date().toISOString().split('T')[0];
      const canal = findValue(['Plataforma', 'plataforma', 'canal', 'Canal']) || 'Sin plataforma';
      const campana = findValue(['Campaña', 'campaña', 'campaign', 'Campaign']) || 'General';
      const inversion = parseFloat(findValue(['Inversión', 'inversión', 'inversion', 'Inversion', 'gasto', 'Gasto']) || 0);
      const alcance = parseFloat(findValue(['Alcance', 'alcance', 'reach', 'Reach', 'impresiones', 'Impresiones']) || 0);
      const clics = parseFloat(findValue(['Clics', 'clics', 'clicks', 'Clicks']) || 0);
      const mensajes = parseFloat(findValue(['Mensajes', 'mensajes', 'messages', 'Messages']) || 0);

      return {
        id: `dig-${Date.now()}-${index}`,
        fecha,
        canal,
        campana,
        inversion,
        alcance,
        clics,
        mensajes,
        fecha_registro: new Date().toISOString(),
        fileId,
      };
    });

    console.log('Registros procesados:', newRecords);
    setAllRecords([...allRecords, ...newRecords]);

    // Extraer periodo de los datos
    const fechas = newRecords.map(r => r.fecha).sort();
    const periodoInicio = fechas.length > 0 ? fechas[0] : 'N/A';
    const periodoFin = fechas.length > 0 ? fechas[fechas.length - 1] : 'N/A';
    
    // Calcular total procesado (suma de inversión)
    const totalProcesado = newRecords.reduce((sum, r) => sum + r.inversion, 0);

    const newFile: ProcessedFile = {
      id: fileId,
      fileName: fileName || `MKT_Archivo_${new Date().toLocaleDateString('es-MX').replace(/\//g, '-')}.xlsx`,
      periodoInicio,
      periodoFin,
      fechaCarga: new Date().toISOString(),
      totalProcesado,
      totalRegistros: newRecords.length,
      status: 'integrado',
      records: newRecords,
    };

    setProcessedFiles([newFile, ...processedFiles]);
    setShowUploader(false);
  };

  const handleEdit = (row: DigitalRecord) => {
    console.log('Editar registro:', row);
  };

  const handleDelete = (row: DigitalRecord) => {
    setAllRecords(allRecords.filter(r => r.id !== row.id));
  };

  const handleCreate = () => {
    setShowUploader(true);
  };

  // Calcular métricas
  const totalInversion = allRecords.reduce((sum, r) => sum + r.inversion, 0);
  const totalAlcance = allRecords.reduce((sum, r) => sum + r.alcance, 0);
  const totalInteracciones = allRecords.reduce((sum, r) => sum + r.clics + r.mensajes, 0);
  const costoPorResultado = totalInteracciones > 0 ? totalInversion / totalInteracciones : 0;

  // Preparar datos para gráficos
  const chartDataByPlatform = allRecords.reduce((acc: any[], record) => {
    const existing = acc.find(item => item.name === record.canal);
    if (existing) {
      existing.inversion += record.inversion;
      existing.resultados += (record.clics + record.mensajes);
    } else {
      acc.push({
        name: record.canal,
        inversion: record.inversion,
        resultados: (record.clics + record.mensajes),
      });
    }
    return acc;
  }, []);

  const chartDataByCampaignCPR = allRecords
    .map(record => ({
      name: record.campana,
      cpr: (record.clics + record.mensajes) > 0 ? record.inversion / (record.clics + record.mensajes) : 0,
      inversion: record.inversion
    }))
    .sort((a, b) => a.cpr - b.cpr) // Ordenar por menor costo (más eficiente)
    .slice(0, 7); // Top 7 campañas

  const columns = [
    { key: 'fecha' as keyof DigitalRecord, label: 'Fecha' },
    { key: 'canal' as keyof DigitalRecord, label: 'Plataforma' },
    { key: 'campana' as keyof DigitalRecord, label: 'Campaña' },
    { 
      key: 'inversion' as keyof DigitalRecord, 
      label: 'Inversión',
      render: (value: number) => `$${value.toLocaleString()}`
    },
    { 
      key: 'alcance' as keyof DigitalRecord, 
      label: 'Alcance',
      render: (value: number) => value.toLocaleString()
    },
    { 
      key: 'clics' as keyof DigitalRecord, 
      label: 'Clics',
      render: (value: number) => value.toLocaleString()
    },
    { 
      key: 'mensajes' as keyof DigitalRecord, 
      label: 'Mensajes',
      render: (value: number) => value.toLocaleString()
    },
    { 
      key: 'cpr' as keyof DigitalRecord, 
      label: 'Costo/Res',
      render: (value: number) => (
        <span className={`font-medium ${value < 50 ? 'text-green-600' : value < 100 ? 'text-yellow-600' : 'text-red-600'}`}>
          ${value.toFixed(2)}
        </span>
      )
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Desarrollo Digital</h2>
            <p className="text-sm text-gray-500">Marketing y métricas de campañas</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setShowUploader(!showUploader)}>
            <Upload className="w-4 h-4" />
            {showUploader ? 'Ocultar Importador' : 'Importar Datos'}
          </Button>
        </div>
      </div>

      {/* CSV Uploader */}
      {showUploader && (
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-orange-600" />
              Importar Reporte de Marketing
            </CardTitle>
            <CardDescription>
              Sube un archivo Excel con columnas: Fecha Reporte, Plataforma, Campaña, Inversión, Alcance, Clics, Mensajes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploader 
              onDataParsed={handleDataParsed}
              expectedColumns={['fecha reporte', 'plataforma', 'campaña', 'inversión', 'alcance', 'clics', 'mensajes']}
              dimensionName="Desarrollo Digital"
            />
          </CardContent>
        </Card>
      )}

      {/* Main Metrics - Top Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-600 border-0 shadow-lg hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white/90 font-medium">Inversión Total</p>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-2">${totalInversion.toLocaleString()}</p>
            <div className="flex items-center gap-1 text-xs text-white/80 font-medium">
              <TrendingUp className="w-3 h-3" />
              <span>Presupuesto ejercido</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 border-0 shadow-lg hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white/90 font-medium">Alcance Total</p>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-2">{totalAlcance.toLocaleString()}</p>
            <div className="flex items-center gap-1 text-xs text-white/80 font-medium">
              <Users className="w-3 h-3" />
              <span>Personas alcanzadas</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 border-0 shadow-lg hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white/90 font-medium">Interacciones</p>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <MousePointerClick className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-2">{totalInteracciones.toLocaleString()}</p>
            <div className="flex items-center gap-1 text-xs text-white/80 font-medium">
              <MessageCircle className="w-3 h-3" />
              <span>Clics + Mensajes</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-600 border-0 shadow-lg hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white/90 font-medium">Costo por Resultado</p>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-2">${costoPorResultado.toFixed(2)}</p>
            <div className="flex items-center gap-1 text-xs text-white/80 font-medium">
              <Zap className="w-3 h-3" />
              <span>Eficiencia de campaña</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para organizar contenido */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">📊 Tablero de Indicadores</TabsTrigger>
          <TabsTrigger value="data">🗃️ Bitácora de Archivos</TabsTrigger>
          <TabsTrigger value="analysis">🤖 Insights & Predicciones</TabsTrigger>
        </TabsList>

        {/* Tab: Tablero de Indicadores */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <DynamicChart
                data={chartDataByPlatform}
                type="composed"
                title="Rendimiento de Inversión (ROI)"
                description="Inversión (Barras) vs Resultados Totales (Línea)"
                xKey="name"
                yKey="inversion"
                yKey2="resultados"
              />
            </div>
            <div>
              <DynamicChart
                data={chartDataByCampaignCPR}
                type="bar"
                title="Eficiencia por Campaña (CPR)"
                description="Costo por Resultado (Menor es mejor)"
                xKey="cpr"
                yKey="cpr"
                nameKey="name"
              />
            </div>
          </div>
        </TabsContent>

        {/* Tab: Datos y CRUD */}
        <TabsContent value="data" className="space-y-6">
          {/* Log de Archivos Procesados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Log de Archivos Procesados
              </CardTitle>
              <CardDescription>
                Historial de archivos cargados al Data Warehouse
              </CardDescription>
            </CardHeader>
            <CardContent>
              {processedFiles.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No se han procesado archivos</p>
                  <p className="text-sm mt-1">Los archivos aparecerán aquí después de cargarlos</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left p-3 font-semibold text-sm text-gray-700">Nombre del Archivo</th>
                        <th className="text-left p-3 font-semibold text-sm text-gray-700">Periodo Abarcado</th>
                        <th className="text-left p-3 font-semibold text-sm text-gray-700">Fecha de Carga</th>
                        <th className="text-right p-3 font-semibold text-sm text-gray-700">Inversión Total</th>
                        <th className="text-center p-3 font-semibold text-sm text-gray-700">Status</th>
                        <th className="text-center p-3 font-semibold text-sm text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedFiles.map((file) => {
                        const fechaCarga = new Date(file.fechaCarga);
                        const ahora = new Date();
                        const diffMinutes = Math.floor((ahora.getTime() - fechaCarga.getTime()) / (1000 * 60));
                        
                        let fechaTexto = '';
                        if (diffMinutes < 1) {
                          fechaTexto = 'Justo ahora';
                        } else if (diffMinutes < 60) {
                          fechaTexto = `Hace ${diffMinutes} min`;
                        } else if (diffMinutes < 1440) {
                          fechaTexto = `Hoy, ${fechaCarga.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
                        } else {
                          fechaTexto = fechaCarga.toLocaleDateString('es-MX', { 
                            day: '2-digit', 
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                        }

                        return (
                          <tr 
                            key={file.id} 
                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-orange-600" />
                                <span className="font-medium text-sm">{file.fileName}</span>
                              </div>
                              <span className="text-xs text-gray-500 ml-6">
                                {file.totalRegistros} registros
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="text-sm text-gray-700">
                                {file.periodoInicio} - {file.periodoFin}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="text-sm text-gray-700">{fechaTexto}</span>
                            </td>
                            <td className="p-3 text-right">
                              <span className="text-sm font-semibold text-gray-900">
                                ${file.totalProcesado.toLocaleString()}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                <CheckCircle className="w-3 h-3" />
                                Integrado al Warehouse
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-1.5 hover:bg-blue-50 hover:text-blue-700"
                                  onClick={() => setSelectedFile(file)}
                                  title="Inspeccionar datos crudos de este archivo"
                                >
                                  <Eye className="w-4 h-4" />
                                  Ver Detalle
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="hover:bg-red-50 hover:text-red-700"
                                  onClick={() => {
                                    setProcessedFiles(processedFiles.filter(f => f.id !== file.id));
                                    setAllRecords(allRecords.filter(r => r.fileId !== file.id));
                                  }}
                                  title="Eliminar archivo del warehouse"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Análisis IA */}
        <TabsContent value="analysis" className="space-y-6">
          <AIAnalystCard data={allRecords} dimensionName="Desarrollo Digital" />
          
          {allRecords.length === 0 && (
            <Card className="border-2 border-orange-200 bg-orange-50">
              <CardContent className="p-6 text-center">
                <Sparkles className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                <p className="font-medium text-orange-900 mb-2">No hay datos para analizar</p>
                <p className="text-sm text-orange-700">
                  Importa un archivo Excel o crea registros manualmente para comenzar el análisis con IA
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Setup Instructions - Solo mostrar si no hay datos */}
      {allRecords.length === 0 && (
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <Sparkles className="w-5 h-5" />
              Comienza a usar Desarrollo Digital
            </CardTitle>
            <CardDescription className="text-orange-700">
              Sube tu primer reporte Excel para comenzar
            </CardDescription>
          </CardHeader>
          <CardContent className="text-orange-800">
            <ol className="list-decimal ml-5 space-y-2 text-sm">
              <li>Haz clic en "Importar Datos" para subir tu archivo Excel</li>
              <li>El archivo debe contener las columnas: Fecha Reporte, Plataforma, Campaña, Inversión, Alcance, Clics, Mensajes</li>
              <li>Los datos se procesarán automáticamente y aparecerán en la tabla</li>
              <li>Usa el AI Analyst para obtener insights sobre tu presencia digital</li>
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Modal: Ver Detalle de Archivo */}
      {selectedFile && (() => {
        const excludedFields = [
          'id', 
          'fileId', 
          'fecha_registro',
          'fecha',
          'canal'
        ];
        
        const dynamicColumns = selectedFile.records.length > 0 
          ? Object.keys(selectedFile.records[0])
              .filter(key => !excludedFields.includes(key))
              .map(key => ({
                key: key as keyof DigitalRecord,
                label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
                render: (value: any) => {
                  if (key === 'inversion') {
                    return `$${parseFloat(value).toLocaleString()}`;
                  }
                  if (key === 'alcance' || key === 'clics' || key === 'mensajes') {
                    return parseFloat(value).toLocaleString();
                  }
                  return value !== null && value !== undefined ? value.toString() : '-';
                }
              }))
          : [];

        return (
          <div 
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedFile(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-6 h-6" />
                      <h3 className="text-xl font-bold">{selectedFile.fileName}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/90">
                      <span>📅 {selectedFile.periodoInicio} - {selectedFile.periodoFin}</span>
                      <span>•</span>
                      <span>🎯 {selectedFile.totalProcesado.toLocaleString()} inversión</span>
                      <span>•</span>
                      <span>📊 {selectedFile.totalRegistros} registros</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={() => setSelectedFile(null)}
                  >
                    ✕
                  </Button>
                </div>
              </div>

              <div className="p-6 overflow-auto max-h-[calc(90vh-140px)]">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Mostrando <span className="font-semibold text-gray-900">{selectedFile.records.length}</span> métricas procesadas
                  </p>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Exportar
                  </Button>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100 border-b-2 border-gray-300">
                        <th className="text-left p-3 font-semibold text-sm text-gray-700 w-16">#</th>
                        {dynamicColumns.map((col, idx) => (
                          <th key={idx} className="text-left p-3 font-semibold text-sm text-gray-700">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedFile.records.map((record, rowIdx) => (
                        <tr 
                          key={rowIdx} 
                          className="border-b border-gray-100 hover:bg-blue-50 transition-colors"
                        >
                          <td className="p-3 text-xs text-gray-500 font-mono">
                            {String(rowIdx + 1).padStart(3, '0')}
                          </td>
                          {dynamicColumns.map((col, colIdx) => (
                            <td key={colIdx} className="p-3 text-sm text-gray-700">
                              {col.render ? col.render(record[col.key]) : record[col.key]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {selectedFile.records.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No hay registros en este archivo</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        );
      })()}
    </div>
  );
}
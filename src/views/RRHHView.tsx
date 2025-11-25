'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Upload, 
  Sparkles,
  Users,
  UserPlus,
  UserCheck,
  TrendingUp,
  Award,
  Activity,
  Clock,
  CheckCircle,
  DollarSign,
  Briefcase,
  Calendar,
  FileText,
  Eye,
  Trash2,
  Download,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { FileUploader } from '../components/dashboard/FileUploader';
import { DataTable } from '../components/dashboard/DataTable';
import { AIAnalystCard } from '../components/dashboard/AIAnalystCard';
import { DynamicChart } from '../components/dashboard/DynamicChart';

interface HRRecord {
  id?: string;
  fecha: string;
  id_emp: string;
  empleado: string;
  puesto: string;
  incidencia: string;
  horas_extra: number;
  monto_extra: number;
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
  records: HRRecord[];
}

export default function RRHHView() {
  const [allRecords, setAllRecords] = useState<HRRecord[]>([]);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [showUploader, setShowUploader] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ProcessedFile | null>(null);

  const handleDataParsed = (data: any[], fileName?: string) => {
    console.log('Datos CSV parseados:', data);
    
    const fileId = `file-${Date.now()}`;
    
    const newRecords: HRRecord[] = data.map((row, index) => {
      const findValue = (variants: string[]) => {
        for (const key of variants) {
          if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
            return row[key];
          }
        }
        return null;
      };

      // Mapeo basado en el esquema del usuario (Asistencia/Nómina):
      // ['Fecha Registro', 'ID Emp', 'Empleado', 'Puesto', 'Incidencia', 'Horas Extra', 'Monto Extra']
      const fecha = findValue(['Fecha Registro', 'Fecha', 'date', 'Date']) || new Date().toISOString().split('T')[0];
      const id_emp = findValue(['ID Emp', 'id_emp', 'ID', 'id']) || `EMP-${index + 1}`;
      const empleado = findValue(['Empleado', 'empleado', 'nombre', 'Nombre']) || `Empleado ${index + 1}`;
      const puesto = findValue(['Puesto', 'puesto', 'cargo', 'Cargo']) || 'Sin puesto';
      const incidencia = findValue(['Incidencia', 'incidencia', 'tipo', 'Tipo']) || 'Asistencia';
      const horas_extra = parseFloat(findValue(['Horas Extra', 'horas_extra', 'horas', 'Horas']) || 0);
      const monto_extra = parseFloat(findValue(['Monto Extra', 'monto_extra', 'monto', 'Monto']) || 0);

      return {
        id: `hr-${Date.now()}-${index}`,
        fecha,
        id_emp,
        empleado,
        puesto,
        incidencia,
        horas_extra,
        monto_extra,
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
    
    // Calcular total procesado (suma de monto extra)
    const totalProcesado = newRecords.reduce((sum, r) => sum + r.monto_extra, 0);

    const newFile: ProcessedFile = {
      id: fileId,
      fileName: fileName || `RRHH_Archivo_${new Date().toLocaleDateString('es-MX').replace(/\//g, '-')}.xlsx`,
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

  const handleEdit = (row: HRRecord) => {
    console.log('Editar registro:', row);
  };

  const handleDelete = (row: HRRecord) => {
    setAllRecords(allRecords.filter(r => r.id !== row.id));
  };

  const handleCreate = () => {
    setShowUploader(true);
  };

  // Calcular métricas
  const totalIncidencias = allRecords.filter(r => r.incidencia !== 'Asistencia').length;
  const totalHorasExtra = allRecords.reduce((sum, r) => sum + r.horas_extra, 0);
  const costoHorasExtra = allRecords.reduce((sum, r) => sum + r.monto_extra, 0);
  const empleadosUnicos = new Set(allRecords.map(r => r.id_emp)).size;

  // Preparar datos para gráficos
  const chartDataByEmployee = allRecords
    .reduce((acc: any[], record) => {
      const existing = acc.find(item => item.name === record.empleado);
      if (existing) {
        existing.horas += record.horas_extra;
        existing.monto += record.monto_extra;
      } else {
        acc.push({
          name: record.empleado,
          horas: record.horas_extra,
          monto: record.monto_extra,
        });
      }
      return acc;
    }, [])
    .sort((a: any, b: any) => b.monto - a.monto) // Ordenar por mayor monto
    .slice(0, 7); // Top 7 empleados con más costo extra

  const chartDataByIncidencia = allRecords.reduce((acc: any[], record) => {
    const existing = acc.find(item => item.name === record.incidencia);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({
        name: record.incidencia,
        value: 1,
      });
    }
    return acc;
  }, []);

  const columns = [
    { key: 'fecha' as keyof HRRecord, label: 'Fecha' },
    { key: 'id_emp' as keyof HRRecord, label: 'ID' },
    { key: 'empleado' as keyof HRRecord, label: 'Empleado' },
    { key: 'puesto' as keyof HRRecord, label: 'Puesto' },
    { 
      key: 'incidencia' as keyof HRRecord, 
      label: 'Incidencia',
      render: (value: string) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Falta' ? 'bg-red-100 text-red-700' :
          value === 'Retardo' ? 'bg-yellow-100 text-yellow-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {value}
        </span>
      )
    },
    { 
      key: 'horas_extra' as keyof HRRecord, 
      label: 'Horas Extra',
      render: (value: number) => value > 0 ? <span className="font-medium text-blue-600">+{value}h</span> : '-'
    },
    { 
      key: 'monto_extra' as keyof HRRecord, 
      label: 'Costo Extra',
      render: (value: number) => value > 0 ? <span className="font-medium text-green-600">+${value.toLocaleString()}</span> : '-'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Recursos Humanos</h2>
            <p className="text-sm text-gray-500">Control de asistencia y nómina extra</p>
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
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-purple-600" />
              Importar Reporte de Asistencia
            </CardTitle>
            <CardDescription>
              Sube un archivo Excel con columnas: Fecha Registro, ID Emp, Empleado, Puesto, Incidencia, Horas Extra, Monto Extra
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploader 
              onDataParsed={handleDataParsed}
              expectedColumns={['fecha registro', 'id emp', 'empleado', 'puesto', 'incidencia', 'horas extra', 'monto extra']}
              dimensionName="RRHH"
            />
          </CardContent>
        </Card>
      )}

      {/* Main Metrics - Top Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-600 border-0 shadow-lg hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white/90 font-medium">Empleados Activos</p>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-2">{empleadosUnicos}</p>
            <div className="flex items-center gap-1 text-xs text-white/80 font-medium">
              <UserCheck className="w-3 h-3" />
              <span>En reporte actual</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-600 border-0 shadow-lg hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white/90 font-medium">Horas Extra Totales</p>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-2">{totalHorasExtra}h</p>
            <div className="flex items-center gap-1 text-xs text-white/80 font-medium">
              <Activity className="w-3 h-3" />
              <span>Acumuladas</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 border-0 shadow-lg hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white/90 font-medium">Costo Nómina Extra</p>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-2">${costoHorasExtra.toLocaleString()}</p>
            <div className="flex items-center gap-1 text-xs text-white/80 font-medium">
              <TrendingUp className="w-3 h-3" />
              <span>Pago adicional</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-600 border-0 shadow-lg hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white/90 font-medium">Incidencias</p>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-2">{totalIncidencias}</p>
            <div className="flex items-center gap-1 text-xs text-white/80 font-medium">
              <span>Registros atípicos</span>
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
                data={chartDataByEmployee}
                type="bar"
                title="Top Costo Nómina Extra"
                description="Empleados con mayor pago por horas extra"
                xKey="value"
                yKey="monto"
                nameKey="name"
              />
            </div>
            <div>
              <DynamicChart
                data={chartDataByIncidencia}
                type="bar"
                title="Frecuencia de Incidencias"
                description="Distribución por tipo de evento"
                xKey="name"
                yKey="value"
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
                        <th className="text-right p-3 font-semibold text-sm text-gray-700">Monto Extra</th>
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
                                <FileText className="w-4 h-4 text-purple-600" />
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
          <AIAnalystCard data={allRecords} dimensionName="RRHH" />
          
          {allRecords.length === 0 && (
            <Card className="border-2 border-purple-200 bg-purple-50">
              <CardContent className="p-6 text-center">
                <Sparkles className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <p className="font-medium text-purple-900 mb-2">No hay datos para analizar</p>
                <p className="text-sm text-purple-700">
                  Importa un archivo Excel o crea registros manualmente para comenzar el análisis con IA
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Setup Instructions - Solo mostrar si no hay datos */}
      {allRecords.length === 0 && (
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Sparkles className="w-5 h-5" />
              Comienza a usar RRHH
            </CardTitle>
            <CardDescription className="text-purple-700">
              Sube tu primer reporte Excel para comenzar
            </CardDescription>
          </CardHeader>
          <CardContent className="text-purple-800">
            <ol className="list-decimal ml-5 space-y-2 text-sm">
              <li>Haz clic en "Importar Datos" para subir tu archivo Excel</li>
              <li>El archivo debe contener las columnas: Fecha Registro, ID Emp, Empleado, Puesto, Incidencia, Horas Extra, Monto Extra</li>
              <li>Los datos se procesarán automáticamente y aparecerán en la tabla</li>
              <li>Usa el AI Analyst para obtener insights sobre tu personal</li>
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
          'id_emp'
        ];
        
        const dynamicColumns = selectedFile.records.length > 0 
          ? Object.keys(selectedFile.records[0])
              .filter(key => !excludedFields.includes(key))
              .map(key => ({
                key: key as keyof HRRecord,
                label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
                render: (value: any) => {
                  if (key === 'monto_extra') {
                    return value > 0 ? `$${parseFloat(value).toLocaleString()}` : '-';
                  }
                  if (key === 'horas_extra') {
                    return value > 0 ? `${value}h` : '-';
                  }
                  if (key === 'incidencia') {
                    return (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        value === 'Asistencia' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {value}
                      </span>
                    );
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
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-6 h-6" />
                      <h3 className="text-xl font-bold">{selectedFile.fileName}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/90">
                      <span>📅 {selectedFile.periodoInicio} - {selectedFile.periodoFin}</span>
                      <span>•</span>
                      <span>💰 ${selectedFile.totalProcesado.toLocaleString()} extra</span>
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
                    Mostrando <span className="font-semibold text-gray-900">{selectedFile.records.length}</span> registros procesados
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
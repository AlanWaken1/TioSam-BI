'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { 
  Upload, 
  Sparkles,
  Factory,
  Package,
  TrendingUp,
  TrendingDown,
  Clock,
  Activity,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Zap,
  FileText,
  Target,
  Percent,
  Eye,
  Trash2,
  Download
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { FileUploader } from '../components/dashboard/FileUploader';
import { DataTable } from '../components/dashboard/DataTable';
import { AIAnalystCard } from '../components/dashboard/AIAnalystCard';

import { DynamicChart } from '../components/dashboard/DynamicChart';
import { ComposedChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProductionRecord {
  id?: string;
  fecha_produccion: string;
  lote: string;
  producto: string;
  cant_programada: number;
  cant_real: number;
  merma: number;
  causa_merma: string;
  eficiencia: number;
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
  records: ProductionRecord[];
}

export default function ProduccionView() {
  const [allRecords, setAllRecords] = useState<ProductionRecord[]>([]);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [showUploader, setShowUploader] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ProcessedFile | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const { confirm, showSuccess, showError } = useConfirmDialog();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: records, error: recordsError } = await supabase
        .from('produccion')
        .select('*')
        .order('fecha_produccion', { ascending: false });

      if (recordsError) throw recordsError;

      const { data: logs, error: logsError } = await supabase
        .from('upload_logs')
        .select('*')
        .eq('dimension', 'Producción')
        .order('created_at', { ascending: false });

      if (logsError) throw logsError;

      const formattedRecords: ProductionRecord[] = (records || []).map((r: any) => ({
        id: r.id,
        fecha_produccion: r.fecha_produccion,
        lote: r.lote,
        producto: r.producto,
        cant_programada: Number(r.cant_programada),
        cant_real: Number(r.cant_real),
        merma: Number(r.merma),
        causa_merma: r.causa_merma,
        eficiencia: Number(r.eficiencia),
        fileId: r.upload_id,
        fecha_registro: r.created_at
      }));

      setAllRecords(formattedRecords);

      // Transform logs
      const formattedLogs: ProcessedFile[] = (logs || []).map((l: any) => {
        const fileRecords = formattedRecords.filter(r => r.fileId === l.id);
        
        // Calculate metrics from records
        let periodoInicio = 'N/A';
        let periodoFin = 'N/A';
        let totalProcesado = 0;

        if (fileRecords.length > 0) {
          // Sort by date to find start/end
          const sortedDates = [...fileRecords].sort((a, b) => new Date(a.fecha_produccion).getTime() - new Date(b.fecha_produccion).getTime());
          periodoInicio = sortedDates[0].fecha_produccion;
          periodoFin = sortedDates[sortedDates.length - 1].fecha_produccion;
          
          // Sum total units produced
          totalProcesado = fileRecords.reduce((sum, r) => sum + r.cant_real, 0);
        }

        return {
          id: l.id,
          fileName: l.filename,
          periodoInicio,
          periodoFin,
          fechaCarga: l.created_at,
          totalProcesado,
          totalRegistros: l.total_rows,
          status: l.status === 'success' ? 'integrado' : 'error',
          records: fileRecords
        };
      });

      setProcessedFiles(formattedLogs);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDataParsed = (data: any[], fileName?: string) => {
    fetchData();
    setShowUploader(false);
  };

  const handleEdit = (row: ProductionRecord) => {
    console.log('Editar registro:', row);
  };

  const handleDelete = async (row: ProductionRecord) => {
    if (!row.id) return;
    
    const confirmed = await confirm(`¿Eliminar lote ${row.lote}?`);
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('produccion')
        .delete()
        .eq('id', row.id);

      if (error) throw error;

      setAllRecords(allRecords.filter(r => r.id !== row.id));
      showSuccess('Registro eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting record:', error);
      showError('Error al eliminar el registro');
    }
  };

  const handleCreate = () => {
    setShowUploader(true);
  };

  // Calcular rango de fechas dinámico
  const dateRange = allRecords.length > 0 ? (() => {
    const dates = allRecords.map(r => new Date(r.fecha_produccion));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    const formatDate = (date: Date) => date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    const formatMonth = (date: Date) => date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    
    if (minDate.getMonth() === maxDate.getMonth() && minDate.getFullYear() === maxDate.getFullYear()) {
      return { text: formatMonth(minDate), isSameMonth: true };
    }
    return { text: `${formatDate(minDate)} - ${formatDate(maxDate)}`, isSameMonth: false };
  })() : { text: 'Sin datos', isSameMonth: false };

  // Calcular métricas
  const totalUnidades = allRecords.reduce((sum, r) => sum + r.cant_real, 0);
  const totalUnidadesProgramadas = allRecords.reduce((sum, r) => sum + r.cant_programada, 0);
  const totalMerma = allRecords.reduce((sum, r) => sum + r.merma, 0);
  const porcentajeMerma = totalUnidades > 0 ? (totalMerma / totalUnidades) * 100 : 0;
  const eficienciaPromedio = allRecords.length > 0 
    ? allRecords.reduce((sum, r) => sum + r.eficiencia, 0) / allRecords.length 
    : 0;
  const lotesRegistrados = allRecords.length;

  // Preparar datos para gráficos
  const chartDataByProduct = allRecords.reduce((acc: any[], record) => {
    const existing = acc.find(item => item.name === record.producto);
    if (existing) {
      existing.programada += record.cant_programada;
      existing.real += record.cant_real;
      existing.eficiencia = (existing.real / existing.programada) * 100;
    } else {
      acc.push({
        name: record.producto,
        programada: record.cant_programada,
        real: record.cant_real,
        eficiencia: record.eficiencia
      });
    }
    return acc;
  }, []);

  const chartDataByMermaCause = allRecords
    .filter(r => r.merma > 0)
    .reduce((acc: any[], record) => {
      const existing = acc.find(item => item.name === record.causa_merma);
      if (existing) {
        existing.value += record.merma;
      } else {
        acc.push({
          name: record.causa_merma,
          value: record.merma,
        });
      }
      return acc;
    }, [])
    .sort((a: any, b: any) => b.value - a.value);

  // Top productos con mayor merma
  const chartDataByProductMerma = allRecords
    .reduce((acc: any[], record) => {
      const existing = acc.find(item => item.name === record.producto);
      if (existing) {
        existing.merma += record.merma;
        existing.unidades += record.cant_real;
      } else {
        acc.push({
          name: record.producto,
          merma: record.merma,
          unidades: record.cant_real
        });
      }
      return acc;
    }, [])
    .filter(p => p.merma > 0)
    .sort((a: any, b: any) => b.merma - a.merma)
    .slice(0, 7);

  const columns = [
    { key: 'fecha_produccion' as keyof ProductionRecord, label: 'Fecha' },
    { key: 'lote' as keyof ProductionRecord, label: 'Lote ID' },
    { key: 'producto' as keyof ProductionRecord, label: 'Producto' },
    { 
      key: 'cant_programada' as keyof ProductionRecord, 
      label: 'Programada',
      render: (value: number) => value.toLocaleString()
    },
    { 
      key: 'cant_real' as keyof ProductionRecord, 
      label: 'Real',
      render: (value: number) => value.toLocaleString()
    },
    { 
      key: 'eficiencia' as keyof ProductionRecord, 
      label: 'Eficiencia',
      render: (value: number) => (
        <span className={`font-medium ${value >= 95 ? 'text-green-600' : value >= 85 ? 'text-yellow-600' : 'text-red-600'}`}>
          {value.toFixed(1)}%
        </span>
      )
    },
    { 
      key: 'merma' as keyof ProductionRecord, 
      label: 'Merma (Kg)',
      render: (value: number) => value > 0 ? <span className="text-red-500 font-medium">{value} kg</span> : '0 kg'
    },
    { key: 'causa_merma' as keyof ProductionRecord, label: 'Causa' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
            <Factory className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Producción</h2>
            <p className="text-sm text-gray-500">Monitoreo de lotes, eficiencia y mermas</p>
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
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              Importar Reporte de Producción
            </CardTitle>
            <CardDescription>
              Sube un archivo Excel con columnas: Fecha, Lote ID, Producto, Cant. Programada, Cant. Real, Merma (Kg), Causa Merma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploader 
              onDataParsed={handleDataParsed}
              expectedColumns={['fecha', 'lote id', 'producto', 'cant. programada', 'cant. real', 'merma (kg)', 'causa merma']}
              dimensionName="Producción"
            />
          </CardContent>
        </Card>
      )}

      {/* Main Metrics - Top Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 border-0 shadow-lg hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white/90 font-medium">Unidades Producidas</p>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-2">{totalUnidades.toLocaleString()}</p>
            <div className="flex items-center gap-1 text-xs text-white/80 font-medium">
              <TrendingUp className="w-3 h-3" />
              <span>Periodo: {dateRange.text}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 border-0 shadow-lg hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white/90 font-medium">Eficiencia Promedio</p>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-2">{eficienciaPromedio.toFixed(1)}%</p>
            <div className="flex items-center gap-1 text-xs text-white/80 font-medium">
              <span>{lotesRegistrados} lotes • {dateRange.text}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-red-500 to-orange-600 border-0 shadow-lg hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white/90 font-medium">Merma Total</p>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-2">{totalMerma.toLocaleString()} kg</p>
            <div className="flex items-center gap-1 text-xs text-white/80 font-medium">
              <TrendingDown className="w-3 h-3" />
              <span>{porcentajeMerma.toFixed(2)}% del total producido</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-violet-600 border-0 shadow-lg hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white/90 font-medium">Lotes Procesados</p>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Factory className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-2">{lotesRegistrados}</p>
            <div className="flex items-center gap-1 text-xs text-white/80 font-medium">
              <span>Periodo: {dateRange.text}</span>
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
              <Card className="h-full border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-gray-800">Eficiencia de Producción</CardTitle>
                  <CardDescription className="text-sm text-gray-500">Producción Real (Barras) vs Eficiencia % (Línea)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={chartDataByProduct}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fill: '#64748b', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          yAxisId="left"
                          tick={{ fill: '#64748b', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          yAxisId="right" 
                          orientation="right" 
                          domain={[0, 100]}
                          tick={{ fill: '#64748b', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          unit="%"
                        />
                        <Tooltip 
                          cursor={{ fill: '#f1f5f9' }}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar yAxisId="left" dataKey="real" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} name="Producción Real" />
                        <Line yAxisId="right" type="monotone" dataKey="eficiencia" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Eficiencia %" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div>
              <Card className="h-full border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-gray-800">Pareto de Mermas</CardTitle>
                  <CardDescription className="text-sm text-gray-500">Causas principales de desperdicio</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartDataByMermaCause}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={100}
                          tick={{ fill: '#64748b', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip 
                          cursor={{ fill: '#f1f5f9' }}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: number) => [`${value.toLocaleString()} kg`, 'Merma']}
                        />
                        <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Nueva fila: Top Productos con Mayor Merma */}
          <div className="grid grid-cols-1 gap-6">
            <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-gray-800">Top Productos con Mayor Merma</CardTitle>
                <CardDescription className="text-sm text-gray-500">
                  Productos que generan más desperdicio • <span className="font-mono text-xs">Optimizar recetas/procesos</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartDataByProductMerma}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={120}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number, name: string, props: any) => {
                          if (name === 'merma') {
                            const porcentaje = props.payload.unidades > 0 
                              ? ((value / props.payload.unidades) * 100).toFixed(2)
                              : '0.00';
                            return [`${value.toLocaleString()} kg (${porcentaje}% de producción)`, 'Merma'];
                          }
                          return [value, name];
                        }}
                        labelFormatter={(label) => `Producto: ${label}`}
                      />
                      <Bar dataKey="merma" fill="#f97316" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
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
                        <th className="text-right p-3 font-semibold text-sm text-gray-700">Total Unidades</th>
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
                                <FileText className="w-4 h-4 text-blue-600" />
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
                                {file.totalProcesado.toLocaleString()} unidades
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
                                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                  onClick={() => setSelectedFile(file)}
                                  title="Inspeccionar datos crudos de este archivo"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                  onClick={async () => {
                                    const confirmed = await confirm('¿Eliminar este archivo y todos sus registros?');
                                    if (confirmed) {
                                      try {
                                        const { error } = await supabase
                                          .from('upload_logs')
                                          .delete()
                                          .eq('id', file.id);
                                        
                                        if (error) throw error;
                                        
                                        await fetchData();
                                        showSuccess('Archivo eliminado correctamente');
                                      } catch (err) {
                                        console.error('Error deleting file:', err);
                                        showError('Error al eliminar el archivo');
                                      }
                                    }
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
          <AIAnalystCard data={allRecords} dimensionName="Producción" />
          
          {allRecords.length === 0 && (
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-6 text-center">
                <Sparkles className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <p className="font-medium text-blue-900 mb-2">No hay datos para analizar</p>
                <p className="text-sm text-blue-700">
                  Importa un archivo Excel o crea registros manualmente para comenzar el análisis con IA
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Setup Instructions - Solo mostrar si no hay datos */}
      {allRecords.length === 0 && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Sparkles className="w-5 h-5" />
              Comienza a usar Producción
            </CardTitle>
            <CardDescription className="text-blue-700">
              Sube tu primer reporte Excel para comenzar
            </CardDescription>
          </CardHeader>
          <CardContent className="text-blue-800">
            <ol className="list-decimal ml-5 space-y-2 text-sm">
              <li>Haz clic en "Importar Datos" para subir tu archivo Excel</li>
              <li>El archivo debe contener las columnas: Fecha, Lote ID, Producto, Cant. Programada, Cant. Real, Merma (Kg), Causa Merma</li>
              <li>Los datos se procesarán automáticamente y aparecerán en la tabla</li>
              <li>Usa el AI Analyst para obtener insights sobre tu producción</li>
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
          'fecha_produccion'
        ];
        
        const dynamicColumns = selectedFile.records.length > 0 
          ? Object.keys(selectedFile.records[0])
              .filter(key => !excludedFields.includes(key))
              .map(key => ({
                key: key as keyof ProductionRecord,
                label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
                render: (value: any) => {
                  if (key === 'cant_real' || key === 'cant_programada') {
                    return value.toLocaleString();
                  }
                  if (key === 'eficiencia') {
                    return `${parseFloat(value || 0).toFixed(1)}%`;
                  }
                  if (key === 'merma') {
                    return value > 0 ? `${value} kg` : '-';
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
              <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-6 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-6 h-6" />
                      <h3 className="text-xl font-bold">{selectedFile.fileName}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/90">
                      <span>📅 {selectedFile.periodoInicio} - {selectedFile.periodoFin}</span>
                      <span>•</span>
                      <span>📦 {selectedFile.totalProcesado.toLocaleString()} unidades</span>
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
                    Mostrando <span className="font-semibold text-gray-900">{selectedFile.records.length}</span> lotes procesados
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
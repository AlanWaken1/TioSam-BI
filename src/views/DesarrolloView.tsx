'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

  const [isLoading, setIsLoading] = useState(true);
  const { confirm, showSuccess, showError } = useConfirmDialog();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: records, error: recordsError } = await supabase
        .from('desarrollo')
        .select('*')
        .order('fecha', { ascending: false });

      if (recordsError) throw recordsError;

      const { data: logs, error: logsError } = await supabase
        .from('upload_logs')
        .select('*')
        .eq('dimension', 'Desarrollo Digital')
        .order('created_at', { ascending: false });

      if (logsError) throw logsError;

      const formattedRecords: DigitalRecord[] = (records || []).map((r: any) => ({
        id: r.id,
        fecha: r.fecha,
        canal: r.canal,
        campana: r.campana,
        inversion: Number(r.inversion),
        alcance: Number(r.alcance),
        clics: Number(r.clics),
        mensajes: Number(r.mensajes),
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
          const sortedDates = [...fileRecords].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
          periodoInicio = sortedDates[0].fecha;
          periodoFin = sortedDates[sortedDates.length - 1].fecha;
          
          // Sum total investment
          totalProcesado = fileRecords.reduce((sum, r) => sum + r.inversion, 0);
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

  const handleEdit = (row: DigitalRecord) => {
    console.log('Editar registro:', row);
  };

  const handleDelete = async (row: DigitalRecord) => {
    if (!row.id) return;
    
    const confirmed = await confirm(`¿Eliminar campaña ${row.campana}?`);
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('desarrollo')
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
    const dates = allRecords.map(r => new Date(r.fecha));
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
  const totalInversion = allRecords.reduce((sum, r) => sum + r.inversion, 0);
  const totalAlcance = allRecords.reduce((sum, r) => sum + r.alcance, 0);
  const totalInteracciones = allRecords.reduce((sum, r) => sum + r.clics + r.mensajes, 0);
  const costoPorResultado = totalInteracciones > 0 ? totalInversion / totalInteracciones : 0;

  // Análisis de mejor periodo (agrupado por semana)
  const weeklyData = allRecords.reduce((acc: any, record) => {
    const date = new Date(record.fecha);
    const weekKey = `Semana ${Math.ceil(date.getDate() / 7)} - ${date.toLocaleDateString('es-MX', { month: 'short' })}`;
    
    if (!acc[weekKey]) {
      acc[weekKey] = { inversion: 0, alcance: 0, interacciones: 0 };
    }
    acc[weekKey].inversion += record.inversion;
    acc[weekKey].alcance += record.alcance;
    acc[weekKey].interacciones += (record.clics + record.mensajes);
    return acc;
  }, {});

  const weeklyArray = Object.entries(weeklyData).map(([week, data]: [string, any]) => ({
    week,
    inversion: data.inversion,
    alcance: data.alcance,
    interacciones: data.interacciones
  }));

  const mejorSemanaInversion = weeklyArray.length > 0 
    ? weeklyArray.reduce((max, current) => current.inversion > max.inversion ? current : max, weeklyArray[0])
    : null;

  const mejorSemanaAlcance = weeklyArray.length > 0
    ? weeklyArray.reduce((max, current) => current.alcance > max.alcance ? current : max, weeklyArray[0])
    : null;

  // Preparar datos para gráficos
  const chartDataByPlatform = allRecords.reduce((acc: any[], record) => {
    const existing = acc.find(item => item.name === record.canal);
    if (existing) {
      existing.inversion += record.inversion;
      existing.resultados += (record.clics + record.mensajes);
      existing.alcance += record.alcance;
    } else {
      acc.push({
        name: record.canal,
        inversion: record.inversion,
        resultados: (record.clics + record.mensajes),
        alcance: record.alcance,
      });
    }
    return acc;
  }, []);

  // Calcular ROI por plataforma (Resultados por cada $ invertido)
  const chartDataROI = chartDataByPlatform
    .map(platform => ({
      name: platform.name,
      roi: platform.inversion > 0 ? platform.resultados / platform.inversion : 0,
      inversion: platform.inversion,
      resultados: platform.resultados
    }))
    .sort((a, b) => b.roi - a.roi);

  const chartDataByCampaignCPR = allRecords
    .map(record => ({
      name: record.campana,
      cpr: (record.clics + record.mensajes) > 0 ? record.inversion / (record.clics + record.mensajes) : 0,
      inversion: record.inversion
    }))
    .sort((a, b) => a.cpr - b.cpr)
    .slice(0, 7);

  // Gráfica de inversión por semana
  const chartDataWeekly = weeklyArray.sort((a, b) => a.week.localeCompare(b.week));

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
              <span>Periodo: {dateRange.text}</span>
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
              <span>Periodo: {dateRange.text}</span>
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
              <span>{allRecords.length} campañas</span>
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
              <span>{totalInteracciones > 0 ? `${totalInteracciones} resultados` : 'Sin datos'}</span>
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
              <Card className="h-full border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-gray-800">Eficiencia por Campaña (CPR)</CardTitle>
                  <CardDescription className="text-sm text-gray-500">
                    Costo por Resultado - Menor es mejor • <span className="font-mono text-xs">Inversión ÷ Interacciones</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartDataByCampaignCPR}
                        margin={{ top: 5, right: 30, left: 10, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          tick={{ fill: '#64748b', fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          tick={{ fill: '#64748b', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value) => `$${value.toFixed(2)}`}
                        />
                        <Tooltip 
                          cursor={{ fill: '#f1f5f9' }}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: number, name: string, props: any) => [
                            `$${value.toFixed(2)} por resultado (inv: $${props.payload.inversion.toLocaleString()})`,
                            'CPR'
                          ]}
                          labelFormatter={(label) => `Campaña: ${label}`}
                        />
                        <Bar dataKey="cpr" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Nueva fila: Gráficas adicionales */}
          <div className="grid grid-cols-2 gap-6">
            {/* ROI por Plataforma */}
            <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-gray-800">ROI por Plataforma</CardTitle>
                <CardDescription className="text-sm text-gray-500">
                  Resultados obtenidos por cada $ invertido • <span className="font-mono text-xs">Cálculo: Interacciones ÷ Inversión</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataROI} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={80}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number, name: string, props: any) => [
                          `${value.toFixed(2)} resultados/$1 (${props.payload.resultados} total)`,
                          'ROI'
                        ]}
                      />
                      <Bar dataKey="roi" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Mejor Semana */}
            <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-gray-800">Análisis Semanal</CardTitle>
                <CardDescription className="text-sm text-gray-500">Mejores periodos de inversión y alcance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mejorSemanaInversion && (
                    <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-orange-600 font-medium">Mejor Semana - Inversión</p>
                          <p className="text-sm font-semibold text-orange-900">{mejorSemanaInversion.week}</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-orange-700">${mejorSemanaInversion.inversion.toLocaleString()}</p>
                      <p className="text-xs text-orange-600 mt-1">{mejorSemanaInversion.interacciones.toLocaleString()} interacciones</p>
                    </div>
                  )}
                  {mejorSemanaAlcance && (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-blue-600 font-medium">Mejor Semana - Alcance</p>
                          <p className="text-sm font-semibold text-blue-900">{mejorSemanaAlcance.week}</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-blue-700">{mejorSemanaAlcance.alcance.toLocaleString()}</p>
                      <p className="text-xs text-blue-600 mt-1">personas alcanzadas</p>
                    </div>
                  )}
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
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                  onClick={() => setSelectedFile(file)}
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
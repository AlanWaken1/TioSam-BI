'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { 
  Upload, 
  Sparkles,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  FileText,
  Eye,
  Trash2,
  Download,
  CheckCircle,
  Calendar,
  Percent
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { FileUploader } from '../components/dashboard/FileUploader';
import { DataTable } from '../components/dashboard/DataTable';
import { AIAnalystCard } from '../components/dashboard/AIAnalystCard';
import { DynamicChart } from '../components/dashboard/DynamicChart';
import { ComposedChart, BarChart, Bar, LineChart, Line, Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FinanceRecord {
  id?: string;
  fecha: string;
  folio: string;
  tipo: 'Ingreso' | 'Gasto';
  categoria: string;
  concepto: string;
  monto: number;
  metodo_pago: string;
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
  records: FinanceRecord[];
}

export default function FinanzasView() {
  const [allRecords, setAllRecords] = useState<FinanceRecord[]>([]);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [showUploader, setShowUploader] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ProcessedFile | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const { confirm, showSuccess, showError } = useConfirmDialog();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Data Records
      const { data: records, error: recordsError } = await supabase
        .from('finanzas')
        .select('*')
        .order('fecha', { ascending: false });

      if (recordsError) throw recordsError;

      // 2. Fetch Upload Logs
      const { data: logs, error: logsError } = await supabase
        .from('upload_logs')
        .select('*')
        .eq('dimension', 'Finanzas')
        .order('created_at', { ascending: false });

      if (logsError) throw logsError;

      // Transform records to match interface
      const formattedRecords: FinanceRecord[] = (records || []).map((r: any) => ({
        id: r.id,
        fecha: r.fecha,
        folio: r.folio,
        tipo: r.tipo,
        categoria: r.categoria,
        concepto: r.concepto,
        monto: Number(r.monto),
        metodo_pago: r.metodo_pago,
        fileId: r.upload_id,
        fecha_registro: r.created_at // Assuming created_at exists or we use upload log date
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
          
          // Sum amounts
          totalProcesado = fileRecords.reduce((sum, r) => sum + Math.abs(r.monto), 0);
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
    // Trigger refetch after upload
    fetchData();
    setShowUploader(false);
  };

  const handleEdit = (row: FinanceRecord) => {
    console.log('Editar registro:', row);
  };

  const handleDelete = async (row: FinanceRecord) => {
    if (!row.id) return;
    
    const confirmed = await confirm(`¿Eliminar registro de ${row.concepto}?`);
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('finanzas')
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
  const totalIngresos = allRecords
    .filter(r => r.tipo === 'Ingreso')
    .reduce((sum, r) => sum + Math.abs(r.monto), 0);
    
  const totalGastos = allRecords
    .filter(r => r.tipo === 'Gasto')
    .reduce((sum, r) => sum + Math.abs(r.monto), 0);
    
  const balance = totalIngresos - totalGastos;
  const margen = totalIngresos > 0 ? ((balance / totalIngresos) * 100) : 0;

  // Preparar datos para gráficos
  const chartDataByDate = allRecords.reduce((acc: any[], record) => {
    const existing = acc.find(item => item.name === record.fecha);
    if (existing) {
      if (record.tipo === 'Ingreso') existing.ingresos += Math.abs(record.monto);
      else existing.gastos += Math.abs(record.monto);
    } else {
      acc.push({
        name: record.fecha,
        ingresos: record.tipo === 'Ingreso' ? Math.abs(record.monto) : 0,
        gastos: record.tipo === 'Gasto' ? Math.abs(record.monto) : 0,
      });
    }
    return acc;
  }, []).sort((a: any, b: any) => new Date(a.name).getTime() - new Date(b.name).getTime());

  const chartDataByCategory = allRecords
    .filter(r => r.tipo === 'Gasto')
    .reduce((acc: any[], record) => {
      const existing = acc.find(item => item.name === record.categoria);
      if (existing) {
        existing.value += Math.abs(record.monto);
      } else {
        acc.push({
          name: record.categoria,
          value: Math.abs(record.monto),
        });
      }
      return acc;
    }, [])
    .sort((a: any, b: any) => b.value - a.value)
    .slice(0, 7);

  // Flujo de efectivo acumulado (balance acumulativo)
  const chartDataCumulativeFlow = chartDataByDate.reduce((acc: any[], item, index) => {
    const balanceDia = item.ingresos - item.gastos;
    const acumulado = index === 0 ? balanceDia : acc[index - 1].acumulado + balanceDia;
    acc.push({
      name: item.name,
      acumulado,
      balanceDia
    });
    return acc;
  }, []);

  const columns = [
    { key: 'fecha' as keyof FinanceRecord, label: 'Fecha' },
    { key: 'folio' as keyof FinanceRecord, label: 'Folio' },
    { 
      key: 'tipo' as keyof FinanceRecord, 
      label: 'Tipo',
      render: (value: string) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Ingreso' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {value === 'Ingreso' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
          {value}
        </span>
      )
    },
    { key: 'categoria' as keyof FinanceRecord, label: 'Categoría' },
    { key: 'concepto' as keyof FinanceRecord, label: 'Concepto' },
    { 
      key: 'monto' as keyof FinanceRecord, 
      label: 'Monto',
      render: (value: number, row: FinanceRecord) => (
        <span className={row.tipo === 'Ingreso' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
          {row.tipo === 'Ingreso' ? '+' : '-'}${Math.abs(value).toLocaleString()}
        </span>
      )
    },
    { key: 'metodo_pago' as keyof FinanceRecord, label: 'Método Pago' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Finanzas</h2>
            <p className="text-sm text-gray-500">Control de ingresos, gastos y flujo de caja</p>
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
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-green-600" />
              Importar Reporte Financiero
            </CardTitle>
            <CardDescription>
              Sube un archivo Excel con columnas: Fecha, Folio, Tipo, Categoría, Concepto, Monto, Método Pago
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploader 
              onDataParsed={handleDataParsed}
              expectedColumns={['fecha', 'folio', 'tipo', 'categoría', 'concepto', 'monto', 'método pago']}
              dimensionName="Finanzas"
            />
          </CardContent>
        </Card>
      )}

      {/* Main Metrics - Top Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 border-0 shadow-lg hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white/90 font-medium">Ingresos Totales</p>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-2">${totalIngresos.toLocaleString()}</p>
            <div className="flex items-center gap-1 text-xs text-white/80 font-medium">
              <ArrowUpRight className="w-3 h-3" />
              <span>Periodo: {dateRange.text}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-red-500 to-pink-600 border-0 shadow-lg hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white/90 font-medium">Gastos Totales</p>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-2">${totalGastos.toLocaleString()}</p>
            <div className="flex items-center gap-1 text-xs text-white/80 font-medium">
              <ArrowDownRight className="w-3 h-3" />
              <span>Periodo: {dateRange.text}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 border-0 shadow-lg hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white/90 font-medium">Balance Neto</p>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-2">${balance.toLocaleString()}</p>
            <div className="flex items-center gap-1 text-xs text-white/80 font-medium">
              <span>{allRecords.filter(r => r.tipo === 'Ingreso').length} ingresos - {allRecords.filter(r => r.tipo === 'Gasto').length} gastos</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-violet-600 border-0 shadow-lg hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white/90 font-medium">Margen Operativo</p>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Percent className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-2">{margen.toFixed(1)}%</p>
            <div className="flex items-center gap-1 text-xs text-white/80 font-medium">
              <span>{margen >= 0 ? 'Rentable' : 'Déficit'} • {dateRange.text}</span>
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
                  <CardTitle className="text-lg font-semibold text-gray-800">Balance Financiero</CardTitle>
                  <CardDescription className="text-sm text-gray-500">Ingresos (Barras) vs Gastos (Línea)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={chartDataByDate}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fill: '#64748b', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value) => new Date(value).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis 
                          tick={{ fill: '#64748b', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          cursor={{ fill: '#f1f5f9' }}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: number) => [`$${value.toLocaleString()}`, 'Monto']}
                          labelFormatter={(label) => new Date(label).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        />
                        <Bar dataKey="ingresos" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} name="Ingresos" />
                        <Bar dataKey="gastos" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} name="Gastos" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div>
              <Card className="h-full border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-gray-800">Top Gastos por Categoría</CardTitle>
                  <CardDescription className="text-sm text-gray-500">
                    Principales fugas de capital • <span className="font-mono text-xs">Top 7 categorías</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartDataByCategory}
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
                          formatter={(value: number) => [
                            `$${value.toLocaleString()} (${((value / totalGastos) * 100).toFixed(1)}% del total)`,
                            'Gasto'
                          ]}
                          labelFormatter={(label) => `Categoría: ${label}`}
                        />
                        <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Nueva fila: Flujo de Efectivo Acumulado */}
          <div className="grid grid-cols-1 gap-6">
            <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-gray-800">Flujo de Efectivo Acumulado</CardTitle>
                <CardDescription className="text-sm text-gray-500">
                  Balance acumulativo en el tiempo • <span className="font-mono text-xs">Cálculo: Σ(Ingresos - Gastos)</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartDataCumulativeFlow}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis 
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '5 5' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number, name: string) => {
                          if (name === 'acumulado') return [`$${value.toLocaleString()}`, 'Balance Acumulado'];
                          return [`$${value.toLocaleString()}`, 'Balance del Día'];
                        }}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="acumulado" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        fill="url(#colorAcumulado)" 
                        name="Balance Acumulado"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="balanceDia" 
                        stroke="#10b981" 
                        strokeWidth={1}
                        strokeDasharray="3 3"
                        dot={false}
                        name="Balance del Día"
                      />
                    </AreaChart>
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
                        <th className="text-right p-3 font-semibold text-sm text-gray-700">Monto Procesado</th>
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
                                <FileText className="w-4 h-4 text-green-600" />
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
          <AIAnalystCard data={allRecords} dimensionName="Finanzas" />
          
          {allRecords.length === 0 && (
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="p-6 text-center">
                <Sparkles className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <p className="font-medium text-green-900 mb-2">No hay datos para analizar</p>
                <p className="text-sm text-green-700">
                  Importa un archivo Excel o crea registros manualmente para comenzar el análisis con IA
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Setup Instructions - Solo mostrar si no hay datos */}
      {allRecords.length === 0 && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Sparkles className="w-5 h-5" />
              Comienza a usar Finanzas
            </CardTitle>
            <CardDescription className="text-green-700">
              Sube tu primer reporte Excel para comenzar
            </CardDescription>
          </CardHeader>
          <CardContent className="text-green-800">
            <ol className="list-decimal ml-5 space-y-2 text-sm">
              <li>Haz clic en "Importar Datos" para subir tu archivo Excel</li>
              <li>El archivo debe contener las columnas: Fecha, Folio, Tipo, Categoría, Concepto, Monto, Método Pago</li>
              <li>Los datos se procesarán automáticamente y aparecerán en la tabla</li>
              <li>Usa el AI Analyst para obtener insights sobre tu flujo de caja</li>
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
          'fecha'
        ];
        
        const dynamicColumns = selectedFile.records.length > 0 
          ? Object.keys(selectedFile.records[0])
              .filter(key => !excludedFields.includes(key))
              .map(key => ({
                key: key as keyof FinanceRecord,
                label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
                render: (value: any, row: FinanceRecord) => {
                  if (key === 'monto') {
                    return (
                      <span className={row.tipo === 'Ingreso' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {row.tipo === 'Ingreso' ? '+' : '-'}${Math.abs(value).toLocaleString()}
                      </span>
                    );
                  }
                  if (key === 'tipo') {
                    return (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        value === 'Ingreso' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
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
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-6 h-6" />
                      <h3 className="text-xl font-bold">{selectedFile.fileName}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/90">
                      <span>📅 {selectedFile.periodoInicio} - {selectedFile.periodoFin}</span>
                      <span>•</span>
                      <span>💰 ${selectedFile.totalProcesado.toLocaleString()} procesado</span>
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
                    Mostrando <span className="font-semibold text-gray-900">{selectedFile.records.length}</span> transacciones procesadas
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
                              {col.render ? col.render(record[col.key], record) : record[col.key]}
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
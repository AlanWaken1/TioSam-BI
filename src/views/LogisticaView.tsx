'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { 
  Upload, 
  Sparkles,
  Truck,
  Package,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Fuel,
  ArrowLeftRight,
  Clock,
  FileText,
  Eye,
  Trash2,
  Download,
  Navigation,
  XCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { FileUploader } from '../components/dashboard/FileUploader';
import { DataTable } from '../components/dashboard/DataTable';
import { AIAnalystCard } from '../components/dashboard/AIAnalystCard';
import { DynamicChart } from '../components/dashboard/DynamicChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface LogisticsRecord {
  id?: string;
  fecha_salida: string;
  ruta_destino: string;
  chofer_asignado: string;
  unidad: string;
  pz_cargadas: number;
  pz_devueltas: number;
  porcentaje_devolucion: number;
  gasto_gasolina: number;
  status?: 'a_tiempo' | 'retrasado' | 'completado';
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
  records: LogisticsRecord[];
}

export default function LogisticaView() {
  const [allRecords, setAllRecords] = useState<LogisticsRecord[]>([]);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [showUploader, setShowUploader] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ProcessedFile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { confirm, showSuccess, showError } = useConfirmDialog();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: records, error: recordsError } = await supabase
        .from('logistica')
        .select('*')
        .order('fecha_salida', { ascending: false });

      if (recordsError) throw recordsError;

      const { data: logs, error: logsError } = await supabase
        .from('upload_logs')
        .select('*')
        .eq('dimension', 'Logística')
        .order('created_at', { ascending: false });

      if (logsError) throw logsError;

      const formattedRecords: LogisticsRecord[] = (records || []).map((r: any) => ({
        id: r.id,
        fecha_salida: r.fecha_salida,
        ruta_destino: r.ruta_destino,
        chofer_asignado: r.chofer_asignado,
        unidad: r.unidad,
        pz_cargadas: Number(r.pz_cargadas),
        pz_devueltas: Number(r.pz_devueltas),
        porcentaje_devolucion: Number(r.pz_cargadas) > 0 ? (Number(r.pz_devueltas) / Number(r.pz_cargadas)) * 100 : 0,
        gasto_gasolina: Number(r.gasto_gasolina),
        status: r.status ? r.status.toLowerCase() : 'a_tiempo', // Default to 'a_tiempo' if null
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
          const sortedDates = [...fileRecords].sort((a, b) => new Date(a.fecha_salida).getTime() - new Date(b.fecha_salida).getTime());
          periodoInicio = sortedDates[0].fecha_salida;
          periodoFin = sortedDates[sortedDates.length - 1].fecha_salida;
          
          // Sum total pieces distributed (loaded - returned)
          totalProcesado = fileRecords.reduce((sum, r) => sum + (r.pz_cargadas - r.pz_devueltas), 0);
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
    console.log('Datos CSV parseados:', data);
    
    const fileId = `file-${Date.now()}`;
    
    const newRecords: LogisticsRecord[] = data.map((row, index) => {
      const findValue = (variants: string[]) => {
        for (const key of variants) {
          if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
            return row[key];
          }
        }
        return null;
      };

      // Mapeo específico según las columnas reales del Excel
      const fecha_salida = findValue(['Fecha Salida', 'fecha_salida', 'FechaSalida', 'fecha', 'Fecha', 'date', 'Date']) || new Date().toISOString().split('T')[0];
      const ruta_destino = findValue(['Ruta Destino', 'ruta_destino', 'RutaDestino', 'route', 'Route', 'destino', 'Destino']) || `Ruta ${index + 1}`;
      const chofer_asignado = findValue(['Chofer Asignado', 'Chofer', 'chofer', 'chofer_asignado', 'ChoferAsignado', 'conductor', 'Conductor', 'driver', 'Driver']) || 'Sin asignar';
      const unidad = findValue(['Unidad', 'unidad', 'vehicle', 'Vehicle', 'camioneta', 'Camioneta']) || 'Sin especificar';
      const pz_cargadas = parseFloat(findValue(['Pz Cargadas', 'pz_cargadas', 'PzCargadas', 'cargado', 'Cargado', 'loaded', 'Loaded']) || 0);
      const pz_devueltas = parseFloat(findValue(['Pz Devueltas (Frío)', 'Pz Devueltas', 'pz_devueltas', 'PzDevueltas', 'devuelto', 'Devuelto', 'returned', 'Returned', 'merma', 'Merma']) || 0);
      
      // El % de devolución puede venir calculado o lo calculamos
      let porcentaje_devolucion = 0;
      const porcentajeRaw = findValue(['% Devolución', '%Devolución', 'porcentaje_devolucion', 'PorcentajeDevolucion']);
      if (porcentajeRaw !== null) {
        // Si viene como "1.6%" o "12.0%", quitar el % y parsear
        const cleanValue = porcentajeRaw.toString().replace('%', '').trim();
        porcentaje_devolucion = parseFloat(cleanValue) || 0;
      } else {
        // Si no viene, calcularlo
        porcentaje_devolucion = pz_cargadas > 0 ? (pz_devueltas / pz_cargadas) * 100 : 0;
      }
      
      // Limpiar el gasto gasolina si viene con "$"
      const gastoRaw = findValue(['Gasto Gasolina', 'gasto_gasolina', 'GastoGasolina', 'combustible', 'Combustible', 'gasolina', 'Gasolina', 'fuel', 'Fuel']) || '0';
      const gasto_gasolina = parseFloat(gastoRaw.toString().replace(/[$,]/g, ''));
      
      const statusRaw = findValue(['status', 'Status', 'estado', 'Estado']) || 'a_tiempo';
      const status = statusRaw.toString().toLowerCase().includes('retraso') || statusRaw.toString().toLowerCase().includes('delay')
        ? 'retrasado'
        : statusRaw.toString().toLowerCase().includes('completado') || statusRaw.toString().toLowerCase().includes('completed')
        ? 'completado'
        : 'a_tiempo';

      return {
        id: `log-${Date.now()}-${index}`,
        fecha_salida,
        ruta_destino,
        chofer_asignado,
        unidad,
        pz_cargadas,
        pz_devueltas,
        porcentaje_devolucion,
        gasto_gasolina,
        status: status as 'a_tiempo' | 'retrasado' | 'completado',
        fecha_registro: new Date().toISOString(),
        fileId,
      };
    });

    console.log('Registros procesados:', newRecords);
    setAllRecords([...allRecords, ...newRecords]);

    // Extraer periodo de los datos
    const fechas = newRecords.map(r => r.fecha_salida).sort();
    const periodoInicio = fechas.length > 0 ? fechas[0] : 'N/A';
    const periodoFin = fechas.length > 0 ? fechas[fechas.length - 1] : 'N/A';
    
    // Calcular total procesado (suma de piezas distribuidas)
    const totalProcesado = newRecords.reduce((sum, r) => sum + (r.pz_cargadas - r.pz_devueltas), 0);

    const newFile: ProcessedFile = {
      id: fileId,
      fileName: fileName || `LOG_Archivo_${new Date().toLocaleDateString('es-MX').replace(/\//g, '-')}.xlsx`,
      periodoInicio,
      periodoFin,
      fechaCarga: new Date().toISOString(),
      totalProcesado,
      totalRegistros: newRecords.length,
      status: 'integrado',
      records: newRecords,
    };

    setProcessedFiles([newFile, ...processedFiles]);
    
    // After data is parsed and potentially uploaded to Supabase, refetch all data
    fetchData();
    setShowUploader(false);
  };

  const handleEdit = (row: LogisticsRecord) => {
    console.log('Editar registro:', row);
  };

  const handleDelete = async (row: LogisticsRecord) => {
    if (!row.id) return;
    
    const confirmed = await confirm(`¿Eliminar ruta ${row.ruta_destino}?`);
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('logistica')
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
    const dates = allRecords.map(r => new Date(r.fecha_salida));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    const formatDate = (date: Date) => date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    const formatMonth = (date: Date) => date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    
    // Si es el mismo mes, mostrar solo el mes
    if (minDate.getMonth() === maxDate.getMonth() && minDate.getFullYear() === maxDate.getFullYear()) {
      return { text: formatMonth(minDate), isSameMonth: true };
    }
    // Si son fechas diferentes, mostrar rango
    return { text: `${formatDate(minDate)} - ${formatDate(maxDate)}`, isSameMonth: false };
  })() : { text: 'Sin datos', isSameMonth: false };

  // Calcular métricas
  const totalPiezasDistribuidas = allRecords.reduce((sum, r) => sum + (r.pz_cargadas - r.pz_devueltas), 0);
  const totalPiezasCargadas = allRecords.reduce((sum, r) => sum + r.pz_cargadas, 0);
  const totalPiezasDevueltas = allRecords.reduce((sum, r) => sum + r.pz_devueltas, 0);
  const tasaDevolucion = totalPiezasCargadas > 0 ? (totalPiezasDevueltas / totalPiezasCargadas) * 100 : 0;
  const totalGastoCombustible = allRecords.reduce((sum, r) => sum + r.gasto_gasolina, 0);
  const rutasATiempo = allRecords.filter(r => r.status === 'a_tiempo' || r.status === 'completado').length;
  const efectividadEntregas = allRecords.length > 0 ? (rutasATiempo / allRecords.length) * 100 : 0;

  // Preparar datos para gráficos
  const chartDataByRoute = allRecords
    .map(record => ({
      name: record.ruta_destino,
      value: record.pz_cargadas > 0 ? (record.pz_devueltas / record.pz_cargadas) * 100 : 0,
      cargado: record.pz_cargadas
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);

  const chartDataGastos = allRecords
    .map(record => ({
      name: record.ruta_destino,
      value: record.gasto_gasolina
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);

  // Nueva gráfica: Eficiencia por Ruta (Costo por Pieza Entregada)
  const chartDataEficiencia = allRecords
    .map(record => {
      const piezasEntregadas = record.pz_cargadas - record.pz_devueltas;
      const costoPorPieza = piezasEntregadas > 0 ? record.gasto_gasolina / piezasEntregadas : 0;
      return {
        name: record.ruta_destino,
        value: costoPorPieza,
        piezas: piezasEntregadas
      };
    })
    .filter(r => r.piezas > 0) // Solo rutas con entregas
    .sort((a, b) => a.value - b.value) // Ordenar por MENOR costo (más eficiente)
    .slice(0, 7);

  const columns = [
    { key: 'ruta_destino' as keyof LogisticsRecord, label: 'Ruta' },
    { key: 'chofer_asignado' as keyof LogisticsRecord, label: 'Chofer' },
    { 
      key: 'pz_cargadas' as keyof LogisticsRecord, 
      label: 'Piezas Cargadas',
      render: (value: number) => `${value.toLocaleString()} pz`
    },
    { 
      key: 'pz_devueltas' as keyof LogisticsRecord, 
      label: 'Piezas Devueltas',
      render: (value: number) => `${value.toLocaleString()} pz`
    },
    { 
      key: 'gasto_gasolina' as keyof LogisticsRecord, 
      label: 'Combustible',
      render: (value: number) => `$${value.toLocaleString()}`
    },
    { key: 'fecha_salida' as keyof LogisticsRecord, label: 'Fecha' },
    { 
      key: 'status' as keyof LogisticsRecord, 
      label: 'Estado',
      render: (value: string) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value === 'a_tiempo' || value === 'completado'
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {value === 'a_tiempo' || value === 'completado' ? (
            <><CheckCircle className="w-3 h-3 mr-1" /> A Tiempo</>
          ) : (
            <><XCircle className="w-3 h-3 mr-1" /> Retrasado</>
          )}
        </span>
      )
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Logística y Distribución</h2>
            <p className="text-sm text-gray-500">Control de rutas y rentabilidad de flota</p>
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
              Importar Datos de Rutas
            </CardTitle>
            <CardDescription>
              Sube un archivo CSV o Excel (.xlsx, .xls) con las columnas necesarias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploader 
              onDataParsed={handleDataParsed}
              expectedColumns={['fecha_salida', 'ruta_destino', 'chofer_asignado', 'unidad', 'pz_cargadas', 'pz_devueltas', 'gasto_gasolina', 'status']}
              dimensionName="Logística"
            />
          </CardContent>
        </Card>
      )}

      {/* Main Metrics - Top Row */}
      <div className="grid grid-cols-4 gap-4">
        {/* Tarjeta 1: Piezas Distribuidas */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-600 border-0 shadow-lg hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white/90 font-medium">Piezas Entregadas Netas</p>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-2">{totalPiezasDistribuidas.toLocaleString()} pz</p>
            <div className="flex items-center gap-1 text-xs text-white/80 font-medium">
              <TrendingUp className="w-3 h-3" />
              <span>Periodo: {dateRange.text}</span>
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta 2: Tasa de Devolución (CRÍTICA) */}
        <Card className={`relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all ${
          tasaDevolucion > 5 
            ? 'bg-gradient-to-br from-yellow-500 to-orange-600' 
            : 'bg-gradient-to-br from-green-500 to-emerald-600'
        }`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white/90 font-medium">Tasa de Devolución Global</p>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <ArrowLeftRight className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-3xl font-bold text-white">{tasaDevolucion.toFixed(1)}%</p>
              {tasaDevolucion > 5 && (
                <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-white/80 font-medium">
              {tasaDevolucion > 5 ? (
                <>
                  <AlertTriangle className="w-3 h-3" />
                  <span>Meta: {'<'} 5% - Revisar rutas</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3 h-3" />
                  <span>Dentro de meta</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta 3: Gasto Combustible */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-red-500 to-pink-600 border-0 shadow-lg hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white/90 font-medium">Gasto Combustible</p>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Fuel className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-2">${totalGastoCombustible.toLocaleString()}</p>
            <div className="flex items-center gap-1 text-xs text-white/80 font-medium">
              <span>Periodo: {dateRange.text}</span>
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta 4: Efectividad de Entregas */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600 border-0 shadow-lg hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white/90 font-medium">Efectividad de Entregas</p>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-2">{efectividadEntregas.toFixed(0)}%</p>
            <div className="flex items-center gap-1 text-xs text-white/80 font-medium">
              <Navigation className="w-3 h-3" />
              <span>{rutasATiempo} de {allRecords.length} rutas a tiempo</span>
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
          {/* Primera fila: 2 gráficas */}
          <div className="grid grid-cols-3 gap-6">
            {/* Gráfico Principal: Carga vs. Devolución */}
            <div className="col-span-2">
              <Card className="h-full border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-gray-800">Top Rutas con Mayor Devolución (%)</CardTitle>
                  <CardDescription className="text-sm text-gray-500">Rutas con mayor índice de rechazo/merma</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartDataByRoute}
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
                          formatter={(value: number) => [`${value.toFixed(1)}%`, 'Tasa Devolución']}
                        />
                        <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico Secundario: Distribución de Gastos */}
            <div>
              <Card className="h-full border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-gray-800">Gasto Combustible</CardTitle>
                  <CardDescription className="text-sm text-gray-500">Top rutas más costosas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartDataGastos}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
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
                          formatter={(value: number) => [`$${value.toLocaleString()}`, 'Gasto']}
                        />
                        <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Segunda fila: Nueva gráfica de eficiencia */}
          <div className="grid grid-cols-1 gap-6">
            <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-gray-800">Eficiencia por Ruta (Costo/Pieza)</CardTitle>
                <CardDescription className="text-sm text-gray-500">
                  Rutas más eficientes • <span className="font-mono text-xs">Cálculo: Gasto Combustible ÷ Piezas Entregadas Netas</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartDataEficiencia}
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
                        formatter={(value: number, name: string, props: any) => [
                          `$${value.toFixed(2)} por pieza (${props.payload.piezas} pz entregadas)`,
                          'Eficiencia'
                        ]}
                      />
                      <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerta Visual si hay problemas de devolución */}
          {tasaDevolucion > 5 && (
            <Card className="border-2 border-yellow-400 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-900 mb-1">
                      ⚠️ Alerta: Tasa de Devolución Alta ({tasaDevolucion.toFixed(1)}%)
                    </p>
                    <p className="text-sm text-yellow-800">
                      La meta es mantener las devoluciones por debajo del 5%. Revisa las rutas con mayor índice de merma 
                      y coordina con producción para ajustar las cargas según demanda real.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Datos y CRUD */}
        <TabsContent value="data" className="space-y-6">
          {/* Log de Archivos Procesados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Reportes de Ruta Procesados
              </CardTitle>
              <CardDescription>
                Historial de bitácoras de distribución cargadas al sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {processedFiles.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No se han procesado reportes de ruta</p>
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
                        <th className="text-right p-3 font-semibold text-sm text-gray-700">Piezas Distribuidas</th>
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
                                {file.totalRegistros} rutas
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
                                {file.totalProcesado.toLocaleString()} piezas
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
                                    console.log('Attempting to delete file:', file.id);
                                    const confirmed = await confirm('¿Eliminar este archivo y todos sus registros?');
                                    if (confirmed) {
                                      try {
                                        const { error } = await supabase
                                          .from('upload_logs')
                                          .delete()
                                          .eq('id', file.id);
                                        
                                        if (error) {
                                          console.error('Supabase delete error:', error);
                                          throw error;
                                        }
                                        
                                        console.log('File deleted successfully');
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
          <AIAnalystCard data={allRecords} dimensionName="Logística y Distribución" />
          
          {allRecords.length === 0 && (
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-6 text-center">
                <Sparkles className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <p className="font-medium text-blue-900 mb-2">No hay datos para analizar</p>
                <p className="text-sm text-blue-700">
                  Importa un archivo CSV o crea registros manualmente para comenzar el análisis con IA
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
              Comienza a usar Logística y Distribución
            </CardTitle>
            <CardDescription className="text-blue-700">
              Sube tu primer reporte de ruta para comenzar
            </CardDescription>
          </CardHeader>
          <CardContent className="text-blue-800">
            <ol className="list-decimal ml-5 space-y-2 text-sm">
              <li>Haz clic en "Importar Datos" para subir tu archivo CSV o Excel</li>
              <li>El archivo debe contener las columnas: fecha_salida, ruta_destino, chofer_asignado, unidad, pz_cargadas, pz_devueltas, gasto_gasolina, status</li>
              <li>Los datos se procesarán automáticamente y calcularán las métricas de rentabilidad</li>
              <li>Usa el AI Analyst para obtener insights sobre eficiencia de rutas y optimización de flota</li>
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
          'ruta_destino',
          'fecha_salida'
        ];
        
        const dynamicColumns = selectedFile.records.length > 0 
          ? Object.keys(selectedFile.records[0])
              .filter(key => !excludedFields.includes(key))
              .map(key => ({
                key: key as keyof LogisticsRecord,
                label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
                render: (value: any) => {
                  if (key === 'pz_cargadas' || key === 'pz_devueltas') {
                    return `${parseFloat(value || 0).toLocaleString()} pz`;
                  }
                  if (key === 'gasto_gasolina') {
                    return `$${parseFloat(value || 0).toLocaleString()}`;
                  }
                  if (key === 'status' && (value === 'a_tiempo' || value === 'retrasado' || value === 'completado')) {
                    return (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        value === 'a_tiempo' || value === 'completado'
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {value === 'a_tiempo' || value === 'completado' ? (
                          <><CheckCircle className="w-3 h-3 mr-1" /> A Tiempo</>
                        ) : (
                          <><XCircle className="w-3 h-3 mr-1" /> Retrasado</>
                        )}
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
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-6 h-6" />
                      <h3 className="text-xl font-bold">{selectedFile.fileName}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/90">
                      <span>📅 {selectedFile.periodoInicio} - {selectedFile.periodoFin}</span>
                      <span>•</span>
                      <span>📦 {selectedFile.totalProcesado.toLocaleString()} piezas distribuidas</span>
                      <span>•</span>
                      <span>🚚 {selectedFile.totalRegistros} rutas</span>
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
                    Mostrando <span className="font-semibold text-gray-900">{selectedFile.records.length}</span> rutas procesadas
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
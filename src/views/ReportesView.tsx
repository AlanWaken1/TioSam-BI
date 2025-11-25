'use client';

import { useState } from 'react';
import { 
  Upload, 
  Download,
  FileText,
  File,
  Sparkles,
  Calendar,
  Archive,
  Clock,
  CheckCircle,
  TrendingUp,
  Activity,
  FolderOpen,
  BarChart3
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { FileUploader } from '../components/dashboard/FileUploader';
import { DataTable } from '../components/dashboard/DataTable';
import { AIAnalystCard } from '../components/dashboard/AIAnalystCard';
import { DynamicChart } from '../components/dashboard/DynamicChart';

interface ReportRecord {
  id?: string;
  nombre_reporte: string;
  categoria: string;
  tipo_archivo: string;
  fecha_creacion: string;
  tamaño: number;
  estado: 'activo' | 'archivado' | 'pendiente';
  autor: string;
  fecha_registro?: string;
}

export default function ReportesView() {
  const [records, setRecords] = useState<ReportRecord[]>([]);
  const [showUploader, setShowUploader] = useState(false);

  const handleDataParsed = (data: any[]) => {
    console.log('Datos CSV parseados:', data);
    
    const newRecords: ReportRecord[] = data.map((row, index) => {
      const findValue = (variants: string[]) => {
        for (const key of variants) {
          if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
            return row[key];
          }
        }
        return null;
      };

      const nombre_reporte = findValue(['nombre_reporte', 'NombreReporte', 'nombre', 'Nombre', 'name', 'Name', 'reporte', 'Reporte']) || `Reporte ${index + 1}`;
      const categoria = findValue(['categoria', 'Categoria', 'Categoría', 'category', 'Category', 'tipo', 'Tipo']) || 'General';
      const tipo_archivo = findValue(['tipo_archivo', 'TipoArchivo', 'tipo', 'Tipo', 'extension', 'Extension']) || 'CSV';
      const fecha_creacion = findValue(['fecha_creacion', 'FechaCreacion', 'fecha', 'Fecha', 'date', 'Date']) || new Date().toISOString().split('T')[0];
      const tamaño = parseFloat(findValue(['tamaño', 'Tamaño', 'tamano', 'Tamano', 'size', 'Size']) || 0);
      const autor = findValue(['autor', 'Autor', 'author', 'Author', 'creador', 'Creador']) || 'Sin autor';
      const estadoRaw = findValue(['estado', 'Estado', 'status', 'Status']) || 'activo';
      const estado = estadoRaw.toString().toLowerCase().includes('archivado') || estadoRaw.toString().toLowerCase().includes('archived')
        ? 'archivado'
        : estadoRaw.toString().toLowerCase().includes('pendiente') || estadoRaw.toString().toLowerCase().includes('pending')
        ? 'pendiente'
        : 'activo';

      return {
        id: `rep-${Date.now()}-${index}`,
        nombre_reporte,
        categoria,
        tipo_archivo,
        fecha_creacion,
        tamaño,
        estado: estado as 'activo' | 'archivado' | 'pendiente',
        autor,
        fecha_registro: new Date().toISOString(),
      };
    });

    console.log('Registros procesados:', newRecords);
    setRecords([...records, ...newRecords]);
    setShowUploader(false);
  };

  const handleEdit = (row: ReportRecord) => {
    console.log('Editar registro:', row);
  };

  const handleDelete = (row: ReportRecord) => {
    setRecords(records.filter(r => r.id !== row.id));
  };

  const handleCreate = () => {
    setShowUploader(true);
  };

  // Calcular métricas
  const totalReportes = records.length;
  const reportesActivos = records.filter(r => r.estado === 'activo').length;
  const categorias = new Set(records.map(r => r.categoria)).size;
  const tamañoTotal = records.reduce((sum, r) => sum + r.tamaño, 0);

  // Preparar datos para gráficos
  const chartDataByCategory = records.reduce((acc: any[], record) => {
    const existing = acc.find(item => item.name === record.categoria);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({
        name: record.categoria,
        value: 1,
      });
    }
    return acc;
  }, []);

  const chartDataByType = records.reduce((acc: any[], record) => {
    const existing = acc.find(item => item.name === record.tipo_archivo);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({
        name: record.tipo_archivo,
        value: 1,
      });
    }
    return acc;
  }, []);

  const columns = [
    { key: 'nombre_reporte' as keyof ReportRecord, label: 'Nombre Reporte' },
    { key: 'categoria' as keyof ReportRecord, label: 'Categoría' },
    { key: 'tipo_archivo' as keyof ReportRecord, label: 'Tipo' },
    { key: 'fecha_creacion' as keyof ReportRecord, label: 'Fecha Creación' },
    { 
      key: 'tamaño' as keyof ReportRecord, 
      label: 'Tamaño (KB)',
      render: (value: number) => `${value.toFixed(2)} KB`
    },
    { key: 'autor' as keyof ReportRecord, label: 'Autor' },
    { 
      key: 'estado' as keyof ReportRecord, 
      label: 'Estado',
      render: (value: string) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value === 'activo' 
            ? 'bg-green-100 text-green-700' 
            : value === 'archivado'
            ? 'bg-gray-100 text-gray-700'
            : 'bg-orange-100 text-orange-700'
        }`}>
          {value === 'activo' ? (
            <><CheckCircle className="w-3 h-3 mr-1" /> Activo</>
          ) : value === 'archivado' ? (
            <><Archive className="w-3 h-3 mr-1" /> Archivado</>
          ) : (
            <><Clock className="w-3 h-3 mr-1" /> Pendiente</>
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
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Repositorio de Reportes</h2>
            <p className="text-sm text-gray-500">Gestión de documentos y archivos</p>
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
        <Card className="border-2 border-indigo-200 bg-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600" />
              Importar Datos de Reportes
            </CardTitle>
            <CardDescription>
              Sube un archivo CSV o Excel (.xlsx, .xls) con las columnas necesarias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploader 
              onDataParsed={handleDataParsed}
              expectedColumns={['nombre_reporte', 'categoria', 'tipo_archivo', 'fecha_creacion', 'tamaño', 'estado', 'autor']}
              dimensionName="Reportes"
            />
          </CardContent>
        </Card>
      )}

      {/* Main Metrics - Top Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-blue-600 border-0 shadow-lg hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white/90 font-medium">Total Reportes</p>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-2">{totalReportes}</p>
            <div className="flex items-center gap-1 text-xs text-white/80 font-medium">
              <File className="w-3 h-3" />
              <span>Documentos en sistema</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 border-0 shadow-lg hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white/90 font-medium">Reportes Activos</p>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-2">{reportesActivos}</p>
            <div className="flex items-center gap-1 text-xs text-white/80 font-medium">
              <Activity className="w-3 h-3" />
              <span>{((reportesActivos / Math.max(totalReportes, 1)) * 100).toFixed(0)}% del total</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-600 border-0 shadow-lg hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white/90 font-medium">Categorías</p>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-2">{categorias}</p>
            <div className="flex items-center gap-1 text-xs text-white/80 font-medium">
              <BarChart3 className="w-3 h-3" />
              <span>Tipos diferentes</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-600 border-0 shadow-lg hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white/90 font-medium">Tamaño Total</p>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Archive className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-2">{(tamañoTotal / 1024).toFixed(2)}</p>
            <div className="flex items-center gap-1 text-xs text-white/80 font-medium">
              <span>MB almacenados</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para organizar contenido */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="data">Datos y CRUD</TabsTrigger>
          <TabsTrigger value="analysis">Análisis IA</TabsTrigger>
        </TabsList>

        {/* Tab: Vista General con gráficos */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <DynamicChart
                data={chartDataByCategory}
                type="bar"
                title="Reportes por Categoría"
                description="Distribución de documentos por tipo"
                xKey="name"
                yKey="value"
              />
            </div>
            <div>
              <DynamicChart
                data={chartDataByType}
                type="pie"
                title="Tipos de Archivo"
                description="Formatos de documentos"
                nameKey="name"
                yKey="value"
              />
            </div>
          </div>
        </TabsContent>

        {/* Tab: Datos y CRUD */}
        <TabsContent value="data" className="space-y-6">
          <DataTable
            data={records}
            columns={columns}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCreate={handleCreate}
          />
        </TabsContent>

        {/* Tab: Análisis IA */}
        <TabsContent value="analysis" className="space-y-6">
          <AIAnalystCard data={records} dimensionName="Reportes" />
          
          {records.length === 0 && (
            <Card className="border-2 border-indigo-200 bg-indigo-50">
              <CardContent className="p-6 text-center">
                <Sparkles className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                <p className="font-medium text-indigo-900 mb-2">No hay datos para analizar</p>
                <p className="text-sm text-indigo-700">
                  Importa un archivo CSV o crea registros manualmente para comenzar el análisis con IA
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Setup Instructions - Solo mostrar si no hay datos */}
      {records.length === 0 && (
        <Card className="border-2 border-indigo-200 bg-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-900">
              <Sparkles className="w-5 h-5" />
              Comienza a usar Reportes
            </CardTitle>
            <CardDescription className="text-indigo-700">
              Sube tu primer reporte CSV para comenzar
            </CardDescription>
          </CardHeader>
          <CardContent className="text-indigo-800">
            <ol className="list-decimal ml-5 space-y-2 text-sm">
              <li>Haz clic en "Importar Datos" para subir tu archivo CSV o Excel</li>
              <li>El archivo debe contener las columnas: nombre_reporte, categoria, tipo_archivo, fecha_creacion, tamaño, estado, autor</li>
              <li>Los datos se procesarán automáticamente y aparecerán en la tabla</li>
              <li>Usa el AI Analyst para obtener insights sobre tus documentos</li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

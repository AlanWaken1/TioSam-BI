'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { 
  RefreshCw, 
  DollarSign,
  Factory,
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  CheckCircle,
  Truck,
  Megaphone,
  AlertTriangle,
  Zap,
  Target,
  Percent,
  Package,
  Clock,
  Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';

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
  hidden: { opacity: 0, scale: 0.9 },
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

interface DimensionMetrics {
  finanzas: {
    ingresos: number;
    gastos: number;
    margen: number;
  };
  produccion: {
    piezasProducidas: number;
    mermaTotal: number;
    eficiencia: number;
    tasaMerma: number;
  };
  logistica: {
    rutasCompletadas: number;
    piezasEntregadas: number;
    tasaDevolucion: number;
    gastoGasolina: number;
  };
  rrhh: {
    empleados: number;
    horasExtra: number;
    montoExtra: number;
    costoPromedioHora: number;
  };
  marketing: {
    inversionTotal: number;
    alcanceTotal: number;
    clicsTotal: number;
    tasaConversion: number;
  };
}

export default function DashboardView() {
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<DimensionMetrics>({
    finanzas: { ingresos: 0, gastos: 0, margen: 0 },
    produccion: { piezasProducidas: 0, mermaTotal: 0, eficiencia: 0, tasaMerma: 0 },
    logistica: { rutasCompletadas: 0, piezasEntregadas: 0, tasaDevolucion: 0, gastoGasolina: 0 },
    rrhh: { empleados: 0, horasExtra: 0, montoExtra: 0, costoPromedioHora: 0 },
    marketing: { inversionTotal: 0, alcanceTotal: 0, clicsTotal: 0, tasaConversion: 0 }
  });
  
  const [financialTrend, setFinancialTrend] = useState<any[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<any[]>([]);
  const [productionTrend, setProductionTrend] = useState<any[]>([]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // FINANZAS
      const { data: finanzas } = await supabase.from('finanzas').select('*');
      const ingresos = (finanzas || [])
        .filter((r: any) => r.tipo === 'Ingreso')
        .reduce((sum: number, r: any) => sum + (parseFloat(r.monto) || 0), 0);
      const gastos = (finanzas || [])
        .filter((r: any) => r.tipo === 'Gasto')
        .reduce((sum: number, r: any) => sum + Math.abs(parseFloat(r.monto) || 0), 0);

      // PRODUCCIÓN
      const { data: produccion } = await supabase.from('produccion').select('*');
      const piezasProducidas = (produccion || []).reduce((sum: number, r: any) => 
        sum + (parseFloat(r.cant_real) || 0), 0);
      const mermaTotal = (produccion || []).reduce((sum: number, r: any) => 
        sum + (parseFloat(r.merma) || 0), 0);
      const avgEficiencia = (produccion || []).length > 0 
        ? (produccion || []).reduce((sum: number, r: any) => sum + (parseFloat(r.eficiencia) || 0), 0) / (produccion || []).length 
        : 0;

      // LOGÍSTICA
      const { data: logistica } = await supabase.from('logistica').select('*');
      const piezasEntregadas = (logistica || []).reduce((sum: number, r: any) => 
        sum + ((parseFloat(r.pz_cargadas) || 0) - (parseFloat(r.pz_devueltas) || 0)), 0);
      const piezasTotales = (logistica || []).reduce((sum: number, r: any) => 
        sum + (parseFloat(r.pz_cargadas) || 0), 0);
      const gastoCombustible = (logistica || []).reduce((sum: number, r: any) => 
        sum + (parseFloat(r.gasto_gasolina) || 0), 0);

      // RRHH
      const { data: rrhh } = await supabase.from('rrhh').select('*');
      const empleados = new Set((rrhh || []).map((r: any) => r.id_emp)).size;
      const horasExtra = (rrhh || []).reduce((sum: number, r: any) => 
        sum + (parseFloat(r.horas_extra) || 0), 0);
      const montoExtra = (rrhh || []).reduce((sum: number, r: any) => 
        sum + (parseFloat(r.monto_extra) || 0), 0);

      // MARKETING
      const { data: desarrollo } = await supabase.from('desarrollo').select('*');
      const inversionTotal = (desarrollo || []).reduce((sum: number, r: any) => 
        sum + (parseFloat(r.inversion) || 0), 0);
      const alcanceTotal = (desarrollo || []).reduce((sum: number, r: any) => 
        sum + (parseFloat(r.alcance) || 0), 0);
      const clicsTotal = (desarrollo || []).reduce((sum: number, r: any) => 
        sum + (parseFloat(r.clics) || 0), 0);

      // Calcular métricas derivadas
      const tasaDevolucion = piezasTotales > 0 ? ((piezasTotales - piezasEntregadas) / piezasTotales) * 100 : 0;
      const tasaMerma = piezasProducidas > 0 ? (mermaTotal / piezasProducidas) * 100 : 0;
      const tasaConversion = alcanceTotal > 0 ? (clicsTotal / alcanceTotal) * 100 : 0;
      const costoPromedioHora = horasExtra > 0 ? montoExtra / horasExtra : 0;

      setMetrics({
        finanzas: {
          ingresos,
          gastos: gastos + montoExtra + gastoCombustible,
          margen: ingresos - (gastos + montoExtra + gastoCombustible)
        },
        produccion: {
          piezasProducidas,
          mermaTotal,
          eficiencia: avgEficiencia,
          tasaMerma
        },
        logistica: {
          rutasCompletadas: (logistica || []).length,
          piezasEntregadas,
          tasaDevolucion,
          gastoGasolina: gastoCombustible
        },
        rrhh: {
          empleados,
          horasExtra,
          montoExtra,
          costoPromedioHora
        },
        marketing: {
          inversionTotal,
          alcanceTotal,
          clicsTotal,
          tasaConversion
        }
      });

      // Tendencia financiera por fecha
      const financeByDate = (finanzas || []).reduce((acc: any, curr: any) => {
        const dateObj = curr.fecha ? new Date(curr.fecha) : null;
        if (!dateObj) return acc;
        const dateKey = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD for sorting
        const dateLabel = dateObj.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
        if (!acc[dateKey]) acc[dateKey] = { name: dateLabel, ingresos: 0, gastos: 0, sortKey: dateKey };
        if (curr.tipo === 'Ingreso') acc[dateKey].ingresos += Math.abs(Number(curr.monto));
        else acc[dateKey].gastos += Math.abs(Number(curr.monto));
        return acc;
      }, {});
      const sortedFinancial = Object.values(financeByDate).sort((a: any, b: any) => a.sortKey.localeCompare(b.sortKey));
      setFinancialTrend(sortedFinancial);

      // Desglose de gastos
      setExpenseBreakdown([
        { name: 'Gastos Operativos', value: gastos, color: '#ef4444' },
        { name: 'Nómina Extra', value: montoExtra, color: '#8b5cf6' },
        { name: 'Combustible', value: gastoCombustible, color: '#f59e0b' },
        { name: 'Marketing', value: inversionTotal, color: '#3b82f6' }
      ].filter(d => d.value > 0));

      // Tendencia de producción
      const prodByDate = (produccion || []).reduce((acc: any, curr: any) => {
        const dateObj = curr.fecha_produccion ? new Date(curr.fecha_produccion) : null;
        if (!dateObj) return acc;
        const dateKey = dateObj.toISOString().split('T')[0];
        const dateLabel = dateObj.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
        if (!acc[dateKey]) acc[dateKey] = { name: dateLabel, produccion: 0, merma: 0, sortKey: dateKey };
        acc[dateKey].produccion += parseFloat(curr.cant_real) || 0;
        acc[dateKey].merma += parseFloat(curr.merma) || 0;
        return acc;
      }, {});
      const sortedProduction = Object.values(prodByDate).sort((a: any, b: any) => a.sortKey.localeCompare(b.sortKey));
      setProductionTrend(sortedProduction);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const kpiCards = [
    {
      title: 'Margen Operativo',
      value: `$${metrics.finanzas.margen.toLocaleString()}`,
      subtitle: `Ingresos $${(metrics.finanzas.ingresos / 1000).toFixed(0)}k - Gastos $${(metrics.finanzas.gastos / 1000).toFixed(0)}k`,
      icon: DollarSign,
      color: metrics.finanzas.margen >= 0 ? 'from-green-500 to-emerald-600' : 'from-red-500 to-pink-600',
      trend: metrics.finanzas.margen >= 0 ? 'positive' : 'negative'
    },
    {
      title: 'Eficiencia Producción',
      value: `${metrics.produccion.eficiencia.toFixed(1)}%`,
      subtitle: `${metrics.produccion.piezasProducidas.toLocaleString()} pzs - Merma ${metrics.produccion.tasaMerma.toFixed(1)}%`,
      icon: Factory,
      color: metrics.produccion.tasaMerma < 5 ? 'from-blue-500 to-cyan-600' : 'from-orange-500 to-amber-600',
      trend: metrics.produccion.tasaMerma < 5 ? 'positive' : 'warning'
    },
    {
      title: 'Efectividad Logística',
      value: `${(100 - metrics.logistica.tasaDevolucion).toFixed(1)}%`,
      subtitle: `${metrics.logistica.rutasCompletadas} rutas - ${metrics.logistica.piezasEntregadas.toLocaleString()} pzs entregadas`,
      icon: Truck,
      color: metrics.logistica.tasaDevolucion < 10 ? 'from-purple-500 to-indigo-600' : 'from-red-500 to-pink-600',
      trend: metrics.logistica.tasaDevolucion < 10 ? 'positive' : 'negative'
    },
    {
      title: 'ROI Marketing',
      value: `${metrics.marketing.tasaConversion.toFixed(2)}%`,
      subtitle: `$${(metrics.marketing.inversionTotal / 1000).toFixed(1)}k inversión - ${(metrics.marketing.alcanceTotal / 1000).toFixed(0)}k alcance`,
      icon: Megaphone,
      color: metrics.marketing.tasaConversion > 2 ? 'from-pink-500 to-rose-600' : 'from-gray-500 to-slate-600',
      trend: metrics.marketing.tasaConversion > 2 ? 'positive' : 'warning'
    }
  ];

  const dimensionCards = [
    { icon: DollarSign, name: 'Finanzas', value: `$${(metrics.finanzas.ingresos / 1000).toFixed(0)}k`, metric: 'Ingresos', color: 'emerald', status: 'success' },
    { icon: Factory, name: 'Producción', value: metrics.produccion.piezasProducidas.toLocaleString(), metric: 'Piezas', color: 'blue', status: 'success' },
    { icon: Truck, name: 'Logística', value: metrics.logistica.rutasCompletadas, metric: 'Rutas', color: 'purple', status: 'success' },
    { icon: Users, name: 'RRHH', value: metrics.rrhh.empleados, metric: 'Empleados', color: 'indigo', status: 'success' },
    { icon: Megaphone, name: 'Marketing', value: `${(metrics.marketing.alcanceTotal / 1000).toFixed(0)}k`, metric: 'Alcance', color: 'pink', status: 'success' }
  ];

  // Inteligencia de Negocio: Top Insights Automáticos
  const generateInsights = () => {
    const insights = [];

    // Insight 1: Rentabilidad
    const rentabilidadPorcentaje = metrics.finanzas.ingresos > 0 
      ? (metrics.finanzas.margen / metrics.finanzas.ingresos) * 100 
      : 0;
    if (rentabilidadPorcentaje < 20) {
      insights.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Margen Bajo',
        message: `Rentabilidad de ${rentabilidadPorcentaje.toFixed(1)}% - Considera reducir gastos operativos`,
        color: 'orange'
      });
    } else {
      insights.push({
        type: 'success',
        icon: TrendingUp,
        title: 'Rentabilidad Saludable',
        message: `Margen operativo de ${rentabilidadPorcentaje.toFixed(1)}% - Negocio rentable`,
        color: 'green'
      });
    }

    // Insight 2: Eficiencia Operativa
    if (metrics.produccion.tasaMerma > 5) {
      insights.push({
        type: 'alert',
        icon: Factory,
        title: 'Merma Elevada en Producción',
        message: `${metrics.produccion.tasaMerma.toFixed(1)}% de merma - Revisar procesos de producción`,
        color: 'red'
      });
    } else if (metrics.produccion.eficiencia >= 95) {
      insights.push({
        type: 'success',
        icon: CheckCircle,
        title: 'Excelencia en Producción',
        message: `Eficiencia del ${metrics.produccion.eficiencia.toFixed(1)}% - Superando estándares`,
        color: 'green'
      });
    }

    // Insight 3: Logística
    if (metrics.logistica.tasaDevolucion > 10) {
      insights.push({
        type: 'alert',
        icon: Truck,
        title: 'Alta Tasa de Devoluciones',
        message: `${metrics.logistica.tasaDevolucion.toFixed(1)}% de devoluciones - Optimizar rutas`,
        color: 'red'
      });
    }

    // Insight 4: Marketing ROI
    const roi = metrics.marketing.inversionTotal > 0
      ? (metrics.marketing.clicsTotal / metrics.marketing.inversionTotal)
      : 0;
    if (roi > 1) {
      insights.push({
        type: 'success',
        icon: Megaphone,
        title: 'ROI Marketing Positivo',
        message: `${roi.toFixed(2)} clics por peso invertido - Campañas efectivas`,
        color: 'green'
      });
    }

    return insights.slice(0, 3); // Top 3 insights
  };

  const insights = generateInsights();

  // Calcular rentabilidad para usar en comparativa
  const rentabilidadPorcentaje = metrics.finanzas.ingresos > 0 
    ? (metrics.finanzas.margen / metrics.finanzas.ingresos) * 100 
    : 0;

  // Comparativa de Áreas (Performance Score)
  const areaPerformance = [
    { 
      area: 'Finanzas', 
      score: Math.min(100, (rentabilidadPorcentaje / 30) * 100),
      color: '#10b981'
    },
    { 
      area: 'Producción', 
      score: metrics.produccion.eficiencia,
      color: '#3b82f6'
    },
    { 
      area: 'Logística', 
      score: 100 - metrics.logistica.tasaDevolucion,
      color: '#8b5cf6'
    },
    { 
      area: 'Marketing', 
      score: Math.min(100, metrics.marketing.tasaConversion * 20),
      color: '#ec4899'
    }
  ].sort((a, b) => b.score - a.score);

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        variants={fadeInUp}
      >
        <div>
          <motion.h1 
            className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            Dashboard Ejecutivo 📊
          </motion.h1>
          <motion.p 
            className="text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Métricas clave consolidadas de todas las dimensiones del negocio
          </motion.p>
        </div>
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={fetchData}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </motion.div>
      </motion.div>

      {/* KPIs Principales - 4 tarjetas */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={staggerContainer}
      >
        {kpiCards.map((card, index) => (
          <motion.div
            key={index}
            variants={scaleIn}
            whileHover={{ scale: 1.03, y: -5 }}
          >
            <Card className={`relative overflow-hidden bg-gradient-to-br ${card.color} border-0 shadow-xl hover:shadow-2xl transition-all`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-3">
                  <motion.div 
                    className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <card.icon className="w-6 h-6 text-white" />
                  </motion.div>
                  <div className={`flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full`}>
                    {card.trend === 'positive' && <CheckCircle className="w-3 h-3 text-white" />}
                    {card.trend === 'warning' && <AlertTriangle className="w-3 h-3 text-white" />}
                    {card.trend === 'negative' && <TrendingDown className="w-3 h-3 text-white" />}
                  </div>
                </div>
                <p className="text-sm text-white/90 font-medium mb-1">{card.title}</p>
                <p className="text-3xl font-bold text-white mb-2">{card.value}</p>
                <p className="text-xs text-white/70">{card.subtitle}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tendencia Financiera */}
          <motion.div variants={fadeInUp}>
            <Card className="border-2 border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Tendencia Financiera
                </CardTitle>
                <CardDescription>Ingresos vs Gastos por periodo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={financialTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                      <Line type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} name="Ingresos" />
                      <Line type="monotone" dataKey="gastos" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', r: 4 }} name="Gastos" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Grid de 5 Dimensiones */}
          <motion.div variants={fadeInUp}>
            <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  Resumen por Dimensión (Modelo Estrella)
                </CardTitle>
                <CardDescription>Indicadores clave de cada área del negocio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-3">
                  {dimensionCards.map((dim, index) => (
                    <motion.div
                      key={index}
                      className="group p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-indigo-400 hover:shadow-lg transition-all"
                      variants={scaleIn}
                      whileHover={{ scale: 1.05, y: -3 }}
                    >
                      <div className="flex flex-col items-center gap-2 text-center">
                        <motion.div 
                          className={`w-12 h-12 bg-gradient-to-br from-${dim.color}-400 to-${dim.color}-600 rounded-lg flex items-center justify-center shadow-md`}
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                        >
                          <dim.icon className="w-6 h-6 text-white" />
                        </motion.div>
                        <span className="text-xs font-semibold text-gray-700">{dim.name}</span>
                        <span className="text-xl font-bold text-gray-900">{dim.value}</span>
                        <span className="text-xs text-gray-500">{dim.metric}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* NUEVO: Inteligencia de Negocio - Insights */}
          <motion.div variants={fadeInUp} className="col-span-full">
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  🧠 Insights Inteligentes - Top 3 Hallazgos
                </CardTitle>
                <CardDescription>
                  Análisis automático de datos para recomendaciones accionables
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {insights.map((insight, index) => (
                    <motion.div
                      key={index}
                      className={`p-4 rounded-xl border-2 ${
                        insight.color === 'green' ? 'bg-green-50 border-green-200' :
                        insight.color === 'orange' ? 'bg-orange-50 border-orange-200' :
                        insight.color === 'red' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          insight.color === 'green' ? 'bg-green-100' :
                          insight.color === 'orange' ? 'bg-orange-100' :
                          insight.color === 'red' ? 'bg-red-100' : 'bg-blue-100'
                        }`}>
                          <insight.icon className={`w-5 h-5 ${
                            insight.color === 'green' ? 'text-green-600' :
                            insight.color === 'orange' ? 'text-orange-600' :
                            insight.color === 'red' ? 'text-red-600' : 'text-blue-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-bold text-sm mb-1 ${
                            insight.color === 'green' ? 'text-green-900' :
                            insight.color === 'orange' ? 'text-orange-900' :
                            insight.color === 'red' ? 'text-red-900' : 'text-blue-900'
                          }`}>
                            {insight.title}
                          </h4>
                          <p className={`text-xs ${
                            insight.color === 'green' ? 'text-green-700' :
                            insight.color === 'orange' ? 'text-orange-700' :
                            insight.color === 'red' ? 'text-red-700' : 'text-blue-700'
                          }`}>
                            {insight.message}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* NUEVO: Comparativa de Áreas */}
          <motion.div variants={fadeInUp} className="col-span-full">
            <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Target className="w-6 h-6 text-indigo-600" />
                  📊 Performance Score por Área
                </CardTitle>
                <CardDescription className="text-sm">
                  <strong>Metodología de Cálculo (0-100 puntos):</strong><br/>
                  • <strong>Finanzas:</strong> Rentabilidad Operativa normalizada (Margen/Ingresos × 100, objetivo: 30%)<br/>
                  • <strong>Producción:</strong> Eficiencia de producción directa (Real/Programado × 100)<br/>
                  • <strong>Logística:</strong> Efectividad de entregas (100 - % devoluciones)<br/>
                  • <strong>Marketing:</strong> Tasa de conversión normalizada (% conversión × 20, objetivo: 5%)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={areaPerformance}
                      layout="horizontal"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="area" 
                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        domain={[0, 100]}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: 'Score', angle: -90, position: 'insideLeft', style: { fill: '#64748b' } }}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [`${value.toFixed(1)} puntos`, 'Performance']}
                      />
                      <Bar 
                        dataKey="score" 
                        radius={[8, 8, 0, 0]} 
                        barSize={60}
                      >
                        {areaPerformance.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-4 gap-3 mt-4">
                  {areaPerformance.map((area, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200"
                    >
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: area.color }}
                      />
                      <div>
                        <p className="text-[10px] text-gray-500">{area.area}</p>
                        <p className="text-sm font-bold text-gray-900">{area.score.toFixed(0)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Producción y Merma */}
          <motion.div variants={fadeInUp}>
            <Card className="border-2 border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Análisis de Producción
                </CardTitle>
                <CardDescription>Producción real vs Merma generada</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productionTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="produccion" fill="#3b82f6" name="Producción (pzs)" />
                      <Bar dataKey="merma" fill="#ef4444" name="Merma (kg)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Columna Derecha - 1/3 */}
        <div className="space-y-6">
          {/* Desglose de Gastos */}
          <motion.div variants={fadeInUp}>
            <Card className="border-2 border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="w-5 h-5 text-red-600" />
                  Desglose de Gastos
                </CardTitle>
                <CardDescription>Distribución de costos operativos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={expenseBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={(entry) => `$${(entry.value / 1000).toFixed(0)}k`}
                      >
                        {expenseBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                      <Legend />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Métricas RRHH */}
          <motion.div variants={fadeInUp}>
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                  Recursos Humanos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200">
                  <div>
                    <p className="text-xs text-gray-600">Empleados Activos</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics.rrhh.empleados}</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-400" />
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200">
                  <div>
                    <p className="text-xs text-gray-600">Horas Extra</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics.rrhh.horasExtra.toFixed(0)}</p>
                  </div>
                  <Clock className="w-8 h-8 text-purple-400" />
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200">
                  <div>
                    <p className="text-xs text-gray-600">Costo/Hora Extra</p>
                    <p className="text-2xl font-bold text-gray-900">${metrics.rrhh.costoPromedioHora.toFixed(0)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Alerta de Indicadores */}
          <motion.div variants={fadeInUp}>
            <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="w-5 h-5 text-amber-600" />
                  Indicadores de Alerta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {metrics.produccion.tasaMerma > 5 && (
                  <div className="flex items-start gap-2 p-3 bg-red-100 border border-red-300 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-900">Merma Alta</p>
                      <p className="text-xs text-red-700">Tasa de merma: {metrics.produccion.tasaMerma.toFixed(1)}%</p>
                    </div>
                  </div>
                )}
                {metrics.logistica.tasaDevolucion > 10 && (
                  <div className="flex items-start gap-2 p-3 bg-orange-100 border border-orange-300 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-orange-900">Devoluciones Altas</p>
                      <p className="text-xs text-orange-700">Tasa: {metrics.logistica.tasaDevolucion.toFixed(1)}%</p>
                    </div>
                  </div>
                )}
                {metrics.marketing.tasaConversion < 2 && metrics.marketing.inversionTotal > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-900">ROI Marketing Bajo</p>
                      <p className="text-xs text-yellow-700">Conversión: {metrics.marketing.tasaConversion.toFixed(2)}%</p>
                    </div>
                  </div>
                )}
                {metrics.finanzas.margen < 0 && (
                  <div className="flex items-start gap-2 p-3 bg-red-100 border border-red-300 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-900">Margen Negativo</p>
                      <p className="text-xs text-red-700">Gastos superan ingresos</p>
                    </div>
                  </div>
                )}
                {metrics.produccion.tasaMerma <= 5 && metrics.logistica.tasaDevolucion <= 10 && 
                 metrics.marketing.tasaConversion >= 2 && metrics.finanzas.margen >= 0 && (
                  <div className="flex items-start gap-2 p-3 bg-green-100 border border-green-300 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-green-900">Todo en Orden</p>
                      <p className="text-xs text-green-700">Todos los KPIs dentro de parámetros</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
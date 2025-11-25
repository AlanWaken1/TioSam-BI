'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  RefreshCw, 
  Clock, 
  ExternalLink, 
  Plus,
  DollarSign,
  Factory,
  Users,
  Smartphone,
  FileText,
  TrendingUp,
  TrendingDown,
  Activity,
  Database,
  Layers,
  BarChart3,
  PieChart,
  Calendar,
  Sparkles,
  Target,
  Zap,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Upload,
  Bell,
  Star,
  Award,
  Percent,
  Eye
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { DynamicChart } from '../components/dashboard/DynamicChart';

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

export default function DashboardView() {
  const [selectedPeriod, setSelectedPeriod] = useState('Este mes');

  // Datos de ejemplo para los gráficos
  const performanceData = [
    { name: 'Ene', finanzas: 4500, produccion: 890, rrhh: 320, digital: 450 },
    { name: 'Feb', finanzas: 5200, produccion: 950, rrhh: 340, digital: 520 },
    { name: 'Mar', finanzas: 4800, produccion: 920, rrhh: 350, digital: 480 },
    { name: 'Abr', finanzas: 6100, produccion: 1100, rrhh: 380, digital: 610 },
    { name: 'May', finanzas: 5900, produccion: 1050, rrhh: 370, digital: 590 },
    { name: 'Jun', finanzas: 6800, produccion: 1250, rrhh: 400, digital: 680 },
  ];

  const dimensionsData = [
    { name: 'Finanzas', value: 6800 },
    { name: 'Producción', value: 1250 },
    { name: 'RRHH', value: 400 },
    { name: 'Digital', value: 680 },
    { name: 'Reportes', value: 340 },
  ];

  const recentActivities = [
    { 
      id: 1, 
      dimension: 'Finanzas', 
      action: 'Nuevo registro ingreso', 
      time: 'Hace 5 min', 
      status: 'success',
      icon: DollarSign,
      color: 'green',
      amount: '$5,240'
    },
    { 
      id: 2, 
      dimension: 'Producción', 
      action: 'Lote #1234 completado', 
      time: 'Hace 12 min', 
      status: 'success',
      icon: Factory,
      color: 'blue',
      amount: '150 unidades'
    },
    { 
      id: 3, 
      dimension: 'RRHH', 
      action: 'Nómina procesada', 
      time: 'Hace 25 min', 
      status: 'success',
      icon: Users,
      color: 'purple',
      amount: '48 empleados'
    },
    { 
      id: 4, 
      dimension: 'Digital', 
      action: 'Análisis IA generado', 
      time: 'Hace 1 hora', 
      status: 'processing',
      icon: Smartphone,
      color: 'orange',
      amount: '3 insights'
    },
    { 
      id: 5, 
      dimension: 'Reportes', 
      action: 'CSV importado', 
      time: 'Hace 2 horas', 
      status: 'success',
      icon: FileText,
      color: 'indigo',
      amount: '89 registros'
    },
  ];

  const notifications = [
    { id: 1, type: 'warning', message: 'Revisa los gastos de Marzo', time: 'Hace 1 hora' },
    { id: 2, type: 'success', message: 'Análisis IA completado', time: 'Hace 3 horas' },
    { id: 3, type: 'info', message: 'Nueva actualización disponible', time: 'Hace 5 horas' },
  ];

  const topPerformers = [
    { dimension: 'Finanzas', growth: '+24%', value: '$24.5K', trend: 'up', color: 'from-green-500 to-emerald-600' },
    { dimension: 'Producción', growth: '+18%', value: '1,250', trend: 'up', color: 'from-blue-500 to-cyan-600' },
    { dimension: 'Digital', growth: '+15%', value: '12.8K', trend: 'up', color: 'from-orange-500 to-red-600' },
  ];

  const metricsCards = [
    { icon: DollarSign, title: 'Venta Total Semanal (MXN)', value: '$145.2K', change: '+24%', color: 'from-green-500 to-emerald-600', subtitle: 'Signo de pesos' },
    { icon: Factory, title: 'Producción Total (Piezas)', value: '28,500', change: 'Meta: 30k', color: 'from-blue-500 to-cyan-600', subtitle: 'Horno industrial' },
    { icon: Users, title: 'Asistencia Operativa', value: '98%', change: '48/50', color: 'from-purple-500 to-pink-600', subtitle: '48 de 50 empleados presentes' },
    { icon: AlertCircle, title: 'Merma Diaria (Desperdicio)', value: '4.2%', change: '⚠️ Límite 3%', color: 'from-orange-500 to-red-600', subtitle: 'Alerta activa' },
  ];

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* Header con saludo y notificaciones */}
      <motion.div 
        className="flex items-center justify-between"
        variants={fadeInUp}
      >
        <div>
          <motion.h1 
            className="text-3xl font-bold mb-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            Resumen Operativo del Día 🍞
          </motion.h1>
          <motion.p 
            className="text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Datos actualizados del Modelo Estrella
          </motion.p>
        </div>
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="outline" className="gap-2 relative">
              <Bell className="w-4 h-4" />
              <motion.span 
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                3
              </motion.span>
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Sparkles className="w-4 h-4" />
              Análisis IA
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Métricas principales - 4 tarjetas grandes */}
      <motion.div 
        className="grid grid-cols-4 gap-4"
        variants={staggerContainer}
      >
        {metricsCards.map((card, index) => (
          <motion.div
            key={index}
            variants={scaleIn}
            whileHover={{ 
              scale: 1.03, 
              y: -5,
              transition: { type: "spring", stiffness: 300 }
            }}
          >
            <Card className={`relative overflow-hidden bg-gradient-to-br ${card.color} border-0 shadow-xl hover:shadow-2xl transition-all cursor-pointer`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <motion.div 
                    className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <card.icon className="w-6 h-6 text-white" />
                  </motion.div>
                  <motion.div 
                    className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                  >
                    {index < 3 ? <ArrowUpRight className="w-3 h-3 text-white" /> : <CheckCircle className="w-3 h-3 text-white" />}
                    <span className="text-xs text-white font-semibold">{card.change}</span>
                  </motion.div>
                </div>
                <motion.p 
                  className="text-sm text-white/80 mb-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.4 }}
                >
                  {card.title}
                </motion.p>
                <motion.p 
                  className="text-3xl font-bold text-white mb-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.5, type: "spring" }}
                >
                  {card.value}
                </motion.p>
                <p className="text-xs text-white/70">Este mes</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Grid principal: 2 columnas */}
      <div className="grid grid-cols-3 gap-6">
        {/* Columna izquierda - 2/3 */}
        <motion.div 
          className="col-span-2 space-y-6"
          variants={staggerContainer}
        >
          {/* Gráfico principal de rendimiento */}
          <motion.div 
            className="col-span-2"
            variants={fadeInUp}
          >
            <DynamicChart
              data={performanceData}
              type="line"
              title="Cruce de Ventas ($) vs. Costo de Insumos ($)"
              description="Análisis comparativo del flujo financiero y costos operativos"
              xKey="name"
              yKey="finanzas"
            />
          </motion.div>

          {/* Top Performers */}
          <motion.div variants={fadeInUp}>
            <Card className="border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50/50 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: [0, 15, -15, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      >
                        <Award className="w-5 h-5 text-yellow-500" />
                      </motion.div>
                      Top Performers del Mes
                    </CardTitle>
                    <CardDescription>Dimensiones con mejor desempeño</CardDescription>
                  </div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" size="sm">
                      Ver Detalles
                    </Button>
                  </motion.div>
                </div>
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="grid grid-cols-3 gap-4"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {topPerformers.map((performer, index) => (
                    <motion.div 
                      key={index} 
                      className={`relative overflow-hidden bg-gradient-to-br ${performer.color} rounded-xl p-4 shadow-lg cursor-pointer`}
                      variants={scaleIn}
                      whileHover={{ 
                        scale: 1.05, 
                        y: -5,
                        transition: { type: "spring", stiffness: 300 }
                      }}
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
                      <div className="relative">
                        <div className="flex items-center justify-between mb-3">
                          <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          >
                            <Star className="w-5 h-5 text-white" />
                          </motion.div>
                          <div className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full">
                            <TrendingUp className="w-3 h-3 text-white" />
                            <span className="text-xs text-white font-semibold">{performer.growth}</span>
                          </div>
                        </div>
                        <p className="text-sm text-white/80 mb-1">{performer.dimension}</p>
                        <motion.p 
                          className="text-2xl font-bold text-white"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.1 + 0.5, type: "spring" }}
                        >
                          {performer.value}
                        </motion.p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Dimensiones Summary - Grid de 5 tarjetas */}
          <motion.div variants={fadeInUp}>
            <Card className="border-2 border-gray-200 bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-gray-700" />
                  Resumen por Dimensión
                </CardTitle>
                <CardDescription>Vista rápida de todas las áreas</CardDescription>
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="grid grid-cols-5 gap-3"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {[
                    { icon: DollarSign, name: 'Finanzas', value: '$24.5K', trend: '+24%', color: 'green' },
                    { icon: Factory, name: 'Producción', value: '1,250', trend: '+18%', color: 'blue' },
                    { icon: Users, name: 'RRHH', value: '48', trend: '100%', color: 'purple' },
                    { icon: Smartphone, name: 'Digital', value: '12.8K', trend: '+15%', color: 'orange' },
                    { icon: FileText, name: 'Reportes', value: '34', trend: 'Activos', color: 'indigo' },
                  ].map((dim, index) => (
                    <motion.button
                      key={index}
                      className={`group p-4 border-2 border-gray-200 rounded-xl hover:border-${dim.color}-300 hover:bg-${dim.color}-50 transition-all`}
                      variants={scaleIn}
                      whileHover={{ scale: 1.05, y: -3 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <motion.div 
                          className={`w-12 h-12 bg-gradient-to-br from-${dim.color}-400 to-${dim.color === 'green' ? 'emerald' : dim.color === 'blue' ? 'cyan' : dim.color === 'purple' ? 'pink' : dim.color === 'orange' ? 'red' : 'blue'}-500 rounded-lg flex items-center justify-center`}
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                        >
                          <dim.icon className="w-6 h-6 text-white" />
                        </motion.div>
                        <span className="text-xs font-medium text-gray-600">{dim.name}</span>
                        <span className="text-lg font-bold">{dim.value}</span>
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <TrendingUp className="w-3 h-3" />
                          <span>{dim.trend}</span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Gráfico de distribución */}
          <motion.div variants={fadeInUp}>
            <DynamicChart
              data={dimensionsData}
              type="pie"
              title="Distribución de Actividad por Dimensión"
              description="Porcentaje de registros por área"
              nameKey="name"
              yKey="value"
            />
          </motion.div>
        </motion.div>

        {/* Columna derecha - 1/3 */}
        <motion.div 
          className="space-y-6"
          variants={staggerContainer}
        >
          {/* Perfil del usuario */}
          <motion.div variants={scaleIn}>
            <Card className="border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50/50 shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col items-center mb-6">
                  <div className="relative mb-4">
                    <motion.div 
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 p-1"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-300 to-pink-400 flex items-center justify-center">
                        <Users className="w-8 h-8 text-white" />
                      </div>
                    </motion.div>
                    <motion.div 
                      className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <CheckCircle className="w-4 h-4 text-white" />
                    </motion.div>
                  </div>
                  <h4 className="font-semibold text-lg mb-1">Admin TioSam</h4>
                  <p className="text-xs text-gray-500 mb-3">BI Manager</p>
                  <motion.div 
                    className="flex items-center gap-2 px-3 py-1 bg-purple-100 rounded-full"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Star className="w-3 h-3 text-purple-600" />
                    <span className="text-xs font-medium text-purple-700">Premium</span>
                  </motion.div>
                </div>

                <motion.div 
                  className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-200"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {[
                    { icon: Database, value: '256', label: 'Registros', color: 'blue' },
                    { icon: Activity, value: '5', label: 'Áreas', color: 'green' },
                    { icon: TrendingUp, value: '+15%', label: 'Growth', color: 'orange' },
                  ].map((stat, index) => (
                    <motion.div 
                      key={index}
                      className="text-center"
                      variants={scaleIn}
                      whileHover={{ y: -5 }}
                    >
                      <div className={`w-10 h-10 bg-${stat.color}-100 rounded-lg flex items-center justify-center mx-auto mb-2`}>
                        <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                      </div>
                      <span className="text-lg font-bold block">{stat.value}</span>
                      <span className="text-xs text-gray-500">{stat.label}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notificaciones */}
          <motion.div variants={fadeInUp}>
            <Card className="border-2 border-gray-200 bg-white shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-gray-700" />
                    Notificaciones
                  </CardTitle>
                  <motion.div 
                    className="w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    3
                  </motion.div>
                </div>
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="space-y-3"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {notifications.map((notif, index) => (
                    <motion.div 
                      key={notif.id} 
                      className={`p-3 rounded-lg border-2 ${
                        notif.type === 'warning' ? 'bg-orange-50 border-orange-200' :
                        notif.type === 'success' ? 'bg-green-50 border-green-200' :
                        'bg-blue-50 border-blue-200'
                      }`}
                      variants={fadeInUp}
                      whileHover={{ x: 5 }}
                    >
                      <div className="flex items-start gap-2">
                        {notif.type === 'warning' && <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5" />}
                        {notif.type === 'success' && <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />}
                        {notif.type === 'info' && <Sparkles className="w-4 h-4 text-blue-600 mt-0.5" />}
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-900">{notif.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button variant="outline" className="w-full mt-3 text-xs">
                    Ver todas las notificaciones
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Actividad reciente */}
          <motion.div variants={fadeInUp}>
            <Card className="border-2 border-gray-200 bg-white shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-gray-700" />
                    Actividad Reciente
                  </CardTitle>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="space-y-3"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {recentActivities.map((activity, index) => (
                    <motion.div 
                      key={activity.id} 
                      className="group p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all cursor-pointer"
                      variants={fadeInUp}
                      whileHover={{ x: 5, scale: 1.02 }}
                    >
                      <div className="flex items-start gap-3">
                        <motion.div 
                          className={`w-10 h-10 bg-gradient-to-br from-${activity.color}-400 to-${activity.color}-500 rounded-lg flex items-center justify-center flex-shrink-0`}
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                        >
                          <activity.icon className="w-5 h-5 text-white" />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 mb-1">{activity.dimension}</p>
                          <p className="text-xs text-gray-600 mb-1">{activity.action}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">{activity.time}</span>
                            <span className="text-xs font-semibold text-gray-700">{activity.amount}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={scaleIn}>
            <Card className="border-2 border-gray-200 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-indigo-600" />
                  Acciones Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="space-y-2"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {[
                    { icon: Plus, label: 'Nuevo Registro', gradient: true },
                    { icon: Upload, label: 'Importar CSV' },
                    { icon: Sparkles, label: 'Análisis IA' },
                    { icon: Download, label: 'Exportar Datos' },
                  ].map((action, index) => (
                    <motion.div
                      key={index}
                      variants={fadeInUp}
                      whileHover={{ scale: 1.03, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        className={`w-full justify-start gap-2 ${
                          action.gradient 
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' 
                            : ''
                        }`}
                        variant={action.gradient ? 'default' : 'outline'}
                      >
                        <action.icon className="w-4 h-4" />
                        {action.label}
                      </Button>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
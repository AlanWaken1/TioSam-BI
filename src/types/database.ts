export interface DimFinanzas {
  id?: string;
  documento: string;
  periodo: string;
  año: number;
  monto: number;
  categoria: string;
  created_at?: string;
}

export interface DimProduccion {
  id?: string;
  documento: string;
  periodo: string;
  año: number;
  area_especifica: string;
  created_at?: string;
}

export interface DimRRHH {
  id?: string;
  documento: string;
  periodo: string;
  año: number;
  tipo_contratacion: string;
  created_at?: string;
}

export interface DimDesarrollo {
  id?: string;
  documento: string;
  periodo: string;
  año: number;
  subdimension: string;
  created_at?: string;
}

export interface Reporte {
  id?: string;
  nombre_archivo: string;
  url_archivo?: string;
  analisis_ia?: string;
  created_at?: string;
}

export type DimensionType = 'finanzas' | 'produccion' | 'rrhh' | 'desarrollo';

export interface DashboardMetrics {
  totalRegistros: number;
  ultimaActualizacion: string;
  categorias: number;
  tendencia: 'up' | 'down' | 'stable';
}

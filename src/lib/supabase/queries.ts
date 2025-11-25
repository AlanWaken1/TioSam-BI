import { supabase } from './client';
import type { DimFinanzas, DimProduccion, DimRRHH, DimDesarrollo, Reporte } from '@/types/database';

// ============ FINANZAS ============
export async function getFinanzas() {
  const { data, error } = await supabase
    .from('dim_finanzas')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as DimFinanzas[];
}

export async function createFinanza(finanza: Omit<DimFinanzas, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('dim_finanzas')
    .insert([finanza])
    .select();
  
  if (error) throw error;
  return data[0];
}

export async function updateFinanza(id: string, finanza: Partial<DimFinanzas>) {
  const { data, error } = await supabase
    .from('dim_finanzas')
    .update(finanza)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0];
}

export async function deleteFinanza(id: string) {
  const { error } = await supabase
    .from('dim_finanzas')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============ PRODUCCION ============
export async function getProduccion() {
  const { data, error } = await supabase
    .from('dim_produccion')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as DimProduccion[];
}

export async function createProduccion(produccion: Omit<DimProduccion, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('dim_produccion')
    .insert([produccion])
    .select();
  
  if (error) throw error;
  return data[0];
}

export async function updateProduccion(id: string, produccion: Partial<DimProduccion>) {
  const { data, error } = await supabase
    .from('dim_produccion')
    .update(produccion)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0];
}

export async function deleteProduccion(id: string) {
  const { error } = await supabase
    .from('dim_produccion')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============ RRHH ============
export async function getRRHH() {
  const { data, error } = await supabase
    .from('dim_rrhh')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as DimRRHH[];
}

export async function createRRHH(rrhh: Omit<DimRRHH, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('dim_rrhh')
    .insert([rrhh])
    .select();
  
  if (error) throw error;
  return data[0];
}

export async function updateRRHH(id: string, rrhh: Partial<DimRRHH>) {
  const { data, error } = await supabase
    .from('dim_rrhh')
    .update(rrhh)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0];
}

export async function deleteRRHH(id: string) {
  const { error } = await supabase
    .from('dim_rrhh')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============ DESARROLLO ============
export async function getDesarrollo() {
  const { data, error } = await supabase
    .from('dim_desarrollo')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as DimDesarrollo[];
}

export async function createDesarrollo(desarrollo: Omit<DimDesarrollo, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('dim_desarrollo')
    .insert([desarrollo])
    .select();
  
  if (error) throw error;
  return data[0];
}

export async function updateDesarrollo(id: string, desarrollo: Partial<DimDesarrollo>) {
  const { data, error } = await supabase
    .from('dim_desarrollo')
    .update(desarrollo)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0];
}

export async function deleteDesarrollo(id: string) {
  const { error } = await supabase
    .from('dim_desarrollo')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============ REPORTES ============
export async function getReportes() {
  const { data, error } = await supabase
    .from('reportes')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Reporte[];
}

export async function createReporte(reporte: Omit<Reporte, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('reportes')
    .insert([reporte])
    .select();
  
  if (error) throw error;
  return data[0];
}

// ============ BULK INSERT ============
export async function bulkInsertFinanzas(finanzas: Omit<DimFinanzas, 'id' | 'created_at'>[]) {
  const { data, error } = await supabase
    .from('dim_finanzas')
    .insert(finanzas)
    .select();
  
  if (error) throw error;
  return data;
}

export async function bulkInsertProduccion(produccion: Omit<DimProduccion, 'id' | 'created_at'>[]) {
  const { data, error } = await supabase
    .from('dim_produccion')
    .insert(produccion)
    .select();
  
  if (error) throw error;
  return data;
}

export async function bulkInsertRRHH(rrhh: Omit<DimRRHH, 'id' | 'created_at'>[]) {
  const { data, error } = await supabase
    .from('dim_rrhh')
    .insert(rrhh)
    .select();
  
  if (error) throw error;
  return data;
}

export async function bulkInsertDesarrollo(desarrollo: Omit<DimDesarrollo, 'id' | 'created_at'>[]) {
  const { data, error } = await supabase
    .from('dim_desarrollo')
    .insert(desarrollo)
    .select();
  
  if (error) throw error;
  return data;
}

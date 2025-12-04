-- 1. Tabla Maestra de Cargas
create table upload_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  filename text not null,
  dimension text not null, -- 'finanzas', 'produccion', 'rrhh', 'desarrollo', 'logistica'
  total_rows int default 0,
  status text default 'processing' -- 'processing', 'success', 'error'
);

-- 2. Tablas Dimensionales

-- Finanzas
create table finanzas (
  id uuid default gen_random_uuid() primary key,
  upload_id uuid references upload_logs(id) on delete cascade,
  fecha date,
  folio text,
  tipo text,
  categoria text,
  concepto text,
  monto numeric,
  metodo_pago text
);

-- Producción
create table produccion (
  id uuid default gen_random_uuid() primary key,
  upload_id uuid references upload_logs(id) on delete cascade,
  fecha_produccion date,
  lote text,
  producto text,
  cant_programada numeric,
  cant_real numeric,
  merma numeric,
  causa_merma text,
  eficiencia numeric
);

-- RRHH (Asistencia y Nómina)
create table rrhh (
  id uuid default gen_random_uuid() primary key,
  upload_id uuid references upload_logs(id) on delete cascade,
  fecha date,
  id_emp text,
  empleado text,
  puesto text,
  incidencia text,
  horas_extra numeric,
  monto_extra numeric
);

-- Desarrollo Digital (Marketing Ads)
create table desarrollo (
  id uuid default gen_random_uuid() primary key,
  upload_id uuid references upload_logs(id) on delete cascade,
  fecha date,
  canal text, -- Plataforma
  campana text,
  inversion numeric,
  alcance numeric,
  clics numeric,
  mensajes numeric
);

-- Logística
create table logistica (
  id uuid default gen_random_uuid() primary key,
  upload_id uuid references upload_logs(id) on delete cascade,
  fecha_salida date,
  ruta_destino text,
  chofer_asignado text,
  unidad text,
  pz_cargadas numeric,
  pz_devueltas numeric,
  gasto_gasolina numeric,
  status text
);

-- 3. Seguridad y RLS (Row Level Security)

-- Habilitar RLS en todas las tablas
alter table upload_logs enable row level security;
alter table finanzas enable row level security;
alter table produccion enable row level security;
alter table rrhh enable row level security;
alter table desarrollo enable row level security;
alter table logistica enable row level security;

-- CREAR POLÍTICAS DE ACCESO TOTAL (CRUD PÚBLICO)
-- Ojo: En un sistema real esto se restringe por usuario, 
-- pero para tu entrega escolar esto permite que la API funcione directo.

-- Política para Upload Logs
create policy "Acceso total a logs" on upload_logs
for all using (true) with check (true);

-- Política para Finanzas
create policy "Acceso total a finanzas" on finanzas
for all using (true) with check (true);

-- Política para Producción
create policy "Acceso total a produccion" on produccion
for all using (true) with check (true);

-- Política para RRHH
create policy "Acceso total a rrhh" on rrhh
for all using (true) with check (true);

-- Política para Desarrollo
create policy "Acceso total a desarrollo" on desarrollo
for all using (true) with check (true);

-- Política para Logística
create policy "Acceso total a logistica" on logistica
for all using (true) with check (true);

-- Índices para búsquedas rápidas en Dashboards
create index idx_finanzas_fecha on finanzas(fecha);
create index idx_produccion_fecha on produccion(fecha_produccion);
create index idx_logistica_ruta on logistica(ruta_destino);
create index idx_logs_dimension on upload_logs(dimension);

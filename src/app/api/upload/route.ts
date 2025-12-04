import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const dimension = formData.get('dimension') as string;

    if (!file || !dimension) {
      return NextResponse.json({ error: 'File and dimension are required' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const filename = file.name;

    // 1. Insertar en upload_logs
    const { data: uploadLog, error: logError } = await supabase
      .from('upload_logs')
      .insert({
        filename,
        dimension,
        status: 'processing'
      })
      .select()
      .single();

    if (logError || !uploadLog) {
      console.error('Error creating upload log:', logError);
      return NextResponse.json({ error: `Failed to create upload log: ${logError?.message || 'Unknown error'}` }, { status: 500 });
    }

    const uploadId = uploadLog.id;

    // 2. Parsear Excel
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // 3. Transformar y Mapear Datos
    let mappedData: any[] = [];
    
    // Helper para buscar valores insensible a mayúsculas/variantes
    const findValue = (row: any, variants: string[]) => {
      for (const key of variants) {
        if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
          return row[key];
        }
      }
      return null;
    };

    // Helper para parsear fechas (Excel serial, DD/MM/YYYY, YYYY-MM-DD)
    const parseDate = (value: any): string | null => {
      if (!value) return null;

      // 1. Si es número (Excel Serial Date)
      if (typeof value === 'number') {
        // Excel base date is 1899-12-30
        const date = new Date(Math.round((value - 25569) * 86400 * 1000));
        return date.toISOString().split('T')[0];
      }

      // 2. Si es string
      if (typeof value === 'string') {
        const trimmed = value.trim();
        
        // Formato DD/MM/YYYY
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
          const [day, month, year] = trimmed.split('/');
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        
        // Formato YYYY-MM-DD (ISO)
        if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
          return trimmed.split('T')[0];
        }
      }

      // 3. Fallback: intentar constructor de Date
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      } catch (e) {
        console.warn('Error parsing date:', value);
      }

      return null;
    };

    if (dimension === 'Finanzas') {
      mappedData = jsonData.map((row: any, index: number) => {
        const tipoRaw = findValue(row, ['tipo', 'Tipo', 'type', 'Type', 'TIPO', 'Movimiento']) || 'Ingreso';
        const tipo = tipoRaw.toString().toLowerCase().includes('gasto') || tipoRaw.toString().toLowerCase().includes('egreso') ? 'Gasto' : 'Ingreso';
        
        return {
          upload_id: uploadId,
          fecha: parseDate(findValue(row, ['fecha', 'Fecha', 'date', 'Date', 'FECHA'])),
          folio: findValue(row, ['folio', 'Folio', 'id', 'ID', 'FOLIO']) || `F-${index + 1}`,
          tipo,
          categoria: findValue(row, ['categoria', 'Categoría', 'Categoria', 'category', 'Category', 'CATEGORIA', 'Rubro']),
          concepto: findValue(row, ['concepto', 'Concepto', 'concept', 'Concept', 'descripcion', 'Descripción', 'Descripcion', 'CONCEPTO']),
          monto: parseFloat(findValue(row, ['monto', 'Monto', 'amount', 'Amount', 'MONTO', 'Importe']) || 0),
          metodo_pago: findValue(row, ['metodo_pago', 'Método Pago', 'Metodo Pago', 'payment_method', 'Forma de Pago'])
        };
      });
    } else if (dimension === 'Producción') {
      mappedData = jsonData.map((row: any, index: number) => {
        const cant_programada = parseFloat(findValue(row, ['cant_programada', 'Cant. Programada', 'programada', 'Programada', 'Esperada', 'Meta']) || 0);
        const cant_real = parseFloat(findValue(row, ['cant_real', 'Cant. Real', 'real', 'Real', 'unidades', 'Unidades', 'Producido']) || 0);
        const eficiencia = cant_programada > 0 ? (cant_real / cant_programada) * 100 : 0;

        return {
          upload_id: uploadId,
          fecha_produccion: parseDate(findValue(row, ['fecha', 'Fecha', 'date', 'Date', 'FECHA'])),
          lote: findValue(row, ['lote_id', 'Lote ID', 'Lote', 'lote', 'batch', 'Batch', 'LOTE']) || `L-${index + 1}`,
          producto: findValue(row, ['producto', 'Producto', 'product', 'Product', 'PRODUCTO']),
          cant_programada,
          cant_real,
          merma: parseFloat(findValue(row, ['merma', 'Merma (Kg)', 'Merma', 'waste', 'Waste', 'Desperdicio', 'Merma Kg']) || 0),
          causa_merma: findValue(row, ['causa_merma', 'Causa Merma', 'Causa de Merma', 'causa', 'Causa', 'reason', 'Reason', 'Motivo']),
          eficiencia
        };
      });
    } else if (dimension === 'RRHH') {
      mappedData = jsonData.map((row: any, index: number) => ({
        upload_id: uploadId,
        fecha: parseDate(findValue(row, ['Fecha Registro', 'Fecha', 'date', 'Date'])),
        id_emp: findValue(row, ['ID Emp', 'id_emp', 'ID', 'id']) || `EMP-${index + 1}`,
        empleado: findValue(row, ['Empleado', 'empleado', 'nombre', 'Nombre']),
        puesto: findValue(row, ['Puesto', 'puesto', 'cargo', 'Cargo']),
        incidencia: findValue(row, ['Incidencia', 'incidencia', 'tipo', 'Tipo']),
        horas_extra: parseFloat(findValue(row, ['Horas Extra', 'horas_extra', 'horas', 'Horas']) || 0),
        monto_extra: parseFloat(findValue(row, ['Monto Extra', 'monto_extra', 'monto', 'Monto']) || 0)
      }));
    } else if (dimension === 'Desarrollo Digital') {
      mappedData = jsonData.map((row: any) => ({
        upload_id: uploadId,
        fecha: parseDate(findValue(row, ['Fecha Reporte', 'Fecha', 'date', 'Date'])),
        canal: findValue(row, ['Plataforma', 'plataforma', 'canal', 'Canal', 'Source']),
        campana: findValue(row, ['Campaña', 'campaña', 'campaign', 'Campaign']),
        inversion: parseFloat(findValue(row, ['Inversión', 'inversion', 'spend', 'Spend', 'Costo']) || 0),
        alcance: parseFloat(findValue(row, ['Alcance', 'alcance', 'reach', 'Reach', 'Impresiones']) || 0),
        clics: parseFloat(findValue(row, ['Clics', 'clics', 'clicks', 'Clicks']) || 0),
        mensajes: parseFloat(findValue(row, ['Mensajes', 'mensajes', 'messages', 'Messages', 'Conversiones']) || 0)
      }));
    } else if (dimension === 'Logística') {
      mappedData = jsonData.map((row: any) => ({
        upload_id: uploadId,
        fecha_salida: parseDate(findValue(row, ['fecha_salida', 'Fecha Salida', 'Fecha', 'date'])),
        ruta_destino: findValue(row, ['ruta_destino', 'Ruta Destino', 'Ruta', 'Destino']),
        chofer_asignado: findValue(row, ['chofer_asignado', 'Chofer Asignado', 'Chofer', 'Conductor']),
        unidad: findValue(row, ['unidad', 'Unidad', 'Vehiculo', 'Camion']),
        pz_cargadas: parseFloat(findValue(row, ['pz_cargadas', 'Piezas Cargadas', 'Cargadas', 'Load', 'Pz Cargadas', 'Pz cargadas']) || 0),
        pz_devueltas: parseFloat(findValue(row, ['pz_devueltas', 'Piezas Devueltas', 'Devueltas', 'Returns', 'Pz Devueltas', 'Pz devueltas']) || 0),
        gasto_gasolina: parseFloat(findValue(row, ['gasto_gasolina', 'Gasto Gasolina', 'Gasolina', 'Combustible', 'Gasto']) || 0),
        status: findValue(row, ['status', 'Status', 'Estado', 'Estatus'])
      }));
    }

    // 4. Insertar en tabla destino
    // Normalize: lowercase, remove accents
    let tableName = dimension.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Handle special cases
    if (tableName === 'desarrollo digital') {
      tableName = 'desarrollo';
    }

    const { error: insertError } = await supabase
      .from(tableName)
      .insert(mappedData);

    if (insertError) {
      console.error(`Error inserting into ${tableName}:`, insertError);
      await supabase.from('upload_logs').update({ status: 'error' }).eq('id', uploadId);
      return NextResponse.json({ error: `Failed to insert data into ${tableName}: ${insertError.message}` }, { status: 500 });
    }

    // 5. Actualizar log
    await supabase
      .from('upload_logs')
      .update({ 
        status: 'success', 
        total_rows: mappedData.length 
      })
      .eq('id', uploadId);

    return NextResponse.json({ success: true, count: mappedData.length });

  } catch (error) {
    console.error('Upload handler error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ComposedChart } from 'recharts';

interface DynamicChartProps {
  data: any[];
  type: 'bar' | 'line' | 'pie' | 'composed';
  title: string;
  description?: string;
  xKey?: string;
  yKey?: string;
  yKey2?: string; // For composed charts (second metric)
  nameKey?: string;
}

// Paleta de colores profesional y moderna
const COLORS = {
  primary: '#2563eb',    // Blue 600
  secondary: '#10b981',  // Emerald 500
  tertiary: '#f59e0b',   // Amber 500
  quaternary: '#ef4444', // Red 500
  slate: '#64748b',      // Slate 500
  purple: '#8b5cf6',     // Violet 500
};

const PIE_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'
];

// ... (keep CustomTooltip and renderCustomizedLabel)

export function DynamicChart({ 
  data, 
  type, 
  title, 
  description, 
  xKey = 'name', 
  yKey = 'value',
  yKey2,
  nameKey = 'name'
}: DynamicChartProps) {
  // ... (keep no data check)

  return (
    <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-gray-800">{title}</CardTitle>
        {description && <CardDescription className="text-sm text-gray-500">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {type === 'bar' ? (
            <BarChart 
              data={data}
              layout={xKey === 'value' ? 'vertical' : 'horizontal'}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              {xKey === 'value' ? (
                <>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey={nameKey} 
                    type="category" 
                    width={150}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    interval={0}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => {
                      const str = String(value);
                      return str.length > 20 ? `${str.substring(0, 20)}...` : str;
                    }}
                  />
                </>
              ) : (
                <>
                  <XAxis 
                    dataKey={xKey} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                  />
                </>
              )}
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f1f5f9' }}
              />
              <Bar 
                dataKey={yKey} 
                fill={COLORS.primary} 
                radius={xKey === 'value' ? [0, 4, 4, 0] : [4, 4, 0, 0]}
                barSize={xKey === 'value' ? 24 : 32}
              />
            </BarChart>
          ) : type === 'line' ? (
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey={xKey} 
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis 
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
              />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Area 
                type="monotone" 
                dataKey={yKey} 
                stroke={COLORS.primary} 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorValue)" 
              />
            </AreaChart>
          ) : type === 'composed' ? (
            <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey={xKey} 
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar 
                yAxisId="left"
                dataKey={yKey} 
                fill={COLORS.primary} 
                radius={[4, 4, 0, 0]}
                barSize={32}
                name={yKey}
              />
              {yKey2 && (
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey={yKey2} 
                  stroke={COLORS.secondary} 
                  strokeWidth={2}
                  dot={{ r: 4, fill: COLORS.secondary }}
                  name={yKey2}
                />
              )}
            </ComposedChart>
          ) : (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey={yKey}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

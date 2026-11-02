import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import type { ChartData, Invoice } from '../types';

interface DashboardProps {
  invoices?: Invoice[];
}

const data: ChartData[] = [
  { name: 'يناير', revenue: 4000, expenses: 2400 },
  { name: 'فبراير', revenue: 3000, expenses: 1398 },
  { name: 'مارس', revenue: 2000, expenses: 9800 },
  { name: 'أبريل', revenue: 2780, expenses: 3908 },
  { name: 'مايو', revenue: 1890, expenses: 4800 },
  { name: 'يونيو', revenue: 2390, expenses: 3800 },
  { name: 'يوليو', revenue: 3490, expenses: 4300 },
];

const metrics = [
  {
    title: 'إجمالي الإيرادات',
    value: '45,231.89 ر.س',
    change: '+20.1%',
    trend: 'up',
    icon: DollarSign,
    color: 'bg-emerald-100 text-emerald-700',
  },
  {
    title: 'فواتير مستحقة',
    value: '12,053.00 ر.س',
    change: '+4.5%',
    trend: 'up',
    icon: Clock,
    color: 'bg-amber-100 text-amber-700',
  },
  {
    title: 'فواتير مدفوعة',
    value: '33,178.89 ر.س',
    change: '+15.2%',
    trend: 'up',
    icon: CheckCircle,
    color: 'bg-indigo-100 text-indigo-700',
  },
  {
    title: 'متأخرات',
    value: '2,300.00 ر.س',
    change: '-2.1%',
    trend: 'down',
    icon: ArrowDownRight,
    color: 'bg-rose-100 text-rose-700',
  },
];

export function Dashboard({ invoices = [] }: DashboardProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-stone-800">نظرة عامة</h2>
          <p className="text-xs text-stone-500 mt-1">ملخص أدائك المالي لهذا الشهر.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-stone-200 text-stone-600 rounded-md text-xs font-medium hover:bg-stone-50 transition-colors shadow-sm">
            تصدير تقرير
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-stone-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={cn("w-9 h-9 rounded-full flex items-center justify-center", metric.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className={cn(
                  "flex items-center text-xs font-bold",
                  metric.trend === 'up' ? "text-emerald-600" : "text-rose-600"
                )}>
                  {metric.change}
                  {metric.trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5 ms-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 ms-0.5" />}
                </div>
              </div>
              <h3 className="text-xs font-medium text-stone-500 mb-1">{metric.title}</h3>
              <p className="text-xl font-bold text-stone-900" dir="ltr">{metric.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-stone-100 shadow-sm">
          <h3 className="text-sm font-bold text-stone-800 mb-4">الإيرادات والمصروفات</h3>
          <div className="h-[250px]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#78716c', fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#78716c', fontSize: 11 }} />
                <Tooltip cursor={{ fill: '#fafaf9' }} contentStyle={{ borderRadius: '6px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                <Bar dataKey="revenue" fill="#d97706" radius={[4, 4, 0, 0]} name="إيرادات" />
                <Bar dataKey="expenses" fill="#fcd34d" radius={[4, 4, 0, 0]} name="مصروفات" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-100 shadow-sm">
          <h3 className="text-sm font-bold text-stone-800 mb-4">التدفق النقدي</h3>
          <div className="h-[250px]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#78716c', fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#78716c', fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '6px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="التدفق" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

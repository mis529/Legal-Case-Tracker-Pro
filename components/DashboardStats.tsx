
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Case, CaseType } from '../types';

interface DashboardStatsProps {
  cases: Case[];
  caseTypes: CaseType[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const DashboardStats: React.FC<DashboardStatsProps> = ({ cases, caseTypes }) => {
  const typeData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    cases.forEach(c => {
      const type = caseTypes.find(t => t.id === c.caseTypeId)?.name || 'Other';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [cases, caseTypes]);

  const directionData = React.useMemo(() => {
    const counts: Record<string, number> = { Plaintiff: 0, Defendant: 0 };
    cases.forEach(c => {
      counts[c.caseDirection]++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [cases]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Cases by Type</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={typeData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={100} fontSize={12} tick={{ fill: 'currentColor' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Case Direction</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={directionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {directionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.name === 'Plaintiff' ? '#10b981' : '#ef4444'} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;

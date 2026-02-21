
import React, { useMemo } from 'react';
import { Case, CaseType, Advocate } from '../types';
import CaseList from './CaseList';
import { PlusIcon, MoneyIcon, TrashIcon } from './icons';
import { motion } from 'motion/react';
import { LayoutDashboard } from 'lucide-react';

interface DashboardProps {
  cases: Case[];
  allCases: Case[];
  caseTypes: CaseType[];
  courtNames: string[];
  advocates: Advocate[];
  onAddCaseType: (name: string) => void;
  onSelectCase: (caseId: string) => void;
  onNewCase: () => void;
  filters: { caseTypeId: string; courtName: string; caseDirection: string; advocateId: string; hearingDate: string; };
  onFilterChange: React.Dispatch<React.SetStateAction<{ caseTypeId: string; courtName: string; caseDirection: string; advocateId: string; hearingDate: string; }>>;
}

const FilterSelect: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode }> = ({ label, value, onChange, children }) => (
    <div className="flex flex-col gap-1 w-full sm:w-auto">
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
            {label}
        </label>
        <select 
            value={value} 
            onChange={onChange} 
            className="w-full sm:min-w-[180px] text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3 transition-all"
        >
            {children}
        </select>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ cases, allCases, caseTypes, courtNames, advocates, onAddCaseType, onSelectCase, onNewCase, filters, onFilterChange }) => {
  const totalFees = useMemo(() => {
    return allCases.reduce((sum, c) => sum + c.feePayments.reduce((pSum, p) => pSum + p.amount, 0), 0);
  }, [allCases]);

  const handleFilter = (filterName: 'caseTypeId' | 'courtName' | 'caseDirection' | 'advocateId' | 'hearingDate') => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    onFilterChange(prev => ({...prev, [filterName]: e.target.value }));
  }

  const resetFilters = () => {
      onFilterChange({ caseTypeId: 'All', courtName: 'All', caseDirection: 'All', advocateId: 'All', hearingDate: '' });
  };

  const sortedCourtList = useMemo(() => {
    const counts: Record<string, number> = {};
    allCases.forEach(c => {
        counts[c.courtName] = (counts[c.courtName] || 0) + 1;
    });
    const list = courtNames.map(name => ({
        name,
        count: counts[name] || 0
    }));
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [allCases, courtNames]);

  const sortedCaseTypeList = useMemo(() => {
      const counts: Record<string, number> = {};
      allCases.forEach(c => {
          counts[c.caseTypeId] = (counts[c.caseTypeId] || 0) + 1;
      });
      return caseTypes.map(ct => ({
          ...ct,
          count: counts[ct.id] || 0
      })).sort((a, b) => a.name.localeCompare(b.name));
  }, [allCases, caseTypes]);

  const sortedAdvocateList = useMemo(() => {
      const counts: Record<string, number> = {};
      allCases.forEach(c => {
          if (c.advocateId) {
            counts[c.advocateId] = (counts[c.advocateId] || 0) + 1;
          }
      });
      return advocates.map(adv => ({
          ...adv,
          count: counts[adv.id] || 0
      })).sort((a, b) => a.name.localeCompare(b.name));
  }, [allCases, advocates]);

  const directionCounts = useMemo(() => {
      const counts: Record<string, number> = { 'Plaintiff': 0, 'Defendant': 0 };
      allCases.forEach(c => {
          counts[c.caseDirection] = (counts[c.caseDirection] || 0) + 1;
      });
      return counts;
  }, [allCases]);

  const hasActiveFilters = filters.caseTypeId !== 'All' || filters.courtName !== 'All' || filters.caseDirection !== 'All' || filters.advocateId !== 'All' || filters.hearingDate !== '';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-8 w-8 text-blue-600" />
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Case Dashboard</h2>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <p className="text-slate-500 dark:text-slate-400">
              Showing {cases.length} of {allCases.length} total cases.
            </p>
            <div className="flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded text-xs font-bold">
                <MoneyIcon className="h-3 w-3" />
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalFees)} Paid
            </div>
          </div>
        </div>
        <button
          onClick={onNewCase}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-md transition-all active:scale-95"
        >
          <PlusIcon className="h-5 w-5" />
          New Case
        </button>
      </div>

      <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm space-y-4">
          <div className="flex flex-wrap items-end gap-4">
              <FilterSelect label="Case Type" value={filters.caseTypeId} onChange={handleFilter('caseTypeId')}>
                <option value="All">All Types ({allCases.length})</option>
                {sortedCaseTypeList.map(ct => (
                    <option key={ct.id} value={ct.id}>
                        {ct.name} ({ct.count})
                    </option>
                ))}
              </FilterSelect>
              
              <FilterSelect label="Court Name" value={filters.courtName} onChange={handleFilter('courtName')}>
                <option value="All">All Courts ({allCases.length})</option>
                {sortedCourtList.map(court => (
                    <option key={court.name} value={court.name}>
                        {court.name} ({court.count})
                    </option>
                ))}
              </FilterSelect>
              
              <FilterSelect label="Advocate" value={filters.advocateId} onChange={handleFilter('advocateId')}>
                <option value="All">All Advocates ({allCases.length})</option>
                {sortedAdvocateList.map(adv => (
                    <option key={adv.id} value={adv.id}>
                        {adv.name} ({adv.count})
                    </option>
                ))}
              </FilterSelect>

              <FilterSelect label="Case Direction" value={filters.caseDirection} onChange={handleFilter('caseDirection')}>
                 <option value="All">All Directions ({allCases.length})</option>
                 <option value="Plaintiff">Plaintiff ({directionCounts['Plaintiff']})</option>
                 <option value="Defendant">Defendant ({directionCounts['Defendant']})</option>
              </FilterSelect>

              <div className="flex flex-col gap-1 w-full sm:w-auto">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                      Hearing Date
                  </label>
                  <input 
                      type="date"
                      value={filters.hearingDate}
                      onChange={handleFilter('hearingDate')}
                      className="w-full sm:min-w-[180px] text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3 transition-all"
                  />
              </div>

              {hasActiveFilters && (
                  <button 
                    onClick={resetFilters}
                    className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-red-500 py-3 px-2 transition-colors"
                  >
                      <TrashIcon className="h-3.5 w-3.5" />
                      CLEAR FILTERS
                  </button>
              )}
          </div>
      </div>

      <CaseList cases={cases} caseTypes={caseTypes} onSelectCase={onSelectCase} />
    </motion.div>
  );
};

export default Dashboard;

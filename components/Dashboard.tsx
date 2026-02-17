
import React, { useMemo, useState } from 'react';
import { Case, CaseType } from '../types';
import CaseList from './CaseList';
import { PlusIcon, MoneyIcon } from './icons';

interface DashboardProps {
  cases: Case[];
  allCases: Case[];
  caseTypes: CaseType[];
  onAddCaseType: (name: string) => void;
  onSelectCase: (caseId: string) => void;
  onNewCase: () => void;
  filters: { caseTypeId: string; courtName: string; caseDirection: string; };
  onFilterChange: React.Dispatch<React.SetStateAction<{ caseTypeId: string; courtName: string; caseDirection: string; }>>;
}

const FilterSelect: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode }> = ({ label, value, onChange, children }) => (
    <div>
        <label className="sr-only">{label}</label>
        <select value={value} onChange={onChange} className="w-full sm:w-auto text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 py-2 px-3">
            {children}
        </select>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ cases, allCases, caseTypes, onAddCaseType, onSelectCase, onNewCase, filters, onFilterChange }) => {
  const [newCaseTypeName, setNewCaseTypeName] = useState('');

  const upcomingCases = cases.filter(c => new Date(c.nextHearingDate) >= new Date()).length;
  
  const totalFees = useMemo(() => {
    return allCases.reduce((sum, c) => sum + c.feePayments.reduce((pSum, p) => pSum + p.amount, 0), 0);
  }, [allCases]);

  const handleFilter = (filterName: 'caseTypeId' | 'courtName' | 'caseDirection') => (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange(prev => ({...prev, [filterName]: e.target.value }));
  }

  const handleAddCaseType = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCaseTypeName.trim()) {
        onAddCaseType(newCaseTypeName.trim());
        setNewCaseTypeName('');
    }
  }

  const courtNames = useMemo(() => [...new Set(allCases.map(c => c.courtName))], [allCases]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Case Dashboard</h2>
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
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all active:scale-95"
        >
          <PlusIcon className="h-5 w-5" />
          New Case
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0">Filters</h3>
              <FilterSelect label="Case Type" value={filters.caseTypeId} onChange={handleFilter('caseTypeId')}>
                <option value="All">All Case Types</option>
                {caseTypes.map(ct => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
              </FilterSelect>
              <FilterSelect label="Court Name" value={filters.courtName} onChange={handleFilter('courtName')}>
                <option value="All">All Court Names</option>
                {courtNames.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </FilterSelect>
              <FilterSelect label="Case Direction" value={filters.caseDirection} onChange={handleFilter('caseDirection')}>
                 <option value="All">All Directions</option>
                 <option value="Plaintiff">Plaintiff</option>
                 <option value="Defendant">Defendant</option>
              </FilterSelect>
          </div>
      </div>

      <CaseList cases={cases} caseTypes={caseTypes} onSelectCase={onSelectCase} />
    </div>
  );
};

export default Dashboard;

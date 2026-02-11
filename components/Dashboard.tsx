
import React, { useMemo, useState } from 'react';
import { Case, CaseType } from '../types';
import CaseList from './CaseList';
import { PlusIcon } from './icons';

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
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Showing {cases.length} of {allCases.length} total cases. {upcomingCases} have upcoming hearings.
          </p>
        </div>
        <button
          onClick={onNewCase}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
        >
          <PlusIcon className="h-5 w-5" />
          New Case
        </button>
      </div>

      <div className="p-4 bg-slate-200/50 dark:bg-slate-800/50 rounded-lg space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
              <h3 className="text-md font-semibold text-slate-700 dark:text-slate-300 shrink-0">Filters:</h3>
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
           <div className="border-t border-slate-300 dark:border-slate-700 pt-4">
                <form onSubmit={handleAddCaseType} className="flex flex-col sm:flex-row items-center gap-4">
                    <h3 className="text-md font-semibold text-slate-700 dark:text-slate-300 shrink-0">Manage:</h3>
                    <input 
                        type="text" 
                        value={newCaseTypeName}
                        onChange={(e) => setNewCaseTypeName(e.target.value)}
                        placeholder="Add new case type" 
                        className="w-full sm:w-auto text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 py-2 px-3"
                    />
                    <button type="submit" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg text-sm">
                        <PlusIcon className="h-4 w-4" />
                        Add Type
                    </button>
                </form>
            </div>
      </div>

      <CaseList cases={cases} caseTypes={caseTypes} onSelectCase={onSelectCase} />
    </div>
  );
};

export default Dashboard;

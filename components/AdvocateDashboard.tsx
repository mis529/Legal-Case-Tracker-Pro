
import React from 'react';
import { Advocate } from '../types';
import AdvocateList from './AdvocateList';
import { PlusIcon } from './icons';

interface AdvocateDashboardProps {
  advocates: Advocate[];
  onSelectAdvocate: (advocateId: string) => void;
  onNewAdvocate: () => void;
}

const AdvocateDashboard: React.FC<AdvocateDashboardProps> = ({ advocates, onSelectAdvocate, onNewAdvocate }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Advocates</h2>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            You are working with {advocates.length} advocates.
          </p>
        </div>
        <button
          onClick={onNewAdvocate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
        >
          <PlusIcon className="h-5 w-5" />
          New Advocate
        </button>
      </div>

      <AdvocateList advocates={advocates} onSelectAdvocate={onSelectAdvocate} />
    </div>
  );
};

export default AdvocateDashboard;

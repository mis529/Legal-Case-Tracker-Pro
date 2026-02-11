
import React from 'react';
import { Advocate } from '../types';
import AdvocateCard from './AdvocateCard';

interface AdvocateListProps {
  advocates: Advocate[];
  onSelectAdvocate: (advocateId: string) => void;
}

const AdvocateList: React.FC<AdvocateListProps> = ({ advocates, onSelectAdvocate }) => {
  if (advocates.length === 0) {
    return (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">No Advocates Found</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Add a new case to assign an advocate.</p>
        </div>
    )
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {advocates.map(advocate => (
        <AdvocateCard key={advocate.id} advocate={advocate} onSelectAdvocate={onSelectAdvocate} />
      ))}
    </div>
  );
};

export default AdvocateList;


import React from 'react';
import { Advocate } from '../types';
import { UserIcon } from './icons';

interface AdvocateCardProps {
  advocate: Advocate;
  onSelectAdvocate: (advocateId: string) => void;
}

const AdvocateCard: React.FC<AdvocateCardProps> = ({ advocate, onSelectAdvocate }) => {
  return (
    <div
      onClick={() => onSelectAdvocate(advocate.id)}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-transparent hover:border-blue-500 overflow-hidden transform hover:-translate-y-1"
    >
      <div className="p-6 flex items-center gap-4">
        <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
            <UserIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white truncate" title={advocate.name}>
              {advocate.name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{advocate.email || 'No email provided'}</p>
        </div>
      </div>
    </div>
  );
};

export default AdvocateCard;

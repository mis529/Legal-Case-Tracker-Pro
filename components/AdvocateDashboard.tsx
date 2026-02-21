
import React from 'react';
import { Advocate } from '../types';
import AdvocateList from './AdvocateList';
import { Plus, Users } from 'lucide-react';
import { motion } from 'motion/react';

interface AdvocateDashboardProps {
  advocates: Advocate[];
  onSelectAdvocate: (advocateId: string) => void;
  onNewAdvocate: () => void;
}

const AdvocateDashboard: React.FC<AdvocateDashboardProps> = ({ advocates, onSelectAdvocate, onNewAdvocate }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-8 w-8 text-blue-600" />
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Advocates</h2>
          </div>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            You are working with {advocates.length} advocates.
          </p>
        </div>
        <button
          onClick={onNewAdvocate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all active:scale-95"
        >
          <Plus className="h-5 w-5" />
          New Advocate
        </button>
      </div>

      <AdvocateList advocates={advocates} onSelectAdvocate={onSelectAdvocate} />
    </motion.div>
  );
};

export default AdvocateDashboard;

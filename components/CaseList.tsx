
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Case, CaseType } from '../types';
import CaseCard from './CaseCard';

interface CaseListProps {
  cases: Case[];
  caseTypes: CaseType[];
  onSelectCase: (caseId: string) => void;
}

const CaseList: React.FC<CaseListProps> = ({ cases, caseTypes, onSelectCase }) => {
  if (cases.length === 0) {
    return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg shadow"
        >
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">No Cases Found</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Adjust your filters or click "New Case" to get started.</p>
        </motion.div>
    )
  }
  
  const sortedCases = [...cases].sort((a, b) => new Date(a.nextHearingDate).getTime() - new Date(b.nextHearingDate).getTime());

  return (
    <motion.div 
      layout
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <AnimatePresence mode="popLayout">
        {sortedCases.map((caseItem, index) => (
          <motion.div
            key={caseItem.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: index * 0.05 }}
            layout
          >
            <CaseCard caseData={caseItem} caseTypes={caseTypes} onSelectCase={onSelectCase} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default CaseList;

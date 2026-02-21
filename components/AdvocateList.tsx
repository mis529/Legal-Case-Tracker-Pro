
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Advocate } from '../types';
import AdvocateCard from './AdvocateCard';

interface AdvocateListProps {
  advocates: Advocate[];
  onSelectAdvocate: (advocateId: string) => void;
}

const AdvocateList: React.FC<AdvocateListProps> = ({ advocates, onSelectAdvocate }) => {
  if (advocates.length === 0) {
    return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg shadow"
        >
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">No Advocates Found</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Add a new case to assign an advocate.</p>
        </motion.div>
    )
  }
  
  return (
    <motion.div 
      layout
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <AnimatePresence mode="popLayout">
        {advocates.map((advocate, index) => (
          <motion.div
            key={advocate.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: index * 0.05 }}
            layout
          >
            <AdvocateCard advocate={advocate} onSelectAdvocate={onSelectAdvocate} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdvocateList;

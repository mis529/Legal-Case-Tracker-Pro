
import React from 'react';
import { Advocate } from '../types';
import { User } from 'lucide-react';
import { motion } from 'motion/react';

interface AdvocateCardProps {
  advocate: Advocate;
  onSelectAdvocate: (advocateId: string) => void;
}

const AdvocateCard: React.FC<AdvocateCardProps> = ({ advocate, onSelectAdvocate }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      onClick={() => onSelectAdvocate(advocate.id)}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-transparent hover:border-blue-500 overflow-hidden"
    >
      <div className="p-6 flex items-center gap-4">
        <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
            <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white truncate" title={advocate.name}>
              {advocate.name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{advocate.email || 'No email provided'}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default AdvocateCard;

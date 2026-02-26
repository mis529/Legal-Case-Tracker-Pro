
import React from 'react';
import { Case, CaseType } from '../types';
import { Calendar, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface CaseCardProps {
  caseData: Case;
  caseTypes: CaseType[];
  onSelectCase: (caseId: string) => void;
}

const CaseCard: React.FC<CaseCardProps> = ({ caseData, caseTypes, onSelectCase }) => {
  const hearingDate = new Date(caseData.nextHearingDate);
  const now = new Date();
  const isPastHearing = hearingDate < new Date(now.toDateString());

  const timeDiff = hearingDate.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  let dateBadgeColor = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
  let dateText = `${daysDiff} days`;

  if (isPastHearing) {
    dateBadgeColor = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    dateText = 'Passed';
  } else if (daysDiff === 0) {
    dateBadgeColor = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    dateText = 'Today';
  } else if (daysDiff === 1) {
    dateBadgeColor = 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    dateText = 'Tomorrow';
  } else if (daysDiff <= 7) {
    dateBadgeColor = 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
  }

  const DirectionIcon = caseData.caseDirection === 'Plaintiff' ? ArrowUpRight : ArrowDownLeft;
  const directionColor = caseData.caseDirection === 'Plaintiff' ? 'text-green-500' : 'text-red-500';

  const caseTypeName = caseTypes.find(ct => ct.id === caseData.caseTypeId)?.name || 'Unknown Type';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      onClick={() => onSelectCase(caseData.id)}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-transparent hover:border-blue-500 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex justify-between items-start">
            <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">
                {caseTypeName}
            </span>
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md ${dateBadgeColor}`}>
              <Calendar className="h-4 w-4" />
              {dateText}
            </span>
        </div>
        <div className="flex items-center gap-2 mt-4">
             <DirectionIcon className={`h-5 w-5 ${directionColor}`} />
             <h3 className="text-xl font-bold text-slate-800 dark:text-white truncate" title={caseData.partyName}>
              {caseData.partyName}
            </h3>
        </div>
       
        <p className="mt-1 text-slate-500 dark:text-slate-400 truncate" title={caseData.courtName}>
          {caseData.courtName}
        </p>

        <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Next Hearing</p>
            <p className="text-md font-semibold text-slate-800 dark:text-white">{hearingDate.toLocaleDateString()}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default CaseCard;


import React, { useMemo, useState } from 'react';
import { Advocate, Case, FeePayment } from '../types';
import { BackIcon, UserIcon, MoneyIcon, ChevronRightIcon, EditIcon, TrashIcon, PlusIcon } from './icons';
import AddPaymentModal from './AddPaymentModal';

interface AdvocateDetailProps {
  advocate: Advocate;
  cases: Case[];
  onBack: () => void;
  onNavigateToCase: (caseId: string) => void;
  onEdit: (advocate: Advocate) => void;
  onDelete: (advocateId: string) => void;
  onAddPayment: (caseId: string, payment: Omit<FeePayment, 'id'>) => void;
}

const InfoCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg flex items-center gap-3">
    <div className="text-slate-400">{icon}</div>
    <div>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="font-semibold text-slate-700 dark:text-slate-200">{value}</p>
    </div>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode, actions?: React.ReactNode }> = ({ title, children, actions }) => (
    <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
          {actions}
        </div>
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
          {children}
        </div>
    </div>
);


const AdvocateDetail: React.FC<AdvocateDetailProps> = ({ advocate, cases, onBack, onNavigateToCase, onEdit, onDelete, onAddPayment }) => {
    const [isAddingPayment, setIsAddingPayment] = useState(false);

    const feeSummary = useMemo(() => {
        const allPayments = cases.flatMap(c => c.feePayments);
        const lifetimeTotal = allPayments.reduce((sum, p) => sum + p.amount, 0);

        const monthlyTotals = allPayments.reduce((acc, payment) => {
            const monthYear = new Date(payment.date).toLocaleString('default', { month: 'long', year: 'numeric' });
            acc[monthYear] = (acc[monthYear] || 0) + payment.amount;
            return acc;
        }, {} as Record<string, number>);

        return { lifetimeTotal, monthlyTotals };
    }, [cases]);
    
    const handleSavePayment = (caseId: string, payment: Omit<FeePayment, 'id'>) => {
        onAddPayment(caseId, payment);
        setIsAddingPayment(false);
    }

  return (
    <>
    <div className="bg-white dark:bg-slate-800/50 p-6 sm:p-8 rounded-2xl shadow-lg animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{advocate.name}</h2>
          <p className="mt-1 text-slate-500 dark:text-slate-400">{advocate.email}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={onBack} className="flex items-center gap-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-2 px-4 rounded-lg transition-colors">
            <BackIcon className="h-5 w-5" />
            Back
          </button>
           <button onClick={() => onEdit(advocate)} className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
            <EditIcon className="h-5 w-5" />
            Edit
          </button>
           <button onClick={() => { if(window.confirm('Are you sure you want to delete this advocate?')) onDelete(advocate.id) }} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        <InfoCard icon={<UserIcon />} label="Phone" value={advocate.phone || 'N/A'} />
        <InfoCard icon={<MoneyIcon />} label="Cases Assigned" value={cases.length.toString()} />
        <InfoCard icon={<MoneyIcon />} label="Lifetime Fees Paid" value={new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(feeSummary.lifetimeTotal)} />
      </div>

       <Section 
          title="Fee Summary (Monthly)"
          actions={
            <button onClick={() => setIsAddingPayment(true)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-lg text-sm transition-colors">
              <PlusIcon className="h-4 w-4" />
              Add Payment
            </button>
          }
        >
            <div className="space-y-2">
                {Object.entries(feeSummary.monthlyTotals).length > 0 ? Object.entries(feeSummary.monthlyTotals).map(([month, total]) => (
                    <div key={month} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                        <span className="font-medium text-slate-600 dark:text-slate-300">{month}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(total)}</span>
                    </div>
                )) : <p className="text-center text-slate-500 py-4">No payments recorded.</p>}
            </div>
       </Section>

       <Section title={`Cases Handled (${cases.length})`}>
          <div className="flow-root">
              <ul role="list" className="-my-2 divide-y divide-slate-200 dark:divide-slate-700">
                  {cases.map(caseItem => (
                      <li key={caseItem.id}>
                        <button onClick={() => onNavigateToCase(caseItem.id)} className="w-full flex items-center justify-between py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 px-2 -mx-2 rounded-md transition-colors">
                            <div>
                                <p className="font-medium text-slate-800 dark:text-slate-200">{caseItem.caseNumber}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{caseItem.courtName}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <p className="hidden sm:block text-sm text-slate-500 dark:text-slate-400">Next Hearing: {new Date(caseItem.nextHearingDate).toLocaleDateString()}</p>
                                <ChevronRightIcon className="h-5 w-5 text-slate-400" />
                            </div>
                        </button>
                      </li>
                  ))}
                  {cases.length === 0 && <li className="text-center text-slate-500 py-4">No cases assigned to this advocate yet.</li>}
              </ul>
          </div>
      </Section>

    </div>
    <AddPaymentModal
      show={isAddingPayment}
      onClose={() => setIsAddingPayment(false)}
      onSave={handleSavePayment}
      advocate={advocate}
      cases={cases}
    />
    </>
  );
};

export default AdvocateDetail;


import React, { useState, useEffect } from 'react';
import { Advocate, Case, FeePayment } from '../types';

interface AddPaymentModalProps {
    show: boolean;
    onClose: () => void;
    onSave: (caseId: string, payment: Omit<FeePayment, 'id'>) => void;
    advocate: Advocate;
    cases: Case[];
}

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        <input {...props} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
    </div>
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }> = ({ label, children, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        <select {...props} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
            {children}
        </select>
    </div>
);

const AddPaymentModal: React.FC<AddPaymentModalProps> = ({ show, onClose, onSave, advocate, cases }) => {
    const [caseId, setCaseId] = useState<string>('');
    const [amount, setAmount] = useState<number>(0);
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState<string>('');

    useEffect(() => {
        // Pre-select the first case if available when the modal opens
        if (show && cases.length > 0) {
            setCaseId(cases[0].id);
        }
        // Reset form when modal is closed
        if (!show) {
            setAmount(0);
            setDate(new Date().toISOString().split('T')[0]);
            setNotes('');
        }
    }, [show, cases]);

    if (!show) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!caseId || amount <= 0) {
            alert("Please select a case and enter a valid amount.");
            return;
        }
        onSave(caseId, { amount, date: new Date(date).toISOString(), notes });
    };

    return (
        <div 
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 id="modal-title" className="text-xl font-bold text-slate-900 dark:text-white">
                        Add Payment for {advocate.name}
                    </h2>
                </div>
                {cases.length > 0 ? (
                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-4">
                            <Select label="Assign to Case" value={caseId} onChange={(e) => setCaseId(e.target.value)} required>
                                {cases.map(c => (
                                    <option key={c.id} value={c.id}>{c.caseNumber} - {c.courtName}</option>
                                ))}
                            </Select>
                            <Input 
                                label="Amount (INR)" 
                                type="number" 
                                value={amount} 
                                onChange={(e) => setAmount(Number(e.target.value))} 
                                required
                                min="1"
                            />
                            <Input 
                                label="Payment Date" 
                                type="date" 
                                value={date} 
                                onChange={(e) => setDate(e.target.value)} 
                                required 
                            />
                            <Input 
                                label="Notes (Optional)" 
                                type="text" 
                                value={notes} 
                                onChange={(e) => setNotes(e.target.value)} 
                                placeholder="e.g., Retainer fee"
                            />
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 rounded-b-xl">
                            <button type="button" onClick={onClose} className="bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-800 dark:text-slate-200 font-bold py-2 px-4 rounded-lg">Cancel</button>
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Save Payment</button>
                        </div>
                    </form>
                ) : (
                    <div className="p-6 text-center">
                        <p className="text-slate-600 dark:text-slate-400">This advocate has no cases assigned.</p>
                        <p className="text-sm text-slate-500 mt-1">Please assign a case before adding a payment.</p>
                        <button onClick={onClose} className="mt-4 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-800 dark:text-slate-200 font-bold py-2 px-4 rounded-lg">Close</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddPaymentModal;

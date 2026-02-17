
import React, { useState, useCallback } from 'react';
import { Case, CaseType, FeePayment, Advocate, CaseDirection } from '../types';
import { suggestCourseOfAction } from '../services/geminiService';
import { SparklesIcon, TrashIcon, PlusIcon } from './icons';

interface CaseFormProps {
  initialData: Case | null;
  advocates: Advocate[];
  caseTypes: CaseType[];
  courtNames: string[];
  onSave: (caseData: Case) => void;
  onCancel: () => void;
}

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        <input {...props} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
    </div>
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        <textarea {...props} rows={4} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"></textarea>
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

const CaseForm: React.FC<CaseFormProps> = ({ initialData, advocates, caseTypes, courtNames, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Omit<Case, 'id' | 'createdAt'>>(() => initialData ? { ...initialData } : {
        caseNumber: '',
        caseTypeId: caseTypes[0]?.id || '',
        courtName: '',
        nextHearingDate: new Date().toISOString().split('T')[0],
        courseOfAction: '',
        advocateId: advocates[0]?.id || '',
        caseDirection: 'Plaintiff',
        personAppearing: '',
        advocateComments: '',
        feePayments: [],
    });
    
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isCustomCourt, setIsCustomCourt] = useState(false);

    // Fixed: Logic for handling special "CUSTOM_ENTRY" dropdown selection moved here.
    // This avoids render-time state updates which caused the 'void' type error and performance issues.
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'courtName' && value === 'CUSTOM_ENTRY') {
            setIsCustomCourt(true);
            setFormData(prev => ({ ...prev, courtName: '' }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: new Date(value).toISOString()}));
    };

    const handleFeeChange = (index: number, field: keyof FeePayment, value: string | number) => {
        const newPayments = [...formData.feePayments];
        (newPayments[index] as any)[field] = field === 'amount' ? Number(value) : value;
        setFormData(prev => ({...prev, feePayments: newPayments }));
    };

    const addFeePayment = () => {
        const newPayment: FeePayment = { id: crypto.randomUUID(), amount: 0, date: new Date().toISOString(), notes: '' };
        setFormData(prev => ({ ...prev, feePayments: [...prev.feePayments, newPayment] }));
    };

    const removeFeePayment = (index: number) => {
        const newPayments = formData.feePayments.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, feePayments: newPayments }));
    };

    const handleGetSuggestions = useCallback(async () => {
        setIsSuggesting(true);
        setSuggestions([]);
        const caseTypeName = caseTypes.find(ct => ct.id === formData.caseTypeId)?.name || 'a case';
        try {
            const result = await suggestCourseOfAction(caseTypeName);
            setSuggestions(result);
        } catch (error) {
            console.error("Error getting suggestions:", error);
            alert("Could not fetch suggestions. Please try again later.");
        } finally {
            setIsSuggesting(false);
        }
    }, [formData.caseTypeId, caseTypes]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const caseToSave: Case = {
            ...formData,
            id: initialData?.id || crypto.randomUUID(),
            createdAt: initialData?.createdAt || new Date().toISOString(),
        };
        onSave(caseToSave);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800/50 p-6 sm:p-8 rounded-2xl shadow-lg space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{initialData ? 'Edit Case' : 'Create New Case'}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Case Number" name="caseNumber" value={formData.caseNumber} onChange={handleChange} required />
                <Select label="Case Type" name="caseTypeId" value={formData.caseTypeId} onChange={handleChange}>
                    {caseTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
                </Select>
                
                <div className="relative">
                    {!isCustomCourt && courtNames.length > 0 ? (
                        <div className="flex flex-col">
                            <Select label="Court Name" name="courtName" value={formData.courtName} onChange={handleChange} required>
                                <option value="">Select Court</option>
                                {courtNames.map(court => <option key={court} value={court}>{court}</option>)}
                                <option value="CUSTOM_ENTRY">+ Add Other Court</option>
                            </Select>
                            <button 
                                type="button" 
                                onClick={() => setIsCustomCourt(true)} 
                                className="text-[10px] text-blue-500 text-left mt-1 hover:underline"
                            >
                                Can't find court? Click here.
                            </button>
                        </div>
                    ) : (
                        <div>
                            <Input label="Court Name" name="courtName" value={formData.courtName} onChange={handleChange} required />
                            {courtNames.length > 0 && (
                                <button 
                                    type="button" 
                                    onClick={() => setIsCustomCourt(false)} 
                                    className="text-[10px] text-blue-500 text-left mt-1 hover:underline"
                                >
                                    Back to list
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <Input label="Next Hearing Date" name="nextHearingDate" type="date" value={new Date(formData.nextHearingDate).toISOString().split('T')[0]} onChange={handleDateChange} required />
                <Select label="Advocate" name="advocateId" value={formData.advocateId} onChange={handleChange} required>
                    <option value="">Select Advocate</option>
                    {advocates.map(adv => <option key={adv.id} value={adv.id}>{adv.name}</option>)}
                </Select>
                 <Select label="Case Direction" name="caseDirection" value={formData.caseDirection} onChange={handleChange} required>
                    <option value="Plaintiff">Plaintiff (You initiated)</option>
                    <option value="Defendant">Defendant (Against you)</option>
                </Select>
                <div className="md:col-span-2">
                    <Input label="Person Appearing" name="personAppearing" value={formData.personAppearing} onChange={handleChange} />
                </div>
            </div>
            
            <div>
              <Textarea label="Course of Action" name="courseOfAction" value={formData.courseOfAction} onChange={handleChange} required />
              <div className="mt-2 flex items-start flex-wrap gap-2">
                <button type="button" onClick={handleGetSuggestions} disabled={isSuggesting} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-1.5 px-3 rounded-md text-sm transition-colors disabled:bg-violet-400">
                    <SparklesIcon className="h-4 w-4" />
                    {isSuggesting ? 'Thinking...' : 'AI Suggestions'}
                </button>
                 {suggestions.map((s, i) => (
                    <button key={i} type="button" onClick={() => setFormData(prev => ({...prev, courseOfAction: prev.courseOfAction + (prev.courseOfAction ? '\n' : '') + `- ${s}`}))} className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-sm py-1 px-2 rounded-md">
                        {s}
                    </button>
                ))}
              </div>
            </div>

            <Textarea label="Advocate's Comments" name="advocateComments" value={formData.advocateComments} onChange={handleChange} />

            <div>
                <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-200">Fee Payments</h3>
                <div className="space-y-4">
                    {formData.feePayments.map((payment, index) => (
                        <div key={payment.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                            <div className="sm:col-span-3">
                                <Input label="Amount (INR)" type="number" value={payment.amount} onChange={(e) => handleFeeChange(index, 'amount', e.target.value)} />
                            </div>
                            <div className="sm:col-span-3">
                                <Input label="Date" type="date" value={new Date(payment.date).toISOString().split('T')[0]} onChange={(e) => handleFeeChange(index, 'date', new Date(e.target.value).toISOString())} />
                            </div>
                            <div className="sm:col-span-5">
                                <Input label="Notes" type="text" value={payment.notes || ''} onChange={(e) => handleFeeChange(index, 'notes', e.target.value)} />
                            </div>
                            <div className="sm:col-span-1 flex items-end h-full">
                                <button type="button" onClick={() => removeFeePayment(index)} className="mt-5 sm:mt-0 w-full h-[42px] flex justify-center items-center bg-red-500 hover:bg-red-600 text-white rounded-md">
                                  <TrashIcon className="h-5 w-5"/>
                                </button>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={addFeePayment} className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                        <PlusIcon className="h-5 w-5" />
                        Add Payment
                    </button>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={onCancel} className="bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-800 dark:text-slate-200 font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Save Case</button>
            </div>
        </form>
    );
};

export default CaseForm;

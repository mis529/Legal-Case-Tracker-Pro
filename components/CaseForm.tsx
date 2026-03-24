
import React, { useState, useCallback, useRef } from 'react';
import { Case, CaseType, FeePayment, Advocate, CaseDirection } from '../types';
import { suggestCourseOfAction } from '../services/geminiService';
import { SparklesIcon, TrashIcon, PlusIcon, FileIcon, CloudIcon } from './icons';
import { motion, AnimatePresence } from 'motion/react';
import { uploadFileToDrive } from '../services/googleSheetsService';

interface CaseFormProps {
  initialData: Case | null;
  advocates: Advocate[];
  caseTypes: CaseType[];
  courtNames: string[];
  onSave: (caseData: Case) => void;
  onCancel: () => void;
  onAddCaseType: (name: string) => string;
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

const CaseForm: React.FC<CaseFormProps> = ({ initialData, advocates, caseTypes, courtNames, onSave, onCancel, onAddCaseType }) => {
    const [formData, setFormData] = useState<Omit<Case, 'id' | 'createdAt'>>(() => initialData ? { 
        ...initialData,
        status: initialData.status || 'Ongoing'
    } : {
        partyName: '',
        caseTypeId: caseTypes[0]?.id || '',
        courtName: '',
        nextHearingDate: new Date().toISOString().split('T')[0],
        courseOfAction: '',
        advocateId: advocates[0]?.id || '',
        caseDirection: 'Plaintiff',
        personAppearing: '',
        advocateComments: '',
        feePayments: [],
        documentUrls: [],
        status: 'Ongoing',
        closingDate: '',
    });
    
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isCustomCourt, setIsCustomCourt] = useState(false);
    const [isCustomCaseType, setIsCustomCaseType] = useState(false);
    const [customCaseTypeName, setCustomCaseTypeName] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'courtName' && value === 'CUSTOM_ENTRY') {
            setIsCustomCourt(true);
            setFormData(prev => ({ ...prev, courtName: '' }));
        } else if (name === 'caseTypeId' && value === 'CUSTOM_TYPE_ENTRY') {
            setIsCustomCaseType(true);
            setFormData(prev => ({ ...prev, caseTypeId: '' }));
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (!formData.partyName) {
            alert("Please enter a Party Name first before uploading documents.");
            return;
        }

        setIsUploading(true);
        try {
            const uploadPromises = Array.from(files).map(file => uploadFileToDrive(file, formData.partyName));
            const uploadedDocs = await Promise.all(uploadPromises);
            
            setFormData(prev => ({ 
                ...prev, 
                documentUrls: [...(prev.documentUrls || []), ...uploadedDocs] 
            }));
            alert(`${files.length} file(s) uploaded successfully!`);
        } catch (error: any) {
            console.error('Upload failed:', error);
            alert(`Upload failed: ${error.message || 'Unknown error'}. Please ensure your Apps Script is deployed as a Web App with 'Anyone' access and you have used the correct Script URL.`);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeDocument = (index: number) => {
        setFormData(prev => ({
            ...prev,
            documentUrls: (prev.documentUrls || []).filter((_, i) => i !== index)
        }));
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
        
        let finalTypeId = formData.caseTypeId;
        if (isCustomCaseType && customCaseTypeName.trim()) {
            finalTypeId = onAddCaseType(customCaseTypeName);
        }

        const caseToSave: Case = {
            ...formData,
            caseTypeId: finalTypeId,
            id: initialData?.id || crypto.randomUUID(),
            createdAt: initialData?.createdAt || new Date().toISOString(),
        };
        onSave(caseToSave);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800/50 p-6 sm:p-8 rounded-2xl shadow-lg space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{initialData ? 'Edit Case' : 'Create New Case'}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Party Name" name="partyName" value={formData.partyName} onChange={handleChange} required />
                
                <div className="relative">
                    {!isCustomCaseType ? (
                        <div className="flex flex-col">
                            <Select label="Case Type" name="caseTypeId" value={formData.caseTypeId} onChange={handleChange} required>
                                <option value="">Select Case Type</option>
                                {caseTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
                                <option value="CUSTOM_TYPE_ENTRY">+ Add Other Case Type</option>
                            </Select>
                            <button 
                                type="button" 
                                onClick={() => setIsCustomCaseType(true)} 
                                className="text-[10px] text-blue-500 text-left mt-1 hover:underline"
                            >
                                New category? Click here.
                            </button>
                        </div>
                    ) : (
                        <div>
                            <Input label="Custom Case Type" name="customCaseType" value={customCaseTypeName} onChange={(e) => setCustomCaseTypeName(e.target.value)} required />
                            <button 
                                type="button" 
                                onClick={() => setIsCustomCaseType(false)} 
                                className="text-[10px] text-blue-500 text-left mt-1 hover:underline"
                            >
                                Back to list
                            </button>
                        </div>
                    )}
                </div>
                
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
                <Select label="Case Status" name="status" value={formData.status} onChange={handleChange} required>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Closed">Closed</option>
                </Select>
                {formData.status === 'Closed' && (
                    <Input 
                        label="Closing Date" 
                        name="closingDate" 
                        type="date" 
                        value={formData.closingDate ? new Date(formData.closingDate).toISOString().split('T')[0] : ''} 
                        onChange={handleDateChange} 
                        required 
                    />
                )}
                <div className="md:col-span-2">
                    <Input label="Person Appearing" name="personAppearing" value={formData.personAppearing} onChange={handleChange} />
                </div>
            </div>
            
            <div>
              <Textarea label="Course of Action" name="courseOfAction" value={formData.courseOfAction} onChange={handleChange} required />
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                    <button 
                        type="button" 
                        onClick={handleGetSuggestions} 
                        disabled={isSuggesting} 
                        className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold py-2 px-4 rounded-lg text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    >
                        <SparklesIcon className={`h-4 w-4 ${isSuggesting ? 'animate-pulse' : ''}`} />
                        {isSuggesting ? 'Analyzing Case...' : 'Get AI Strategic Suggestions'}
                    </button>
                    {suggestions.length > 0 && (
                        <button 
                            type="button" 
                            onClick={() => setSuggestions([])} 
                            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            Clear Suggestions
                        </button>
                    )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                    <AnimatePresence>
                        {suggestions.map((s, i) => (
                            <motion.button 
                                key={i} 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: i * 0.1 }}
                                type="button" 
                                onClick={() => {
                                    setFormData(prev => ({...prev, courseOfAction: prev.courseOfAction + (prev.courseOfAction ? '\n' : '') + `- ${s}`}));
                                    setSuggestions(prev => prev.filter((_, idx) => idx !== i));
                                }} 
                                className="group relative bg-slate-100 dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-700 text-slate-700 dark:text-slate-300 text-xs py-2 px-3 rounded-lg text-left transition-all max-w-xs"
                            >
                                <span className="block pr-4">{s}</span>
                                <PlusIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                            </motion.button>
                        ))}
                    </AnimatePresence>
                </div>
              </div>
            </div>

            <Textarea label="Advocate's Comments" name="advocateComments" value={formData.advocateComments} onChange={handleChange} />

            <div>
                <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-200">Case Documents</h3>
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 text-slate-500">
                                <CloudIcon className="h-6 w-6" />
                                <p className="text-sm">Upload one or more documents for this case.</p>
                            </div>
                        </div>
                        <div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileUpload} 
                                className="hidden" 
                                multiple
                            />
                            <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                                    isUploading 
                                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                            >
                                {isUploading ? 'Uploading...' : 'Upload Documents'}
                            </button>
                        </div>
                    </div>

                    {formData.documentUrls && formData.documentUrls.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {formData.documentUrls.map((doc, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-sm">
                                    <div className="flex items-center gap-3 truncate mr-2">
                                        <FileIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                        <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[150px]" title={doc.name}>
                                            {doc.name}
                                        </span>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => removeDocument(index)}
                                        className="text-red-500 hover:text-red-700 p-1 transition-colors"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

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
                <button 
                    type="submit" 
                    disabled={isUploading}
                    className={`font-bold py-2 px-4 rounded-lg transition-all ${
                        isUploading 
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                >
                    {isUploading ? 'Uploading...' : 'Save Case'}
                </button>
            </div>
        </form>
    );
};

export default CaseForm;

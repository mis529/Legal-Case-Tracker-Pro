
import React, { useState } from 'react';
import { Advocate } from '../types';

interface AdvocateFormProps {
  initialData: Advocate | null;
  onSave: (advocate: Advocate) => void;
  onCancel: () => void;
}

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        <input {...props} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
    </div>
);


const AdvocateForm: React.FC<AdvocateFormProps> = ({ initialData, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Omit<Advocate, 'id'>>(() => initialData ? { ...initialData } : {
        name: '',
        email: '',
        phone: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const advocateToSave: Advocate = {
            ...formData,
            id: initialData?.id || `adv-${Date.now()}`,
        };
        onSave(advocateToSave);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800/50 p-6 sm:p-8 rounded-2xl shadow-lg space-y-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{initialData ? 'Edit Advocate' : 'Create New Advocate'}</h2>
            
            <div className="space-y-4">
                <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} required />
                <Input label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} />
                <Input label="Phone Number" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={onCancel} className="bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-800 dark:text-slate-200 font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Save Advocate</button>
            </div>
        </form>
    );
};

export default AdvocateForm;

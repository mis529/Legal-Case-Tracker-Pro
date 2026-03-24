
import React, { useState, useRef } from 'react';
import { Case, FeePayment, Advocate, CaseType } from '../types';
import CaseForm from './CaseForm';
import { BackIcon, EditIcon, TrashIcon, UserIcon, GavelIcon, CalendarIcon, ArrowUpRightIcon, ArrowDownLeftIcon, FileIcon, CloudIcon } from './icons';
import { uploadFileToDrive } from '../services/googleSheetsService';

interface CaseDetailProps {
  caseData: Case | null;
  advocates: Advocate[];
  caseTypes: CaseType[];
  courtNames: string[];
  onSave: (caseToSave: Case) => void;
  onBack: () => void;
  onDelete: (caseId: string) => void;
  onAddCaseType: (name: string) => string;
}

const InfoCard: React.FC<{ icon: React.ReactNode; label: string; value: string | React.ReactNode }> = ({ icon, label, value }) => (
  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
    <div className="flex items-center gap-3">
      <div className="text-slate-400">{icon}</div>
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <div className="font-semibold text-slate-700 dark:text-slate-200">{value}</div>
      </div>
    </div>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mt-8">
        <h3 className="text-lg font-semibold border-b border-slate-200 dark:border-slate-700 pb-2 mb-4 text-slate-800 dark:text-slate-200">{title}</h3>
        {children}
    </div>
);


const CaseDetail: React.FC<CaseDetailProps> = ({ caseData, advocates, caseTypes, courtNames, onSave, onBack, onDelete, onAddCaseType }) => {
  const [isEditing, setIsEditing] = useState<boolean>(!caseData);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = (updatedCase: Case) => {
    onSave(updatedCase);
    setIsEditing(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !caseData) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => uploadFileToDrive(file, caseData.partyName));
      const uploadedDocs = await Promise.all(uploadPromises);
      
      const updatedCase: Case = {
        ...caseData,
        documentUrls: [...(caseData.documentUrls || []), ...uploadedDocs]
      };
      onSave(updatedCase);
      alert(`${files.length} file(s) uploaded successfully!`);
    } catch (error: any) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error.message || 'Unknown error'}. Please ensure your Apps Script is deployed as a Web App with 'Anyone' access and you have used the correct Script URL.`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  
  const totalFeesPaid = caseData?.feePayments.reduce((sum, p) => sum + p.amount, 0) || 0;

  if (isEditing) {
    return <CaseForm initialData={caseData} advocates={advocates} caseTypes={caseTypes} courtNames={courtNames} onSave={handleSave} onCancel={caseData ? () => setIsEditing(false) : onBack} onAddCaseType={onAddCaseType} />;
  }

  if (!caseData) return null;
  
  const advocate = advocates.find(a => a.id === caseData.advocateId);
  const caseTypeName = caseTypes.find(ct => ct.id === caseData.caseTypeId)?.name || 'Unknown Type';

  const DirectionIcon = caseData.caseDirection === 'Plaintiff' ? ArrowUpRightIcon : ArrowDownLeftIcon;
  const directionText = caseData.caseDirection === 'Plaintiff' ? 'You vs. Others' : 'Others vs. You';
  const directionColor = caseData.caseDirection === 'Plaintiff' ? 'text-green-500' : 'text-red-500';

  const statusColors = {
    'Ongoing': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'Closed': 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
  };

  const status = caseData.status || 'Ongoing';

  return (
    <div className="bg-white dark:bg-slate-800/50 p-6 sm:p-8 rounded-2xl shadow-lg animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{caseData.partyName}</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusColors[status as keyof typeof statusColors] || statusColors['Ongoing']}`}>
              {status}
            </span>
          </div>
          <p className="mt-1 text-slate-500 dark:text-slate-400">{caseTypeName}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={onBack} className="flex items-center gap-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-2 px-4 rounded-lg transition-colors">
            <BackIcon className="h-5 w-5" />
            Back
          </button>
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
            <EditIcon className="h-5 w-5" />
            Edit
          </button>
           <button onClick={() => { if(window.confirm('Are you sure you want to delete this case?')) onDelete(caseData.id) }} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <InfoCard icon={<CalendarIcon/>} label="Next Hearing" value={new Date(caseData.nextHearingDate).toLocaleDateString()} />
        {caseData.status === 'Closed' && caseData.closingDate && (
            <InfoCard icon={<CalendarIcon/>} label="Closing Date" value={new Date(caseData.closingDate).toLocaleDateString()} />
        )}
        <InfoCard icon={<GavelIcon />} label="Court" value={caseData.courtName} />
        <InfoCard icon={<UserIcon />} label="Advocate" value={advocate?.name || 'N/A'} />
        <InfoCard 
            icon={<DirectionIcon className={directionColor} />}
            label="Case Direction" 
            value={<span className={directionColor}>{directionText}</span>} 
        />
      </div>

      <Section title="Documents">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
            <div className="flex-1">
              <div className="flex items-center gap-3 text-slate-500">
                <CloudIcon className="h-6 w-6" />
                <p className="text-sm">Upload additional documents for this case.</p>
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
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  isUploading 
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isUploading ? 'Uploading...' : 'Upload Files'}
              </button>
            </div>
          </div>

          {caseData.documentUrls && caseData.documentUrls.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {caseData.documentUrls.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3 truncate mr-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded flex-shrink-0">
                      <FileIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate" title={doc.name}>
                        {doc.name}
                      </p>
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline font-bold flex items-center gap-1"
                      >
                        View / Download
                        <ArrowUpRightIcon className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (window.confirm('Remove this document?')) {
                        const updatedCase = {
                          ...caseData,
                          documentUrls: (caseData.documentUrls || []).filter((_, i) => i !== index)
                        };
                        onSave(updatedCase);
                      }
                    }}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-500">
              <p className="text-sm">No documents uploaded for this case.</p>
            </div>
          )}
        </div>
      </Section>

       <Section title="Course of Action">
          <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{caseData.courseOfAction}</p>
      </Section>

       <Section title="Advocate's Comments">
          <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap italic">"{caseData.advocateComments}"</p>
      </Section>
      
       <Section title="Fee Accountant">
          <div className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">
              Total Paid: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalFeesPaid)}
          </div>
          <div className="flow-root">
              <ul role="list" className="-my-4 divide-y divide-slate-200 dark:divide-slate-700">
                  {caseData.feePayments.map(payment => (
                      <li key={payment.id} className="flex items-center justify-between py-4">
                          <div>
                              <p className="font-medium text-slate-800 dark:text-slate-200">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(payment.amount)}</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">{payment.notes || 'Payment'}</p>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(payment.date).toLocaleDateString()}</p>
                      </li>
                  ))}
                  {caseData.feePayments.length === 0 && <p className="text-center text-slate-500 py-4">No payments recorded yet.</p>}
              </ul>
          </div>
      </Section>
    </div>
  );
};

export default CaseDetail;

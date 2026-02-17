
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Case, CaseType, Advocate, FeePayment } from './types';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CaseDetail from './components/CaseDetail';
import AdvocateDashboard from './components/AdvocateDashboard';
import AdvocateDetail from './components/AdvocateDetail';
import AdvocateForm from './components/AdvocateForm';
import { syncToGoogleSheets, loadFromGoogleSheets } from './services/googleSheetsService';

const App: React.FC = () => {
  const [caseTypes, setCaseTypes] = useState<CaseType[]>(() => {
    try {
      const saved = localStorage.getItem('caseTypes');
      return saved ? JSON.parse(saved) : [
        { id: 'ct1', name: 'Recovery Suit' },
        { id: 'ct2', name: 'Check Bounce' },
        { id: 'ct3', name: 'GST Department' },
        { id: 'ct4', name: 'Custom Department' },
        { id: 'ct5', name: 'Appeal' },
        { id: 'ct6', name: 'Other' },
      ];
    } catch {
      return [];
    }
  });

  const [advocates, setAdvocates] = useState<Advocate[]>(() => {
    try {
      const saved = localStorage.getItem('advocates');
      return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
  });

  const [cases, setCases] = useState<Case[]>(() => {
    try {
        const saved = localStorage.getItem('cases');
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
  });

  const [lastSynced, setLastSynced] = useState<string | null>(() => localStorage.getItem('lastSynced'));
  const [isSyncing, setIsSyncing] = useState(false);
  
  useEffect(() => { localStorage.setItem('cases', JSON.stringify(cases)); }, [cases]);
  useEffect(() => { localStorage.setItem('advocates', JSON.stringify(advocates)); }, [advocates]);
  useEffect(() => { localStorage.setItem('caseTypes', JSON.stringify(caseTypes)); }, [caseTypes]);
  useEffect(() => { if (lastSynced) localStorage.setItem('lastSynced', lastSynced); }, [lastSynced]);

  const handleCloudLoad = useCallback(async (isInitial = false) => {
    setIsSyncing(true);
    try {
      const data = await loadFromGoogleSheets();
      if (data) {
        // If the cloud has content, we replace. If cloud is empty but we have local, we keep local.
        const hasCloudContent = (data.cases && data.cases.length > 0);
        
        if (hasCloudContent) {
          setCases(data.cases);
          setAdvocates(data.advocates || []);
          setCaseTypes(data.caseTypes || []);
          setLastSynced(`Loaded at ${new Date().toLocaleTimeString()}`);
          if (!isInitial) alert(`Successfully loaded ${data.cases.length} cases from the cloud.`);
        } else if (!isInitial) {
          alert("Connected to cloud, but no case data was found in your spreadsheet.");
        }
      } else if (!isInitial) {
        alert("Failed to connect to Google Sheets. Please ensure your script is deployed as a Web App for 'Anyone'.");
      }
    } catch (error) {
      console.error("Cloud load error:", error);
      if (!isInitial) alert("A network error occurred while loading data.");
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    handleCloudLoad(true);
  }, [handleCloudLoad]); 


  const [currentView, setCurrentView] = useState<'cases' | 'advocates'>('cases');
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [activeAdvocateId, setActiveAdvocateId] = useState<string | null>(null);
  const [isCreatingNewCase, setIsCreatingNewCase] = useState<boolean>(false);
  const [isCreatingNewAdvocate, setIsCreatingNewAdvocate] = useState<boolean>(false);
  const [editingAdvocate, setEditingAdvocate] = useState<Advocate | null>(null);

  const [filters, setFilters] = useState({ caseTypeId: 'All', courtName: 'All', caseDirection: 'All' });

  const handleSelectCase = useCallback((caseId: string) => {
    setActiveCaseId(caseId);
    setIsCreatingNewCase(false);
  }, []);
  
  const handleSelectAdvocate = useCallback((advocateId: string) => {
    setActiveAdvocateId(advocateId);
    setIsCreatingNewAdvocate(false);
    setEditingAdvocate(null);
  }, []);

  const handleDeselect = useCallback(() => {
    setActiveCaseId(null);
    setActiveAdvocateId(null);
    setIsCreatingNewCase(false);
    setIsCreatingNewAdvocate(false);
    setEditingAdvocate(null);
  }, []);
  
  const handleNavigateToCase = useCallback((caseId: string) => {
    handleDeselect();
    setCurrentView('cases');
    setActiveCaseId(caseId);
  }, [handleDeselect]);

  const handleInitiateNewCase = useCallback(() => {
    handleDeselect();
    setIsCreatingNewCase(true);
  }, [handleDeselect]);

  const handleSaveCase = useCallback((caseToSave: Case) => {
    setCases(prev => {
      const exists = prev.some(c => c.id === caseToSave.id);
      if (exists) return prev.map(c => c.id === caseToSave.id ? caseToSave : c);
      return [...prev, caseToSave];
    });
    setActiveCaseId(caseToSave.id);
    setIsCreatingNewCase(false);
  }, []);

  const handleDeleteCase = useCallback((caseId: string) => {
    setCases(prev => prev.filter(c => c.id !== caseId));
    setActiveCaseId(null);
  }, []);

  const handleSaveAdvocate = useCallback((advocateToSave: Advocate) => {
    setAdvocates(prev => {
      const exists = prev.some(a => a.id === advocateToSave.id);
      if (exists) return prev.map(a => a.id === advocateToSave.id ? advocateToSave : a);
      return [...prev, advocateToSave];
    });
    setActiveAdvocateId(advocateToSave.id);
    setIsCreatingNewAdvocate(false);
    setEditingAdvocate(null);
  }, []);

  const handleDeleteAdvocate = useCallback((advocateId: string) => {
    setAdvocates(prev => prev.filter(a => a.id !== advocateId));
    setActiveAdvocateId(null);
  }, []);

  const handleAddCaseType = useCallback((name: string) => {
    const newType: CaseType = { id: `ct-${Date.now()}`, name };
    setCaseTypes(prev => [...prev, newType]);
  }, []);

  const handleAddPayment = useCallback((caseId: string, payment: Omit<FeePayment, 'id'>) => {
    setCases(prev => prev.map(c => {
      if (c.id === caseId) {
        return {
          ...c,
          feePayments: [...c.feePayments, { ...payment, id: crypto.randomUUID() }]
        };
      }
      return c;
    }));
  }, []);

  const handleCloudSync = async () => {
    setIsSyncing(true);
    try {
      await syncToGoogleSheets({ cases, advocates, caseTypes });
      setLastSynced(`Synced at ${new Date().toLocaleTimeString()}`);
      alert("Sync request sent. Please allow a few moments for the Google Sheet to update.");
    } catch (error) {
      console.error("Sync failed:", error);
      alert("Cloud sync failed. Check your network or Google Script deployment.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExport = useCallback(() => {
    const data = { cases, advocates, caseTypes, lastSynced };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legal-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [cases, advocates, caseTypes, lastSynced]);

  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      const matchesType = filters.caseTypeId === 'All' || c.caseTypeId === filters.caseTypeId;
      const matchesCourt = filters.courtName === 'All' || c.courtName === filters.courtName;
      const matchesDirection = filters.caseDirection === 'All' || c.caseDirection === filters.caseDirection;
      return matchesType && matchesCourt && matchesDirection;
    });
  }, [cases, filters]);

  const activeCase = cases.find(c => c.id === activeCaseId) || null;
  const activeAdvocate = advocates.find(a => a.id === activeAdvocateId) || null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Header 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        onDeselect={handleDeselect}
        onExport={handleExport}
        onCloudSync={handleCloudSync}
        onCloudLoad={() => handleCloudLoad(false)}
        isSyncing={isSyncing}
        lastSynced={lastSynced}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'cases' ? (
          activeCaseId || isCreatingNewCase ? (
            <CaseDetail 
              caseData={activeCase} 
              advocates={advocates} 
              caseTypes={caseTypes} 
              onSave={handleSaveCase} 
              onBack={handleDeselect}
              onDelete={handleDeleteCase}
            />
          ) : (
            <Dashboard 
              cases={filteredCases} 
              allCases={cases} 
              caseTypes={caseTypes} 
              onAddCaseType={handleAddCaseType}
              onSelectCase={handleSelectCase}
              onNewCase={handleInitiateNewCase}
              filters={filters}
              onFilterChange={setFilters}
            />
          )
        ) : (
          activeAdvocateId || isCreatingNewAdvocate || editingAdvocate ? (
            editingAdvocate || isCreatingNewAdvocate ? (
                <AdvocateForm 
                    initialData={editingAdvocate} 
                    onSave={handleSaveAdvocate} 
                    onCancel={handleDeselect} 
                />
            ) : (
                <AdvocateDetail 
                    advocate={activeAdvocate!} 
                    cases={cases.filter(c => c.advocateId === activeAdvocateId)} 
                    onBack={handleDeselect}
                    onNavigateToCase={handleNavigateToCase}
                    onEdit={setEditingAdvocate}
                    onDelete={handleDeleteAdvocate}
                    onAddPayment={handleAddPayment}
                />
            )
          ) : (
            <AdvocateDashboard 
              advocates={advocates} 
              onSelectAdvocate={handleSelectAdvocate} 
              onNewAdvocate={() => setIsCreatingNewAdvocate(true)}
            />
          )
        )}
      </main>
    </div>
  );
};

export default App;

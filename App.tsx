
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
      return saved ? JSON.parse(saved) : [
        { id: 'adv1', name: 'Jessica Pearson', email: 'j.pearson@specterlitt.com', phone: '555-0101' },
        { id: 'adv2', name: 'Louis Litt', email: 'l.litt@specterlitt.com', phone: '555-0102' },
        { id: 'adv3', name: 'Rachel Zane', email: 'r.zane@specterlitt.com', phone: '555-0103' },
      ];
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
  
  // Persistence effects for local storage backup
  useEffect(() => { localStorage.setItem('cases', JSON.stringify(cases)); }, [cases]);
  useEffect(() => { localStorage.setItem('advocates', JSON.stringify(advocates)); }, [advocates]);
  useEffect(() => { localStorage.setItem('caseTypes', JSON.stringify(caseTypes)); }, [caseTypes]);
  useEffect(() => { if (lastSynced) localStorage.setItem('lastSynced', lastSynced); }, [lastSynced]);

  // Load data from Google Sheets when app starts
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await loadFromGoogleSheets();
        if (data && (data.cases || data.advocates || data.caseTypes)) {
            console.log("Cloud data found, merging with local state...");
            if (data.cases) setCases(data.cases);
            if (data.advocates) setAdvocates(data.advocates);
            if (data.caseTypes) setCaseTypes(data.caseTypes);
            setLastSynced(new Date().toLocaleTimeString());
        } else {
            console.log("No valid cloud data found, using local storage.");
        }
      } catch (error) {
        console.warn("Could not load from cloud. Using local storage as fallback.");
      }
    };
    
    // Small delay to ensure browser network stack is fully ready
    const timer = setTimeout(loadData, 500);
    return () => clearTimeout(timer);
  }, []);

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
    if (activeCaseId === caseId) handleDeselect();
  }, [activeCaseId, handleDeselect]);
  
  const handleInitiateNewAdvocate = useCallback(() => {
    handleDeselect();
    setIsCreatingNewAdvocate(true);
  }, [handleDeselect]);

  const handleEditAdvocate = useCallback((advocate: Advocate) => {
    handleDeselect();
    setEditingAdvocate(advocate);
  }, [handleDeselect]);

  const handleSaveAdvocate = useCallback((advocateToSave: Advocate) => {
    setAdvocates(prev => {
      const exists = prev.some(a => a.id === advocateToSave.id);
      if (exists) return prev.map(a => a.id === advocateToSave.id ? advocateToSave : a);
      return [...prev, advocateToSave];
    });
    handleDeselect();
    setActiveAdvocateId(advocateToSave.id);
  }, [handleDeselect]);

  const handleDeleteAdvocate = useCallback((advocateId: string) => {
    if (cases.some(c => c.advocateId === advocateId)) {
        alert("Cannot delete advocate with assigned cases. Please reassign cases first.");
        return;
    }
    setAdvocates(prev => prev.filter(a => a.id !== advocateId));
    if (activeAdvocateId === advocateId) handleDeselect();
  }, [cases, activeAdvocateId, handleDeselect]);

  const handleAddCaseType = useCallback((name: string) => {
    if (name && !caseTypes.some(ct => ct.name.toLowerCase() === name.toLowerCase())) {
        const newCaseType: CaseType = { id: `ct-${Date.now()}`, name };
        setCaseTypes(prev => [...prev, newCaseType]);
    }
  }, [caseTypes]);

  const handleAddPayment = useCallback((caseId: string, paymentData: Omit<FeePayment, 'id'>) => {
      setCases(prevCases => {
          return prevCases.map(c => {
              if (c.id === caseId) {
                  const newPayment: FeePayment = { ...paymentData, id: `fee-${crypto.randomUUID()}` };
                  return { ...c, feePayments: [...c.feePayments, newPayment] };
              }
              return c;
          });
      });
  }, []);

  const handleExportData = useCallback(() => {
    const data = { cases, advocates, caseTypes, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `legal_tracker_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [cases, advocates, caseTypes]);

  const handleCloudSync = useCallback(async () => {
    setIsSyncing(true);
    try {
        await syncToGoogleSheets({ cases, advocates, caseTypes });
        setLastSynced(new Date().toLocaleTimeString());
        alert('Cloud sync triggered! Your data is being sent to Google Sheets.\n\nNote: Changes might take a moment to appear in the sheet cell.');
    } catch (err: any) {
        alert(err.message || 'Sync failed. Check your browser console for more details.');
    } finally {
        setIsSyncing(false);
    }
  }, [cases, advocates, caseTypes]);

  const activeCase = useMemo(() => cases.find(c => c.id === activeCaseId) || null, [cases, activeCaseId]);
  const activeAdvocate = useMemo(() => advocates.find(a => a.id === activeAdvocateId) || null, [advocates, activeAdvocateId]);

  const filteredCases = useMemo(() => {
    return cases.filter(c => 
      (filters.caseTypeId === 'All' || c.caseTypeId === filters.caseTypeId) &&
      (filters.courtName === 'All' || c.courtName === filters.courtName) &&
      (filters.caseDirection === 'All' || c.caseDirection === filters.caseDirection)
    );
  }, [cases, filters]);

  const renderContent = () => {
    if (currentView === 'advocates') {
        if (isCreatingNewAdvocate || editingAdvocate) {
            return <AdvocateForm onSave={handleSaveAdvocate} onCancel={handleDeselect} initialData={editingAdvocate}/>;
        }
        if (activeAdvocate) {
            return <AdvocateDetail advocate={activeAdvocate} cases={cases.filter(c => c.advocateId === activeAdvocate.id)} onBack={handleDeselect} onNavigateToCase={handleNavigateToCase} onEdit={handleEditAdvocate} onDelete={handleDeleteAdvocate} onAddPayment={handleAddPayment} />;
        }
        return <AdvocateDashboard advocates={advocates} onSelectAdvocate={handleSelectAdvocate} onNewAdvocate={handleInitiateNewAdvocate}/>;
    }

    if (isCreatingNewCase || activeCase) {
        return <CaseDetail
            caseData={activeCase}
            advocates={advocates}
            caseTypes={caseTypes}
            onSave={handleSaveCase}
            onBack={handleDeselect}
            onDelete={handleDeleteCase}
        />
    }
    return <Dashboard 
        cases={filteredCases}
        allCases={cases}
        caseTypes={caseTypes}
        onAddCaseType={handleAddCaseType}
        onSelectCase={handleSelectCase} 
        onNewCase={handleInitiateNewCase} 
        filters={filters}
        onFilterChange={setFilters}
    />
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
      <Header 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        onDeselect={handleDeselect} 
        onExport={handleExportData}
        onCloudSync={handleCloudSync}
        isSyncing={isSyncing}
        lastSynced={lastSynced}
      />
      <main className="p-4 sm:p-6 md:p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;

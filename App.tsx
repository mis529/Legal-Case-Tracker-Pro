
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

        if (data) {
          // Only overwrite if cloud data has content, OR if we have NO local data.
          // This prevents accidental local data loss on first load if the sheet is empty.
          const hasCloudData = (data.cases?.length > 0 || data.advocates?.length > 0);
          const hasLocalData = (cases.length > 0 || advocates.length > 3); // 3 is default count

          if (hasCloudData || !hasLocalData) {
            if (Array.isArray(data.cases)) setCases(data.cases);
            if (Array.isArray(data.advocates)) setAdvocates(data.advocates);
            if (Array.isArray(data.caseTypes)) setCaseTypes(data.caseTypes);
            setLastSynced(new Date().toLocaleTimeString());
          }
        }
      } catch (error) {
        console.error("Cloud data load failed. Falling back to local storage.");
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount


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

  // Completed missing handleDeleteCase implementation
  const handleDeleteCase = useCallback((caseId: string) => {
    setCases(prev => prev.filter(c => c.id !== caseId));
    setActiveCaseId(null);
  }, []);

  // Added missing handleSaveAdvocate implementation
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

  // Added missing handleDeleteAdvocate implementation
  const handleDeleteAdvocate = useCallback((advocateId: string) => {
    setAdvocates(prev => prev.filter(a => a.id !== advocateId));
    setActiveAdvocateId(null);
  }, []);

  // Added missing handleAddCaseType implementation
  const handleAddCaseType = useCallback((name: string) => {
    const newType: CaseType = { id: `ct-${Date.now()}`, name };
    setCaseTypes(prev => [...prev, newType]);
  }, []);

  // Added missing handleAddPayment implementation
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

  // Added missing handleCloudSync implementation
  const handleCloudSync = async () => {
    setIsSyncing(true);
    try {
      await syncToGoogleSheets({ cases, advocates, caseTypes });
      setLastSynced(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Sync failed:", error);
      alert("Cloud sync failed. Please try again later.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Added missing handleExport implementation
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

  // Added missing filteredCases derivation
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

// Exporting App as default to fix the import error in index.tsx
export default App;

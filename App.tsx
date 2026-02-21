
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Case, CaseType, Advocate, FeePayment } from './types';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CaseDetail from './components/CaseDetail';
import AdvocateDashboard from './components/AdvocateDashboard';
import AdvocateDetail from './components/AdvocateDetail';
import AdvocateForm from './components/AdvocateForm';
import { syncToGoogleSheets, loadFromGoogleSheets } from './services/googleSheetsService';
import { motion, AnimatePresence } from 'motion/react';

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

  const [courtNames, setCourtNames] = useState<string[]>(() => {
    try {
        const saved = localStorage.getItem('courtNames');
        return saved ? JSON.parse(saved) : [];
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
  const isInitialLoadRef = useRef(true);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => { localStorage.setItem('cases', JSON.stringify(cases)); }, [cases]);
  useEffect(() => { localStorage.setItem('advocates', JSON.stringify(advocates)); }, [advocates]);
  useEffect(() => { localStorage.setItem('caseTypes', JSON.stringify(caseTypes)); }, [caseTypes]);
  useEffect(() => { localStorage.setItem('courtNames', JSON.stringify(courtNames)); }, [courtNames]);
  useEffect(() => { if (lastSynced) localStorage.setItem('lastSynced', lastSynced); }, [lastSynced]);

  const handleCloudLoad = useCallback(async (isInitial = false) => {
    setIsSyncing(true);
    try {
      const data = await loadFromGoogleSheets();
      
      if (data) {
        isInitialLoadRef.current = true; 
        
        setCases([...(data.cases || [])]);
        setAdvocates([...(data.advocates || [])]);
        
        if (data.caseTypes && data.caseTypes.length > 0) {
            setCaseTypes(data.caseTypes);
        }
        
        if (data.courtNames && data.courtNames.length > 0) {
            setCourtNames(data.courtNames);
        }
        
        setLastSynced(`Updated ${new Date().toLocaleTimeString()}`);
        setTimeout(() => { isInitialLoadRef.current = false; }, 2000);
      }
    } catch (error) {
      console.error("Cloud load error:", error);
      isInitialLoadRef.current = false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    handleCloudLoad(true);
  }, [handleCloudLoad]);

  useEffect(() => {
    if (isInitialLoadRef.current) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = setTimeout(async () => {
      setIsSyncing(true);
      try {
        await syncToGoogleSheets({ cases, advocates, caseTypes, courtNames });
        setLastSynced(`Saved ${new Date().toLocaleTimeString()}`);
      } catch (error) {
        console.error("Auto-sync error:", error);
      } finally {
        setIsSyncing(false);
      }
    }, 2000); 

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [cases, advocates, caseTypes, courtNames]);

  const [currentView, setCurrentView] = useState<'cases' | 'advocates'>('cases');
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [activeAdvocateId, setActiveAdvocateId] = useState<string | null>(null);
  const [isCreatingNewCase, setIsCreatingNewCase] = useState<boolean>(false);
  const [isCreatingNewAdvocate, setIsCreatingNewAdvocate] = useState<boolean>(false);
  const [editingAdvocate, setEditingAdvocate] = useState<Advocate | null>(null);

  const [filters, setFilters] = useState({ caseTypeId: 'All', courtName: 'All', caseDirection: 'All', advocateId: 'All', hearingDate: '' });

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
    if (caseToSave.courtName) {
        const newCourt = caseToSave.courtName.trim();
        setCourtNames(prev => {
            const alreadyExists = prev.some(c => c.toLowerCase() === newCourt.toLowerCase());
            if (alreadyExists) return prev;
            return [...prev, newCourt].sort();
        });
    }

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
    const normalizedName = name.trim();
    if (!normalizedName) return '';
    
    let existingId = '';
    setCaseTypes(prev => {
        const existing = prev.find(t => t.name.toLowerCase() === normalizedName.toLowerCase());
        if (existing) {
            existingId = existing.id;
            return prev;
        }
        const newType: CaseType = { id: `ct-${Date.now()}`, name: normalizedName };
        existingId = newType.id;
        return [...prev, newType].sort((a,b) => a.name.localeCompare(b.name));
    });
    return existingId;
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

  const handleExport = useCallback(() => {
    const data = { cases, advocates, caseTypes, lastSynced };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legal-tracker-export.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [cases, advocates, caseTypes, lastSynced]);

  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      const matchesType = filters.caseTypeId === 'All' || c.caseTypeId === filters.caseTypeId;
      const matchesCourt = filters.courtName === 'All' || c.courtName === filters.courtName;
      const matchesDirection = filters.caseDirection === 'All' || c.caseDirection === filters.caseDirection;
      const matchesAdvocate = filters.advocateId === 'All' || c.advocateId === filters.advocateId;
      
      let matchesDate = true;
      if (filters.hearingDate) {
        const caseDate = new Date(c.nextHearingDate).toISOString().split('T')[0];
        matchesDate = caseDate === filters.hearingDate;
      }
      
      return matchesType && matchesCourt && matchesDirection && matchesAdvocate && matchesDate;
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
        onCloudLoad={() => handleCloudLoad(false)}
        isSyncing={isSyncing}
        lastSynced={lastSynced}
        totalCases={cases.length}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {currentView === 'cases' ? (
            activeCaseId || isCreatingNewCase ? (
              <motion.div
                key="case-detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <CaseDetail 
                  caseData={activeCase} 
                  advocates={advocates} 
                  caseTypes={caseTypes} 
                  courtNames={courtNames}
                  onSave={handleSaveCase} 
                  onBack={handleDeselect}
                  onDelete={handleDeleteCase}
                  onAddCaseType={handleAddCaseType}
                />
              </motion.div>
            ) : (
              <motion.div
                key="case-dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Dashboard 
                  cases={filteredCases} 
                  allCases={cases} 
                  caseTypes={caseTypes} 
                  courtNames={courtNames}
                  advocates={advocates}
                  onAddCaseType={(name) => handleAddCaseType(name)}
                  onSelectCase={handleSelectCase}
                  onNewCase={handleInitiateNewCase}
                  filters={filters}
                  onFilterChange={setFilters}
                />
              </motion.div>
            )
          ) : (
            activeAdvocateId || isCreatingNewAdvocate || editingAdvocate ? (
              editingAdvocate || isCreatingNewAdvocate ? (
                  <motion.div
                    key="advocate-form"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <AdvocateForm 
                        initialData={editingAdvocate} 
                        onSave={handleSaveAdvocate} 
                        onCancel={handleDeselect} 
                    />
                  </motion.div>
              ) : (
                  <motion.div
                    key="advocate-detail"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <AdvocateDetail 
                        advocate={activeAdvocate!} 
                        cases={cases.filter(c => c.advocateId === activeAdvocateId)} 
                        onBack={handleDeselect}
                        onNavigateToCase={handleNavigateToCase}
                        onEdit={setEditingAdvocate}
                        onDelete={handleDeleteAdvocate}
                        onAddPayment={handleAddPayment}
                    />
                  </motion.div>
              )
            ) : (
              <motion.div
                key="advocate-dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <AdvocateDashboard 
                  advocates={advocates} 
                  onSelectAdvocate={handleSelectAdvocate} 
                  onNewAdvocate={() => setIsCreatingNewAdvocate(true)}
                />
              </motion.div>
            )
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;

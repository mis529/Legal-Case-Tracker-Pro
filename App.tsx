
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Case, CaseType, Advocate, FeePayment } from './types';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CaseDetail from './components/CaseDetail';
import AdvocateDashboard from './components/AdvocateDashboard';
import AdvocateDetail from './components/AdvocateDetail';
import AdvocateForm from './components/AdvocateForm';

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
        return saved ? JSON.parse(saved) : [
          {
            id: '1', caseNumber: 'CS-2023-101', caseTypeId: 'ct1', courtName: 'City Civil Court, Metropolis', nextHearingDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(), courseOfAction: 'Submit evidence affidavit and prepare for cross-examination of the defendant.', advocateId: 'adv1', caseDirection: 'Plaintiff', personAppearing: 'Harvey Specter', advocateComments: 'Defendant seems to be looking for a settlement. We have a strong position.', feePayments: [ { id: 'fee1', amount: 5000, date: new Date().toISOString(), notes: 'Initial Retainer' }, { id: 'fee2', amount: 2500, date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(), notes: 'Filing Charges' } ], createdAt: new Date().toISOString(),
          },
          {
            id: '2', caseNumber: 'CR-2023-245', caseTypeId: 'ct2', courtName: 'Metropolitan Magistrate Court', nextHearingDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString(), courseOfAction: 'Issue final legal notice before filing a criminal complaint under Section 138.', advocateId: 'adv2', caseDirection: 'Plaintiff', personAppearing: 'Mike Ross', advocateComments: 'The client has all the required documentation. A straightforward case.', feePayments: [ { id: 'fee3', amount: 7000, date: new Date().toISOString(), notes: 'Full fee paid' } ], createdAt: new Date().toISOString(),
          },
           {
            id: '3', caseNumber: 'GST-APL-2024-015', caseTypeId: 'ct3', courtName: 'GST Appellate Tribunal', nextHearingDate: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(), courseOfAction: 'Review the department\'s response and prepare counter-arguments.', advocateId: 'adv3', caseDirection: 'Defendant', personAppearing: 'Rachel Zane', advocateComments: 'Need to focus on the procedural lapses by the department.', feePayments: [ { id: 'fee4', amount: 15000, date: new Date().toISOString(), notes: 'Advance for appeal' } ], createdAt: new Date().toISOString(),
          },
          {
            id: '4', caseNumber: 'CIV-2024-088', caseTypeId: 'ct1', courtName: 'City Civil Court, Metropolis', nextHearingDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(), courseOfAction: 'Awaiting defendant\'s reply to our notice.', advocateId: 'adv1', caseDirection: 'Defendant', personAppearing: 'Jessica Pearson', advocateComments: 'The opposing counsel is known for delay tactics.', feePayments: [ { id: 'fee5', amount: 8000, date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(), notes: 'Appearance Fee' } ], createdAt: new Date().toISOString(),
          }
        ];
    } catch {
        return [];
    }
  });
  
  // Effects to persist state to localStorage
  useEffect(() => {
    localStorage.setItem('cases', JSON.stringify(cases));
  }, [cases]);

  useEffect(() => {
    localStorage.setItem('advocates', JSON.stringify(advocates));
  }, [advocates]);

  useEffect(() => {
    localStorage.setItem('caseTypes', JSON.stringify(caseTypes));
  }, [caseTypes]);


  const [currentView, setCurrentView] = useState<'cases' | 'advocates'>('cases');
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [activeAdvocateId, setActiveAdvocateId] = useState<string | null>(null);
  const [isCreatingNewCase, setIsCreatingNewCase] = useState<boolean>(false);
  const [isCreatingNewAdvocate, setIsCreatingNewAdvocate] = useState<boolean>(false);
  const [editingAdvocate, setEditingAdvocate] = useState<Advocate | null>(null);


  const [filters, setFilters] = useState({ caseTypeId: 'All', courtName: 'All', caseDirection: 'All' });

  // Navigation and Selection handlers
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

  // Case handlers
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
  
  // Advocate Handlers
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

  // Case Type Handlers
  const handleAddCaseType = useCallback((name: string) => {
    if (name && !caseTypes.some(ct => ct.name.toLowerCase() === name.toLowerCase())) {
        const newCaseType: CaseType = { id: `ct-${Date.now()}`, name };
        setCaseTypes(prev => [...prev, newCaseType]);
    }
  }, [caseTypes]);

  // Payment Handler
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


  // Memos for active items
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

    // Default to 'cases' view
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
      <Header currentView={currentView} setCurrentView={setCurrentView} onDeselect={handleDeselect} />
      <main className="p-4 sm:p-6 md:p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;

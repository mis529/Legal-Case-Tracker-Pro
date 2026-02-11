
import React from 'react';
import { GavelIcon, BriefcaseIcon } from './icons';

interface HeaderProps {
    currentView: 'cases' | 'advocates';
    setCurrentView: (view: 'cases' | 'advocates') => void;
    onDeselect: () => void;
}

const NavButton: React.FC<{ isActive: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ isActive, onClick, icon, label }) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive 
            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
        }`}
    >
        {icon}
        {label}
    </button>
);


const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, onDeselect }) => {
  const handleViewChange = (view: 'cases' | 'advocates') => {
    onDeselect();
    setCurrentView(view);
  };
    
  return (
    <header className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <GavelIcon className="h-8 w-8 text-blue-600 dark:text-blue-500" />
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Legal Case Tracker Pro
            </h1>
          </div>
          <nav className="flex items-center gap-2">
            <NavButton 
                isActive={currentView === 'cases'} 
                onClick={() => handleViewChange('cases')}
                icon={<GavelIcon className="h-5 w-5" />}
                label="Cases"
            />
             <NavButton 
                isActive={currentView === 'advocates'} 
                onClick={() => handleViewChange('advocates')}
                icon={<BriefcaseIcon className="h-5 w-5" />}
                label="Advocates"
            />
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;


import React from 'react';
import { GavelIcon, BriefcaseIcon, DownloadIcon, RefreshIcon } from './icons';

interface HeaderProps {
    currentView: 'cases' | 'advocates';
    setCurrentView: (view: 'cases' | 'advocates') => void;
    onDeselect: () => void;
    onExport: () => void;
    onCloudLoad: () => void;
    isSyncing: boolean;
    lastSynced: string | null;
    totalCases: number;
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


const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, onDeselect, onExport, onCloudLoad, isSyncing, lastSynced, totalCases }) => {
  const handleViewChange = (view: 'cases' | 'advocates') => {
    // FIX: Renamed 'onDeslect' to 'onDeselect' to fix the compilation error.
    onDeselect();
    setCurrentView(view);
  };
    
  return (
    <header className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3 overflow-hidden">
            <GavelIcon className="h-8 w-8 text-blue-600 dark:text-blue-500 shrink-0" />
            <div className="flex flex-col">
              <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white truncate">
                Legal Tracker Pro
              </h1>
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">
                {totalCases} Active Cases
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-2">
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
            </div>
            
            <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2 sm:pl-4">
                <div className="flex flex-col items-end mr-2 hidden md:flex">
                    <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full transition-colors duration-500 ${isSyncing ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            {isSyncing ? 'Saving' : 'Synced'}
                        </span>
                    </div>
                    {lastSynced && (
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                            {lastSynced}
                        </span>
                    )}
                </div>
                <button 
                    onClick={onCloudLoad}
                    disabled={isSyncing}
                    className="p-2 rounded-full text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                    title="Force Refresh Data"
                >
                    <RefreshIcon className={`h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
                <button 
                    onClick={onExport}
                    className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                    title="Local Backup"
                >
                    <DownloadIcon className="h-5 w-5" />
                </button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
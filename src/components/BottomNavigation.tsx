
import React from 'react';
import { Home, Package, BarChart3, User, Hospital } from 'lucide-react';

interface BottomNavigationProps {
  currentView: string;
  onNavigation: (tab: 'dashboard' | 'polyclinics' | 'sklad' | 'control' | 'settings') => void;
  darkMode: boolean;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ 
  currentView, 
  onNavigation, 
  darkMode 
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-blue-500 px-4 py-2 z-50">
      <div className="flex justify-around items-center">
        <button 
          onClick={() => onNavigation('dashboard')}
          className="flex flex-col items-center space-y-1"
        >
          <Home size={24} className={currentView === 'dashboard' ? 'text-white' : 'text-white/60'} />
          <span className={`text-xs ${currentView === 'dashboard' ? 'text-white font-medium' : 'text-white/60'}`}>
            Сводка
          </span>
        </button>
        <button 
          onClick={() => onNavigation('polyclinics')}
          className="flex flex-col items-center space-y-1"
        >
          <Hospital size={24} className={currentView === 'polyclinics' ? 'text-white' : 'text-white/60'} />
          <span className={`text-xs ${currentView === 'polyclinics' ? 'text-white font-medium' : 'text-white/60'}`}>
            Поликлиники
          </span>
        </button>
        <button 
          onClick={() => onNavigation('sklad')}
          className="flex flex-col items-center space-y-1"
        >
          <Package size={24} className={currentView === 'sklad' ? 'text-white' : 'text-white/60'} />
          <span className={`text-xs ${currentView === 'sklad' ? 'text-white font-medium' : 'text-white/60'}`}>
            Склад
          </span>
        </button>
        <button 
          onClick={() => onNavigation('control')}
          className="flex flex-col items-center space-y-1"
        >
          <BarChart3 size={24} className={currentView === 'control' ? 'text-white' : 'text-white/60'} />
          <span className={`text-xs ${currentView === 'control' ? 'text-white font-medium' : 'text-white/60'}`}>
            Остатки
          </span>
        </button>
        <button 
          onClick={() => onNavigation('settings')}
          className="flex flex-col items-center space-y-1"
        >
          <User size={24} className={currentView === 'settings' ? 'text-white' : 'text-white/60'} />
          <span className={`text-xs ${currentView === 'settings' ? 'text-white font-medium' : 'text-white/60'}`}>
            Настройки
          </span>
        </button>
      </div>
    </div>
  );
};

export default BottomNavigation;

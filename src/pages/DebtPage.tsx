import React, { useEffect } from "react";
import DebtManagement from "@/components/DebtManagement";
import BottomNavigation from "@/components/BottomNavigation";
import { useNavigate } from "react-router-dom";

const DebtPage: React.FC = () => {
  const navigate = useNavigate();
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  useEffect(() => {
    document.title = "Qarzlar boshqaruvi — Boshqaruv";
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16">
      {/* Header */}
      <div className="p-4 shadow-sm bg-white dark:bg-gray-800">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Qarzlar boshqaruvi</h1>
      </div>

      {/* Main Content */}
      <DebtManagement />

      {/* Bottom Navigation */}
      <BottomNavigation 
        currentView="settings" 
        onNavigation={(tab) => {
          if (tab === 'dashboard') navigate('/dashboard');
          else if (tab === 'sklad') navigate('/sklad');
          else if (tab === 'polyclinics') navigate('/polyclinics');
          else if (tab === 'control') navigate('/ostatka');
          else if (tab === 'settings') navigate('/settings');
        }}
        darkMode={isDark}
      />
    </div>
  );
};

export default DebtPage;
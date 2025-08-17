
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import Dashboard from '@/components/Dashboard';
import Settings from '@/components/Settings';
import Sklad from '@/components/Sklad';
import Ostatka from '@/components/Ostatka';
import UserManagement from '@/components/UserManagement';
import SavedMessages from '@/components/SavedMessages';
import Archive from '@/components/Archive';
import BottomNavigation from '@/components/BottomNavigation';
import DoctorsTable from '@/components/DoctorsTable';
import PolyclinicDoctorsList from '@/components/PolyclinicDoctorsList';
import DoctorMedicinesDetail from '@/components/DoctorMedicinesDetail';
import { useNotifications } from '@/hooks/useNotifications';

const DashboardPage = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'sklad' | 'ostatka' | 'settings' | 'userManagement' | 'savedMessages' | 'archive' | 'doctors' | 'polyclinic-doctors' | 'doctor-medicines'>('dashboard');
  const [selectedLanguage, setSelectedLanguage] = useState('Русский');
  const [darkMode, setDarkMode] = useState(false);
  const [selectedPolyclinic, setSelectedPolyclinic] = useState<any>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const navigate = useNavigate();
  const notifications = useNotifications();
  const location = useLocation();
  const params = useParams();

  const routeForTab = (tab: 'dashboard' | 'sklad' | 'ostatka' | 'settings') =>
    tab === 'dashboard' ? '/dashboard' : tab === 'sklad' ? '/sklad' : tab === 'ostatka' ? '/ostatka' : '/settings';

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/sklad')) setCurrentView('sklad');
    else if (path.includes('/doctor/') && path.includes('/ostatka/polyclinic/')) {
      setCurrentView('doctor-medicines');
      fetchDoctorDetails();
    }
    else if (path.includes('/doctors') && path.includes('/ostatka/polyclinic/')) {
      setCurrentView('polyclinic-doctors');
      fetchPolyclinicDetails();
    }
    else if (path.startsWith('/ostatka')) setCurrentView('ostatka');
    else if (path.startsWith('/settings')) setCurrentView('settings');
    else setCurrentView('dashboard');
  }, [location.pathname, params.polyclinicId, params.doctorId]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark', 'bg-gray-900');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark', 'bg-gray-900');
    }
  }, [darkMode]);

  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    navigate('/login');
  };

  const handleNavigation = (tab: 'dashboard' | 'sklad' | 'ostatka' | 'settings') => {
    setCurrentView(tab);
    navigate(routeForTab(tab));
  };

  const handleUserManagement = () => {
    setCurrentView('userManagement');
  };

  const handleSavedMessages = () => {
    setCurrentView('savedMessages');
  };

  const handleArchive = () => {
    setCurrentView('archive');
  };

  const handleDoctors = () => {
    setCurrentView('doctors');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    navigate('/dashboard');
  };

  const handleBackToSettings = () => {
    setCurrentView('settings');
    navigate('/settings');
  };

  const handleDarkModeChange = (enabled: boolean) => {
    setDarkMode(enabled);
  };

  const handlePolyclinicClick = (polyclinic: any) => {
    setSelectedPolyclinic(polyclinic);
    navigate(`/ostatka/polyclinic/${polyclinic.id}/doctors`);
  };

  const handleDoctorClick = (doctor: any) => {
    setSelectedDoctor(doctor);
    navigate(`/ostatka/polyclinic/${params.polyclinicId}/doctor/${doctor.id}`);
  };

  const handleBackToOstatka = () => {
    setCurrentView('ostatka');
    navigate('/ostatka');
  };

  const handleBackToDoctors = () => {
    setCurrentView('polyclinic-doctors');
    navigate(`/ostatka/polyclinic/${params.polyclinicId}/doctors`);
  };

  const fetchPolyclinicDetails = async () => {
    if (!params.polyclinicId) return;
    
    try {
      const token = localStorage.getItem('access');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
      
      const response = await fetch(`${apiUrl}/pharmacy/hospitals/${params.polyclinicId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const polyclinic = await response.json();
        setSelectedPolyclinic(polyclinic);
      }
    } catch (error) {
      console.error('Error fetching polyclinic:', error);
    }
  };

  const fetchDoctorDetails = async () => {
    if (!params.doctorId) return;
    
    try {
      const token = localStorage.getItem('access');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
      
      const response = await fetch(`${apiUrl}/polyclinic_doctors/polyclinic_doctors/${params.doctorId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const doctor = await response.json();
        setSelectedDoctor(doctor);
      }
    } catch (error) {
      console.error('Error fetching doctor:', error);
    }
  };

  return (
    <div className="min-h-screen pb-16 relative">
      {currentView === 'dashboard' && (
        <Dashboard darkMode={darkMode} />
      )}
      {currentView === 'sklad' && (
        <Sklad 
          darkMode={darkMode} 
          onBack={handleBackToDashboard}
          onSettingsClick={() => { setCurrentView('settings'); navigate('/settings'); }}
        />
      )}
      {currentView === 'ostatka' && (
        <Ostatka 
          darkMode={darkMode} 
          onSettingsClick={() => { setCurrentView('settings'); navigate('/settings'); }}
          onDoctorsClick={handleDoctors}
          onPolyclinicClick={handlePolyclinicClick}
        />
      )}
      {currentView === 'polyclinic-doctors' && selectedPolyclinic && (
        <PolyclinicDoctorsList
          polyclinic={selectedPolyclinic}
          onBack={handleBackToOstatka}
          onDoctorClick={handleDoctorClick}
          darkMode={darkMode}
        />
      )}
      {currentView === 'doctor-medicines' && selectedDoctor && (
        <DoctorMedicinesDetail
          doctor={selectedDoctor}
          onBack={handleBackToDoctors}
          darkMode={darkMode}
        />
      )}
      {currentView === 'doctors' && (
        <DoctorsTable
          darkMode={darkMode}
          onBack={() => setCurrentView('ostatka')}
          medicines={[
            { id: 1, name: 'Парацетамол', dosage: '500мг', pills_per_package: 20, price_per_package: 15000, price_per_pill: 750, price_type: 'pill', stock_quantity: 100 },
            { id: 2, name: 'Аспирин', dosage: '100мг', pills_per_package: 30, price_per_package: 25000, price_per_pill: 833, price_type: 'pill', stock_quantity: 50 },
            { id: 3, name: 'Ибупрофен', dosage: '200мг', pills_per_package: 24, price_per_package: 32000, price_per_pill: 1333, price_type: 'pill', stock_quantity: 75 },
          ]}
          pharmacies={[
            { id: 1, name: 'Аптека №1', address: 'ул. Пушкина, 12' },
            { id: 2, name: 'Аптека №2', address: 'ул. Лермонтова, 25' },
            { id: 3, name: 'Аптека №3', address: 'ул. Гоголя, 8' },
          ]}
        />
      )}
      {currentView === 'settings' && (
        <Settings 
          onBack={handleBackToDashboard}
          onLogout={handleLogout}
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          darkMode={darkMode}
          onDarkModeChange={handleDarkModeChange}
          onUserManagement={handleUserManagement}
          onSavedMessages={handleSavedMessages}
          onArchive={handleArchive}
        />
      )}
      {currentView === 'userManagement' && (
        <UserManagement 
          onBack={handleBackToSettings}
          darkMode={darkMode}
        />
      )}
      {currentView === 'savedMessages' && (
        <SavedMessages 
          onBack={handleBackToSettings}
          darkMode={darkMode}
        />
      )}
      {currentView === 'archive' && (
        <Archive 
          onBack={handleBackToSettings}
          darkMode={darkMode}
        />
      )}
      
      <BottomNavigation 
        currentView={currentView === 'ostatka' ? 'control' : currentView}
        onNavigation={(tab) => {
          if (tab === 'control') {
            handleNavigation('ostatka');
          } else if (tab === 'polyclinics') {
            navigate('/polyclinics');
          } else {
            handleNavigation(tab as 'dashboard' | 'sklad' | 'settings');
          }
        }}
        darkMode={darkMode}
      />
    </div>
  );
};

export default DashboardPage;

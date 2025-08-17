
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginScreen from '@/components/LoginScreen';

const LoginPage = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('Русский');
  const navigate = useNavigate();

  useEffect(() => {
    const access = localStorage.getItem('access');
    const refresh = localStorage.getItem('refresh');
    
    if (access && refresh) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleLogin = () => {
    navigate('/dashboard');
  };

  return (
    <LoginScreen 
      onLogin={handleLogin}
      selectedLanguage={selectedLanguage}
      onLanguageChange={setSelectedLanguage}
    />
  );
};

export default LoginPage;

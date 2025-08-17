import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeft, User, Settings as SettingsIcon, Archive, Globe, MessageSquare, Plus, LogOut, Eye, EyeOff, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { authFetch } from '@/utils/authFetch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  username: string;
  role: string;
  image: string;
}

interface SettingsProps {
  onBack: () => void;
  onLogout: () => void;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  darkMode: boolean;
  onDarkModeChange: (enabled: boolean) => void;
  onUserManagement: () => void;
  onSavedMessages: () => void;
  onArchive: () => void;
}

const Settings: React.FC<SettingsProps> = ({
  onBack,
  onLogout,
  selectedLanguage,
  onLanguageChange,
  darkMode,
  onDarkModeChange,
  onUserManagement,
  onSavedMessages,
  onArchive
}) => {
  const navigate = useNavigate();
  // Add state for current user
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState<User | null>(null);
  const [editProfileImageFile, setEditProfileImageFile] = useState<File | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('access');
        const res = await authFetch(
          import.meta.env.VITE_API_URL + '/users/',
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        const data = await res.json();
        if (Array.isArray(data.results) && data.results.length > 0) {
          setCurrentUser(data.results[0]);
        } else if (Array.isArray(data) && data.length > 0) {
          setCurrentUser(data[0]);
        }
      } catch {}
    };
    fetchProfile();
  }, []);

  // Open edit modal and set initial data
  const handleEditProfileOpen = () => {
    setEditProfileData(currentUser ? { ...currentUser } : null);
    setShowEditProfile(true);
  };

  // Example save handler (replace with your API call)
  const handleEditProfileSave = async () => {
    if (!editProfileData) return;
    try {
      const token = localStorage.getItem('access');
      const formData = new FormData();
      formData.append('first_name', editProfileData.first_name);
      formData.append('last_name', editProfileData.last_name);
      formData.append('phone_number', editProfileData.phone_number);
      formData.append('username', editProfileData.username);
      // Only append image if changed
      if (editProfileImageFile) {
        formData.append('image', editProfileImageFile);
      }
      // If image is not changed, do not append 'image' at all
      const res = await authFetch(
        import.meta.env.VITE_API_URL + `/users/${editProfileData.id}/`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        }
      );
      // Get updated user from API
      const updatedUser = await res.json();
      setCurrentUser(updatedUser);
      setShowEditProfile(false);
      setEditProfileImageFile(null);
    } catch {
      setShowEditProfile(false);
      setEditProfileImageFile(null);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError("Barcha maydonlarni to'ldiring");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Yangi parollar mos emas");
      return;
    }
    if (!currentUser) {
      setPasswordError("Foydalanuvchi aniqlanmadi");
      return;
    }
    setPasswordLoading(true);
    try {
      const token = localStorage.getItem('access');
      const res = await authFetch(
        import.meta.env.VITE_API_URL + `/users/${currentUser.id}/change_password/`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            old_password: oldPassword,
            new_password: newPassword
          })
        }
      );
      const data = await res.json();
      if (!data.success) {
        setPasswordError(
          typeof data.errors === 'object'
            ? Object.values(data.errors).join(', ')
            : data.message || 'Parolni o\'zgartirishda xatolik'
        );
      } else {
        setPasswordSuccess(data.message || "Parol muvaffaqiyatli o'zgartirildi");
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setShowPasswordModal(false), 1500);
      }
    } catch {
      setPasswordError("Parolni o'zgartirishda xatolik yuz berdi");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 shadow-sm`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className={darkMode ? 'text-white hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Настройки
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className={darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50'}
              title="Chiqish"
            >
              <LogOut className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={darkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-blue-50'}
              onClick={handleEditProfileOpen}
            >
              Изм.
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* User Profile */}
        <Card className={`mb-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gray-300 rounded-full mb-4 flex items-center justify-center overflow-hidden">
                {currentUser?.image ? (
                  <img src={currentUser.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-gray-400" />
                )}
              </div>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {currentUser?.first_name} {currentUser?.last_name}
              </h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {currentUser?.phone_number}
              </p>
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {currentUser?.role}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Admin Badge */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {currentUser?.first_name} {currentUser?.last_name}
          </span>
        </div>

        {/* Menu Items */}
        <div className="space-y-3">
          {/* User Management */}
          <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <CardContent className="p-4">
              <button
                onClick={onUserManagement}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Добавить аккаунт
                  </span>
                </div>
                <div className="w-5 h-5 text-gray-400">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
            </CardContent>
          </Card>

          {/* Saved Messages */}
          <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <CardContent className="p-4">
              <button
                onClick={onSavedMessages}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Избранное
                  </span>
                </div>
                <div className="w-5 h-5 text-gray-400">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
            </CardContent>
          </Card>

          {/* Bloknot */}
          <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <CardContent className="p-4">
              <button
                onClick={() => window.location.assign('/notes')}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Bloknot
                  </span>
                </div>
                <div className="w-5 h-5 text-gray-400">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
            </CardContent>
          </Card>

          {/* Archive */}
          <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <CardContent className="p-4">
              <button
                onClick={onArchive}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Archive className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Архив
                  </span>
                </div>
                <div className="w-5 h-5 text-gray-400">
                  <svg viewBox="0 0 20 20" fill="currentColor"></svg>
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  {/* </svg> */}
                </div>
              </button>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <CardContent className="p-4">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Parolni o'zgartirish
                  </span>
                </div>
                <div className="w-5 h-5 text-gray-400">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
            </CardContent>
          </Card>
        </div>


        {/* Floating Add Note Button */}
        <div className="fixed bottom-24 right-6 z-50">
          <Button
            onClick={() => navigate('/notes/new')}
            className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg text-white"
          >
            <Plus size={24} />
          </Button>
        </div>
      </div>

      {/* Edit Profile Modal (centered but lower on the screen) */}
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent
          className={`max-w-lg w-full mx-auto ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          style={{
            position: 'fixed',
            left: '50%',
            transform: 'translate(-50%, -120%)',
            bottom: 'auto',
            top: 'unset',
            margin: 0,
            borderRadius: '1.5rem',
          }}
        >
          <DialogHeader>
            <DialogTitle className={darkMode ? 'text-white' : 'text-black'}>
              Profilni tahrirlash
            </DialogTitle>
          </DialogHeader>
          {editProfileData && (
            <form
              onSubmit={e => {
                e.preventDefault();
                handleEditProfileSave();
              }}
              className="space-y-4"
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200">
                    <img
                      src={
                        editProfileImageFile
                          ? URL.createObjectURL(editProfileImageFile)
                          : editProfileData.image
                      }
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <label
                    htmlFor="edit-profile-image-upload"
                    className="absolute bottom-0 right-0 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600"
                    style={{ border: '2px solid white' }}
                  >
                    <Plus className="text-white" size={16} />
                  </label>
                  <input
                    id="edit-profile-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) setEditProfileImageFile(file);
                    }}
                  />
                </div>
              </div>
              <div>
                <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Ism</label>
                <input
                  className={`w-full rounded border px-3 py-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  value={editProfileData.first_name}
                  onChange={e => setEditProfileData({ ...editProfileData, first_name: e.target.value })}
                />
              </div>
              <div>
                <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Familya</label>
                <input
                  className={`w-full rounded border px-3 py-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  value={editProfileData.last_name}
                  onChange={e => setEditProfileData({ ...editProfileData, last_name: e.target.value })}
                />
              </div>
              <div>
                <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Telefon</label>
                <input
                  className={`w-full rounded border px-3 py-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  value={editProfileData.phone_number}
                  onChange={e => setEditProfileData({ ...editProfileData, phone_number: e.target.value })}
                />
              </div>
              <div>
                <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Username</label>
                <input
                  className={`w-full rounded border px-3 py-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  value={editProfileData.username}
                  onChange={e => setEditProfileData({ ...editProfileData, username: e.target.value })}
                />
              </div>
              <div className="flex space-x-4 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowEditProfile(false);
                    setEditProfileImageFile(null);
                  }}
                >
                  Bekor qilish
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                >
                  Saqlash
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Password Change Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className={`max-w-lg w-full mx-auto ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <DialogHeader>
            <DialogTitle className={darkMode ? 'text-white' : 'text-black'}>
              Parolni o'zgartirish
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={e => {
              e.preventDefault();
              handlePasswordChange();
            }}
            className="space-y-4"
          >
            <div>
              <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Eski parol</label>
              <div className="relative">
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  className={`w-full rounded border px-3 py-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowOldPassword(v => !v)}
                  tabIndex={-1}
                >
                  {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Yangi parol</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  className={`w-full rounded border px-3 py-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowNewPassword(v => !v)}
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Yangi parolni tasdiqlang</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`w-full rounded border px-3 py-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowConfirmPassword(v => !v)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {passwordError && (
              <div className="text-red-500 text-sm">{passwordError}</div>
            )}
            {passwordSuccess && (
              <div className="text-green-500 text-sm">{passwordSuccess}</div>
            )}
            <div className="flex space-x-4 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowPasswordModal(false);
                  setOldPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                  setPasswordSuccess('');
                }}
              >
                Bekor qilish
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-500 hover:bg-blue-600"
                disabled={passwordLoading}
              >
                Saqlash
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

          </div>
  );
};

export default Settings;
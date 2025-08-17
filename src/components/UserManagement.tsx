import React, { useState } from 'react';
import { ArrowLeft, Search, X, MoreHorizontal, Plus, Trash2, Eye, EyeOff, Camera, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  username: string;
  password: string;
  image: string;
}

interface UserManagementProps {
  onBack: () => void;
  darkMode: boolean;
}

const UserManagement: React.FC<UserManagementProps> = ({ onBack, darkMode }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      firstName: "Шахбоз",
      lastName: "Расулов",
      phone: "+998 91 234 70 72",
      username: "shahboz",
      password: "password123",
      image: "/lovable-uploads/d086db43-3f49-4444-a5ce-8e89072f4602.png"
    },
    {
      id: 2,
      firstName: "Абдурашид",
      lastName: "Умурзаков",
      phone: "+998 90 123 45 67",
      username: "abdurashid",
      password: "password456",
      image: "/lovable-uploads/d086db43-3f49-4444-a5ce-8e89072f4602.png"
    }
  ]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: '',
    image: ''
  });

  const [errors, setErrors] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });

  const filteredUsers = users.filter(user =>
    user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone.includes(searchQuery)
  );

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      username: '',
      password: '',
      confirmPassword: '',
      image: ''
    });
    setErrors({
      username: '',
      password: '',
      confirmPassword: ''
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleDeleteUser = (userId: number) => {
    setUsers(users.filter(user => user.id !== userId));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, image: imageUrl }));
    }
  };

  const handleEditImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editingUser) {
      const imageUrl = URL.createObjectURL(file);
      setEditingUser(prev => prev ? ({ ...prev, image: imageUrl }) : null);
    }
  };

  const handleAddUser = () => {
    const newErrors = { username: '', password: '', confirmPassword: '' };
    let hasErrors = false;

    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.phone.trim() || !formData.username.trim() || !formData.password.trim()) {
      return;
    }

    if (users.some(user => user.username === formData.username)) {
      newErrors.username = 'Bu username mavjud, iltimos boshqa username kiriting';
      hasErrors = true;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Parollar mos kelmadi';
      hasErrors = true;
    }

    if (formData.password.length < 6) {
      newErrors.password = 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak';
      hasErrors = true;
    }

    setErrors(newErrors);

    if (!hasErrors) {
      const newUser: User = {
        id: Math.max(...users.map(u => u.id)) + 1,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        username: formData.username.trim(),
        password: formData.password,
        image: formData.image || "/lovable-uploads/d086db43-3f49-4444-a5ce-8e89072f4602.png"
      };

      setUsers([...users, newUser]);
      resetForm();
      setShowAddForm(false);
    }
  };

  const handleEditUser = () => {
    if (editingUser) {
      setUsers(users.map(user => 
        user.id === editingUser.id ? editingUser : user
      ));
      setEditingUser(null);
    }
  };

  const handleCancelAddForm = () => {
    resetForm();
    setShowAddForm(false);
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
  };

  const handleEditClick = (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingUser({ ...user });
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`px-4 py-4 flex items-center justify-between shadow-sm ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex items-center space-x-4">
          <button onClick={onBack}>
            <ArrowLeft className="text-blue-500" size={24} />
          </button>
          <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Управление пользователями
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => setIsSearchOpen(!isSearchOpen)}>
            <Search className="text-blue-500" size={24} />
          </button>
          <MoreHorizontal className="text-blue-500" size={24} />
        </div>
      </div>

      {/* Search Bar */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
        isSearchOpen ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className={`px-4 py-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="relative">
            <Input
              type="text"
              placeholder="Поиск пользователей..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pr-10 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
              }`}
            />
            <button
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery('');
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <X className="text-gray-400" size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="flex-1 px-4 py-4 ">
        <div className={`rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className={`flex items-center justify-between p-4 border-b last:border-b-0 cursor-pointer ${
                darkMode 
                  ? 'border-gray-700 hover:bg-gray-700' 
                  : 'border-gray-100 hover:bg-gray-50'
              }`}
              onClick={() => handleUserClick(user)}
            >
              <div className="flex items-center flex-1">
                <div className="w-12 h-12 rounded-full overflow-hidden mr-3">
                  <img 
                    src={user.image} 
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user.firstName} {user.lastName}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    @{user.username} • {user.phone}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => handleEditClick(user, e)}
                  className="p-2 bg-blue-500 hover:bg-blue-600 rounded-lg"
                >
                  <Edit size={16} className="text-white" />
                </button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 bg-red-500 hover:bg-red-600 rounded-lg"
                    >
                      <Trash2 size={16} className="text-white" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent
                    className={darkMode ? 'bg-gray-800 border-gray-700' : ''}
                    onOpenAutoFocus={e => e.preventDefault()} // Prevent focus bug
                  >
                    <AlertDialogHeader>
                      <AlertDialogTitle className={darkMode ? 'text-white' : ''}>
                        Пользователя удалить?
                      </AlertDialogTitle>
                      <AlertDialogDescription className={darkMode ? 'text-gray-300' : ''}>
                        Вы уверены, что хотите удалить пользователя {user.firstName} {user.lastName}?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        type="button"
                        className={darkMode ? 'bg-gray-700 text-white border-gray-600' : ''}
                      >
                        Отмена
                      </AlertDialogCancel>
                      <AlertDialogAction
                        type="button"
                        onClick={() => handleDeleteUser(user.id)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Удалить
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add User Button */}
      <div className="fixed bottom-24 right-6">
        <Button 
          onClick={() => setShowAddForm(true)}
          className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg"
        >
          <Plus size={24} className="text-white" />
        </Button>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className={`w-full rounded-t-3xl p-6 transition-transform duration-300 animate-slide-in-right ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>
            <h3 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-black'}`}>
              Добавить пользователя
            </h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {/* Profile Image Upload */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200">
                    {formData.image ? (
                      <img 
                        src={formData.image} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera size={24} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  <label 
                    htmlFor="add-user-image-upload"
                    className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600"
                  >
                    <Plus size={12} className="text-white" />
                  </label>
                  <input
                    id="add-user-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Имя</Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                  />
                </div>
                <div>
                  <Label className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Фамилия</Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                  />
                </div>
              </div>
              <div>
                <Label className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Телефон</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+998 90 123 45 67"
                  className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
              <div>
                <Label className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Username</Label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
                {errors.username && (
                  <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                )}
              </div>
              <div>
                <Label className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Пароль</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>
              <div>
                <Label className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Подтвердить пароль</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
            <div className="flex space-x-4 mt-6 mb-12">
              <Button
                onClick={handleCancelAddForm}
                variant="outline"
                className="flex-1"
              >
                Отмена
              </Button>
              <Button
                onClick={handleAddUser}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
              >
                Добавить
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <DialogHeader>
            <DialogTitle className={darkMode ? 'text-white' : 'text-black'}>
              Информация о пользователе
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full overflow-hidden">
                  <img 
                    src={selectedUser.image} 
                    alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div>
                <Label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Полное имя
                </Label>
                <p className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedUser.firstName} {selectedUser.lastName}
                </p>
              </div>
              <div>
                <Label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Телефон
                </Label>
                <p className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedUser.phone}
                </p>
              </div>
              <div>
                <Label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Username
                </Label>
                <p className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  @{selectedUser.username}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <DialogHeader>
            <DialogTitle className={darkMode ? 'text-white' : 'text-black'}>
              Редактировать пользователя
            </DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              {/* Profile Image Upload */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full overflow-hidden">
                    <img 
                      src={editingUser.image} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <label 
                    htmlFor="edit-user-image-upload"
                    className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600"
                  >
                    <Camera size={12} className="text-white" />
                  </label>
                  <input
                    id="edit-user-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Имя</Label>
                  <Input
                    value={editingUser.firstName}
                    onChange={(e) => setEditingUser({...editingUser, firstName: e.target.value})}
                    className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                  />
                </div>
                <div>
                  <Label className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Фамилия</Label>
                  <Input
                    value={editingUser.lastName}
                    onChange={(e) => setEditingUser({...editingUser, lastName: e.target.value})}
                    className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                  />
                </div>
              </div>
              <div>
                <Label className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Телефон</Label>
                <Input
                  value={editingUser.phone}
                  onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                  className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
              <div>
                <Label className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Username</Label>
                <Input
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                  className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>

              <div className="flex space-x-4 mt-6">
                <Button
                  onClick={() => setEditingUser(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleEditUser}
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                >
                  Сохранить
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;

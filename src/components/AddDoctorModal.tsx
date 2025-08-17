import React, { useState } from 'react';
import { X, User, Phone, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  phone: string;
}

interface AddDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDoctor: (doctor: Omit<Doctor, 'id'>) => void;
  darkMode: boolean;
}

const AddDoctorModal: React.FC<AddDoctorModalProps> = ({ 
  isOpen, 
  onClose, 
  onAddDoctor, 
  darkMode 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    phone: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.specialty.trim() || !formData.phone.trim()) {
      toast({
        title: "Ошибка",
        description: "Заполните все поля",
        variant: "destructive",
      });
      return;
    }

    // Validate phone number format
    const phoneRegex = /^\+998\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast({
        title: "Ошибка",
        description: "Введите корректный номер телефона (+998XXXXXXXXX)",
        variant: "destructive",
      });
      return;
    }

    onAddDoctor(formData);
    setFormData({ name: '', specialty: '', phone: '' });
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
      <div className={`w-full max-w-md rounded-lg shadow-xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Добавить врача
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <Label className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2 block`}>
              <User className="w-4 h-4 inline mr-2" />
              Имя врача
            </Label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Введите имя врача"
              className={`${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
              required
            />
          </div>

          <div>
            <Label className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2 block`}>
              <Stethoscope className="w-4 h-4 inline mr-2" />
              Специальность
            </Label>
            <Input
              type="text"
              value={formData.specialty}
              onChange={(e) => handleInputChange('specialty', e.target.value)}
              placeholder="Введите специальность"
              className={`${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
              required
            />
          </div>

          <div>
            <Label className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2 block`}>
              <Phone className="w-4 h-4 inline mr-2" />
              Телефон
            </Label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+998901234567"
              className={`${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className={`${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}`}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Добавить врача
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDoctorModal;

import React, { useState } from 'react';
import { ArrowLeft, Search, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Medicine {
  id: number;
  name: string;
  quantity: number;
}

interface ReturnScreenProps {
  pharmacyName: string;
  onBack: () => void;
  darkMode: boolean;
}

const ReturnScreen: React.FC<ReturnScreenProps> = ({ pharmacyName, onBack, darkMode }) => {
  const [medicines, setMedicines] = useState<Medicine[]>([
    { id: 1, name: "Цитромон 250 mg x 8.5 шт.", quantity: 1.5 },
    { id: 2, name: "Тримол таб. x 5.5 шт.", quantity: 4.5 },
    { id: 3, name: "Тримол таб. x 5 шт.", quantity: 5 },
    { id: 4, name: "Тримол таб. x 3 шт.", quantity: 7 },
    { id: 5, name: "Тримол таб. x 4 шт.", quantity: 6 },
    { id: 6, name: "Тримол таб. x 7 шт.", quantity: 3 }
  ]);

  const handleQuantityChange = (id: number, change: number) => {
    setMedicines(medicines.map(medicine => 
      medicine.id === id 
        ? { ...medicine, quantity: Math.max(0, medicine.quantity + change) }
        : medicine
    ));
  };

  const handleSave = () => {
    console.log('Saving changes:', medicines);
    // Here you would typically save the changes to your backend
    onBack();
  };

  const totalSum = "835 000 сум"; // This would be calculated based on quantities

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`px-4 py-4 flex items-center justify-between shadow-sm ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex items-center space-x-4">
          <button onClick={onBack}>
            <ArrowLeft className="text-blue-500" size={24} />
          </button>
          <div>
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {pharmacyName}
            </h1>
            <p className="text-sm text-gray-500">+998 91 234 70 72</p>
          </div>
        </div>
        <button className="text-blue-500">
          <Search size={24} />
        </button>
      </div>

      {/* Info Section */}
      <div className={`px-4 py-3 border-b ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <button className="flex items-center justify-between w-full">
          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            ИНФОРМАЦИЯ О ВОЗВРАТАХ
          </span>
          <span className="text-gray-400">›</span>
        </button>
      </div>

      {/* Medicines List */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {medicines.map((medicine, index) => (
          <div key={medicine.id} className={`px-4 py-4 flex justify-between items-center border-b ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          } last:border-b-0`}>
            <div className="flex-1">
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-400'} mr-3`}>
                0{index + 1}
              </span>
              <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {medicine.name}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleQuantityChange(medicine.id, -0.5)}
                className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center"
              >
                <Minus size={16} className="text-white" />
              </button>
              <span className={`min-w-[40px] text-center font-medium ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {medicine.quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(medicine.id, 0.5)}
                className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center"
              >
                <Plus size={16} className="text-white" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="fixed bottom-0 left-0 right-0 bg-blue-500 p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-white text-sm">Итого:</span>
          <span className="text-white text-xl font-bold">{totalSum}</span>
        </div>
        <Button 
          onClick={handleSave}
          className="w-full bg-white text-blue-500 hover:bg-gray-100 py-3 rounded-lg font-medium"
        >
          Сохранить
        </Button>
      </div>
    </div>
  );
};

export default ReturnScreen;

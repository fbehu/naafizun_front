import React, { useState } from 'react';
import { X, Search, Package, Calculator, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';

interface Medicine {
  id: number;
  name: string;
  dosage: string;
  pills_per_package: number;
  price_per_package: number;
  price_per_pill: number;
  price_type: string;
  stock_quantity: number;
}

interface Pharmacy {
  id: number;
  name: string;
  address: string;
}

interface AddMedicineItem {
  medicine: Medicine;
  quantity: number;
  packages: number;
  totalPrice: number;
}

interface AddMedicineToDoctorProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMedicine: (medicines: AddMedicineItem[], pharmacies: Pharmacy[]) => void;
  medicines: Medicine[];
  pharmacies: Pharmacy[];
  darkMode: boolean;
}

const AddMedicineToDoctor: React.FC<AddMedicineToDoctorProps> = ({
  isOpen,
  onClose,
  onAddMedicine,
  medicines,
  pharmacies,
  darkMode
}) => {
  const [selectedPharmacies, setSelectedPharmacies] = useState<Pharmacy[]>([]);
  const [pharmacySearchQuery, setPharmacySearchQuery] = useState('');
  const [medicineSearchQuery, setMedicineSearchQuery] = useState('');
  const [selectedMedicines, setSelectedMedicines] = useState<AddMedicineItem[]>([]);
  const [showMedicineSearch, setShowMedicineSearch] = useState(false);

  const filteredPharmacies = pharmacies.filter(pharmacy =>
    pharmacy.name.toLowerCase().includes(pharmacySearchQuery.toLowerCase()) ||
    pharmacy.address.toLowerCase().includes(pharmacySearchQuery.toLowerCase())
  );

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(medicineSearchQuery.toLowerCase()) &&
    !selectedMedicines.find(sm => sm.medicine.id === medicine.id)
  );

  const handlePharmacySelect = (pharmacy: Pharmacy) => {
    if (!selectedPharmacies.find(p => p.id === pharmacy.id)) {
      setSelectedPharmacies([...selectedPharmacies, pharmacy]);
    }
    setPharmacySearchQuery('');
  };

  const handlePharmacyRemove = (pharmacyId: number) => {
    setSelectedPharmacies(selectedPharmacies.filter(p => p.id !== pharmacyId));
  };

  const handleMedicineSelect = (medicine: Medicine) => {
    const newMedicineItem: AddMedicineItem = {
      medicine,
      quantity: 1,
      packages: 1,
      totalPrice: calculatePrice(medicine, 1, 1)
    };
    setSelectedMedicines([...selectedMedicines, newMedicineItem]);
    setMedicineSearchQuery('');
    setShowMedicineSearch(false);
  };

  const calculatePrice = (medicine: Medicine, quantity: number, packages: number): number => {
    const totalPills = quantity * packages;
    const pricePerPill = medicine.price_type === 'pill' 
      ? medicine.price_per_pill 
      : medicine.price_per_package / medicine.pills_per_package;
    
    return totalPills * pricePerPill;
  };

  const updateMedicineItem = (index: number, field: 'quantity' | 'packages', value: number) => {
    const updatedMedicines = [...selectedMedicines];
    updatedMedicines[index] = {
      ...updatedMedicines[index],
      [field]: value,
      totalPrice: calculatePrice(
        updatedMedicines[index].medicine,
        field === 'quantity' ? value : updatedMedicines[index].quantity,
        field === 'packages' ? value : updatedMedicines[index].packages
      )
    };
    setSelectedMedicines(updatedMedicines);
  };

  const removeMedicine = (index: number) => {
    setSelectedMedicines(selectedMedicines.filter((_, i) => i !== index));
  };

  const getTotalStats = () => {
    const totalQuantity = selectedMedicines.reduce((sum, item) => sum + (item.quantity * item.packages), 0);
    const totalPrice = selectedMedicines.reduce((sum, item) => sum + item.totalPrice, 0);
    return { totalQuantity, totalPrice };
  };

  const handleSubmit = () => {
    if (selectedPharmacies.length === 0) {
      toast({
        title: "Ошибка",
        description: "Выберите хотя бы одну аптеку",
        variant: "destructive",
      });
      return;
    }

    if (selectedMedicines.length === 0) {
      toast({
        title: "Ошибка",
        description: "Добавьте хотя бы одно лекарство",
        variant: "destructive",
      });
      return;
    }

    onAddMedicine(selectedMedicines, selectedPharmacies);
    
    // Reset form
    setSelectedPharmacies([]);
    setSelectedMedicines([]);
    setPharmacySearchQuery('');
    setMedicineSearchQuery('');
    setShowMedicineSearch(false);
    onClose();
  };

  const stats = getTotalStats();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
      <div className={`w-full max-w-2xl max-h-[90vh] rounded-lg shadow-xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Выдать лекарства врачу
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

        <div className="p-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
          <div className="space-y-6">
            {/* Pharmacy Selection */}
            <div>
              <Label className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2 block`}>
                Выберите аптеки
              </Label>
              <div className="relative">
                <Input
                  type="text"
                  value={pharmacySearchQuery}
                  onChange={(e) => setPharmacySearchQuery(e.target.value)}
                  placeholder="Поиск аптек..."
                  className={`${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                />
                <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
              </div>
              
              {pharmacySearchQuery && (
                <div className={`mt-2 max-h-40 overflow-y-auto border rounded-md ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-white'}`}>
                  {filteredPharmacies.map(pharmacy => (
                    <div
                      key={pharmacy.id}
                      onClick={() => handlePharmacySelect(pharmacy)}
                      className={`p-2 cursor-pointer hover:bg-gray-100 ${darkMode ? 'hover:bg-gray-600 text-white' : 'text-gray-900'}`}
                    >
                      <div className="font-medium">{pharmacy.name}</div>
                      <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        {pharmacy.address}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedPharmacies.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedPharmacies.map(pharmacy => (
                    <Badge
                      key={pharmacy.id}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {pharmacy.name}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePharmacyRemove(pharmacy.id)}
                        className="p-0 h-4 w-4 hover:bg-transparent"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Medicine Selection */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Лекарства
                </Label>
                <Button
                  type="button"
                  onClick={() => setShowMedicineSearch(!showMedicineSearch)}
                  className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Добавить лекарство
                </Button>
              </div>

              {showMedicineSearch && (
                <div className="mb-4">
                  <div className="relative">
                    <Input
                      type="text"
                      value={medicineSearchQuery}
                      onChange={(e) => setMedicineSearchQuery(e.target.value)}
                      placeholder="Поиск лекарств..."
                      className={`${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                    />
                    <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                  </div>
                  
                  {medicineSearchQuery && (
                    <div className={`mt-2 max-h-40 overflow-y-auto border rounded-md ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-white'}`}>
                      {filteredMedicines.map(medicine => (
                        <div
                          key={medicine.id}
                          onClick={() => handleMedicineSelect(medicine)}
                          className={`p-2 cursor-pointer hover:bg-gray-100 ${darkMode ? 'hover:bg-gray-600 text-white' : 'text-gray-900'}`}
                        >
                          <div className="font-medium">{medicine.name}</div>
                          <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            {medicine.dosage} • Остаток: {medicine.stock_quantity}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Selected Medicines */}
              <div className="space-y-3">
                {selectedMedicines.map((item, index) => (
                  <Card key={index} className={`${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50'}`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {item.medicine.name}
                          </h4>
                          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            {item.medicine.dosage}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMedicine(index)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <Label className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Количество (шт)
                          </Label>
                          <div className="flex items-center gap-1 mt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateMedicineItem(index, 'quantity', Math.max(1, item.quantity - 1))}
                              className="p-1 h-8 w-8"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateMedicineItem(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                              className={`text-center h-8 ${darkMode ? 'bg-gray-600 border-gray-500' : ''}`}
                              min="1"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateMedicineItem(index, 'quantity', item.quantity + 1)}
                              className="p-1 h-8 w-8"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <Label className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Упаковки
                          </Label>
                          <div className="flex items-center gap-1 mt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateMedicineItem(index, 'packages', Math.max(1, item.packages - 1))}
                              className="p-1 h-8 w-8"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <Input
                              type="number"
                              value={item.packages}
                              onChange={(e) => updateMedicineItem(index, 'packages', Math.max(1, parseInt(e.target.value) || 1))}
                              className={`text-center h-8 ${darkMode ? 'bg-gray-600 border-gray-500' : ''}`}
                              min="1"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateMedicineItem(index, 'packages', item.packages + 1)}
                              className="p-1 h-8 w-8"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`flex justify-between items-center text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <span>Общее количество: {item.quantity * item.packages} шт</span>
                        <span className="font-medium">
                          {item.totalPrice.toLocaleString()} сум
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Total Summary */}
            {selectedMedicines.length > 0 && (
              <Card className={`${darkMode ? 'bg-blue-900/20 border-blue-500' : 'bg-blue-50 border-blue-200'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="w-4 h-4 text-blue-500" />
                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Итоговая сумма
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Общее количество
                      </div>
                      <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {stats.totalQuantity} шт
                      </div>
                    </div>
                    <div>
                      <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Общая стоимость
                      </div>
                      <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {stats.totalPrice.toLocaleString()} сум
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className={`${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}`}
          >
            Отмена
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            className="bg-blue-500 hover:bg-blue-600 text-white"
            disabled={selectedPharmacies.length === 0 || selectedMedicines.length === 0}
          >
            Выдать лекарства
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddMedicineToDoctor;
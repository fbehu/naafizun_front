import React, { useState } from 'react';
import { Search, User, Plus, Package, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import AddDoctorModal from '@/components/AddDoctorModal';
import AddMedicineToDoctor from '@/components/AddMedicineToDoctor';
import DoctorSMSPanel from '@/components/DoctorSMSPanel';

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  phone: string;
}

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

interface DoctorMedicine {
  id: number;
  medicine: Medicine;
  quantity: number;
  packages: number;
  total_price: number;
  pharmacies: Pharmacy[];
}

interface DoctorsTableProps {
  darkMode: boolean;
  onBack: () => void;
  medicines: Medicine[];
  pharmacies: Pharmacy[];
}

const DoctorsTable: React.FC<DoctorsTableProps> = ({ darkMode, onBack, medicines, pharmacies }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);
  const [isAddMedicineOpen, setIsAddMedicineOpen] = useState(false);
  const [isSmsOpen, setIsSmsOpen] = useState(false);

  // Mock doctors data with demo data
  const [doctors, setDoctors] = useState<Doctor[]>([
    { id: 1, name: 'Доктор Алиев Ахмад', specialty: 'Терапевт', phone: '+998901234567' },
    { id: 2, name: 'Доктор Каримова Малика', specialty: 'Кардиолог', phone: '+998901234568' },
    { id: 3, name: 'Доктор Рустамов Бобур', specialty: 'Невролог', phone: '+998901234569' },
    { id: 4, name: 'Доктор Исмаилова Нигора', specialty: 'Педиатр', phone: '+998901234570' },
    { id: 5, name: 'Доктор Холматов Азиз', specialty: 'Хирург', phone: '+998901234571' },
    { id: 6, name: 'Доктор Юсупова Дилфуза', specialty: 'Гинеколог', phone: '+998901234572' },
  ]);

  // Mock doctor medicines data
  const [allDoctorMedicines, setAllDoctorMedicines] = useState<{ [key: number]: DoctorMedicine[] }>({
    1: [
      { 
        id: 1, 
        medicine: { id: 1, name: 'Парацетамол', dosage: '500мг', pills_per_package: 20, price_per_package: 15000, price_per_pill: 750, price_type: 'package', stock_quantity: 100 }, 
        quantity: 20, 
        packages: 1, 
        total_price: 15000,
        pharmacies: [{ id: 1, name: 'Аптека №1', address: 'ул. Пушкина, 12' }]
      },
      { 
        id: 2, 
        medicine: { id: 2, name: 'Ибупрофен', dosage: '400мг', pills_per_package: 10, price_per_package: 25000, price_per_pill: 2500, price_type: 'package', stock_quantity: 50 }, 
        quantity: 10, 
        packages: 2, 
        total_price: 50000,
        pharmacies: [{ id: 2, name: 'Аптека №2', address: 'ул. Лермонтова, 25' }]
      },
    ],
    2: [
      { 
        id: 3, 
        medicine: { id: 3, name: 'Аспирин', dosage: '100мг', pills_per_package: 30, price_per_package: 12000, price_per_pill: 400, price_type: 'package', stock_quantity: 80 }, 
        quantity: 30, 
        packages: 1, 
        total_price: 12000,
        pharmacies: [{ id: 1, name: 'Аптека №1', address: 'ул. Пушкина, 12' }]
      },
    ],
    3: [
      { 
        id: 4, 
        medicine: { id: 4, name: 'Витамин D3', dosage: '1000 МЕ', pills_per_package: 60, price_per_package: 45000, price_per_pill: 750, price_type: 'package', stock_quantity: 30 }, 
        quantity: 60, 
        packages: 1, 
        total_price: 45000,
        pharmacies: [{ id: 3, name: 'Аптека №3', address: 'ул. Гоголя, 8' }]
      },
    ]
  });

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddDoctor = (doctorData: Omit<Doctor, 'id'>) => {
    const newDoctor: Doctor = {
      id: Math.max(...doctors.map(d => d.id), 0) + 1,
      ...doctorData
    };

    setDoctors([...doctors, newDoctor]);
    
    toast({
      title: "Успех",
      description: "Врач успешно добавлен",
    });
  };

  const handleAddMedicineToDoctor = (medicineItems: any[], selectedPharmacies: Pharmacy[]) => {
    if (!selectedDoctor) return;

    const newMedicines: DoctorMedicine[] = medicineItems.map(item => ({
      id: Date.now() + Math.random(),
      medicine: item.medicine,
      quantity: item.quantity,
      packages: item.packages,
      total_price: item.totalPrice,
      pharmacies: selectedPharmacies
    }));

    const currentMedicines = allDoctorMedicines[selectedDoctor.id] || [];
    setAllDoctorMedicines({
      ...allDoctorMedicines,
      [selectedDoctor.id]: [...currentMedicines, ...newMedicines]
    });
    
    const totalPrice = medicineItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalQuantity = medicineItems.reduce((sum, item) => sum + (item.quantity * item.packages), 0);
    
    toast({
      title: "Успех",
      description: `Выдано ${totalQuantity} шт лекарств на сумму ${totalPrice.toLocaleString()} сум`,
    });
  };

  const getCurrentDoctorMedicines = () => {
    if (!selectedDoctor) return [];
    return allDoctorMedicines[selectedDoctor.id] || [];
  };

  const getTotalMedicineStats = () => {
    const medicines = getCurrentDoctorMedicines();
    const totalQuantity = medicines.reduce((sum, med) => sum + (med.quantity * med.packages), 0);
    const totalValue = medicines.reduce((sum, med) => sum + med.total_price, 0);
    return { totalQuantity, totalValue };
  };

  if (selectedDoctor) {
    const doctorMedicines = getCurrentDoctorMedicines();
    const stats = getTotalMedicineStats();

    return (
      <div className={`min-h-screen pb-20 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 shadow-sm`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setSelectedDoctor(null)}>
                <span>←</span>
              </Button>
              <h1 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {selectedDoctor.name}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                size="icon"
                onClick={() => setIsSmsOpen(true)}
                aria-label="SMS"
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
              <Button 
                onClick={() => setIsAddMedicineOpen(true)} 
                className="bg-blue-500 hover:bg-blue-600 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Добавить лекарство</span>
                <span className="sm:hidden">Добавить</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <CardHeader>
              <CardTitle className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Информация о враче
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Специальность</Label>
                  <p className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedDoctor.specialty}</p>
                </div>
                <div>
                  <Label className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Телефон</Label>
                  <p className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedDoctor.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Статистика */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Общее количество лекарств
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.totalQuantity} шт
                </div>
              </CardContent>
            </Card>

            <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Общая стоимость
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.totalValue.toLocaleString()} сум
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <CardHeader>
              <CardTitle className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Выданные лекарства
              </CardTitle>
            </CardHeader>
            <CardContent>
              {doctorMedicines.length > 0 ? (
                <ScrollArea className="h-64">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Препарат</TableHead>
                        <TableHead className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Количество</TableHead>
                        <TableHead className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Стоимость</TableHead>
                        <TableHead className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} hidden sm:table-cell`}>Аптеки</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {doctorMedicines.map((medicine) => (
                        <TableRow key={medicine.id}>
                          <TableCell>
                            <div>
                              <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {medicine.medicine.name}
                              </div>
                              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {medicine.medicine.dosage}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                            {medicine.quantity * medicine.packages} шт ({medicine.packages} уп)
                          </TableCell>
                          <TableCell className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                            {medicine.total_price.toLocaleString()} сум
                          </TableCell>
                          <TableCell className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} hidden sm:table-cell`}>
                            <div className="flex flex-wrap gap-1">
                              {medicine.pharmacies.map(pharmacy => (
                                <span 
                                  key={pharmacy.id}
                                  className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'}`}
                                >
                                  {pharmacy.name}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Лекарства не найдены
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add Medicine to Doctor Modal */}
        <AddMedicineToDoctor
          isOpen={isAddMedicineOpen}
          onClose={() => setIsAddMedicineOpen(false)}
          onAddMedicine={handleAddMedicineToDoctor}
          medicines={medicines}
          pharmacies={pharmacies}
          darkMode={darkMode}
        />

        {/* Doctor SMS Panel */}
        <DoctorSMSPanel
          isOpen={isSmsOpen}
          onClose={() => setIsSmsOpen(false)}
          doctor={{ id: selectedDoctor.id, name: selectedDoctor.name, phone: selectedDoctor.phone }}
          darkMode={darkMode}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-20 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 shadow-sm`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <span>←</span>
            </Button>
            <h1 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Врачи
            </h1>
          </div>
          <Button 
            onClick={() => setIsAddDoctorOpen(true)} 
            className="bg-blue-500 hover:bg-blue-600 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
          >
            <Plus className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Добавить врача</span>
            <span className="sm:hidden">Добавить</span>
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Поиск врачей..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`pl-10 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
          />
        </div>

        <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Имя</TableHead>
                    <TableHead className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Специальность</TableHead>
                    <TableHead className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} hidden sm:table-cell`}>Телефон</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDoctors.map((doctor) => (
                    <TableRow
                      key={doctor.id}
                      className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        darkMode ? 'border-gray-700' : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedDoctor(doctor)}
                    >
                      <TableCell className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span className="truncate">{doctor.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} truncate`}>
                        {doctor.specialty}
                      </TableCell>
                      <TableCell className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} hidden sm:table-cell`}>
                        {doctor.phone}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Doctor Modal */}
      <AddDoctorModal
        isOpen={isAddDoctorOpen}
        onClose={() => setIsAddDoctorOpen(false)}
        onAddDoctor={handleAddDoctor}
        darkMode={darkMode}
      />
    </div>
  );
};

export default DoctorsTable;
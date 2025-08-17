import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Plus, Calculator, Package2, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  phone: string;
  isActive: boolean;
}

interface Medicine {
  id: number;
  name: string;
  dosage: string;
  pills_per_package: number;
  price_per_package: number;
  price_per_pill: number;
  price_type: string;
  manufacturer: string;
}

interface DoctorMedicineTransaction {
  id: number;
  doctor: Doctor;
  medicine: Medicine;
  quantity_pills: number;
  quantity_packages: number;
  transaction_type: 'given' | 'used' | 'returned';
  price_per_unit: number;
  total_price: number;
  created_at: string;
}

interface DoctorMedicineStats {
  doctor: Doctor;
  givenPills: number;
  givenPackages: number;
  usedPills: number;
  usedPackages: number;
  remainingPills: number;
  remainingPackages: number;
  totalCost: number;
}

interface PolyclinicTransactionsTableProps {
  polyclinic: {
    id: number;
    name: string;
    address: string;
    phone: string;
    manager: string;
  };
  onBack: () => void;
  darkMode: boolean;
}

// Demo data for polyclinic doctors
const DEMO_DOCTORS: Doctor[] = [
  {
    id: 1,
    name: "Доктор Иванов",
    specialty: "Терапевт",
    phone: "+998901234567",
    isActive: true
  },
  {
    id: 2,
    name: "Доктор Петрова",
    specialty: "Кардиолог",
    phone: "+998901234568",
    isActive: true
  },
  {
    id: 3,
    name: "Доктор Сидоров",
    specialty: "Невролог",
    phone: "+998901234569",
    isActive: true
  }
];

const DEMO_MEDICINES: Medicine[] = [
  {
    id: 1,
    name: "Цитромон",
    dosage: "250 mg",
    pills_per_package: 8,
    price_per_package: 5000,
    price_per_pill: 625,
    price_type: "package",
    manufacturer: "Фармстандарт"
  },
  {
    id: 2,
    name: "Тримол",
    dosage: "500 mg",
    pills_per_package: 10,
    price_per_package: 8000,
    price_per_pill: 800,
    price_type: "package",
    manufacturer: "Узфарма"
  },
  {
    id: 3,
    name: "Парацетамол",
    dosage: "200 mg",
    pills_per_package: 20,
    price_per_package: 3000,
    price_per_pill: 150,
    price_type: "package",
    manufacturer: "Здоровье"
  }
];

const DEMO_TRANSACTIONS: DoctorMedicineTransaction[] = [
  // Доктор Иванов transactions
  {
    id: 1,
    doctor: DEMO_DOCTORS[0],
    medicine: DEMO_MEDICINES[0],
    quantity_pills: 8,
    quantity_packages: 50,
    transaction_type: 'given',
    price_per_unit: 625,
    total_price: 250000,
    created_at: '2025-07-29T10:00:00Z'
  },
  {
    id: 2,
    doctor: DEMO_DOCTORS[0],
    medicine: DEMO_MEDICINES[0],
    quantity_pills: 8,
    quantity_packages: 30,
    transaction_type: 'used',
    price_per_unit: 625,
    total_price: 150000,
    created_at: '2025-07-30T14:00:00Z'
  },
  // Доктор Петрова transactions
  {
    id: 3,
    doctor: DEMO_DOCTORS[1],
    medicine: DEMO_MEDICINES[1],
    quantity_pills: 10,
    quantity_packages: 40,
    transaction_type: 'given',
    price_per_unit: 800,
    total_price: 320000,
    created_at: '2025-07-29T11:00:00Z'
  },
  {
    id: 4,
    doctor: DEMO_DOCTORS[1],
    medicine: DEMO_MEDICINES[1],
    quantity_pills: 10,
    quantity_packages: 25,
    transaction_type: 'used',
    price_per_unit: 800,
    total_price: 200000,
    created_at: '2025-07-30T15:00:00Z'
  },
  // Доктор Сидоров transactions
  {
    id: 5,
    doctor: DEMO_DOCTORS[2],
    medicine: DEMO_MEDICINES[2],
    quantity_pills: 20,
    quantity_packages: 60,
    transaction_type: 'given',
    price_per_unit: 150,
    total_price: 180000,
    created_at: '2025-07-29T12:00:00Z'
  },
  {
    id: 6,
    doctor: DEMO_DOCTORS[2],
    medicine: DEMO_MEDICINES[2],
    quantity_pills: 20,
    quantity_packages: 35,
    transaction_type: 'used',
    price_per_unit: 150,
    total_price: 105000,
    created_at: '2025-07-30T16:00:00Z'
  }
];

const PolyclinicTransactionsTable: React.FC<PolyclinicTransactionsTableProps> = ({ 
  polyclinic, 
  onBack, 
  darkMode 
}) => {
  const [doctors] = useState<Doctor[]>(DEMO_DOCTORS);
  const [medicines] = useState<Medicine[]>(DEMO_MEDICINES);
  const [transactions] = useState<DoctorMedicineTransaction[]>(DEMO_TRANSACTIONS);
  const [doctorStats, setDoctorStats] = useState<DoctorMedicineStats[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    calculateDoctorStats();
  }, [doctors, medicines, transactions]);

  const calculateDoctorStats = () => {
    const stats = doctors.map(doctor => {
      const doctorTransactions = transactions.filter(t => t.doctor.id === doctor.id);
      
      const givenTransactions = doctorTransactions.filter(t => t.transaction_type === 'given');
      const usedTransactions = doctorTransactions.filter(t => t.transaction_type === 'used');
      
      const givenPills = givenTransactions.reduce((sum, t) => sum + (t.quantity_pills * t.quantity_packages), 0);
      const usedPills = usedTransactions.reduce((sum, t) => sum + (t.quantity_pills * t.quantity_packages), 0);
      const remainingPills = Math.max(0, givenPills - usedPills);
      
      const givenPackages = Math.floor(givenPills / 10); // Average pills per package
      const usedPackages = Math.floor(usedPills / 10);
      const remainingPackages = Math.floor(remainingPills / 10);
      
      const totalCost = doctorTransactions
        .filter(t => t.transaction_type === 'given')
        .reduce((sum, t) => sum + t.total_price, 0);
      
      return {
        doctor,
        givenPills,
        givenPackages,
        usedPills,
        usedPackages,
        remainingPills,
        remainingPackages,
        totalCost
      };
    });
    
    setDoctorStats(stats);
  };

  const filteredStats = doctorStats.filter(stat =>
    stat.doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stat.doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSummary = filteredStats.reduce((acc, stat) => ({
    totalGivenPills: acc.totalGivenPills + stat.givenPills,
    totalGivenPackages: acc.totalGivenPackages + stat.givenPackages,
    totalUsedPills: acc.totalUsedPills + stat.usedPills,
    totalUsedPackages: acc.totalUsedPackages + stat.usedPackages,
    totalRemainingPills: acc.totalRemainingPills + stat.remainingPills,
    totalRemainingPackages: acc.totalRemainingPackages + stat.remainingPackages,
    totalCost: acc.totalCost + stat.totalCost,
  }), {
    totalGivenPills: 0,
    totalGivenPackages: 0,
    totalUsedPills: 0,
    totalUsedPackages: 0,
    totalRemainingPills: 0,
    totalRemainingPackages: 0,
    totalCost: 0,
  });

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-4 shadow-sm border-b`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {polyclinic.name}
              </h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {polyclinic.phone}
              </p>
            </div>
          </div>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white">
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Поиск врачей..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Info section */}
      <div className={`mx-4 mb-4 p-4 rounded-lg border ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <Button
          variant="ghost"
          className={`w-full flex items-center justify-between p-0 h-auto ${
            darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="text-sm">ИНФОРМАЦИЯ О ВЫДАННЫХ ЛЕКАРСТВАХ ВРАЧАМ</span>
          <span>›</span>
        </Button>
      </div>

      {/* Main table matching the uploaded image design */}
      <div className={`mx-4 rounded-lg overflow-hidden ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Table header */}
        <div className={`grid grid-cols-4 p-4 border-b text-sm font-medium ${
          darkMode ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-600'
        }`}>
          <div>Выдано</div>
          <div>Использовано</div>
          <div>Остается</div>
          <div className="text-right">Стоимость</div>
        </div>

        {/* Summary row */}
        <div className={`grid grid-cols-4 p-4 border-b ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex flex-col">
            <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">
              {totalSummary.totalGivenPills.toLocaleString()}
            </span>
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Дона
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-red-600 dark:text-red-400 font-bold text-lg">
              {totalSummary.totalUsedPills.toLocaleString()}
            </span>
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Пачка
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-green-600 dark:text-green-400 font-bold text-lg">
              {totalSummary.totalRemainingPills.toLocaleString()}
            </span>
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Пачка
            </span>
          </div>
          <div className="text-right">
            <span className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {Math.round(totalSummary.totalCost).toLocaleString()} сум
            </span>
          </div>
        </div>

        {/* Individual doctors */}
        <ScrollArea className="max-h-96">
          {filteredStats.map((stat, index) => (
            <div
              key={stat.doctor.id}
              className={`grid grid-cols-4 p-4 border-b last:border-b-0 ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              <div className="flex flex-col">
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  {stat.givenPills.toLocaleString()}
                </span>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {stat.givenPackages} уп
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-red-600 dark:text-red-400 font-medium">
                  {stat.usedPills.toLocaleString()}
                </span>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {stat.usedPackages} уп
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {stat.remainingPills.toLocaleString()}
                </span>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {stat.remainingPackages} уп
                </span>
              </div>
              <div className="text-right flex flex-col">
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {Math.round(stat.totalCost).toLocaleString()} сум
                </span>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {stat.doctor.name}
                </span>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Bottom section for doctor details */}
      <div className="p-4 mt-6">
        <div className={`rounded-lg p-4 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Детали по врачам
          </h3>
          <ScrollArea className="max-h-60">
            {filteredStats.map((stat, index) => (
              <div
                key={stat.doctor.id}
                className={`p-3 border-b last:border-b-0 ${
                  darkMode ? 'border-gray-700' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {stat.doctor.name}
                      </span>
                    </div>
                    <div className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {stat.doctor.specialty} • {stat.doctor.phone}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-600 dark:text-green-400 font-medium">
                      {stat.remainingPills}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default PolyclinicTransactionsTable;
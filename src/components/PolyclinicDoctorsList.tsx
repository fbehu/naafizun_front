import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, User, Phone, Stethoscope, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from "sonner";

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  phone: string;
  is_active: boolean;
  products: any[];
  pharmacy: any[];
  archived: boolean;
  created_at: string;
  total_amount: number;
  debt_amount: number;
}

interface Polyclinic {
  id: number;
  name: string;
  address: string;
  phone: string;
  manager_name: string;
}

interface PolyclinicDoctorsListProps {
  polyclinic: Polyclinic;
  onBack: () => void;
  onDoctorClick: (doctor: Doctor) => void;
  darkMode: boolean;
}

const PolyclinicDoctorsList: React.FC<PolyclinicDoctorsListProps> = ({
  polyclinic,
  onBack,
  onDoctorClick,
  darkMode
}) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoctors();
  }, [polyclinic.id]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
      
      const response = await fetch(`${apiUrl}/polyclinic_doctors/?polyclinic=${polyclinic.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const doctorsList = Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : [];
      setDoctors(doctorsList);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setDoctors([]);
      toast.error('Не удалось загрузить данные врачей. Проверьте подключение к интернету.');
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeDoctors = filteredDoctors.filter(doctor => !doctor.archived && doctor.is_active);
  const totalDoctors = activeDoctors.length;
  const totalAmount = activeDoctors.reduce((sum, doctor) => sum + (doctor.total_amount || 0), 0);
  const totalDebt = activeDoctors.reduce((sum, doctor) => sum + (doctor.debt_amount || 0), 0);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-4 shadow-sm border-b sticky top-0 z-10`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Врачи поликлиники
              </h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {polyclinic.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {totalDoctors} врачей
            </Badge>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Поиск врачей по имени, специальности или телефону..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {totalDoctors}
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Всего врачей
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {Math.round(totalAmount).toLocaleString()}
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Общая сумма (сум)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <Package className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {Math.round(totalDebt).toLocaleString()}
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Общий долг (сум)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Doctors List */}
      <div className="px-4">
        <ScrollArea className="h-[calc(100vh-320px)]">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : activeDoctors.length === 0 ? (
            <Card className={`p-8 text-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <User className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-300'}`} />
              <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Врачи не найдены
              </h3>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'В данной поликлинике пока нет активных врачей'}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeDoctors.map((doctor) => (
                <Card
                  key={doctor.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => onDoctorClick(doctor)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <Stethoscope className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {doctor.name}
                          </h3>
                          <div className="flex items-center gap-4 mt-1">
                            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {doctor.specialty}
                            </span>
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {doctor.phone}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {(doctor.products || []).length} лекарств
                            </Badge>
                            {doctor.total_amount > 0 && (
                              <span className={`text-sm font-medium ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                                {Math.round(doctor.total_amount).toLocaleString()} сум
                              </span>
                            )}
                            {doctor.debt_amount > 0 && (
                              <span className={`text-sm font-medium ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                                Долг: {Math.round(doctor.debt_amount).toLocaleString()} сум
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-gray-400">
                        <span>›</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default PolyclinicDoctorsList;
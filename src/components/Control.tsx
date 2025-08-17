import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Settings, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useNotifications } from '@/hooks/useNotifications';
import api from '@/hooks/api-settings';
import { toast } from './ui/use-toast';

interface Pharmacy {
  id: number;
  name: string;
  address: string;
  phone: string;
  manager: string;
}

interface Polyclinic {
  id: number;
  name: string;
  address: string;
  phone: string;
  manager: string;
  archived: boolean;
}

interface Doctor {
  id: number;
  name: string;
  phone: string;
  specialization: string;
  polyclinic_id: number;
  archived: boolean;
}

interface ControlProps {
  darkMode: boolean;
}

const Control: React.FC<ControlProps> = ({ darkMode }) => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [polyclinics, setPolyclinics] = useState<Polyclinic[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isAddPharmacyOpen, setIsAddPharmacyOpen] = useState(false);
  const [isAddPolyclinicOpen, setIsAddPolyclinicOpen] = useState(false);
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);
  const [pharmacyName, setPharmacyName] = useState('');
  const [pharmacyAddress, setPharmacyAddress] = useState('');
  const [pharmacyPhone, setPharmacyPhone] = useState('');
  const [pharmacyManager, setPharmacyManager] = useState('');
  const [polyclinicName, setPolyclinicName] = useState('');
  const [polyclinicAddress, setPolyclinicAddress] = useState('');
  const [polyclinicPhone, setPolyclinicPhone] = useState('');
  const [polyclinicManager, setPolyclinicManager] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorPhone, setDoctorPhone] = useState('');
  const [doctorSpecialization, setDoctorSpecialization] = useState('');
  const [selectedPolyclinic, setSelectedPolyclinic] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const pharmacyResponse = await api.get('/pharmacy/pharmacies/');
      setPharmacies(pharmacyResponse.results || pharmacyResponse);

      const polyclinicResponse = await api.get('/pharmacy/polyclinics/');
      setPolyclinics(polyclinicResponse.results || polyclinicResponse);

      const doctorResponse = await api.get('/pharmacy/doctors/');
      setDoctors(doctorResponse.results || doctorResponse);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPharmacy = async () => {
    try {
      const payload = {
        name: pharmacyName,
        address: pharmacyAddress,
        phone: pharmacyPhone,
        manager: pharmacyManager
      };
      await api.post('/pharmacy/pharmacies/', payload);
      toast({
        title: "Успех",
        description: "Аптека успешно добавлена",
      });
      loadData();
      setIsAddPharmacyOpen(false);
      setPharmacyName('');
      setPharmacyAddress('');
      setPharmacyPhone('');
      setPharmacyManager('');
    } catch (error) {
      console.error('Error adding pharmacy:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить аптеку",
        variant: "destructive",
      });
    }
  };

  const handleAddPolyclinic = async () => {
    try {
      const payload = {
        name: polyclinicName,
        address: polyclinicAddress,
        phone: polyclinicPhone,
        manager: polyclinicManager
      };
      await api.post('/pharmacy/polyclinics/', payload);
      toast({
        title: "Успех",
        description: "Поликлиника успешно добавлена",
      });
      loadData();
      setIsAddPolyclinicOpen(false);
      setPolyclinicName('');
      setPolyclinicAddress('');
      setPolyclinicPhone('');
      setPolyclinicManager('');
    } catch (error) {
      console.error('Error adding polyclinic:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить поликлинику",
        variant: "destructive",
      });
    }
  };

  const handleAddDoctor = async () => {
    if (!selectedPolyclinic) {
      toast({
        title: "Ошибка",
        description: "Выберите поликлинику для врача",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = {
        name: doctorName,
        phone: doctorPhone,
        specialization: doctorSpecialization,
        polyclinic_id: selectedPolyclinic
      };
      await api.post('/pharmacy/doctors/', payload);
      toast({
        title: "Успех",
        description: "Врач успешно добавлен",
      });
      loadData();
      setIsAddDoctorOpen(false);
      setDoctorName('');
      setDoctorPhone('');
      setDoctorSpecialization('');
      setSelectedPolyclinic(null);
    } catch (error) {
      console.error('Error adding doctor:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить врача",
        variant: "destructive",
      });
    }
  };

  const handleArchivePharmacy = async (id: number) => {
    try {
      await api.put(`/pharmacy/pharmacies/${id}/`, { archived: true });
      toast({
        title: "Успех",
        description: "Аптека архивирована",
      });
      loadData();
    } catch (error) {
      console.error('Error archiving pharmacy:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось архивировать аптеку",
        variant: "destructive",
      });
    }
  };

  const handleArchivePolyclinic = async (id: number) => {
    try {
      await api.put(`/pharmacy/polyclinics/${id}/`, { archived: true });
      toast({
        title: "Успех",
        description: "Поликлиника архивирована",
      });
      loadData();
    } catch (error) {
      console.error('Error archiving polyclinic:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось архивировать поликлинику",
        variant: "destructive",
      });
    }
  };

   const handleArchiveDoctor = async (id: number) => {
    try {
      await api.put(`/pharmacy/doctors/${id}/`, { archived: true });
      toast({
        title: "Успех",
        description: "Врач архивирован",
      });
      loadData();
    } catch (error) {
      console.error('Error archiving doctor:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось архивировать врача",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 shadow-sm`}>
        <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Управление
        </h1>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Pharmacies */}
        <Card className={`mb-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
          <CardHeader>
            <CardTitle className={darkMode ? 'text-white' : 'text-gray-900'}>
              Аптеки ({pharmacies.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ScrollArea className="max-h-60">
              {loading ? (
                <div className="text-center py-8">Загрузка...</div>
              ) : pharmacies.length > 0 ? (
                pharmacies.map((pharmacy) => (
                  <div key={pharmacy.id} className={`flex items-center justify-between p-3 rounded border ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                    <div>
                      <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{pharmacy.name}</h3>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{pharmacy.address}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleArchivePharmacy(pharmacy.id)}
                      className="text-red-500"
                    >
                      Архивировать
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Аптеки не найдены
                </div>
              )}
            </ScrollArea>
            <Button
              onClick={() => setIsAddPharmacyOpen(true)}
              className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white"
            >
              Добавить аптеку
            </Button>
          </CardContent>
        </Card>

        {/* Polyclinics */}
        <Card className={`mb-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
          <CardHeader>
            <CardTitle className={darkMode ? 'text-white' : 'text-gray-900'}>
              Поликлиники ({polyclinics.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ScrollArea className="max-h-60">
              {loading ? (
                <div className="text-center py-8">Загрузка...</div>
              ) : polyclinics.length > 0 ? (
                polyclinics.map((polyclinic) => (
                  <div key={polyclinic.id} className={`flex items-center justify-between p-3 rounded border ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                    <div>
                      <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{polyclinic.name}</h3>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{polyclinic.address}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleArchivePolyclinic(polyclinic.id)}
                      className="text-red-500"
                    >
                      Архивировать
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Поликлиники не найдены
                </div>
              )}
            </ScrollArea>
            <Button
              onClick={() => setIsAddPolyclinicOpen(true)}
              className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white"
            >
              Добавить поликлинику
            </Button>
          </CardContent>
        </Card>

        {/* Doctors */}
        <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <CardHeader>
            <CardTitle className={darkMode ? 'text-white' : 'text-gray-900'}>
              Врачи ({doctors.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ScrollArea className="max-h-60">
              {loading ? (
                <div className="text-center py-8">Загрузка...</div>
              ) : doctors.length > 0 ? (
                doctors.map((doctor) => (
                  <div key={doctor.id} className={`flex items-center justify-between p-3 rounded border ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                    <div>
                      <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{doctor.name}</h3>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{doctor.specialization}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleArchiveDoctor(doctor.id)}
                      className="text-red-500"
                    >
                      Архивировать
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Врачи не найдены
                </div>
              )}
            </ScrollArea>
            <Button
              onClick={() => setIsAddDoctorOpen(true)}
              className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white"
            >
              Добавить врача
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Add Pharmacy Drawer */}
      <Sheet open={isAddPharmacyOpen} onOpenChange={setIsAddPharmacyOpen}>
        <SheetContent className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <SheetHeader>
            <SheetTitle className={darkMode ? 'text-white' : 'text-gray-900'}>Добавить аптеку</SheetTitle>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Название</Label>
              <Input
                id="name"
                value={pharmacyName}
                onChange={(e) => setPharmacyName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">Адрес</Label>
              <Input
                id="address"
                value={pharmacyAddress}
                onChange={(e) => setPharmacyAddress(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">Телефон</Label>
              <Input
                id="phone"
                value={pharmacyPhone}
                onChange={(e) => setPharmacyPhone(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="manager" className="text-right">Менеджер</Label>
              <Input
                id="manager"
                value={pharmacyManager}
                onChange={(e) => setPharmacyManager(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <Button onClick={handleAddPharmacy} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
            Добавить
          </Button>
        </SheetContent>
      </Sheet>

      {/* Add Polyclinic Drawer */}
      <Sheet open={isAddPolyclinicOpen} onOpenChange={setIsAddPolyclinicOpen}>
        <SheetContent className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <SheetHeader>
            <SheetTitle className={darkMode ? 'text-white' : 'text-gray-900'}>Добавить поликлинику</SheetTitle>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Название</Label>
              <Input
                id="name"
                value={polyclinicName}
                onChange={(e) => setPolyclinicName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">Адрес</Label>
              <Input
                id="address"
                value={polyclinicAddress}
                onChange={(e) => setPolyclinicAddress(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">Телефон</Label>
              <Input
                id="phone"
                value={polyclinicPhone}
                onChange={(e) => setPolyclinicPhone(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="manager" className="text-right">Менеджер</Label>
              <Input
                id="manager"
                value={polyclinicManager}
                onChange={(e) => setPolyclinicManager(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <Button onClick={handleAddPolyclinic} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
            Добавить
          </Button>
        </SheetContent>
      </Sheet>

      {/* Add Doctor Drawer */}
      <Sheet open={isAddDoctorOpen} onOpenChange={setIsAddDoctorOpen}>
        <SheetContent className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <SheetHeader>
            <SheetTitle className={darkMode ? 'text-white' : 'text-gray-900'}>Добавить врача</SheetTitle>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Имя</Label>
              <Input
                id="name"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">Телефон</Label>
              <Input
                id="phone"
                value={doctorPhone}
                onChange={(e) => setDoctorPhone(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="specialization" className="text-right">Специализация</Label>
              <Input
                id="specialization"
                value={doctorSpecialization}
                onChange={(e) => setDoctorSpecialization(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="polyclinic" className="text-right">Поликлиника</Label>
              <select
                id="polyclinic"
                onChange={(e) => setSelectedPolyclinic(parseInt(e.target.value))}
                className={`col-span-3 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              >
                <option value="">Выберите поликлинику</option>
                {polyclinics.map((polyclinic) => (
                  <option key={polyclinic.id} value={polyclinic.id}>
                    {polyclinic.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button onClick={handleAddDoctor} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
            Добавить
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Control;

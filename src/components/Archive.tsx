import React, { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Trash2, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import api from '@/hooks/api-settings';
import { toast } from '@/hooks/use-toast';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { ChevronDown } from 'lucide-react';

interface ArchivedPharmacy {
  id: number;
  name: string;
  address: string;
  phone: string;
  manager: string;
  archived: boolean;
}

interface ArchivedPolyclinic {
  id: number;
  name: string;
  address: string;
  phone: string;
  manager: string;
  archived: boolean;
}

interface ArchivedDoctor {
  id: number;
  name: string;
  phone: string;
  specialization: string;
  polyclinic_id: number;
  archived: boolean;
}

interface ArchivedProduct {
  id: number;
  name: string;
  dosage: string;
  manufacturer: string;
  archived: boolean;
}

interface ArchivedCompany {
  id: number;
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  archived: boolean;
}

interface ArchiveProps {
  onBack: () => void;
  darkMode: boolean;
}

const Archive: React.FC<ArchiveProps> = ({ onBack, darkMode }) => {
  const [pharmacies, setPharmacies] = useState<ArchivedPharmacy[]>([]);
  const [polyclinics, setPolyclinics] = useState<ArchivedPolyclinic[]>([]);
  const [doctors, setDoctors] = useState<ArchivedDoctor[]>([]);
  const [products, setProducts] = useState<ArchivedProduct[]>([]);
  const [companies, setCompanies] = useState<ArchivedCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [pharmacyFilter, setPharmacyFilter] = useState('');
  const [polyclinicFilter, setPolyclinicFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  
  // Selection states
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<{[key: string]: number[]}>({
    companies: [],
    pharmacies: [],
    polyclinics: [],
    doctors: [],
    products: []
  });
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadArchivedData();
  }, []);

  const loadArchivedData = async () => {
    try {
      setLoading(true);
      
      // Load archived pharmacies - sorted by most recently archived first
      const pharmacyResponse = await api.get('/pharmacy/pharmacies/?archived=true&ordering=-updated_at');
      setPharmacies(pharmacyResponse.results || []);
      
      // Load archived polyclinics - sorted by most recently archived first
      const polyclinicResponse = await api.get('/pharmacy/hospitals/?archived=true&ordering=-updated_at');
      setPolyclinics(polyclinicResponse.results || []);
      
      // Load archived doctors - sorted by most recently archived first
      const doctorResponse = await api.get('/polyclinic_doctors/?archived=true&ordering=-updated_at');
      setDoctors(doctorResponse.results || []);
      
      // Load archived products - sorted by most recently archived first
      const productResponse = await api.get('/products/?archived=true&ordering=-updated_at');
      setProducts(productResponse.results || []);
      
      // Load archived companies - sorted by most recently archived first
      const companyResponse = await api.get('/company/?archived=true&ordering=-updated_at');
      setCompanies(companyResponse.results || []);
    } catch (error) {
      console.error('Error loading archived data:', error);
      toast({
        title: "Xatolik",
        description: "Arxivlangan ma'lumotlarni yuklashda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const restorePharmacy = async (id: number) => {
    try {
      await api.post(`/pharmacy/pharmacies/restore/`, { ids: [id] });
      toast({
        title: "Muvaffaqiyat",
        description: "Dorixona tiklandi",
      });
      loadArchivedData();
    } catch (error) {
      console.error('Error restoring pharmacy:', error);
      toast({
        title: "Xatolik",
        description: "Dorixonani tiklashda xatolik",
        variant: "destructive",
      });
    }
  };

  const restorePolyclinic = async (id: number) => {
    try {
      await api.post(`/pharmacy/hospitals/restore/`, { ids: [id] });
      toast({
        title: "Muvaffaqiyat",
        description: "Poliklinika tiklandi",
      });
      loadArchivedData();
    } catch (error) {
      console.error('Error restoring polyclinic:', error);
      toast({
        title: "Xatolik",
        description: "Poliklinikani tiklashda xatolik",
        variant: "destructive",
      });
    }
  };

  const restoreDoctor = async (id: number) => {
    try {
      await api.put(`/polyclinic_doctors/${id}/`, { archived: false });
      toast({
        title: "Muvaffaqiyat",
        description: "Shifokor tiklandi",
      });
      loadArchivedData();
    } catch (error) {
      console.error('Error restoring doctor:', error);
      toast({
        title: "Xatolik",
        description: "Shifokorni tiklashda xatolik",
        variant: "destructive",
      });
    }
  };

  const restoreProduct = async (id: number) => {
    try {
      await api.put(`/products/${id}/`, { archived: false });
      toast({
        title: "Muvaffaqiyat",
        description: "Mahsulot tiklandi",
      });
      loadArchivedData();
    } catch (error) {
      console.error('Error restoring product:', error);
      toast({
        title: "Xatolik",
        description: "Mahsulotni tiklashda xatolik",
        variant: "destructive",
      });
    }
  };

  const restoreCompany = async (id: number) => {
    try {
      await api.post(`/company/restore/`, { ids: [id] });
      toast({
        title: "Muvaffaqiyat",
        description: "Kompaniya tiklandi",
      });
      loadArchivedData();
    } catch (error) {
      console.error('Error restoring company:', error);
      toast({
        title: "Xatolik",
        description: "Kompaniyani tiklashda xatolik",
        variant: "destructive",
      });
    }
  };

  const permanentlyDelete = async (type: 'pharmacy' | 'polyclinic' | 'doctor' | 'product' | 'company', id: number) => {
    try {
      let endpoint = '';
      switch (type) {
        case 'pharmacy':
          endpoint = `/pharmacy/pharmacies/${id}/`;
          break;
        case 'polyclinic':
          endpoint = `/pharmacy/hospitals/${id}/`;
          break;
        case 'doctor':
          endpoint = `/polyclinic_doctors/${id}/`;
          break;
        case 'product':
          endpoint = `/products/${id}/`;
          break;
        case 'company':
          endpoint = `/company/${id}/`;
          break;
      }
      await api.delete(endpoint);
      toast({
        title: "Muvaffaqiyat",
        description: "Element butunlay o'chirildi",
      });
      loadArchivedData();
    } catch (error) {
      console.error('Error permanently deleting item:', error);
      toast({
        title: "Xatolik",
        description: "Elementni o'chirishda xatolik",
        variant: "destructive",
      });
    }
  };

  const filteredPharmacies = pharmacies.filter(pharmacy =>
    pharmacy.name.toLowerCase().includes(pharmacyFilter.toLowerCase()) ||
    pharmacy.address.toLowerCase().includes(pharmacyFilter.toLowerCase())
  );

  const filteredPolyclinics = polyclinics.filter(polyclinic =>
    polyclinic.name.toLowerCase().includes(polyclinicFilter.toLowerCase()) ||
    polyclinic.address.toLowerCase().includes(polyclinicFilter.toLowerCase())
  );

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(doctorFilter.toLowerCase()) ||
    doctor.specialization.toLowerCase().includes(doctorFilter.toLowerCase())
  );

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productFilter.toLowerCase()) ||
    product.manufacturer.toLowerCase().includes(productFilter.toLowerCase())
  );

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(companyFilter.toLowerCase()) ||
    company.address.toLowerCase().includes(companyFilter.toLowerCase())
  );

  // Selection functions
  const toggleSelection = (type: string, id: number) => {
    setSelectedItems(prev => {
      const current = prev[type] || [];
      const isSelected = current.includes(id);
      
      return {
        ...prev,
        [type]: isSelected 
          ? current.filter(itemId => itemId !== id)
          : [...current, id]
      };
    });
  };

  const selectAll = (type: string, items: any[]) => {
    setSelectedItems(prev => ({
      ...prev,
      [type]: items.map(item => item.id)
    }));
  };

  const clearSelection = (type: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [type]: []
    }));
  };

  const bulkRestore = async (type: string) => {
    try {
      const ids = selectedItems[type];
      if (ids.length === 0) return;

      let endpoint = '';
      switch (type) {
        case 'companies':
          endpoint = '/company/restore/';
          break;
        case 'pharmacies':
          endpoint = '/pharmacy/pharmacies/restore/';
          break;
        case 'polyclinics':
          endpoint = '/pharmacy/hospitals/restore/';
          break;
        default:
          return;
      }

      await api.post(endpoint, { ids });
      
      toast({
        title: "Muvaffaqiyat",
        description: `${ids.length} ta element tiklandi`,
      });
      
      clearSelection(type);
      loadArchivedData();
    } catch (error) {
      console.error('Error bulk restoring:', error);
      toast({
        title: "Xatolik",
        description: "Elementlarni tiklashda xatolik",
        variant: "destructive",
      });
    }
  };

  const bulkDelete = async (type: string) => {
    try {
      const ids = selectedItems[type];
      if (ids.length === 0) return;

      let endpoint = '';
      switch (type) {
        case 'companies':
          endpoint = '/company/remove/';
          break;
        case 'pharmacies':
          endpoint = '/pharmacy/pharmacies/remove/';
          break;
        case 'polyclinics':
          endpoint = '/pharmacy/hospitals/remove/';
          break;
        default:
          return;
      }

      await api.post(endpoint, { ids });
      
      toast({
        title: "Muvaffaqiyat",
        description: `${ids.length} ta element o'chirildi`,
      });
      
      clearSelection(type);
      loadArchivedData();
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast({
        title: "Xatolik",
        description: "Elementlarni o'chirishda xatolik",
        variant: "destructive",
      });
    }
  };

  const getSelectedCount = (type: string) => selectedItems[type]?.length || 0;

  const tabs = [
    { value: 'all', label: 'Hammasi' },
    { value: 'pharmacies', label: 'Dorixonalar' },
    { value: 'polyclinics', label: 'Poliklinikalar' },
    { value: 'doctors', label: 'Shifokorlar' },
    { value: 'products', label: 'Mahsulotlar' },
    { value: 'companies', label: 'Kompaniyalar' },
  ];

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
              Arxiv
            </h1>
          </div>

          <Menu as="div" className="relative">
            <MenuButton
              className={`flex items-center gap-2 px-4 py-2 rounded-md ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} border ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}
            >
              {tabs.find(tab => tab.value === activeTab)?.label}
              <ChevronDown className="w-4 h-4" />
            </MenuButton>
            <MenuItems
              className={`absolute mt-2 w-48 rounded-md shadow-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} border ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}
            >
              {tabs.map(tab => (
                <MenuItem
                  key={tab.value}
                  as="button"
                  onClick={() => setActiveTab(tab.value)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {tab.label}
                </MenuItem>
              ))}
            </MenuItems>
          </Menu>
        </div>
      </div>

      <div className="p-4">
        {activeTab === 'pharmacies' && (
          <div>
            {/* Dorixonalar uchun kontent */}
            <Input
              placeholder="Dorixonalar bo'yicha qidirish..."
              value={pharmacyFilter}
              onChange={(e) => setPharmacyFilter(e.target.value)}
              className={`mb-4 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}`}
            />
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8">Yuklanmoqda...</div>
              ) : filteredPharmacies.length > 0 ? (
                 filteredPharmacies.map((pharmacy) => (
                   <Card key={pharmacy.id} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} opacity-60`}>
                     <CardContent className="p-4">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3 flex-1">
                           {selectionMode && (
                             <Checkbox
                               checked={selectedItems.pharmacies.includes(pharmacy.id)}
                               onCheckedChange={() => toggleSelection('pharmacies', pharmacy.id)}
                             />
                           )}
                           <div>
                             <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                               {pharmacy.name}
                             </h3>
                             <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                               {pharmacy.address}
                             </p>
                             <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                               {pharmacy.phone} • {pharmacy.manager}
                             </p>
                           </div>
                         </div>
                         {!selectionMode && (
                           <div className="flex gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Dorixonani tiklash?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Haqiqatan ham "{pharmacy.name}" dorixonasini tiklashni xohlaysizmi?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                <AlertDialogAction onClick={() => restorePharmacy(pharmacy.id)}>
                                  Tiklash
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Butunlay o'chirish?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Haqiqatan ham "{pharmacy.name}" dorixonasini butunlay o'chirishni xohlaysizmi? Bu amalni bekor qilib bo'lmaydi.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => permanentlyDelete('pharmacy', pharmacy.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Butunlay o'chirish
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                           </AlertDialog>
                           </div>
                         )}
                       </div>
                     </CardContent>
                   </Card>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Arxivlangan dorixonalar topilmadi
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'polyclinics' && (
          <div>
            {/* Poliklinikalar uchun kontent */}
            <Input
              placeholder="Poliklinikalar bo'yicha qidirish..."
              value={polyclinicFilter}
              onChange={(e) => setPolyclinicFilter(e.target.value)}
              className={`mb-4 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}`}
            />
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8">Yuklanmoqda...</div>
              ) : filteredPolyclinics.length > 0 ? (
                 filteredPolyclinics.map((polyclinic) => (
                   <Card key={polyclinic.id} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} opacity-60`}>
                     <CardContent className="p-4">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3 flex-1">
                           {selectionMode && (
                             <Checkbox
                               checked={selectedItems.polyclinics.includes(polyclinic.id)}
                               onCheckedChange={() => toggleSelection('polyclinics', polyclinic.id)}
                             />
                           )}
                           <div>
                             <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                               {polyclinic.name}
                             </h3>
                             <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                               {polyclinic.address}
                             </p>
                             <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                               {polyclinic.phone} • {polyclinic.manager}
                             </p>
                           </div>
                         </div>
                         {!selectionMode && (
                           <div className="flex gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Poliklinikani tiklash?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Haqiqatan ham "{polyclinic.name}" poliklinikasini tiklashni xohlaysizmi?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                <AlertDialogAction onClick={() => restorePolyclinic(polyclinic.id)}>
                                  Tiklash
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Butunlay o'chirish?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Haqiqatan ham "{polyclinic.name}" poliklinikasini butunlay o'chirishni xohlaysizmi? Bu amalni bekor qilib bo'lmaydi.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => permanentlyDelete('polyclinic', polyclinic.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Butunlay o'chirish
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                           </AlertDialog>
                           </div>
                         )}
                       </div>
                     </CardContent>
                   </Card>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Arxivlangan poliklinikalar topilmadi
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'doctors' && (
          <div>
            {/* Shifokorlar uchun kontent */}
            <Input
              placeholder="Shifokorlar bo'yicha qidirish..."
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className={`mb-4 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}`}
            />
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8">Yuklanmoqda...</div>
              ) : filteredDoctors.length > 0 ? (
                 filteredDoctors.map((doctor) => (
                   <Card key={doctor.id} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} opacity-60`}>
                     <CardContent className="p-4">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3 flex-1">
                           {selectionMode && (
                             <Checkbox
                               checked={selectedItems.doctors.includes(doctor.id)}
                               onCheckedChange={() => toggleSelection('doctors', doctor.id)}
                             />
                           )}
                           <div>
                             <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                               {doctor.name}
                             </h3>
                             <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                               {doctor.specialization}
                             </p>
                             <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                               {doctor.phone}
                             </p>
                           </div>
                         </div>
                         {!selectionMode && (
                           <div className="flex gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Shifokorni tiklash?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Haqiqatan ham "{doctor.name}" shifokorini tiklashni xohlaysizmi?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                <AlertDialogAction onClick={() => restoreDoctor(doctor.id)}>
                                  Tiklash
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Butunlay o'chirish?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Haqiqatan ham "{doctor.name}" shifokorini butunlay o'chirishni xohlaysizmi? Bu amalni bekor qilib bo'lmaydi.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => permanentlyDelete('doctor', doctor.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Butunlay o'chirish
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                           </AlertDialog>
                           </div>
                         )}
                       </div>
                     </CardContent>
                   </Card>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Arxivlangan shifokorlar topilmadi
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'products' && (
          <div>
            {/* Mahsulotlar uchun kontent */}
            <Input
              placeholder="Mahsulotlar bo'yicha qidirish..."
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className={`mb-4 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}`}
            />
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8">Yuklanmoqda...</div>
              ) : filteredProducts.length > 0 ? (
                 filteredProducts.map((product) => (
                   <Card key={product.id} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} opacity-60`}>
                     <CardContent className="p-4">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3 flex-1">
                           {selectionMode && (
                             <Checkbox
                               checked={selectedItems.products.includes(product.id)}
                               onCheckedChange={() => toggleSelection('products', product.id)}
                             />
                           )}
                           <div>
                             <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                               {product.name}
                             </h3>
                             <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                               {product.dosage}
                             </p>
                             <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                               {product.manufacturer}
                             </p>
                           </div>
                         </div>
                         {!selectionMode && (
                           <div className="flex gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Mahsulotni tiklash?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Haqiqatan ham "{product.name}" mahsulotini tiklashni xohlaysizmi?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                <AlertDialogAction onClick={() => restoreProduct(product.id)}>
                                  Tiklash
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Butunlay o'chirish?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Haqiqatan ham "{product.name}" mahsulotini butunlay o'chirishni xohlaysizmi? Bu amalni bekor qilib bo'lmaydi.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => permanentlyDelete('product', product.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Butunlay o'chirish
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                           </AlertDialog>
                           </div>
                         )}
                       </div>
                     </CardContent>
                   </Card>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Arxivlangan mahsulotlar topilmadi
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'companies' && (
          <div>
            {/* Kompaniyalar uchun kontent */}
            <Input
              placeholder="Kompaniyalar bo'yicha qidirish..."
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className={`mb-4 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}`}
            />
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8">Yuklanmoqda...</div>
              ) : filteredCompanies.length > 0 ? (
                 filteredCompanies.map((company) => (
                   <Card key={company.id} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} opacity-60`}>
                     <CardContent className="p-4">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3 flex-1">
                           {selectionMode && (
                             <Checkbox
                               checked={selectedItems.companies.includes(company.id)}
                               onCheckedChange={() => toggleSelection('companies', company.id)}
                             />
                           )}
                           <div>
                             <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                               {company.name}
                             </h3>
                             <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                               {company.address}
                             </p>
                             <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                               {company.phone} • {company.ownerName}
                             </p>
                           </div>
                         </div>
                         {!selectionMode && (
                           <div className="flex gap-2">
                             <AlertDialog>
                               <AlertDialogTrigger asChild>
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   className="text-green-600 hover:text-green-700"
                                 >
                                   <RotateCcw className="w-4 h-4" />
                                 </Button>
                               </AlertDialogTrigger>
                               <AlertDialogContent>
                                 <AlertDialogHeader>
                                   <AlertDialogTitle>Kompaniyani tiklash?</AlertDialogTitle>
                                   <AlertDialogDescription>
                                     Haqiqatan ham "{company.name}" kompaniyasini tiklashni xohlaysizmi?
                                   </AlertDialogDescription>
                                 </AlertDialogHeader>
                                 <AlertDialogFooter>
                                   <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                   <AlertDialogAction onClick={() => restoreCompany(company.id)}>
                                     Tiklash
                                   </AlertDialogAction>
                                 </AlertDialogFooter>
                               </AlertDialogContent>
                             </AlertDialog>
                             <AlertDialog>
                               <AlertDialogTrigger asChild>
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   className="text-red-600 hover:text-red-700"
                                 >
                                   <Trash2 className="w-4 h-4" />
                                 </Button>
                               </AlertDialogTrigger>
                               <AlertDialogContent>
                                 <AlertDialogHeader>
                                   <AlertDialogTitle>Butunlay o'chirish?</AlertDialogTitle>
                                   <AlertDialogDescription>
                                     Haqiqatan ham "{company.name}" kompaniyasini butunlay o'chirishni xohlaysizmi? Bu amalni bekor qilib bo'lmaydi.
                                   </AlertDialogDescription>
                                 </AlertDialogHeader>
                                 <AlertDialogFooter>
                                   <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                   <AlertDialogAction 
                                     onClick={() => permanentlyDelete('company', company.id)}
                                     className="bg-red-600 hover:bg-red-700"
                                   >
                                     Butunlay o'chirish
                                   </AlertDialogAction>
                                 </AlertDialogFooter>
                               </AlertDialogContent>
                             </AlertDialog>
                           </div>
                         )}
                       </div>
                     </CardContent>
                   </Card>
                ))
               ) : (
                 <div className="text-center py-8 text-gray-500">
                   Arxivlangan kompaniyalar topilmadi
                 </div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'all' && (
          <div>
            {/* Hammasi - barcha arxivlangan elementlar */}
            <div className="space-y-6">
              {loading ? (
                <div className="text-center py-8">Yuklanmoqda...</div>
              ) : (
                <>
                  {/* Kompaniyalar */}
                  {filteredCompanies.length > 0 && (
                    <div>
                      <h2 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Kompaniyalar ({filteredCompanies.length})
                      </h2>
                      <div className="space-y-3">
                        {filteredCompanies.map((company) => (
                          <Card key={`company-${company.id}`} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} opacity-60`}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <div>
                                    <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {company.name}
                                    </h3>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {company.address}
                                    </p>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {company.phone} • {company.ownerName}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-green-600 hover:text-green-700"
                                      >
                                        <RotateCcw className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Kompaniyani tiklash?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Haqiqatan ham "{company.name}" kompaniyasini tiklashni xohlaysizmi?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => restoreCompany(company.id)}>
                                          Tiklash
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Butunlay o'chirish?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Haqiqatan ham "{company.name}" kompaniyasini butunlay o'chirishni xohlaysizmi? Bu amalni bekor qilib bo'lmaydi.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => permanentlyDelete('company', company.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Butunlay o'chirish
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dorixonalar */}
                  {filteredPharmacies.length > 0 && (
                    <div>
                      <h2 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Dorixonalar ({filteredPharmacies.length})
                      </h2>
                      <div className="space-y-3">
                        {filteredPharmacies.map((pharmacy) => (
                          <Card key={`pharmacy-${pharmacy.id}`} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} opacity-60`}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <div>
                                    <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {pharmacy.name}
                                    </h3>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {pharmacy.address}
                                    </p>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {pharmacy.phone} • {pharmacy.manager}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-green-600 hover:text-green-700"
                                      >
                                        <RotateCcw className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Dorixonani tiklash?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Haqiqatan ham "{pharmacy.name}" dorixonasini tiklashni xohlaysizmi?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => restorePharmacy(pharmacy.id)}>
                                          Tiklash
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Butunlay o'chirish?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Haqiqatan ham "{pharmacy.name}" dorixonasini butunlay o'chirishni xohlaysizmi? Bu amalni bekor qilib bo'lmaydi.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => permanentlyDelete('pharmacy', pharmacy.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Butunlay o'chirish
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Poliklinikalar */}
                  {filteredPolyclinics.length > 0 && (
                    <div>
                      <h2 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Poliklinikalar ({filteredPolyclinics.length})
                      </h2>
                      <div className="space-y-3">
                        {filteredPolyclinics.map((polyclinic) => (
                          <Card key={`polyclinic-${polyclinic.id}`} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} opacity-60`}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <div>
                                    <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {polyclinic.name}
                                    </h3>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {polyclinic.address}
                                    </p>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {polyclinic.phone} • {polyclinic.manager}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-green-600 hover:text-green-700"
                                      >
                                        <RotateCcw className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Poliklinikani tiklash?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Haqiqatan ham "{polyclinic.name}" poliklinikasini tiklashni xohlaysizmi?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => restorePolyclinic(polyclinic.id)}>
                                          Tiklash
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Butunlay o'chirish?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Haqiqatan ham "{polyclinic.name}" poliklinikasini butunlay o'chirishni xohlaysizmi? Bu amalni bekor qilib bo'lmaydi.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => permanentlyDelete('polyclinic', polyclinic.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Butunlay o'chirish
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Shifokorlar */}
                  {filteredDoctors.length > 0 && (
                    <div>
                      <h2 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Shifokorlar ({filteredDoctors.length})
                      </h2>
                      <div className="space-y-3">
                        {filteredDoctors.map((doctor) => (
                          <Card key={`doctor-${doctor.id}`} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} opacity-60`}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <div>
                                    <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {doctor.name}
                                    </h3>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {doctor.specialization}
                                    </p>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {doctor.phone}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-green-600 hover:text-green-700"
                                      >
                                        <RotateCcw className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Shifokorni tiklash?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Haqiqatan ham "{doctor.name}" shifokorini tiklashni xohlaysizmi?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => restoreDoctor(doctor.id)}>
                                          Tiklash
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Butunlay o'chirish?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Haqiqatan ham "{doctor.name}" shifokorini butunlay o'chirishni xohlaysizmi? Bu amalni bekor qilib bo'lmaydi.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => permanentlyDelete('doctor', doctor.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Butunlay o'chirish
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mahsulotlar */}
                  {filteredProducts.length > 0 && (
                    <div>
                      <h2 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Mahsulotlar ({filteredProducts.length})
                      </h2>
                      <div className="space-y-3">
                        {filteredProducts.map((product) => (
                          <Card key={`product-${product.id}`} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} opacity-60`}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <div>
                                    <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {product.name}
                                    </h3>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {product.dosage}
                                    </p>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {product.manufacturer}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-green-600 hover:text-green-700"
                                      >
                                        <RotateCcw className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Mahsulotni tiklash?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Haqiqatan ham "{product.name}" mahsulotini tiklashni xohlaysizmi?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => restoreProduct(product.id)}>
                                          Tiklash
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Butunlay o'chirish?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Haqiqatan ham "{product.name}" mahsulotini butunlay o'chirishni xohlaysizmi? Bu amalni bekor qilib bo'lmaydi.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => permanentlyDelete('product', product.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Butunlay o'chirish
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Agar hech narsa topilmasa */}
                  {filteredCompanies.length === 0 && 
                   filteredPharmacies.length === 0 && 
                   filteredPolyclinics.length === 0 && 
                   filteredDoctors.length === 0 && 
                   filteredProducts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Arxivlangan ma'lumotlar topilmadi
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Archive;

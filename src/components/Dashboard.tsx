import React, { useState, useEffect } from 'react';
import { Building, Hospital, Search, Plus, Users, TrendingUp, Package, X, Trash2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import AddPharmacyModal from './AddPharmacyModal';
import AddPolyclinicModal from './AddPolyclinicModal';
import PharmacyDetails from './PharmacyDetails';
import PolyclinicDetails from './PolyclinicDetails';
import FloatingActionButton from './FloatingActionButton';
import NotificationBell from './NotificationBell';
import FilterDrawer from './FilterDrawer';
import api from '@/hooks/api-settings';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import EditPharmacyModal from './EditPharmacyModal';
import CompanySMSPanel from './CompanySMSPanel';

interface Pharmacy {
  id: number;
  name: string;
  address: string;
  phone: string;
  manager: string;
  archived: boolean;
  remaining_debt?: number;
  total_debt?: number;
}

interface Polyclinic {
  id: number;
  name: string;
  address: string;
  phone: string;
  manager: string;
  archived: boolean;
}

interface DashboardProps {
  darkMode: boolean;
}

type FilterPayload = {
  regionId: string;
  districtId: string;
  clinicId: number | null;
  debt: { mode: 'all' | 'hasDebt' | 'noDebt' };
};

const Dashboard: React.FC<DashboardProps> = ({ darkMode }) => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [polyclinics, setPolyclinics] = useState<Polyclinic[]>([]);
  const [filteredPharmacies, setFilteredPharmacies] = useState<Pharmacy[]>([]);
  const [filteredPolyclinics, setFilteredPolyclinics] = useState<Polyclinic[]>([]);
  const [isAddPharmacyModalOpen, setIsAddPharmacyModalOpen] = useState(false);
  const [isAddPolyclinicModalOpen, setIsAddPolyclinicModalOpen] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [selectedPolyclinic, setSelectedPolyclinic] = useState<Polyclinic | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pharmacies');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditPharmacyModalOpen, setIsEditPharmacyModalOpen] = useState(false);
  const [editPharmacy, setEditPharmacy] = useState<Pharmacy | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string>("");
  const [isPharmacySelectionMode, setIsPharmacySelectionMode] = useState(false);
  const [selectedPharmacies, setSelectedPharmacies] = useState<Set<number>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [showSMSPanel, setShowSMSPanel] = useState(false);

  useEffect(() => {
    loadPharmacies();
    loadPolyclinics();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const searchedPharmacies = pharmacies.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.address.toLowerCase().includes(query) ||
        p.manager.toLowerCase().includes(query) ||
        p.phone.toLowerCase().includes(query)
      );
      
      const searchedPolyclinics = polyclinics.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.address.toLowerCase().includes(query) ||
        p.manager.toLowerCase().includes(query) ||
        p.phone.toLowerCase().includes(query)
      );

      setFilteredPharmacies(searchedPharmacies);
      setFilteredPolyclinics(searchedPolyclinics);
    } else {
      setFilteredPharmacies(pharmacies);
      setFilteredPolyclinics(polyclinics);
    }
  }, [searchQuery, pharmacies, polyclinics]);


  const loadPharmacies = async () => {
    try {
      setLoading(true);
      const response = await api.get('/pharmacy/pharmacies/');
      const data = response.results || response;
      setPharmacies(data);
      setFilteredPharmacies(data);
    } catch (error) {
      console.error('Error loading pharmacies:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить аптеки",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPolyclinics = async () => {
    try {
      const response = await api.get('/pharmacy/hospitals/');
      const data = response.results || response;
      setPolyclinics(data);
      setFilteredPolyclinics(data);
    } catch (error) {
      console.error('Error loading polyclinics:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить поликлиники",
        variant: "destructive",
      });
    }
  };

  const handleAddPharmacy = async (pharmacyData: { name: string; address: string; phone: string; district: string }) => {
    try {
      const payload = {
        name: pharmacyData.name,
        address: pharmacyData.address,
        phone: pharmacyData.phone,
        manager: pharmacyData.district,
      };
      
      await api.post('/pharmacy/pharmacies/', payload);
      
      toast({
        title: "Успех",
        description: "Аптека успешно добавлена",
      });
      
      loadPharmacies();
    } catch (error) {
      console.error('Error adding pharmacy:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить аптеку",
        variant: "destructive",
      });
    }
  };

  const handleAddPolyclinic = async (polyclinicData: { name: string; address: string; phone: string; district: string }) => {
    try {
      const payload = {
        name: polyclinicData.name,
        address: polyclinicData.address,
        phone: polyclinicData.phone,
        manager: polyclinicData.district,
      };
      
      await api.post('/pharmacy/hospitals/', payload);
      
      toast({
        title: "Успех",
        description: "Поликлиника успешно добавлена",
      });
      
      loadPolyclinics();
    } catch (error) {
      console.error('Error adding polyclinic:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить поликлинику",
        variant: "destructive",
      });
    }
  };

  const handleEditPharmacy = (pharmacy: Pharmacy) => {
    setEditPharmacy(pharmacy);
    setIsEditPharmacyModalOpen(true);
  };

  const handleUpdatePharmacy = async (pharmacyData: { name: string; address: string; phone: string; region: string; district: string }) => {
    if (!editPharmacy) return;
    try {
      await api.put(`/pharmacy/pharmacies/${editPharmacy.id}/`, {
        ...editPharmacy,
        name: pharmacyData.name,
        address: pharmacyData.address,
        phone: pharmacyData.phone,
        manager: pharmacyData.district,
      });
      toast({
        title: "Muvaffaqiyat",
        description: "Apteka ma'lumotlari yangilandi",
      });
      setIsEditPharmacyModalOpen(false);
      setEditPharmacy(null);
      loadPharmacies();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Apteka ma'lumotlarini yangilashda xatolik",
        variant: "destructive",
      });
    }
  };

  const handleFilterApply = (payload: FilterPayload) => {
    const { regionId, districtId, clinicId, debt } = payload;
    let filteredPharms = pharmacies;
    let filteredPoly = polyclinics;

    if (districtId) {
      filteredPharms = filteredPharms.filter(p => (p.manager || '').toLowerCase().includes(districtId.toLowerCase()));
      filteredPoly = filteredPoly.filter(p => (p.manager || '').toLowerCase().includes(districtId.toLowerCase()));
    }

    if (clinicId) {
      filteredPoly = filteredPoly.filter(p => p.id === clinicId);
    }

    if (debt?.mode && debt.mode !== 'all') {
      filteredPharms = filteredPharms.filter(p => {
        const rd = Number(p.remaining_debt ?? 0);
        return debt.mode === 'hasDebt' ? rd > 0 : rd <= 0;
      });
    }

    setFilteredPharmacies(filteredPharms);
    setFilteredPolyclinics(filteredPoly);
  };

  const handlePharmacyClick = (pharmacy: Pharmacy) => {
    setSelectedPharmacy(pharmacy);
  };

  const handlePolyclinicClick = (polyclinic: Polyclinic) => {
    // Transform the polyclinic to match the expected interface
    const transformedPolyclinic = {
      ...polyclinic,
      doctors: [] // Initialize with empty doctors array
    };
    setSelectedPolyclinic(transformedPolyclinic);
  };

  const handleBackToList = () => {
    setSelectedPharmacy(null);
    setSelectedPolyclinic(null);
  };

  const handlePharmacySelect = (pharmacyId: number) => {
    setSelectedPharmacies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pharmacyId)) {
        newSet.delete(pharmacyId);
      } else {
        newSet.add(pharmacyId);
      }
      return newSet;
    });
  };

  const clearPharmacySelection = () => {
    setSelectedPharmacies(new Set());
    setIsPharmacySelectionMode(false);
  };

  const handleBulkDeletePharmacies = async () => {
    try {
      const ids = Array.from(selectedPharmacies);
      await api.post('/pharmacy/pharmacies/archive/', { ids });
      toast({
        title: "Arxivlandi",
        description: `${selectedPharmacies.size} ta apteka arxivlandi`,
      });
      clearPharmacySelection();
      loadPharmacies();
    } catch (err) {
      toast({
        title: "Xatolik",
        description: "Aptekalarni arxivlashda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  // Show pharmacy details if a pharmacy is selected
  if (selectedPharmacy) {
    return (
      <PharmacyDetails
        pharmacy={{...selectedPharmacy, total_debt: 0, remaining_debt: 0}}
        onBack={handleBackToList}
        darkMode={darkMode}
      />
    );
  }

  // Show polyclinic details if a polyclinic is selected
  if (selectedPolyclinic) {
    return (
      <PolyclinicDetails
        polyclinic={selectedPolyclinic}
        onBack={handleBackToList}
        darkMode={darkMode}
        showAddButton={true}
      />
    );
  }

  // Show SMS Panel if requested
  if (showSMSPanel) {
    return (
      <div>
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 shadow-sm`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSMSPanel(false)}
              className="p-1"
              title="Orqaga"
            >
              <X className="text-blue-500" size={24} />
            </button>
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              SMS yuborish
            </h1>
          </div>
        </div>
        <CompanySMSPanel darkMode={darkMode} />
      </div>
    );
  }

  const totalPharmacies = filteredPharmacies.filter(p => !p.archived).length;
  

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 shadow-sm`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center">
              <button onClick={() => setIsSearchOpen(!isSearchOpen)}>
                <Search className="text-blue-500" size={24} />
              </button>
            </div>
            {/* Replace "Bosh Sahifa" with X button in selection mode */}
            {isPharmacySelectionMode ? (
              <button
                onClick={clearPharmacySelection}
                className="p-1"
                title="Bekor qilish"
              >
                <X className="text-blue-500" size={28} />
              </button>
            ) : (
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Bosh Sahifa
              </h1>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Delete button for selection mode */}
            {isPharmacySelectionMode ? (
              <>
                <span className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {selectedPharmacies.size}
                </span>
                <button
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="p-1"
                  title="O'chirish"
                >
                  <Trash2 className="text-red-500" size={28} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsPharmacySelectionMode(true)}
                  className="p-1"
                  title="O'chirish rejimi"
                >
                  <Trash2 className="text-red-500" size={28} />
                </button>
                <button
                  onClick={() => setShowSMSPanel(true)}
                  className="p-1"
                  title="SMS yuborish"
                >
                  <MessageSquare className="text-green-500" size={28} />
                </button>
                <NotificationBell darkMode={darkMode} />
                <FilterDrawer darkMode={darkMode} clinics={polyclinics} onFilterApply={handleFilterApply} />
              </>
            )}
          </div>
        </div>
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isSearchOpen ? 'max-h-16 opacity-100 mt-4' : 'max-h-0 opacity-0'
        }`}>
          <div className="relative">
            <Input
              type="text"
              placeholder="Apteka yoki poliklinika qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pr-10 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <X className="text-gray-400" size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="p-4 space-y-4">
        <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              UMUMIY SUMMA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              120 000 000 so'm
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4">
          <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-500" />
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Aptekalar
                  </p>
                  <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {totalPharmacies}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full grid-cols-1 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <TabsTrigger value="pharmacies">Aptekalar</TabsTrigger>
          </TabsList>

          <TabsContent value="pharmacies" className="mt-4">
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Yuklanmoqda...</div>
                </div>
              ) : filteredPharmacies.filter(p => !p.archived).length > 0 ? (
                filteredPharmacies.filter(p => !p.archived).map((pharmacy, index) => (
                  <Card
                    key={pharmacy.id}
                    className={`cursor-pointer transition-colors ${
                      darkMode
                        ? 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                    // Only enable selection mode click if selection mode is active
                    onClick={() => isPharmacySelectionMode ? handlePharmacySelect(pharmacy.id) : handlePharmacyClick(pharmacy)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Checkbox for selection mode */}
                          {isPharmacySelectionMode && (
                            <input
                              type="checkbox"
                              checked={selectedPharmacies.has(pharmacy.id)}
                              onChange={e => {
                                e.stopPropagation();
                                handlePharmacySelect(pharmacy.id);
                              }}
                              className="mr-2 w-5 h-5 accent-blue-500"
                            />
                          )}
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                          </div>
                          <div>
                            <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {pharmacy.name}
                            </h3>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {pharmacy.address}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className={`text-right`}>
                            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-xs`}>Qarz</p>
                            <p className={`${darkMode ? 'text-white' : 'text-gray-900'} text-sm font-semibold`}>
                              {Number(pharmacy.remaining_debt ?? 0).toLocaleString()} so'm
                            </p>
                          </div>
                          {/* Edit button only if not in selection mode */}
                          {!isPharmacySelectionMode && (
                            <button
                              className={`mt-2 p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900`}
                              onClick={e => {
                                e.stopPropagation();
                                handleEditPharmacy(pharmacy);
                              }}
                              title="Tahrirlash"
                            >
                              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className={`text-blue-500`}>
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aptekalar topilmadi</p>
                </div>
              )}
            </div>
          </TabsContent>

        </Tabs>
      </div>


      {/* Floating Action Button */}
      <FloatingActionButton
        darkMode={darkMode}
        onAddPharmacy={() => setIsAddPharmacyModalOpen(true)}
        onAddPolyclinic={() => setIsAddPolyclinicModalOpen(true)}
      />

      {/* Modals */}
      <AddPharmacyModal
        isOpen={isAddPharmacyModalOpen}
        onClose={() => setIsAddPharmacyModalOpen(false)}
        onAdd={handleAddPharmacy}
        darkMode={darkMode}
      />

      <AddPolyclinicModal
        isOpen={isAddPolyclinicModalOpen}
        onClose={() => setIsAddPolyclinicModalOpen(false)}
        onAdd={handleAddPolyclinic}
        darkMode={darkMode}
      />

      <EditPharmacyModal
        isOpen={isEditPharmacyModalOpen}
        onClose={() => {
          setIsEditPharmacyModalOpen(false);
          setEditPharmacy(null);
          setSelectedRegionId("");
        }}
        onEdit={handleUpdatePharmacy}
        darkMode={darkMode}
        editData={editPharmacy}
      />

      {/* Confirm Delete Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40">
          <div className={`rounded-lg shadow-lg w-full max-w-sm mx-auto ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>Aptekalarni o'chirish</h2>
              <button className="p-1" onClick={() => setDeleteConfirmOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="px-6 py-4">
              <p className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                {selectedPharmacies.size} ta aptekani o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi.
              </p>
            </div>
            <div className="px-6 py-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                Bekor qilish
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={async () => {
                  await handleBulkDeletePharmacies();
                  setDeleteConfirmOpen(false);
                }}
              >
                O'chirish
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
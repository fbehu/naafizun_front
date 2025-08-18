import React, { useEffect, useMemo, useState } from "react";
import { Search, X, Hospital, Plus, Trash2, Edit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import api from "@/hooks/api-settings";
import { toast } from "@/hooks/use-toast";
import { regions } from "@/data/regions";
import BottomNavigation from "@/components/BottomNavigation";
import { useNavigate } from "react-router-dom";
import AddPolyclinicModal from "@/components/AddPolyclinicModal";
import EditPolyclinicModal from "@/components/EditPolyclinicModal";
import PolyclinicDetails from "@/components/PolyclinicDetails";

interface Polyclinic {
  id: number;
  name: string;
  address: string;
  phone: string;
  manager: string; // stores "Region - District"
  archived: boolean;
  doctorCount?: number;
}

const PolyclinicsPage: React.FC = () => {
  const [polyclinics, setPolyclinics] = useState<Polyclinic[]>([]);
  const [filtered, setFiltered] = useState<Polyclinic[]>([]);
  const [loading, setLoading] = useState(false);
  const [doctorCounts, setDoctorCounts] = useState<{[key: number]: number}>({});
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddPolyclinicModalOpen, setIsAddPolyclinicModalOpen] = useState(false);
  const [isEditPolyclinicModalOpen, setIsEditPolyclinicModalOpen] = useState(false);
  const [selectedPolyclinic, setSelectedPolyclinic] = useState<Polyclinic | null>(null);
  const [editingPolyclinic, setEditingPolyclinic] = useState<Polyclinic | null>(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<number[]>([]);

  const [selectedRegionId, setSelectedRegionId] = useState<string>("");
  const [selectedDistrictIds, setSelectedDistrictIds] = useState<string[]>([]);
  const navigate = useNavigate();
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  useEffect(() => {
    document.title = "Poliklinikalar — Boshqaruv";
  }, []);

  // Fetch doctor counts for each polyclinic
  const fetchDoctorCounts = async (polyclinicIds: number[]) => {
    try {
      const counts: {[key: number]: number} = {};
      await Promise.all(
        polyclinicIds.map(async (id) => {
          try {
            const response = await api.get(`/polyclinic_doctors/?polyclinic=${id}`);
            const doctors = (response as any).results || response || [];
            counts[id] = Array.isArray(doctors) ? doctors.filter((d: any) => !d.archived && d.is_active).length : 0;
          } catch (error) {
            console.error(`Error fetching doctors for polyclinic ${id}:`, error);
            counts[id] = 0;
          }
        })
      );
      setDoctorCounts(counts);
    } catch (error) {
      console.error("Error fetching doctor counts:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await api.get("/pharmacy/hospitals/");
        const data: Polyclinic[] = (response as any).results || response;
        setPolyclinics(data);
        setFiltered(data);
        
        // Fetch doctor counts for all polyclinics
        const activePolyclinics = data.filter(p => !p.archived);
        if (activePolyclinics.length > 0) {
          await fetchDoctorCounts(activePolyclinics.map(p => p.id));
        }
      } catch (error) {
        console.error("Error loading polyclinics:", error);
        toast({
          title: "Xatolik",
          description: "Poliklinikalar yuklanmadi",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const selectedRegion = useMemo(
    () => regions.find((r) => r.id === selectedRegionId),
    [selectedRegionId]
  );

  useEffect(() => {
    let list = [...polyclinics];

    // Region/District filtering
    if (selectedRegion) {
      const regionName = selectedRegion.name.toLowerCase();
      const managerMatchRegion = (mgr: string) => mgr.toLowerCase().includes(regionName);

      if (selectedDistrictIds.length > 0) {
        const selectedDistrictNames = selectedRegion.districts
          .filter((d) => selectedDistrictIds.includes(d.id))
          .map((d) => d.name.toLowerCase());

        list = list.filter((p) => {
          const mgr = (p.manager || "").toLowerCase();
          // ensure region matches and any selected district matches
          return managerMatchRegion(mgr) && selectedDistrictNames.some((n) => mgr.includes(n));
        });
      } else {
        // only region selected
        list = list.filter((p) => managerMatchRegion(p.manager || ""));
      }
    }

    // Search filtering
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.address || "").toLowerCase().includes(q) ||
          (p.manager || "").toLowerCase().includes(q) ||
          (p.phone || "").toLowerCase().includes(q)
      );
    }

    setFiltered(list);
  }, [polyclinics, selectedRegion, selectedDistrictIds, searchQuery]);

  const toggleDistrict = (id: string) => {
    setSelectedDistrictIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const clearFilters = () => {
    setSelectedRegionId("");
    setSelectedDistrictIds([]);
  };

  const handleAddPolyclinic = async (polyclinicData: { name: string; address: string; district: string }) => {
    try {
      const payload = {
        name: polyclinicData.name,
        address: polyclinicData.address,
        phone: "",
        manager: polyclinicData.district,
      };
      await api.post("/pharmacy/hospitals/", payload);
      toast({
        title: "Успех",
        description: "Поликлиника успешно добавлена",
      });
      const response = await api.get("/pharmacy/hospitals/");
      const data: Polyclinic[] = (response as any).results || response;
      setPolyclinics(data);
      setFiltered(data);
      
      // Refresh doctor counts
      const activePolyclinics = data.filter(p => !p.archived);
      if (activePolyclinics.length > 0) {
        await fetchDoctorCounts(activePolyclinics.map(p => p.id));
      }
      setIsAddPolyclinicModalOpen(false);
    } catch (error) {
      console.error("Error adding polyclinic:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить поликлинику",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePolyclinic = async (id: number, polyclinicData: { name: string; address: string; district: string; phone: string }) => {
    try {
      const payload = {
        name: polyclinicData.name,
        address: polyclinicData.address,
        phone: polyclinicData.phone,
        manager: polyclinicData.district,
      };
      await api.put(`/pharmacy/hospitals/${id}/`, payload);
      toast({
        title: "Успех",
        description: "Поликлиника успешно обновлена",
      });
      const response = await api.get("/pharmacy/hospitals/");
      const data: Polyclinic[] = (response as any).results || response;
      setPolyclinics(data);
      setFiltered(data);
      
      // Refresh doctor counts
      const activePolyclinics = data.filter(p => !p.archived);
      if (activePolyclinics.length > 0) {
        await fetchDoctorCounts(activePolyclinics.map(p => p.id));
      }
      setIsEditPolyclinicModalOpen(false);
      setEditingPolyclinic(null);
    } catch (error) {
      console.error("Error updating polyclinic:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить поликлинику",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedForDelete.length === 0) return;
    
    try {
      // Archive selected polyclinics
      await Promise.all(
        selectedForDelete.map(id => 
          api.put(`/pharmacy/hospitals/${id}/`, { archived: true })
        )
      );
      
      toast({
        title: "Успех",
        description: `${selectedForDelete.length} поликлиника архивирована`,
      });
      
      // Refresh data
      const response = await api.get("/pharmacy/hospitals/");
      const data: Polyclinic[] = (response as any).results || response;
      setPolyclinics(data);
      setFiltered(data);
      
      // Refresh doctor counts
      const activePolyclinics = data.filter(p => !p.archived);
      if (activePolyclinics.length > 0) {
        await fetchDoctorCounts(activePolyclinics.map(p => p.id));
      }
      setIsDeleteMode(false);
      setSelectedForDelete([]);
    } catch (error) {
      console.error("Error archiving polyclinics:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось архивировать поликлиники",
        variant: "destructive",
      });
    }
  };

  const toggleSelectForDelete = (id: number) => {
    setSelectedForDelete(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleEditPolyclinic = (polyclinic: Polyclinic) => {
    setEditingPolyclinic(polyclinic);
    setIsEditPolyclinicModalOpen(true);
  };

  if (selectedPolyclinic) {
    return (
      <PolyclinicDetails
        polyclinic={selectedPolyclinic}
        onBack={() => setSelectedPolyclinic(null)}
        darkMode={isDark}
        showAddButton={true}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16">
      {/* Header */}
      <div className="p-4 shadow-sm bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Poliklinikalar</h1>
          <div className="flex items-center gap-2">
            {isDeleteMode && (
              <Button 
                onClick={handleDeleteSelected}
                disabled={selectedForDelete.length === 0}
                className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1"
              >
                O'chirish ({selectedForDelete.length})
              </Button>
            )}
            <button 
              onClick={() => {
                setIsDeleteMode(!isDeleteMode);
                setSelectedForDelete([]);
              }}
              className={`p-1 rounded ${isDeleteMode ? 'bg-red-100 text-red-600' : ''}`}
            >
              <Trash2 className={isDeleteMode ? "text-red-600" : "text-gray-500"} size={24} />
            </button>
            <button onClick={() => setIsSearchOpen((s) => !s)}>
              <Search className="text-blue-500" size={24} />
            </button>
          </div>
        </div>
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isSearchOpen ? "max-h-16 opacity-100 mt-4" : "max-h-0 opacity-0"
          }`}
        >
          <div className="relative">
            <Input
              type="text"
              placeholder="Poliklinika qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pr-10 ${
                "dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="text-gray-400" size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <Label className="text-gray-700 dark:text-gray-300">Viloyat</Label>
          <select
            value={selectedRegionId}
            onChange={(e) => {
              setSelectedRegionId(e.target.value);
              setSelectedDistrictIds([]);
            }}
            className="w-full rounded-md border px-3 py-3 focus:outline-none bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="">Viloyatni tanlang</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {selectedRegion && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-gray-700 dark:text-gray-300">Tumanlar</Label>
              <Button variant="outline" size="sm" onClick={() => setSelectedDistrictIds([])}>
                Tozalash
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {selectedRegion.districts.map((d) => (
                <label key={d.id} className="flex items-center gap-2 p-2 rounded-md border bg-white dark:bg-gray-800 dark:border-gray-700">
                  <Checkbox
                    checked={selectedDistrictIds.includes(d.id)}
                    onCheckedChange={() => toggleDistrict(d.id)}
                    id={`district-${d.id}`}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-200">{d.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {(selectedRegionId || selectedDistrictIds.length > 0) && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={clearFilters}>Filtrlarni tiklash</Button>
          </div>
        )}
      </div>

      {/* List */}
      <div className="px-4 pb-8">
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">Yuklanmoqda...</div>
        ) : filtered.filter((p) => !p.archived).length > 0 ? (
          <div className="space-y-3">
            {filtered
              .filter((p) => !p.archived)
              .map((polyclinic, index) => (
                <Card
                  key={polyclinic.id}
                  className="transition-colors bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-700"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isDeleteMode && (
                          <Checkbox
                            checked={selectedForDelete.includes(polyclinic.id)}
                            onCheckedChange={() => toggleSelectForDelete(polyclinic.id)}
                          />
                        )}
                        <div 
                          className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center cursor-pointer"
                          onClick={() => !isDeleteMode && setSelectedPolyclinic(polyclinic)}
                        >
                          <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                        </div>
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => !isDeleteMode && setSelectedPolyclinic(polyclinic)}
                        >
                          <h3 className="font-medium text-gray-900 dark:text-white">{polyclinic.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{polyclinic.address}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-gray-400 dark:text-gray-500">{polyclinic.manager}</p>
                            <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-full">
                              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                {doctorCounts[polyclinic.id] || 0} врач
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isDeleteMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditPolyclinic(polyclinic);
                            }}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          >
                            <Edit className="w-4 h-4 text-blue-500" />
                          </button>
                        )}
                        <Hospital className="w-5 h-5 text-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Hospital className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Poliklinikalar topilmadi</p>
          </div>
        )}
      </div>

      {/* Floating Add Button for Polyclinics */}
      <div className="fixed bottom-20 right-4 z-40">
        <Button
          onClick={() => setIsAddPolyclinicModalOpen(true)}
          className={`w-16 h-16 rounded-full shadow-lg ${
            isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          <Plus className="h-8 w-8" />
        </Button>
      </div>

      <AddPolyclinicModal
        isOpen={isAddPolyclinicModalOpen}
        onClose={() => setIsAddPolyclinicModalOpen(false)}
        onAdd={handleAddPolyclinic}
        darkMode={isDark}
      />

      <EditPolyclinicModal
        isOpen={isEditPolyclinicModalOpen}
        onClose={() => {
          setIsEditPolyclinicModalOpen(false);
          setEditingPolyclinic(null);
        }}
        onUpdate={handleUpdatePolyclinic}
        polyclinic={editingPolyclinic}
        darkMode={isDark}
      />

      <BottomNavigation 
        currentView="polyclinics"
        onNavigation={(tab) => {
          if (tab === 'polyclinics') return;
          if (tab === 'dashboard') navigate('/dashboard');
          else if (tab === 'sklad') navigate('/sklad');
          else if (tab === 'control') navigate('/ostatka');
          else if (tab === 'settings') navigate('/settings');
        }}
        darkMode={isDark}
      />
    </div>
  );
};

export default PolyclinicsPage;

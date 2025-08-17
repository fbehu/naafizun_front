import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Building2, MapPin, Phone, User, TrendingUp, TrendingDown, Package2, Filter, Download, Plus, Minus, Maximize2, Hospital } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotifications } from '@/hooks/useNotifications';
import { toast } from "sonner";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Interfaces
interface Pharmacy {
  id: number;
  name: string;
  address: string;
  phone: string;
  manager: string;
  region: string;
  district: string;
  totalGiven: number;
  totalSold: number;
  totalRemaining: number;
  totalValue: number;
}

interface Polyclinic {
  id: number;
  name: string;
  address: string;
  phone: string;
  manager: string;
  region: string;
  district: string;
  totalGiven: number;
  totalSold: number;
  totalRemaining: number;
  totalValue: number;
}

interface OstatkaProps {
  darkMode: boolean;
  onSettingsClick: () => void;
  onDoctorsClick: () => void;
  onPolyclinicClick?: (polyclinic: Polyclinic) => void;
}

interface Medicine {
  id: number;
  name: string;
  dosage: string;
  remaining?: number;
  price: number;
  totalValue: number;
  expiryDate: string;
  stock_quantity?: number;
  pills_per_package?: number;
  manufacturer?: string;
}

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  phone: string;
  medicines: Medicine[];
  totalDebt: number;
}

interface MedicineInput {
  id: string;
  name: string;
  quantity: number;
  unit: 'pills' | 'packages';
}

interface SoldQuantity {
  pieces: number;
  packages: number;
}

interface ProductInstance {
  product_id: number;
  count: number;
  receipt_id: number;
  created_at: string;
}

const Ostatka: React.FC<OstatkaProps> = ({ darkMode, onSettingsClick, onDoctorsClick, onPolyclinicClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [selectedPharmacyForMedicine, setSelectedPharmacyForMedicine] = useState<Pharmacy | null>(null);
  const [selectedPolyclinicForMedicine, setSelectedPolyclinicForMedicine] = useState<Polyclinic | null>(null);
  const [medicineInputs, setMedicineInputs] = useState<MedicineInput[]>([
    { id: '1', name: '', quantity: 0, unit: 'pills' }
  ]);
  const [soldQuantities, setSoldQuantities] = useState<Record<number, SoldQuantity>>({});
  const [activeTab, setActiveTab] = useState('pharmacies');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<Pharmacy | Polyclinic | null>(null);
  const [priceFilter, setPriceFilter] = useState({ min: '', max: '' });
  const [medicineNameFilter, setMedicineNameFilter] = useState('');
  const [showSoldModal, setShowSoldModal] = useState(false);
  const [selectedItemForSold, setSelectedItemForSold] = useState<Pharmacy | Polyclinic | null>(null);
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellInputs, setSellInputs] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);
  const [lastSellTime, setLastSellTime] = useState<string | null>(null);
  const [productDetail, setProductDetail] = useState<any | null>(null);
  const [productDetailOpen, setProductDetailOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<Record<number, boolean>>({});
  const [sellQuantity, setSellQuantity] = useState<Record<number, number>>({});
  const [isPharmacyInfoVisible, setIsPharmacyInfoVisible] = useState(false);
  // Reminders/Notifications
  const { addNotification } = useNotifications();
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDateTime, setReminderDateTime] = useState('');
  const [reminderRepeat, setReminderRepeat] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [showStats, setShowStats] = useState(false);

  // API state
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [polyclinics, setPolyclinics] = useState<Polyclinic[]>([]);
  const [pharmacyMedicines, setPharmacyMedicines] = useState<Record<number, Medicine[]>>({});
  const [allReceipts, setAllReceipts] = useState<any[]>([]);

  // State for tracking sold and remaining quantities
  const [localSold, setLocalSold] = useState<Record<number, number>>({});
  const [localRemain, setLocalRemain] = useState<Record<number, number>>({});
  const [localSoldSum, setLocalSoldSum] = useState<Record<number, number>>({});
  const [localRemainSum, setLocalRemainSum] = useState<Record<number, number>>({});

  // Fetch pharmacies and polyclinics from API
  useEffect(() => {
    const token = localStorage.getItem('access');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    
    // Fetch pharmacies with error handling
    fetch(`${apiUrl}/pharmacy/pharmacies/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data.results)) setPharmacies(data.results);
        else if (Array.isArray(data)) setPharmacies(data);
      })
      .catch((error) => {
        console.error('Error fetching pharmacies:', error);
        setPharmacies([]);
        // Show user-friendly error message
        toast.error('Не удалось загрузить данные аптек. Проверьте подключение к интернету.');
      });
      
    // Fetch polyclinics with error handling
    fetch(`${apiUrl}/pharmacy/hospitals/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data.results)) setPolyclinics(data.results);
        else if (Array.isArray(data)) setPolyclinics(data);
      })
      .catch((error) => {
        console.error('Error fetching polyclinics:', error);
        setPolyclinics([]);
        toast.error('Не удалось загрузить данные поликлиник. Проверьте подключение к интернету.');
      });
  }, []);

  // Fetch all receipts for overall statistics
  useEffect(() => {
    const token = localStorage.getItem('access');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    
    fetch(`${apiUrl}/pharmacy/pharmacy-receipts/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        const items = Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : [];
        setAllReceipts(items);
      })
      .catch((error) => {
        console.error('Error fetching receipts:', error);
        setAllReceipts([]);
        toast.error('Не удалось загрузить данные по чекам. Проверьте подключение к интернету.');
      });
  }, []);

  // Add useEffect to fetch medicines for selected pharmacy
  useEffect(() => {
    if (selectedPharmacy) {
      const token = localStorage.getItem('access');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
      
      fetch(`${apiUrl}/pharmacy/pharmacy-receipts/?pharmacy=${selectedPharmacy.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          // Support both paginated and array response
          const meds = Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : [];
          setPharmacyMedicines(prev => ({
            ...prev,
            [selectedPharmacy.id]: meds
          }));
        })
        .catch((error) => {
          console.error('Error fetching pharmacy medicines:', error);
          setPharmacyMedicines(prev => ({
            ...prev,
            [selectedPharmacy.id]: []
          }));
          toast.error('Не удалось загрузить лекарства для аптеки. Проверьте подключение к интернету.');
        });
    }
  }, [selectedPharmacy]);

  // Data processing
  const currentData = activeTab === 'pharmacies' ? pharmacies : polyclinics;
  // Filtrlar uchun viloyat va tumanlarni shakllantirish
  const regions = [...new Set(currentData.map((p) => p.region).filter(Boolean))]; // Faqat mavjud viloyatlarni olish
  const districts = selectedRegion && selectedRegion !== 'all-regions'
    ? [...new Set(currentData.filter((p) => p.region === selectedRegion).map((p) => p.district).filter(Boolean))]
    : [...new Set(currentData.map((p) => p.district).filter(Boolean))];

  // Filtrlangan ma'lumotlar
  const filteredData = currentData.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.manager.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRegion =
      !selectedRegion || selectedRegion === 'all-regions' || item.region === selectedRegion;

    const matchesDistrict =
      !selectedDistrict || selectedDistrict === 'all-districts' || item.district === selectedDistrict;

    return matchesSearch && matchesRegion && matchesDistrict;
  });

  const filteredMedicines = (pharmacyMedicines[selectedPharmacy?.id || 0] || []).filter(medicine => {
    const matchesName = !medicineNameFilter || medicine.name.toLowerCase().includes(medicineNameFilter.toLowerCase());
    const matchesPrice = (!priceFilter.min || medicine.price >= parseInt(priceFilter.min)) &&
                        (!priceFilter.max || medicine.price <= parseInt(priceFilter.max));
    return matchesName && matchesPrice;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    switch (sortBy) {
      case 'most-given':
        return b.totalGiven - a.totalGiven;
      case 'least-given':
        return a.totalGiven - b.totalGiven;
      case 'most-sold':
        return b.totalSold - a.totalSold;
      case 'least-sold':
        return a.totalSold - b.totalSold;
      case 'highest-value':
        return b.totalValue - a.totalValue;
      case 'lowest-value':
        return a.totalValue - b.totalValue;
      case 'no-sort':
      default:
        return 0;
    }
  });

  // Helper functions
  const addMedicineInput = () => {
    const newId = (medicineInputs.length + 1).toString();
    setMedicineInputs([...medicineInputs, { id: newId, name: '', quantity: 0, unit: 'pills' }]);
  };

  const removeMedicineInput = (id: string) => {
    if (medicineInputs.length > 1) {
      setMedicineInputs(medicineInputs.filter(input => input.id !== id));
    }
  };

  const updateMedicineInput = (id: string, field: keyof MedicineInput, value: any) => {
    setMedicineInputs(medicineInputs.map(input => 
      input.id === id ? { ...input, [field]: value } : input
    ));
  };

  const handleSoldQuantityChange = (itemId: number, field: 'pieces' | 'packages', quantity: number) => {
    setSoldQuantities(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId] || { pieces: 0, packages: 0 },
        [field]: Math.max(0, quantity)
      }
    }));
  };

  const getCalculatedRemaining = (item: Pharmacy | Polyclinic) => {
    const soldData = soldQuantities[item.id] || { pieces: 0, packages: 0 };
    const totalSoldQty = soldData.pieces + (soldData.packages * 10);
    return Math.max(0, item.totalRemaining - totalSoldQty);
  };

  const exportItemData = (item: Pharmacy | Polyclinic) => {
    const soldData = soldQuantities[item.id] || { pieces: 0, packages: 0 };
    const medicines = pharmacyMedicines[item.id] || [];
    
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text(`Отчет по ${activeTab === 'pharmacies' ? 'аптеке' : 'поликлинике'}`, 20, 25);
    
    // Date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Дата экспорта: ${new Date().toLocaleDateString('ru-RU')}`, 20, 35);
    
    // Organization info
    doc.setFontSize(14);
    doc.setTextColor(60, 60, 60);
    doc.text('Информация об организации:', 20, 50);
    
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    const orgInfo = [
      `Название: ${item.name}`,
      `Адрес: ${item.address}`,
      `Менеджер: ${item.manager}`,
      `Телефон: ${item.phone}`,
      `Регион: ${item.region}`,
      `Район: ${item.district}`
    ];
    
    orgInfo.forEach((info, index) => {
      doc.text(info, 25, 60 + (index * 8));
    });
    
    // Statistics
    doc.setFontSize(14);
    doc.setTextColor(60, 60, 60);
    doc.text('Статистика:', 20, 120);
    
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    const stats = [
      `Всего выдано: ${item.totalGiven}`,
      `Всего продано: ${item.totalSold + soldData.pieces + (soldData.packages * 10)}`,
      `Остаток: ${getCalculatedRemaining(item)}`,
      `Общая стоимость: ${item.totalValue.toLocaleString('ru-RU')} сум`
    ];
    
    stats.forEach((stat, index) => {
      doc.text(stat, 25, 130 + (index * 8));
    });
    
    // Medicines table
    if (medicines.length > 0) {
      const tableData = medicines.map(med => [
        med.name || 'Не указано',
        med.dosage || 'Не указано',
        med.manufacturer || 'Не указано',
        (med.stock_quantity || 0).toString(),
        (med.pills_per_package || 0).toString(),
        (med.price || 0).toLocaleString('ru-RU')
      ]);
      
      (doc as any).autoTable({
        head: [['Название', 'Дозировка', 'Производитель', 'Количество', 'Таб./упак.', 'Цена (сум)']],
        body: tableData,
        startY: 170,
        theme: 'grid',
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 9,
          textColor: 50
        },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 25 },
          2: { cellWidth: 30 },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 20, halign: 'center' },
          5: { cellWidth: 25, halign: 'right' }
        },
        margin: { left: 20, right: 20 }
      });
    }
    
    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Экспортировано из системы управления аптеками', 20, pageHeight - 20);
    doc.text(`Страница 1 из 1`, doc.internal.pageSize.width - 40, pageHeight - 20);
    
    // Save PDF
    const fileName = `${item.name.replace(/[^a-zA-Z0-9а-яё]/gi, '_')}_отчет.pdf`;
    doc.save(fileName);
    
    toast.success('PDF отчет успешно экспортирован');
  };

  const handleMedicineDispense = () => {
    console.log('Dispensing medicines:', medicineInputs, 'to pharmacy:', selectedPharmacyForMedicine?.name);
    setShowMedicineModal(false);
    setMedicineInputs([{ id: '1', name: '', quantity: 0, unit: 'pills' }]);
    setSelectedPharmacyForMedicine(null);
    setSelectedPolyclinicForMedicine(null);
  };

  const getProductInstances = (receipts: any[], productId: number): ProductInstance[] => {
    const instances: ProductInstance[] = [];
    receipts.forEach(receipt => {
      if (Array.isArray(receipt.products)) {
        receipt.products.forEach((prod: any) => {
          if (prod.product_id === productId) {
            instances.push({
              product_id: productId,
              count: prod.count || 0,
              receipt_id: receipt.id,
              created_at: receipt.created_at
            });
          }
        });
      }
    });
    return instances.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };

  const handleSaveSell = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('access');
      const toastId = (toast as any).loading ? (toast as any).loading('Saqlanmoqda...') : null;
      
      const productsToUpdate: { product_id: number; quantity: number; receipt_id: number }[] = [];
      
      // Build updates from sellInputs
      for (const [productIdStr, sellAmountRaw] of Object.entries(sellInputs)) {
        const productId = parseInt(productIdStr);
        const sellAmount = Number(sellAmountRaw) || 0;
        if (!sellAmount || sellAmount <= 0) continue;
        
        let remainingToSell = sellAmount;
        const instances = getProductInstances(pharmacyMedicines[selectedPharmacy?.id || 0] || [], productId);
        
        for (const instance of instances) {
          if (remainingToSell <= 0) break;
          const amountFromThis = Math.min(remainingToSell, instance.count);
          if (amountFromThis > 0) {
            productsToUpdate.push({
              product_id: instance.product_id,
              quantity: amountFromThis,
              receipt_id: instance.receipt_id
            });
            remainingToSell -= amountFromThis;
          }
        }
        
        if (remainingToSell > 0) {
          toast.error(`Недостаточно товара с ID ${productId}`);
          if (toastId) (toast as any).error('Xatolik', { id: toastId });
          setSaving(false);
          return;
        }
      }

      if (productsToUpdate.length === 0) {
        toast.error('Kiritilgan qiymatlar yo\'q');
        if (toastId) (toast as any).error('Kiritilgan qiymatlar yo\'q', { id: toastId });
        setSaving(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/pharmacy/pharmacies/${selectedPharmacy?.id}/update_stock/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          products: productsToUpdate
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Ошибка при сохранении');
      }

      await response.json();
      if (toastId) (toast as any).success('Ma\'lumotlar saqlandi', { id: toastId });
      else toast.success('Ma\'lumotlar saqlandi');
      
      setSellInputs({});
      setIsEditing({});
      
      if (selectedPharmacy) {
        fetch(`${import.meta.env.VITE_API_URL}/pharmacy/pharmacy-receipts/?pharmacy=${selectedPharmacy.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            const meds = Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : [];
            setPharmacyMedicines(prev => ({
              ...prev,
              [selectedPharmacy.id]: meds
            }));
          });
      }

    } catch (error) {
      console.error('Error saving sell:', error);
      toast.error(error instanceof Error ? error.message : 'Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  const totalStats = sortedData.reduce((acc, item) => ({
    totalGiven: acc.totalGiven + item.totalGiven,
    totalSold: acc.totalSold + item.totalSold,
    totalRemaining: acc.totalRemaining + item.totalRemaining,
    totalValue: acc.totalValue + item.totalValue,
  }), {
    totalGiven: 0,
    totalSold: 0,
    totalRemaining: 0,
    totalValue: 0,
  });

  const handleDoubleClick = (item: Pharmacy | Polyclinic) => {
    setSelectedDetailItem(item);
    setShowDetailModal(true);
  };

  // Add this helper function before the return statement
  const aggregateProducts = (receipts: any[]) => {
    const productMap = new Map();

    receipts.forEach(receipt => {
      if (Array.isArray(receipt.products)) {
        receipt.products.forEach((prod: any) => {
          if (productMap.has(prod.product_id)) {
            const existing = productMap.get(prod.product_id);
            productMap.set(prod.product_id, {
              ...prod,
              count: (existing.count || 0) + (prod.count || 0),
              total_product: (existing.total_product || 0) + (prod.total_product || 0),
            });
          } else {
            productMap.set(prod.product_id, { ...prod });
          }
        });
      }
    });

    return Array.from(productMap.values());
  };

  // Render pharmacy details with medicines
  if (selectedPharmacy) {
    return (
      <div className={`min-h-screen pb-20 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 shadow-sm`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setSelectedPharmacy(null)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {selectedPharmacy.name}
              </h1>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsPharmacyInfoVisible(!isPharmacyInfoVisible)}>
              <Filter className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-0 space-y-4">
          {/* Pharmacy Info */}
          {isPharmacyInfoVisible && (
            <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
              <CardHeader>
                <CardTitle className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Информация об аптеке
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Всего выдано</p>
                    <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {(() => {
                        const receipts = pharmacyMedicines[selectedPharmacy?.id || 0] || [];
                        const totalGiven = receipts.reduce((sum: number, r: any) => sum + (Number(r.total_count) || 0), 0);
                        return Number(totalGiven).toLocaleString() + ' шт';
                      })()}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Всего остается</p>
                    <p className="font-bold text-purple-500">
                      {(() => {
                        const receipts = pharmacyMedicines[selectedPharmacy?.id || 0] || [];
                        const totalRemaining = receipts.reduce((sum: number, r: any) => sum + ((Array.isArray(r.products) ? r.products.reduce((s: number, p: any) => s + (Number(p.count ?? p.total_product ?? 0)), 0) : 0)), 0);
                        return Number(totalRemaining).toLocaleString() + ' шт';
                      })()}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Всего продано</p>
                    <p className="font-bold text-blue-500">
                      {(() => {
                        const receipts = pharmacyMedicines[selectedPharmacy?.id || 0] || [];
                        const totalGiven = receipts.reduce((sum: number, r: any) => sum + (Number(r.total_count) || 0), 0);
                        const totalRemaining = receipts.reduce((sum: number, r: any) => sum + ((Array.isArray(r.products) ? r.products.reduce((s: number, p: any) => s + (Number(p.count ?? p.total_product ?? 0)), 0) : 0)), 0);
                        const totalSold = Math.max(0, totalGiven - totalRemaining);
                        return Number(totalSold).toLocaleString() + ' шт';
                      })()}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Общая стоимость</p>
                    <p className="font-bold text-green-500">
                      {(() => {
                        const receipts = pharmacyMedicines[selectedPharmacy?.id || 0] || [];
                        const totalValue = receipts.reduce((sum: number, r: any) => sum + ((Array.isArray(r.products) ? r.products.reduce((s: number, p: any) => s + ((Number(p.selling_price) || 0) * Number(p.count ?? p.total_product ?? 0)), 0) : 0)), 0);
                        return Number(totalValue).toLocaleString() + ' сум';
                      })()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters for medicines */}
          {/* <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <CardHeader>
              <CardTitle className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Фильтры
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Название лекарства</label>
                  <Input
                    placeholder="Поиск по названию..."
                    value={medicineNameFilter}
                    onChange={(e) => setMedicineNameFilter(e.target.value)}
                    className={darkMode ? 'bg-gray-700 border-gray-600' : ''}
                  />
                </div>
                <div>
                  <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Мин. цена</label>
                  <Input
                    type="number"
                    placeholder="От..."
                    value={priceFilter.min}
                    onChange={(e) => setPriceFilter(prev => ({ ...prev, min: e.target.value }))}
                    className={darkMode ? 'bg-gray-700 border-gray-600' : ''}
                  />
                </div>
                <div>
                  <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Макс. цена</label>
                  <Input
                    type="number"
                    placeholder="До..."
                    value={priceFilter.max}
                    onChange={(e) => setPriceFilter(prev => ({ ...prev, max: e.target.value }))}
                    className={darkMode ? 'bg-gray-700 border-gray-600' : ''}
                  />
                </div>
              </div>
            </CardContent>
          </Card> */}

          {/* Medicines table */}
          <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white p-0'}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Остатки лекарств ({aggregateProducts(pharmacyMedicines[selectedPharmacy?.id || 0] || []).length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSellInputs({})}
                  className={darkMode ? 'border-gray-600 hover:bg-gray-700' : ''}
                >
                  Tozalash
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleSaveSell}
                  disabled={saving || Object.values(sellInputs).every(v => !v || v <= 0)}
                >
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className='p-0'>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={`${darkMode ? 'text-gray-300' : 'text-gray-500'} text-center`}>№</TableHead>
                      <TableHead className={`${darkMode ? 'text-gray-300' : 'text-gray-500'} text-left`}>
                        Препарат
                      </TableHead>
                      <TableHead className="text-center font-semibold">Жами</TableHead>
                      <TableHead className="text-center font-semibold">Остаток</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Loop through aggregated products */}
                    {(() => {
                      const aggregatedProducts = aggregateProducts(pharmacyMedicines[selectedPharmacy?.id || 0] || []);
                      return aggregatedProducts.map((prod: any, idx: number) => {
                        const totalStock = prod.total_product ?? 0;
                        const stockQuantity = prod.count ?? 0;
                        const pillsPerPackage = prod.pills_per_package ?? 1;
                        const remainingQuantity = stockQuantity * pillsPerPackage;
                        const soldQuantity = totalStock-remainingQuantity;
                        const soldSum = soldQuantity * prod.selling_price;
                        const CreatedAt = prod.created_at;
                        const remainingSum = remainingQuantity * prod.selling_price;
                        
                        return (
                          <TableRow key={prod.product_id + '-' + idx} onClick={() => {
                            try {
                              const receipts = pharmacyMedicines[selectedPharmacy?.id || 0] || [];
                              const instances = getProductInstances(receipts as any[], prod.product_id);
                              const createdAt = instances.length ? instances[0].created_at : prod.created_at;
                              const updatedAt = instances.length ? instances[instances.length - 1].created_at : prod.created_at;
                              const totalStockVal = totalStock;
                              const remainingQty = remainingQuantity;
                              const soldQty = totalStockVal - remainingQty;
                              const soldSumVal = soldQty * (prod.selling_price || 0);
                              const remainingSumVal = remainingQty * (prod.selling_price || 0);
                              setProductDetail({
                                name: prod.name,
                                dosage: prod.dosage,
                                manufacturer: prod.manufacturer,
                                price: prod.selling_price,
                                totalStock: totalStockVal,
                                soldQuantity: soldQty,
                                remainingQuantity: remainingQty,
                                soldSum: soldSumVal,
                                remainingSum: remainingSumVal,
                                createdAt,
                                updatedAt,
                              });
                              setProductDetailOpen(true);
                            } catch (e) {}
                          }}>
                            <TableCell className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} font-mono text-center`}>
                              {idx + 1}
                            </TableCell>
                            <TableCell className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {prod.name}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-semibold">{totalStock}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <input
                                type="number"
                                min={0}
                                max={remainingQuantity}
                                className={`w-24 rounded border px-2 py-1 text-center ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                value={sellInputs[prod.product_id] ?? ''}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  if (raw === '') {
                                    setSellInputs(prev => {
                                      const { [prod.product_id]: _omit, ...rest } = prev;
                                      return rest;
                                    });
                                    return;
                                  }
                                  const num = Math.max(0, Math.min(remainingQuantity, Number(raw)));
                                  setSellInputs(prev => ({ ...prev, [prod.product_id]: num }));
                                }}
                              />
                              <div className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Max: {remainingQuantity}</div>
                            </TableCell>
                          </TableRow>
                        );
                      });
                    })()}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Product detail modal */}
        <Dialog open={productDetailOpen} onOpenChange={setProductDetailOpen}>
          <DialogContent className={`max-w-md ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
            <DialogHeader>
              <DialogTitle className={darkMode ? 'text-white' : 'text-gray-900'}>
                {productDetail?.name} {productDetail?.dosage ? `• ${productDetail?.dosage}` : ''}
              </DialogTitle>
            </DialogHeader>
            {productDetail && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Ishlab chiqaruvchi</span>
                  <span className={darkMode ? 'text-white' : 'text-gray-900'}>{productDetail.manufacturer || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Narxi</span>
                  <span className="font-semibold">{Number(productDetail.price || 0).toLocaleString()} сум</span>
                </div>
                <div className="border-t my-2" />
                <div className="flex justify-between text-sm">
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Jami olingan</span>
                  <span className="font-semibold">{productDetail.totalStock}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Sotilgan</span>
                  <span className="font-semibold text-blue-500">{productDetail.soldQuantity} ({Number(productDetail.soldSum || 0).toLocaleString()} сум)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Qolgan</span>
                  <span className="font-semibold text-red-500">{productDetail.remainingQuantity} ({Number(productDetail.remainingSum || 0).toLocaleString()} сум)</span>
                </div>
                <div className="border-t my-2" />
                <div className="flex justify-between text-xs">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Yaratilgan</span>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{productDetail.createdAt ? new Date(productDetail.createdAt).toLocaleString() : '-'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Yangilangan</span>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{productDetail.updatedAt ? new Date(productDetail.updatedAt).toLocaleString() : '-'}</span>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        {/* Продано Modal */}
        <Dialog open={showSellModal} onOpenChange={setShowSellModal}>
          <DialogContent className={`max-w-xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
            <DialogHeader>
              <DialogTitle className={darkMode ? 'text-white' : 'text-gray-900'}>
                Продано (барча дори учун)
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left">Препарат</TableHead>
                    <TableHead className="text-center">Продано</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMedicines.map((medicine) => {
                    const soldData = soldQuantities[medicine.id] || { pieces: 0, packages: 0 };
                    const totalSold = soldData.pieces + (soldData.packages * 10);
                    return (
                      <TableRow key={medicine.id + '-sell'}>
                        <TableCell>{medicine.name}</TableCell>
                        <TableCell className="text-center">
                          <input
                            type="number"
                            min={0}
                            className={`w-24 rounded border px-2 py-1 text-center ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                            value={sellInputs[medicine.id] ?? ''}
                            onChange={e => {
                              const val = e.target.value;
                              setSellInputs(inputs => ({
                                ...inputs,
                                [medicine.id]: val === '' ? 0 : Math.max(0, Number(val))
                              }));
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSellModal(false);
                    setSellInputs({});
                  }}
                >
                  Bekor qilish
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleSaveSell}
                >
                  Saqlash
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );

  }

  // Render doctor details (unchanged)
  if (selectedDoctor) {
    return (
      <div className={`min-h-screen pb-20 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 shadow-sm`}>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedDoctor(null)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {selectedDoctor.name}
            </h1>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Doctor Info */}
          <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <CardHeader>
              <CardTitle className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Информация о враче
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Специальность</p>
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedDoctor.specialty}</p>
                </div>
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Телефон</p>
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedDoctor.phone}</p>
                </div>
                <div className="md:col-span-2">
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Общая задолженность</p>
                  <p className="font-bold text-red-500">{selectedDoctor.totalDebt.toLocaleString()} сум</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Doctor's medicines table (read-only) */}
          <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <CardHeader>
              <CardTitle className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Выданные лекарства
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={darkMode ? 'text-gray-300' : ''}>Название</TableHead>
                      <TableHead className={darkMode ? 'text-gray-300' : ''}>Дозировка</TableHead>
                      <TableHead className={darkMode ? 'text-gray-300' : ''}>Количество</TableHead>
                      <TableHead className={darkMode ? 'text-gray-300' : ''}>Цена</TableHead>
                      <TableHead className={darkMode ? 'text-gray-300' : ''}>Общая стоимость</TableHead>
                      <TableHead className={darkMode ? 'text-gray-300' : ''}>Срок годности</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedDoctor.medicines.map((medicine) => (
                      <TableRow key={medicine.id} className={darkMode ? 'border-gray-700' : ''}>
                        <TableCell className={`font-medium ${darkMode ? 'text-white' : ''}`}>
                          {medicine.name}
                        </TableCell>
                        <TableCell className={darkMode ? 'text-gray-300' : ''}>
                          {medicine.dosage}
                        </TableCell>
                        <TableCell className={darkMode ? 'text-gray-300' : ''}>
                          {medicine.remaining} шт
                        </TableCell>
                        <TableCell className={darkMode ? 'text-gray-300' : ''}>
                          {medicine.price.toLocaleString()} сум
                        </TableCell>
                        <TableCell className={darkMode ? 'text-gray-300' : ''}>
                          {medicine.totalValue.toLocaleString()} сум
                        </TableCell>
                        <TableCell className={darkMode ? 'text-gray-300' : ''}>
                          <Badge variant={new Date(medicine.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'destructive' : 'secondary'}>
                            {medicine.expiryDate}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-20 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 shadow-sm`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Остатки
            </h1>
          </div>
          <Collapsible open={showFilters} onOpenChange={setShowFilters}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                <Filter className="w-5 h-5" />
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Поиск и фильтры */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Поиск аптек..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
            />
          </div>

          <Collapsible open={showFilters} onOpenChange={setShowFilters}>
            <CollapsibleContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className={darkMode ? 'bg-gray-700 border-gray-600' : ''}>
                    <SelectValue placeholder="Выберите регион" />
                  </SelectTrigger>
                  <SelectContent className={darkMode ? 'bg-gray-800 border-gray-700' : ''}>
                    <SelectItem value="all-regions">Все регионы</SelectItem>
                    {regions.map(region => (
                      <SelectItem key={region} value={region}>{region}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                  <SelectTrigger className={darkMode ? 'bg-gray-700 border-gray-600' : ''}>
                    <SelectValue placeholder="Выберите район" />
                  </SelectTrigger>
                  <SelectContent className={darkMode ? 'bg-gray-800 border-gray-700' : ''}>
                    <SelectItem value="all-districts">Все районы</SelectItem>
                    {districts.map(district => (
                      <SelectItem key={district} value={district}>{district}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Общая статистика - Collapsible */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} border rounded-lg`}>
          <Collapsible open={showStats} onOpenChange={setShowStats}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className={`w-full justify-between p-4 h-auto ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Общая статистика
                  </span>
                </div>
                <Filter className={`w-4 h-4 transition-transform ${showStats ? 'rotate-180' : ''} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-200'}`}>
                  <div className={`text-sm flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-blue-600'} mb-2`}>
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    Jami berilgan
                  </div>
                  <div className={`text-xl font-bold text-blue-600 mb-1`}>
                    {(() => {
                      const receipts = allReceipts;
                      const totalGiven = receipts.reduce((sum: number, r: any) => sum + (Number(r.total_count) || 0), 0);
                      return Number(totalGiven).toLocaleString();
                    })()} ta
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-blue-500'}`}>
                    {(() => {
                      const receipts = allReceipts;
                      const totalGivenValue = receipts.reduce((sum: number, r: any) => {
                        if (Array.isArray(r.products)) {
                          return sum + r.products.reduce((s: number, p: any) => s + ((Number(p.selling_price) || 0) * Number(r.total_count || 0)), 0);
                        }
                        return sum;
                      }, 0);
                      return Number(totalGivenValue).toLocaleString();
                    })()} so'm qiymat
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-green-50 border-green-200'}`}>
                  <div className={`text-sm flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-green-600'} mb-2`}>
                    <TrendingDown className="w-4 h-4 text-green-500" />
                    Jami sotilgan
                  </div>
                  <div className={`text-xl font-bold text-green-600 mb-1`}>
                    {(() => {
                      const receipts = allReceipts;
                      const totalGiven = receipts.reduce((sum: number, r: any) => sum + (Number(r.total_count) || 0), 0);
                      const totalRemaining = receipts.reduce((sum: number, r: any) => sum + (Array.isArray(r.products) ? r.products.reduce((s: number, p: any) => s + (Number(p.count ?? p.total_product ?? 0)), 0) : 0), 0);
                      const totalSold = Math.max(0, totalGiven - totalRemaining);
                      return Number(totalSold).toLocaleString();
                    })()} ta
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-green-500'}`}>
                    {(() => {
                      const receipts = allReceipts;
                      const totalGiven = receipts.reduce((sum: number, r: any) => sum + (Number(r.total_count) || 0), 0);
                      const totalRemaining = receipts.reduce((sum: number, r: any) => sum + (Array.isArray(r.products) ? r.products.reduce((s: number, p: any) => s + (Number(p.count ?? p.total_product ?? 0)), 0) : 0), 0);
                      const totalSold = Math.max(0, totalGiven - totalRemaining);
                      const soldValue = receipts.reduce((sum: number, r: any) => {
                        if (Array.isArray(r.products)) {
                          const soldInReceipt = Number(r.total_count || 0) - r.products.reduce((s: number, p: any) => s + (Number(p.count ?? p.total_product ?? 0)), 0);
                          return sum + r.products.reduce((s: number, p: any) => s + ((Number(p.selling_price) || 0) * soldInReceipt), 0);
                        }
                        return sum;
                      }, 0);
                      return Number(soldValue).toLocaleString();
                    })()} so'm daromad
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-yellow-50 border-yellow-200'}`}>
                  <div className={`text-sm flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-yellow-600'} mb-2`}>
                    <Package2 className="w-4 h-4 text-yellow-500" />
                    Jami qolgan
                  </div>
                  <div className={`text-xl font-bold text-yellow-600 mb-1`}>
                    {(() => {
                      const receipts = allReceipts;
                      const totalRemaining = receipts.reduce((sum: number, r: any) => sum + (Array.isArray(r.products) ? r.products.reduce((s: number, p: any) => s + (Number(p.count ?? p.total_product ?? 0)), 0) : 0), 0);
                      return Number(totalRemaining).toLocaleString();
                    })()} ta
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-yellow-500'}`}>
                    {(() => {
                      const receipts = allReceipts;
                      const remainingValue = receipts.reduce((sum: number, r: any) => sum + (Array.isArray(r.products) ? r.products.reduce((s: number, p: any) => s + ((Number(p.selling_price) || 0) * Number(p.count ?? p.total_product ?? 0)), 0) : 0), 0);
                      return Number(remainingValue).toLocaleString();
                    })()} so'm qiymat
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-purple-50 border-purple-200'}`}>
                  <div className={`text-sm flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-purple-600'} mb-2`}>
                    <Building2 className="w-4 h-4 text-purple-500" />
                    Sotish foizi
                  </div>
                  <div className={`text-xl font-bold text-purple-600 mb-1`}>
                    {(() => {
                      const receipts = allReceipts;
                      const totalGiven = receipts.reduce((sum: number, r: any) => sum + (Number(r.total_count) || 0), 0);
                      const totalRemaining = receipts.reduce((sum: number, r: any) => sum + (Array.isArray(r.products) ? r.products.reduce((s: number, p: any) => s + (Number(p.count ?? p.total_product ?? 0)), 0) : 0), 0);
                      const totalSold = Math.max(0, totalGiven - totalRemaining);
                      const percentage = totalGiven > 0 ? ((totalSold / totalGiven) * 100).toFixed(1) : '0.0';
                      return percentage;
                    })()}%
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-purple-500'}`}>
                    Sotish samaradorligi
                  </div>
                </div>
              </div>

              {/* Additional detailed statistics */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`text-center p-3 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
                    <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {currentData.length}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Jami {activeTab === 'pharmacies' ? 'aptekalar' : 'poliklinikalar'}
                    </div>
                  </div>
                  <div className={`text-center p-3 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
                    <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {regions.length}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Viloyatlar soni
                    </div>
                  </div>
                  <div className={`text-center p-3 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
                    <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {districts.length}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Tumanlar soni
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Tabs for Pharmacies and Polyclinics */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full grid-cols-2 ${darkMode ? 'bg-gray-800' : ''}`}>
            <TabsTrigger value="pharmacies" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Аптеки
            </TabsTrigger>
            <TabsTrigger value="polyclinics" className="flex items-center gap-2">
              <Hospital className="w-4 h-4" />
              Поликлиники
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pharmacies" className="mt-4">
            <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
              <CardHeader>
                <CardTitle className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Аптеки ({sortedData.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className={darkMode ? 'text-gray-300' : 'text-gray-700'}>№</TableHead>
                        <TableHead className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Аптека</TableHead>
                        <TableHead className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} hidden sm:table-cell`}>Регион</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedData.map((item, index) => (
                        <TableRow
                          key={item.id}
                          className={`${darkMode ? 'border-gray-700' : 'border-gray-200'} cursor-pointer`}
                          onDoubleClick={() => handleDoubleClick(item)}
                        >
                          <TableCell className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} font-mono`}>
                            {index + 1}
                          </TableCell>
                          <TableCell 
                            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => setSelectedPharmacy(item as Pharmacy)}
                          >
                            <div>
                              <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {item.name}
                              </div>
                              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {item.address}
                                </div>
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {item.manager}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} hidden sm:table-cell`}>
                            <Badge variant="secondary">
                              {item.manager}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Export all pharmacies data as PDF
                      const doc = new jsPDF();
                      
                      // Header
                      doc.setFontSize(18);
                      doc.setTextColor(40, 40, 40);
                      doc.text('Отчет по всем аптекам', 20, 25);
                      
                      // Date
                      doc.setFontSize(10);
                      doc.setTextColor(100, 100, 100);
                      doc.text(`Дата экспорта: ${new Date().toLocaleDateString('ru-RU')}`, 20, 35);
                      
                      // Summary statistics
                      doc.setFontSize(14);
                      doc.setTextColor(60, 60, 60);
                      doc.text('Общая статистика:', 20, 50);
                      
                      const totalPharmacies = sortedData.length;
                      const totalGiven = sortedData.reduce((sum, item) => sum + (item.totalGiven || 0), 0);
                      const totalSold = sortedData.reduce((sum, item) => sum + (item.totalSold || 0), 0);
                      const totalValue = sortedData.reduce((sum, item) => sum + (item.totalValue || 0), 0);
                      
                      doc.setFontSize(11);
                      doc.setTextColor(40, 40, 40);
                      const summaryInfo = [
                        `Всего аптек: ${totalPharmacies}`,
                        `Общее количество выданных лекарств: ${totalGiven.toLocaleString('ru-RU')}`,
                        `Общее количество проданных лекарств: ${totalSold.toLocaleString('ru-RU')}`,
                        `Общая стоимость: ${totalValue.toLocaleString('ru-RU')} сум`
                      ];
                      
                      summaryInfo.forEach((info, index) => {
                        doc.text(info, 25, 60 + (index * 8));
                      });
                      
                      // Pharmacies table
                      const tableData = sortedData.map((item, index) => [
                        (index + 1).toString(),
                        item.name || 'Не указано',
                        item.address || 'Не указано',
                        item.region || 'Не указано',
                        item.manager || 'Не указано',
                        (item.totalGiven || 0).toLocaleString('ru-RU'),
                        (item.totalSold || 0).toLocaleString('ru-RU'),
                        (item.totalValue || 0).toLocaleString('ru-RU')
                      ]);
                      
                      (doc as any).autoTable({
                        head: [['№', 'Название', 'Адрес', 'Регион', 'Менеджер', 'Выдано', 'Продано', 'Стоимость (сум)']],
                        body: tableData,
                        startY: 100,
                        theme: 'grid',
                        headStyles: {
                          fillColor: [66, 139, 202],
                          textColor: 255,
                          fontSize: 9,
                          fontStyle: 'bold'
                        },
                        bodyStyles: {
                          fontSize: 8,
                          textColor: 50
                        },
                        columnStyles: {
                          0: { cellWidth: 15, halign: 'center' },
                          1: { cellWidth: 35 },
                          2: { cellWidth: 35 },
                          3: { cellWidth: 25 },
                          4: { cellWidth: 25 },
                          5: { cellWidth: 20, halign: 'right' },
                          6: { cellWidth: 20, halign: 'right' },
                          7: { cellWidth: 25, halign: 'right' }
                        },
                        margin: { left: 10, right: 10 }
                      });
                      
                      // Footer
                      const pageHeight = doc.internal.pageSize.height;
                      doc.setFontSize(8);
                      doc.setTextColor(150, 150, 150);
                      doc.text('Экспортировано из системы управления аптеками', 20, pageHeight - 20);
                      doc.text(`Страница 1 из 1`, doc.internal.pageSize.width - 40, pageHeight - 20);
                      
                      // Save PDF
                      const fileName = `все_аптеки_отчет_${new Date().toLocaleDateString('ru-RU').replace(/\./g, '_')}.pdf`;
                      doc.save(fileName);
                      
                      toast.success('PDF отчет по всем аптекам успешно экспортирован');
                    }}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export All PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="polyclinics" className="mt-4">
            <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
              <CardHeader>
                <CardTitle className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Поликлиники ({sortedData.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className={darkMode ? 'text-gray-300' : 'text-gray-700'}>№</TableHead>
                        <TableHead className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Поликлиника</TableHead>
                        <TableHead className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} hidden sm:table-cell`}>Регион</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                       {sortedData.map((item, index) => (
                        <TableRow
                          key={item.id}
                          className={`${darkMode ? 'border-gray-700' : 'border-gray-200'} cursor-pointer`}
                          onClick={() => onPolyclinicClick?.(item as Polyclinic)}
                        >
                          <TableCell className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} font-mono`}>
                            {index + 1}
                          </TableCell>
                          <TableCell 
                            className="hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                            onClick={() => onPolyclinicClick?.(item as Polyclinic)}
                          >
                            <div>
                              <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {item.name}
                              </div>
                              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {item.address}
                                </div>
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {item.manager}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} hidden sm:table-cell`}>
                            <Badge variant="secondary">
                              {item.manager}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Export all polyclinics data as PDF
                      const doc = new jsPDF();
                      
                      // Header
                      doc.setFontSize(18);
                      doc.setTextColor(40, 40, 40);
                      doc.text('Отчет по всем поликлиникам', 20, 25);
                      
                      // Date
                      doc.setFontSize(10);
                      doc.setTextColor(100, 100, 100);
                      doc.text(`Дата экспорта: ${new Date().toLocaleDateString('ru-RU')}`, 20, 35);
                      
                      // Summary statistics
                      doc.setFontSize(14);
                      doc.setTextColor(60, 60, 60);
                      doc.text('Общая статистика:', 20, 50);
                      
                      const totalPolyclinics = sortedData.length;
                      const totalGiven = sortedData.reduce((sum, item) => sum + (item.totalGiven || 0), 0);
                      const totalSold = sortedData.reduce((sum, item) => sum + (item.totalSold || 0), 0);
                      const totalValue = sortedData.reduce((sum, item) => sum + (item.totalValue || 0), 0);
                      
                      doc.setFontSize(11);
                      doc.setTextColor(40, 40, 40);
                      const summaryInfo = [
                        `Всего поликлиник: ${totalPolyclinics}`,
                        `Общее количество выданных лекарств: ${totalGiven.toLocaleString('ru-RU')}`,
                        `Общее количество проданных лекарств: ${totalSold.toLocaleString('ru-RU')}`,
                        `Общая стоимость: ${totalValue.toLocaleString('ru-RU')} сум`
                      ];
                      
                      summaryInfo.forEach((info, index) => {
                        doc.text(info, 25, 60 + (index * 8));
                      });
                      
                      // Polyclinics table
                      const tableData = sortedData.map((item, index) => [
                        (index + 1).toString(),
                        item.name || 'Не указано',
                        item.address || 'Не указано',
                        item.region || 'Не указано',
                        item.manager || 'Не указано',
                        (item.totalGiven || 0).toLocaleString('ru-RU'),
                        (item.totalSold || 0).toLocaleString('ru-RU'),
                        (item.totalValue || 0).toLocaleString('ru-RU')
                      ]);
                      
                      (doc as any).autoTable({
                        head: [['№', 'Название', 'Адрес', 'Регион', 'Менеджер', 'Выдано', 'Продано', 'Стоимость (сум)']],
                        body: tableData,
                        startY: 100,
                        theme: 'grid',
                        headStyles: {
                          fillColor: [66, 139, 202],
                          textColor: 255,
                          fontSize: 9,
                          fontStyle: 'bold'
                        },
                        bodyStyles: {
                          fontSize: 8,
                          textColor: 50
                        },
                        columnStyles: {
                          0: { cellWidth: 15, halign: 'center' },
                          1: { cellWidth: 35 },
                          2: { cellWidth: 35 },
                          3: { cellWidth: 25 },
                          4: { cellWidth: 25 },
                          5: { cellWidth: 20, halign: 'right' },
                          6: { cellWidth: 20, halign: 'right' },
                          7: { cellWidth: 25, halign: 'right' }
                        },
                        margin: { left: 10, right: 10 }
                      });
                      
                      // Footer
                      const pageHeight = doc.internal.pageSize.height;
                      doc.setFontSize(8);
                      doc.setTextColor(150, 150, 150);
                      doc.text('Экспортировано из системы управления аптеками', 20, pageHeight - 20);
                      doc.text(`Страница 1 из 1`, doc.internal.pageSize.width - 40, pageHeight - 20);
                      
                      // Save PDF
                      const fileName = `все_поликлиники_отчет_${new Date().toLocaleDateString('ru-RU').replace(/\./g, '_')}.pdf`;
                      doc.save(fileName);
                      
                      toast.success('PDF отчет по всем поликлиникам успешно экспортирован');
                    }}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export All PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Medicine Dispensing Modal */}
        <Dialog open={showMedicineModal} onOpenChange={setShowMedicineModal}>
          <DialogContent className={`max-w-2xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
            <DialogHeader>
              <DialogTitle className={darkMode ? 'text-white' : 'text-gray-900'}>
                Выдача лекарств - {selectedPharmacyForMedicine?.name || selectedPolyclinicForMedicine?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {medicineInputs.map((input, index) => (
                <Card key={input.id} className={`p-4 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50'}`}>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                      <Input
                        placeholder="Название лекарства"
                        value={input.name}
                        onChange={(e) => updateMedicineInput(input.id, 'name', e.target.value)}
                        className={darkMode ? 'bg-gray-600 border-gray-500' : ''}
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Количество"
                        value={input.quantity || ''}
                        onChange={(e) => updateMedicineInput(input.id, 'quantity', Number(e.target.value) || 0)}
                        className={darkMode ? 'bg-gray-600 border-gray-500' : ''}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Select 
                        value={input.unit}
                        onValueChange={(value) => updateMedicineInput(input.id, 'unit', value as 'pills' | 'packages')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Ед. измерения" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pills">Шт.</SelectItem>
                          <SelectItem value="packages">Упаковки</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        onClick={() => removeMedicineInput(input.id)}
                        className={darkMode ? 'border-gray-600 hover:bg-gray-700' : ''}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              <Button
                onClick={addMedicineInput}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить еще лекарство
              </Button>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowMedicineModal(false)}
              >
                Отмена
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleMedicineDispense}
              >
                Выдать лекарства
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Ostatka;
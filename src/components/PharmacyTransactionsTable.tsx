 import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Plus, Calculator, Package2, TrendingUp, TrendingDown, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import api from '@/hooks/api-settings';
import { toast } from '@/hooks/use-toast';

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

interface PharmacyTransaction {
  id: number;
  medicine: Medicine;
  quantity_pills: number;
  quantity_packages: number;
  transaction_type: 'given' | 'sold' | 'returned';
  price_per_unit: number;
  total_price: number;
  created_at: string;
}

interface MedicineStats {
  medicine: Medicine;
  givenPills: number;
  givenPackages: number;
  soldPills: number;
  soldPackages: number;
  remainingPills: number;
  remainingPackages: number;
  totalCost: number;
}

interface PaymentItem {
  id: number;
  amount: number;
  created_at: string;
}

interface PharmacyTransactionsTableProps {
  pharmacy: {
    id: number;
    name: string;
    address: string;
    phone: string;
    manager: string;
  };
  onBack: () => void;
  darkMode: boolean;
}

// Demo data for testing
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

const DEMO_TRANSACTIONS: PharmacyTransaction[] = [
  // Цитромон transactions
  {
    id: 1,
    medicine: DEMO_MEDICINES[0],
    quantity_pills: 8,
    quantity_packages: 100,
    transaction_type: 'given',
    price_per_unit: 625,
    total_price: 500000,
    created_at: '2025-07-29T10:00:00Z'
  },
  {
    id: 2,
    medicine: DEMO_MEDICINES[0],
    quantity_pills: 8,
    quantity_packages: 65,
    transaction_type: 'sold',
    price_per_unit: 625,
    total_price: 325000,
    created_at: '2025-07-30T14:00:00Z'
  },
  // Тримол transactions
  {
    id: 3,
    medicine: DEMO_MEDICINES[1],
    quantity_pills: 10,
    quantity_packages: 80,
    transaction_type: 'given',
    price_per_unit: 800,
    total_price: 640000,
    created_at: '2025-07-29T11:00:00Z'
  },
  {
    id: 4,
    medicine: DEMO_MEDICINES[1],
    quantity_pills: 10,
    quantity_packages: 45,
    transaction_type: 'sold',
    price_per_unit: 800,
    total_price: 360000,
    created_at: '2025-07-30T15:00:00Z'
  },
  // Парацетамол transactions
  {
    id: 5,
    medicine: DEMO_MEDICINES[2],
    quantity_pills: 20,
    quantity_packages: 150,
    transaction_type: 'given',
    price_per_unit: 150,
    total_price: 450000,
    created_at: '2025-07-29T12:00:00Z'
  },
  {
    id: 6,
    medicine: DEMO_MEDICINES[2],
    quantity_pills: 20,
    quantity_packages: 75,
    transaction_type: 'sold',
    price_per_unit: 150,
    total_price: 225000,
    created_at: '2025-07-30T16:00:00Z'
  }
];

const PharmacyTransactionsTable: React.FC<PharmacyTransactionsTableProps> = ({ 
  pharmacy, 
  onBack, 
  darkMode 
}) => {
  const [medicines] = useState<Medicine[]>(DEMO_MEDICINES);
  const [transactions, setTransactions] = useState<PharmacyTransaction[]>(DEMO_TRANSACTIONS);
  const [medicineStats, setMedicineStats] = useState<MedicineStats[]>([]);
  const [statsSearchQuery, setStatsSearchQuery] = useState('');
  const [paymentsSearchQuery, setPaymentsSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [paymentsStart, setPaymentsStart] = useState<string>('');
  const [paymentsEnd, setPaymentsEnd] = useState<string>('');
  const [statsStart, setStatsStart] = useState<string>('');
  const [statsEnd, setStatsEnd] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showSoldModal, setShowSoldModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [soldPackages, setSoldPackages] = useState('');
  const [soldPills, setSoldPills] = useState('');

  // Tabs and payments state
  const [activeTab, setActiveTab] = useState<'stats' | 'payments'>('stats');
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [soldEntries, setSoldEntries] = useState<any[]>([]);
  const [soldEntriesLoading, setSoldEntriesLoading] = useState(false);

  useEffect(() => {
    calculateMedicineStats();
  }, [medicines, transactions]);

  const fetchPayments = async () => {
    try {
      setPaymentsLoading(true);
      const token = localStorage.getItem('access');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/pharmacy/pharmacy-debt-payments/?pharmacy=${pharmacy.id}` , {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      setPayments(list as PaymentItem[]);
    } catch (e) {
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const fetchReceipts = async () => {
    try {
      setSoldEntriesLoading(true);
      const token = localStorage.getItem('access');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/pharmacy/pharmacy-receipts/?pharmacy=${pharmacy.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const receipts = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      const flattened: any[] = [];
      receipts.forEach((r: any) => {
        const items = r.products || r.items || r.receipt_items || r.medicine_items || r.medicines || [];
        (items || []).forEach((i: any, idx: number) => {
          const name = i.name || (i.product?.name) || '—';
          const dosage = i.dosage || (i.product?.dosage) || '';
          const manufacturer = i.manufacturer || (i.product?.manufacturer) || '';
          const totalUnits = Number(i.total_product ?? i.count ?? 0);
          const pricePerUnit = Number(i.selling_price ?? i.price_per_unit ?? i.unit_price ?? 0);
          const totalPrice = Number(i.total ?? (totalUnits * pricePerUnit) ?? 0);
          const createdAt = r.created_at || i.created_at || r.date || i.date || '';
          flattened.push({
            id: i.id ?? idx,
            medicineName: name,
            dosage,
            manufacturer,
            quantity_packages: 0,
            quantity_pills: totalUnits,
            total_pills: totalUnits,
            price_per_unit: pricePerUnit,
            total_price: totalPrice,
            created_at: createdAt,
          });
        });
      });
      setSoldEntries(flattened);
    } catch (e) {
      setSoldEntries([]);
    } finally {
      setSoldEntriesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'payments') {
      fetchPayments();
    }
  }, [activeTab, pharmacy.id]);

  useEffect(() => {
    if (activeTab === 'stats') {
      fetchReceipts();
    }
  }, [activeTab, pharmacy.id]);

  const calculateMedicineStats = () => {
    const stats = medicines.map(medicine => {
      const medicineTransactions = transactions.filter(t => t.medicine.id === medicine.id);
      
      const givenTransactions = medicineTransactions.filter(t => t.transaction_type === 'given');
      const soldTransactions = medicineTransactions.filter(t => t.transaction_type === 'sold');
      
      const givenPills = givenTransactions.reduce((sum, t) => sum + (t.quantity_pills * t.quantity_packages), 0);
      const soldPills = soldTransactions.reduce((sum, t) => sum + (t.quantity_pills * t.quantity_packages), 0);
      const remainingPills = Math.max(0, givenPills - soldPills);
      
      const givenPackages = Math.floor(givenPills / medicine.pills_per_package);
      const soldPackages = Math.floor(soldPills / medicine.pills_per_package);
      const remainingPackages = Math.floor(remainingPills / medicine.pills_per_package);
      
      const pricePerPill = medicine.price_type === 'pill' ? medicine.price_per_pill : (medicine.price_per_package / medicine.pills_per_package);
      const totalCost = remainingPills * pricePerPill;
      
      return {
        medicine,
        givenPills,
        givenPackages,
        soldPills,
        soldPackages,
        remainingPills,
        remainingPackages,
        totalCost
      };
    });
    
    setMedicineStats(stats);
  };

  const handleSellMedicine = () => {
    if (!selectedMedicine || !soldPackages || !soldPills) {
      toast({
        title: "Хатолик",
        description: "Барча майдонларни тўлдиринг",
        variant: "destructive"
      });
      return;
    }

    const newTransaction: PharmacyTransaction = {
      id: Date.now(),
      medicine: selectedMedicine,
      quantity_pills: parseInt(soldPills),
      quantity_packages: parseInt(soldPackages),
      transaction_type: 'sold',
      price_per_unit: selectedMedicine.price_per_pill,
      total_price: parseInt(soldPills) * parseInt(soldPackages) * selectedMedicine.price_per_pill,
      created_at: new Date().toISOString()
    };

    setTransactions([...transactions, newTransaction]);
    setShowSoldModal(false);
    setSelectedMedicine(null);
    setSoldPackages('');
    setSoldPills('');
    
    toast({
      title: "Муваффақиятли!",
      description: "Сотилган дори қўшилди",
    });
  };

  const openSellModal = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setShowSoldModal(true);
  };

  let filteredStats = medicineStats.filter(stat =>
    stat.medicine.name.toLowerCase().includes(statsSearchQuery.toLowerCase()) ||
    stat.medicine.manufacturer?.toLowerCase().includes(statsSearchQuery.toLowerCase()) ||
    stat.medicine.dosage.toLowerCase().includes(statsSearchQuery.toLowerCase())
  );

  // Apply filter
  if (filterType !== 'all') {
    filteredStats = filteredStats.filter(stat => {
      if (filterType === 'low_stock') return stat.remainingPills < 50;
      if (filterType === 'out_of_stock') return stat.remainingPills === 0;
      if (filterType === 'high_stock') return stat.remainingPills > 100;
      return true;
    });
  }

  const totalSummary = filteredStats.reduce((acc, stat) => ({
    totalGivenPills: acc.totalGivenPills + stat.givenPills,
    totalGivenPackages: acc.totalGivenPackages + stat.givenPackages,
    totalSoldPills: acc.totalSoldPills + stat.soldPills,
    totalSoldPackages: acc.totalSoldPackages + stat.soldPackages,
    totalRemainingPills: acc.totalRemainingPills + stat.remainingPills,
    totalRemainingPackages: acc.totalRemainingPackages + stat.remainingPackages,
    totalCost: acc.totalCost + stat.totalCost,
  }), {
    totalGivenPills: 0,
    totalGivenPackages: 0,
    totalSoldPills: 0,
    totalSoldPackages: 0,
    totalRemainingPills: 0,
    totalRemainingPackages: 0,
    totalCost: 0,
  });

  // Payments derived filtering
  const paymentsQueryDigits = paymentsSearchQuery.replace(/\D/g, '');
  const filteredPayments = payments
    .filter(p => paymentsQueryDigits ? String(Number(p.amount || 0)).includes(paymentsQueryDigits) : true)
    .filter(p => paymentsStart ? new Date(p.created_at).getTime() >= new Date(paymentsStart).getTime() : true)
    .filter(p => paymentsEnd ? new Date(p.created_at).getTime() <= new Date(paymentsEnd).getTime() : true);

  // Sold entries (from receipts) within stats tab (searchable)
  const statsQuery = statsSearchQuery.trim().toLowerCase();
  const statsQueryDigits = statsQuery.replace(/\D/g, '');
  const filteredSoldEntries = soldEntries
    .filter(e => {
      const matchesText = (e.medicineName || '').toLowerCase().includes(statsQuery)
        || (e.manufacturer || '').toLowerCase().includes(statsQuery)
        || (e.dosage || '').toLowerCase().includes(statsQuery);
      const amount = Number(e.total_price || 0);
      const qtyTotal = Number(e.total_pills || 0);
      const matchesDigits = statsQueryDigits
        ? String(amount).includes(statsQueryDigits) || String(qtyTotal).includes(statsQueryDigits)
        : true;
      return statsQuery ? (matchesText || matchesDigits) : true;
    })
    .filter(e => statsStart ? new Date(e.created_at).getTime() >= new Date(statsStart).getTime() : true)
    .filter(e => statsEnd ? new Date(e.created_at).getTime() <= new Date(statsEnd).getTime() : true);

  return (
    <div className={`fixed min-h-screen min-w-full ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={` ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-4 shadow-sm border-b`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {pharmacy.name}
              </h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {pharmacy.phone}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFilter(!showFilter)}
              className={showFilter ? 'bg-blue-50 border-blue-200' : ''}
            >
              <Filter className="w-4 h-4" />
            </Button>
            <Button 
              onClick={() => setShowSearch(!showSearch)}
              className={`text-white ${showSearch ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pb-2 pt-3 max-w-full  flex gap-2">
        <Button
          variant={activeTab === 'stats' ? 'default' : 'outline'}
          size="sm"
          className={activeTab === 'stats' ? 'bg-blue-600 text-white w-full  hover:bg-blue-700' : 'w-full'}
          onClick={() => setActiveTab('stats')}
        >
          Dorilar
        </Button>
        <Button
          variant={activeTab === 'payments' ? 'default' : 'outline'}
          size="sm"
          className={activeTab === 'payments' ? 'bg-blue-600 text-white w-full hover:bg-blue-700' : 'w-full'}
          onClick={() => setActiveTab('payments')}
        >
          To'lovlar
        </Button>
      </div>

      {activeTab === 'stats' && showSearch && (
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Дориларни қидириш..."
              value={statsSearchQuery}
              onChange={(e) => setStatsSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {activeTab === 'payments' && showSearch && (
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Summasi bo'yicha qidirish..."
              value={paymentsSearchQuery}
              onChange={(e) => setPaymentsSearchQuery(e.target.value.replace(/[^0-9]/g, ''))}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Filter Section */}
      {activeTab === 'stats' && showFilter && (
        <div className={`mx-4 mb-4 p-4 rounded-lg border ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Фильтр
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setShowFilter(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Выберите фильтр" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все лекарства</SelectItem>
              <SelectItem value="low_stock">Мало остатков (&lt;50)</SelectItem>
              <SelectItem value="out_of_stock">Нет в наличии</SelectItem>
              <SelectItem value="high_stock">Много остатков (&gt;100)</SelectItem>
            </SelectContent>
          </Select>
          <div className="mt-4">
            <div className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Sotilganlar bo'yicha sana va vaqt filtri
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="statsStart" className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Boshlanish sanasi
                </Label>
                <Input id="statsStart" type="datetime-local" value={statsStart} onChange={(e) => setStatsStart(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="statsEnd" className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Tugash sanasi
                </Label>
                <Input id="statsEnd" type="datetime-local" value={statsEnd} onChange={(e) => setStatsEnd(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={() => { setStatsStart(''); setStatsEnd(''); }}>
                Tozalash
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowFilter(false)}>
                Yopish
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payments' && showFilter && (
        <div className={`mx-4 mb-4 p-4 rounded-lg border ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Sana va vaqt bo'yicha filtr
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setShowFilter(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="paymentsStart" className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Boshlanish sanasi
              </Label>
              <Input id="paymentsStart" type="datetime-local" value={paymentsStart} onChange={(e) => setPaymentsStart(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="paymentsEnd" className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Tugash sanasi
              </Label>
              <Input id="paymentsEnd" type="datetime-local" value={paymentsEnd} onChange={(e) => setPaymentsEnd(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={() => { setPaymentsStart(''); setPaymentsEnd(''); }}>
              Tozalash
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowFilter(false)}>
              Yopish
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="p-4">
          <div className={`rounded-lg p-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Sotilgan dori yozuvlari
              </h3>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Jami: {filteredSoldEntries.length}
              </div>
            </div>
            <ScrollArea className="max-h-96">
              {soldEntriesLoading ? (
                <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Yuklanmoqda...</div>
              ) : filteredSoldEntries.length === 0 ? (
                <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Ma'lumot yo'q
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredSoldEntries.map((e, idx) => (
                    <div key={`${e.created_at}-${idx}`} className={`p-3 rounded border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-start gap-2 min-w-0">
                          <span className={`text-[11px] px-2 py-1 rounded border ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'}`}>
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className={`truncate font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {e.medicineName} {e.dosage || ''}
                            </div>
                            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {e.quantity_packages} up × {e.quantity_pills} dona = {e.total_pills} dona
                            </div>
                            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Narx: {Number(e.price_per_unit || 0).toLocaleString()} so'm • Jami: {Number(e.total_price || 0).toLocaleString()} so'm
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {e.created_at ? String(e.created_at).slice(0, 16).replace('T', ' ') : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Payments Tab Content */}
      {activeTab === 'payments' && (
        <div className="p-4">
          <div className={`rounded-lg p-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                To'lovlar tarixi
              </h3>
              <Button size="sm" variant="outline" onClick={fetchPayments}>
                Yangilash
              </Button>
            </div>
            <div className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Jami to'lovlar: {filteredPayments.reduce((s, p) => s + Number(p.amount || 0), 0).toLocaleString()} so'm
            </div>
            {paymentsLoading ? (
              <div className={`text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Yuklanmoqda...</div>
            ) : (
              <ScrollArea className="max-h-96">
                {filteredPayments.length === 0 ? (
                  <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Ma'lumot yo'q
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredPayments.map((p, idx) => (
                      <div key={p.id} className={`p-3 rounded border ${darkMode ? 'border-blue-900 bg-blue-950/40' : 'border-blue-200 bg-blue-50'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-200 text-blue-800'}`}>#{idx + 1}</span>
                            <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {Number(p.amount).toLocaleString()} so'm
                            </span>
                          </div>
                          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {p.created_at?.slice(0, 16).replace('T', ' ')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            )}
          </div>
        </div>
      )}

      {/* Sell Medicine Modal */}
      <Dialog open={showSoldModal} onOpenChange={setShowSoldModal}>
        <DialogContent className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <DialogHeader>
            <DialogTitle className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Сотилган дори қўшиш
            </DialogTitle>
          </DialogHeader>
          {selectedMedicine && (
            <div className="space-y-4">
              <div>
                <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedMedicine.name} {selectedMedicine.dosage}
                </h4>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {selectedMedicine.manufacturer}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="packages" className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Пачка сони
                  </Label>
                  <Input
                    id="packages"
                    type="number"
                    placeholder="0"
                    value={soldPackages}
                    onChange={(e) => setSoldPackages(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="pills" className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Дона сони
                  </Label>
                  <Input
                    id="pills"
                    type="number"
                    placeholder="0"
                    value={soldPills}
                    onChange={(e) => setSoldPills(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowSoldModal(false)}>
                  Бекор қилиш
                </Button>
                <Button onClick={handleSellMedicine} className="bg-blue-500 hover:bg-blue-600">
                  Қўшиш
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PharmacyTransactionsTable;
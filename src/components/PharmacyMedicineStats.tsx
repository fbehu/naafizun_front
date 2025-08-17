
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, Package2, TrendingUp, TrendingDown, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  stock_quantity: number;
  given_quantity: number;
  sold_quantity: number;
  expiry_date?: string;
}

interface Pharmacy {
  id: number;
  name: string;
  address: string;
  phone: string;
  manager: string;
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

interface PharmacyMedicineRecord {
  medicine: Medicine;
  givenQuantity: number;
  givenPackages: number;
  soldQuantity: number;
  soldPackages: number;
  remainingQuantity: number;
  remainingPackages: number;
  remainingValue: number;
  givenValue: number;
  soldValue: number;
}

interface PharmacyMedicineStatsProps {
  pharmacy: Pharmacy;
  darkMode: boolean;
  onBack: () => void;
}

const PharmacyMedicineStats: React.FC<PharmacyMedicineStatsProps> = ({ pharmacy, darkMode, onBack }) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [transactions, setTransactions] = useState<PharmacyTransaction[]>([]);
  const [medicineRecords, setMedicineRecords] = useState<PharmacyMedicineRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddGivenOpen, setIsAddGivenOpen] = useState(false);
  const [isAddSoldOpen, setIsAddSoldOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [quantity, setQuantity] = useState('');
  const [packages, setPackages] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [pharmacy.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load products and receipts instead of medicines and transactions
      const [productsRes, receiptsRes] = await Promise.all([
        api.get('/products/'),
        api.get(`/pharmacy/pharmacy-receipts/?pharmacy=${pharmacy.id}`)
      ]);
      
      const productsList = productsRes.results || productsRes;
      const receiptsList = receiptsRes.results || receiptsRes;
      
      // Convert products to medicines format for compatibility
      const convertedMedicines = productsList.map((product: any) => ({
        id: product.id,
        name: product.name,
        dosage: product.dosage,
        pills_per_package: product.pills_per_package,
        price_per_package: product.selling_price,
        price_per_pill: Number(product.selling_price) / product.pills_per_package,
        price_type: 'pill',
        manufacturer: product.manufacturer,
        stock_quantity: product.stock_quantity,
        given_quantity: 0,
        sold_quantity: 0
      }));
      
      setMedicines(convertedMedicines);
      
      // Calculate statistics for each medicine from receipts
      const records = convertedMedicines.map((medicine: Medicine) => {
        // Find all receipts containing this medicine
        let givenQuantity = 0;
        
        receiptsList.forEach((receipt: any) => {
          if (Array.isArray(receipt.products)) {
            receipt.products.forEach((product: any) => {
              if (product.product_id === medicine.id) {
                givenQuantity += product.count || 0;
              }
            });
          }
        });
        
        // For now, assume sold quantity is 0 (we would need additional data for this)
        const soldQuantity = 0;
        const remainingQuantity = Math.max(0, givenQuantity - soldQuantity);
        
        const givenPackages = Math.floor(givenQuantity / medicine.pills_per_package);
        const soldPackages = Math.floor(soldQuantity / medicine.pills_per_package);
        const remainingPackages = Math.floor(remainingQuantity / medicine.pills_per_package);
        
        const pricePerPill = medicine.price_per_pill;
        
        const givenValue = givenQuantity * pricePerPill;
        const soldValue = soldQuantity * pricePerPill;
        const remainingValue = remainingQuantity * pricePerPill;
        
        return {
          medicine,
          givenQuantity,
          givenPackages,
          soldQuantity,
          soldPackages,
          remainingQuantity,
          remainingPackages,
          remainingValue,
          givenValue,
          soldValue
        };
      }).filter(record => record.givenQuantity > 0); // Only show medicines that were given to this pharmacy
      
      setMedicineRecords(records);
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

  const handleAddTransaction = async (transactionType: 'given' | 'sold') => {
    if (!selectedMedicine || !quantity || !packages) {
      toast({
        title: "Ошибка",
        description: "Заполните все поля",
        variant: "destructive",
      });
      return;
    }

    try {
      const pricePerUnit = selectedMedicine.price_type === 'pill' 
        ? selectedMedicine.price_per_pill 
        : (selectedMedicine.price_per_package / selectedMedicine.pills_per_package);

      await api.post('/pharmacy/pharmacy-transactions/', {
        pharmacy: pharmacy.id,
        medicine: selectedMedicine.id,
        quantity_pills: parseInt(quantity),
        quantity_packages: parseInt(packages),
        transaction_type: transactionType,
        price_per_unit: pricePerUnit,
        total_price: parseInt(quantity) * parseInt(packages) * pricePerUnit
      });

      toast({
        title: "Успешно",
        description: `Транзакция ${transactionType === 'given' ? 'выдачи' : 'продажи'} добавлена`,
      });

      setQuantity('');
      setPackages('');
      setSelectedMedicine(null);
      setIsAddGivenOpen(false);
      setIsAddSoldOpen(false);
      loadData();
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить транзакцию",
        variant: "destructive",
      });
    }
  };

  const filteredRecords = medicineRecords.filter(record =>
    record.medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.medicine.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.medicine.dosage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStats = filteredRecords.reduce((acc, record) => ({
    totalGiven: acc.totalGiven + record.givenQuantity,
    totalSold: acc.totalSold + record.soldQuantity,
    totalRemaining: acc.totalRemaining + record.remainingQuantity,
    totalGivenValue: acc.totalGivenValue + record.givenValue,
    totalSoldValue: acc.totalSoldValue + record.soldValue,
    totalRemainingValue: acc.totalRemainingValue + record.remainingValue,
  }), {
    totalGiven: 0,
    totalSold: 0,
    totalRemaining: 0,
    totalGivenValue: 0,
    totalSoldValue: 0,
    totalRemainingValue: 0,
  });

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 shadow-sm`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {pharmacy.name}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsAddGivenOpen(true)} className="bg-blue-500 hover:bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Выдать
            </Button>
            <Button onClick={() => setIsAddSoldOpen(true)} className="bg-green-500 hover:bg-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Продать
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Поиск */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Поиск лекарств..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Выдано в аптеку
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {totalStats.totalGiven.toLocaleString()} шт
              </div>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {totalStats.totalGivenValue.toLocaleString()} сум
              </div>
            </CardContent>
          </Card>

          <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <TrendingDown className="w-4 h-4 text-red-500" />
                Продано
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {totalStats.totalSold.toLocaleString()} шт
              </div>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {totalStats.totalSoldValue.toLocaleString()} сум
              </div>
            </CardContent>
          </Card>

          <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <Package2 className="w-4 h-4 text-green-500" />
                Остается
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {totalStats.totalRemaining.toLocaleString()} шт
              </div>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {totalStats.totalRemainingValue.toLocaleString()} сум
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Препараты */}
        <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <CardHeader>
            <CardTitle className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Препараты
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex justify-end text-sm">
              <span className="text-red-500 mr-4">Ост.</span>
              <span className="text-green-500">Прод.</span>
            </div>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {filteredRecords.map((record, index) => (
                  <div key={record.medicine.id} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {record.medicine.name} {record.medicine.dosage}
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-red-500 font-medium min-w-[30px] text-right">
                        {record.remainingQuantity}
                      </span>
                      <span className="text-green-500 font-medium min-w-[30px] text-right">
                        {record.soldQuantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Модальные окна для добавления транзакций */}
      <Dialog open={isAddGivenOpen} onOpenChange={setIsAddGivenOpen}>
        <DialogContent className={`max-w-md ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <DialogHeader>
            <DialogTitle className={darkMode ? 'text-white' : 'text-gray-900'}>
              Выдать лекарство в аптеку
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                Выберите лекарство
              </Label>
              <Select onValueChange={(value) => {
                const medicine = medicines.find(m => m.id === parseInt(value));
                setSelectedMedicine(medicine || null);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите лекарство" />
                </SelectTrigger>
                <SelectContent className={`z-50 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  {medicines.map(medicine => (
                    <SelectItem key={medicine.id} value={medicine.id.toString()}>
                      {medicine.name} ({medicine.stock_quantity - medicine.given_quantity - medicine.sold_quantity} на складе)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                  Количество (шт)
                </Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Введите количество"
                  min="1"
                />
              </div>
              <div>
                <Label className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                  Упаковки
                </Label>
                <Input
                  type="number"
                  value={packages}
                  onChange={(e) => setPackages(e.target.value)}
                  placeholder="Введите количество упаковок"
                  min="1"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsAddGivenOpen(false)}
                className="flex-1"
              >
                Отмена
              </Button>
              <Button
                onClick={() => handleAddTransaction('given')}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
                disabled={!selectedMedicine || !quantity || !packages}
              >
                Выдать
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddSoldOpen} onOpenChange={setIsAddSoldOpen}>
        <DialogContent className={`max-w-md ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <DialogHeader>
            <DialogTitle className={darkMode ? 'text-white' : 'text-gray-900'}>
              Продать лекарство
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                Выберите лекарство
              </Label>
              <Select onValueChange={(value) => {
                const medicine = medicines.find(m => m.id === parseInt(value));
                setSelectedMedicine(medicine || null);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите лекарство" />
                </SelectTrigger>
                <SelectContent className={`z-50 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  {medicineRecords
                    .filter(record => record.remainingQuantity > 0)
                    .map(record => (
                    <SelectItem key={record.medicine.id} value={record.medicine.id.toString()}>
                      {record.medicine.name} ({record.remainingQuantity} в наличии)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                  Количество (шт)
                </Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Введите количество"
                  min="1"
                />
              </div>
              <div>
                <Label className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                  Упаковки
                </Label>
                <Input
                  type="number"
                  value={packages}
                  onChange={(e) => setPackages(e.target.value)}
                  placeholder="Введите количество упаковок"
                  min="1"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsAddSoldOpen(false)}
                className="flex-1"
              >
                Отмена
              </Button>
              <Button
                onClick={() => handleAddTransaction('sold')}
                className="flex-1 bg-green-500 hover:bg-green-600"
                disabled={!selectedMedicine || !quantity || !packages}
              >
                Продать
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PharmacyMedicineStats;

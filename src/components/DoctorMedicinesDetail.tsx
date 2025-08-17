import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Package, TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  phone: string;
  products: any[];
  total_amount: number;
  debt_amount: number;
}

interface MedicineTransaction {
  id: string;
  medicine_name: string;
  count: number;
  selling_price: number;
  total: number;
  paid: number;
  debt: number;
  date_added?: string;
  manufacturer?: string;
  dosage?: string;
}

interface DoctorMedicinesDetailProps {
  doctor: Doctor;
  onBack: () => void;
  darkMode: boolean;
}

const DoctorMedicinesDetail: React.FC<DoctorMedicinesDetailProps> = ({
  doctor,
  onBack,
  darkMode
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [medicines, setMedicines] = useState<MedicineTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    processDoctorMedicines();
  }, [doctor]);

  const processDoctorMedicines = () => {
    try {
      setLoading(true);
      const processedMedicines: MedicineTransaction[] = [];

      // Process products array from doctor data
      if (Array.isArray(doctor.products)) {
        doctor.products.forEach((product, index) => {
          if (typeof product === 'object' && product !== null) {
            const medicine: MedicineTransaction = {
              id: `${doctor.id}-${index}`,
              medicine_name: product.medicine_name || product.name || `Лекарство ${index + 1}`,
              count: parseInt(product.count) || 0,
              selling_price: parseFloat(product.selling_price) || 0,
              total: parseFloat(product.total) || (parseFloat(product.selling_price) || 0) * (parseInt(product.count) || 0),
              paid: parseFloat(product.paid) || 0,
              debt: parseFloat(product.debt) || 0,
              date_added: product.date_added || product.created_at,
              manufacturer: product.manufacturer,
              dosage: product.dosage
            };

            // Calculate debt if not explicitly provided
            if (medicine.debt === 0 && medicine.total > 0) {
              medicine.debt = Math.max(0, medicine.total - medicine.paid);
            }

            processedMedicines.push(medicine);
          }
        });
      }

      setMedicines(processedMedicines);
    } catch (error) {
      console.error('Error processing doctor medicines:', error);
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMedicines = medicines.filter(medicine =>
    medicine.medicine_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (medicine.manufacturer && medicine.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalMedicines = medicines.length;
  const totalQuantity = medicines.reduce((sum, med) => sum + med.count, 0);
  const totalAmount = medicines.reduce((sum, med) => sum + med.total, 0);
  const totalPaid = medicines.reduce((sum, med) => sum + med.paid, 0);
  const totalDebt = medicines.reduce((sum, med) => sum + med.debt, 0);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Не указано';
    try {
      return new Date(dateString).toLocaleDateString('ru-RU');
    } catch {
      return 'Не указано';
    }
  };

  const formatCurrency = (amount: number) => {
    return Math.round(amount).toLocaleString('ru-RU');
  };

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
                Лекарства врача
              </h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {doctor.name} • {doctor.specialty}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {totalMedicines} лекарств
            </Badge>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Поиск лекарств по названию или производителю..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {totalQuantity}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Количество
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(totalAmount)}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Общая сумма
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(totalPaid)}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Оплачено
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(totalDebt)}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Долг
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="px-4">
        <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
          <CardHeader>
            <CardTitle className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Детали по лекарствам
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-500px)]">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredMedicines.length === 0 ? (
                <div className="text-center py-8">
                  <Package className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-300'}`} />
                  <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Лекарства не найдены
                  </h3>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'У данного врача пока нет лекарств'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className={darkMode ? 'border-gray-700' : 'border-gray-200'}>
                      <TableHead className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Название</TableHead>
                      <TableHead className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Количество</TableHead>
                      <TableHead className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Цена за ед.</TableHead>
                      <TableHead className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Всего</TableHead>
                      <TableHead className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Оплачено</TableHead>
                      <TableHead className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Долг</TableHead>
                      <TableHead className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Дата</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMedicines.map((medicine) => (
                      <TableRow 
                        key={medicine.id}
                        className={`${darkMode ? 'border-gray-700 hover:bg-gray-750' : 'border-gray-200 hover:bg-gray-50'}`}
                      >
                        <TableCell>
                          <div>
                            <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {medicine.medicine_name}
                            </div>
                            {medicine.manufacturer && (
                              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {medicine.manufacturer}
                              </div>
                            )}
                            {medicine.dosage && (
                              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {medicine.dosage}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {medicine.count}
                          </Badge>
                        </TableCell>
                        <TableCell className={`font-mono ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {formatCurrency(medicine.selling_price)} сум
                        </TableCell>
                        <TableCell className={`font-mono font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {formatCurrency(medicine.total)} сум
                        </TableCell>
                        <TableCell className={`font-mono ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                          {formatCurrency(medicine.paid)} сум
                        </TableCell>
                        <TableCell className={`font-mono ${medicine.debt > 0 ? (darkMode ? 'text-red-400' : 'text-red-600') : (darkMode ? 'text-gray-400' : 'text-gray-500')}`}>
                          {formatCurrency(medicine.debt)} сум
                        </TableCell>
                        <TableCell className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatDate(medicine.date_added)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorMedicinesDetail;
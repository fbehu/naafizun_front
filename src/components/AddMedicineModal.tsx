import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddMedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (medicine: {
    name: string;
    type: string;
    dosage: string;
    packagesCount: string;
    pillsPerPackage: string;
    totalPills: number;
    company?: string;
    pricePerUnit: string;
    purchasePrice: string;
    sellingPrice: string;
    composition?: string;
  }) => void;
  darkMode: boolean;
  isSheet?: boolean;
  selectedCompany?: string;
  editData?: {
    name: string;
    type: string;
    dosage: string;
    packagesCount: string;
    pillsPerPackage: string;
    company: string;
    pricePerUnit: string;
    purchasePrice: string;
    sellingPrice: string;
    composition?: string;
  };
}

const AddMedicineModal: React.FC<AddMedicineModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdd, 
  darkMode, 
  isSheet = false,
  selectedCompany,
  editData 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'таблетка',
    dosage: '',
    packagesCount: '',
    pillsPerPackage: '',
    company: '',
    pricePerUnit: '',
    purchasePrice: '',
    sellingPrice: '',
    composition: '',
    priceType: 'pachka',
    quantity: '',
    unitPrice: ''
  });

  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [showPurchaseKeyboard, setShowPurchaseKeyboard] = useState(false);
  const [showSellingKeyboard, setShowSellingKeyboard] = useState(false);
  const [activeKeyboard, setActiveKeyboard] = useState<'purchasePrice' | 'sellingPrice' | null>(null);
  const [companyOptions, setCompanyOptions] = useState<string[]>([]);

  const pharmacyCompanies = [
    'Gradusnik Farm',
    'Hayot Medical',
    'Street Farm',
    'Star Farm'
  ];

  useEffect(() => {
    // Fetch companies from API
    const fetchCompanies = async () => {
      try {
        const token = localStorage.getItem("access");
        const res = await fetch(import.meta.env.VITE_API_URL + "/company/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.results && Array.isArray(data.results)) {
          setCompanyOptions(data.results.map((c: any) => c.name));
        }
      } catch (err) {
        setCompanyOptions([]);
      }
    };
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (editData) {
      setFormData({
        ...editData,
        composition: editData.composition || '',
        priceType: 'pachka',
        quantity: '',
        unitPrice: ''
      });
    } else {
      setFormData({
        name: '',
        type: 'таблетка',
        dosage: '',
        packagesCount: '',
        pillsPerPackage: '',
        company: selectedCompany && selectedCompany !== 'all' ? selectedCompany : '',
        pricePerUnit: '',
        purchasePrice: '',
        sellingPrice: '',
        composition: '',
        priceType: 'pachka',
        quantity: '',
        unitPrice: ''
      });
    }
  }, [editData, isOpen, selectedCompany]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCompanyToggle = (company: string) => {
    setSelectedCompanies(prev => 
      prev.includes(company) 
        ? prev.filter(c => c !== company)
        : [...prev, company]
    );
  };

  const applyFilters = () => {
    console.log('Applied filters:', selectedCompanies);
  };

  // Calculate total pills
  const totalPills = parseInt(formData.packagesCount) * parseInt(formData.pillsPerPackage) || 0;

  // Get unit text based on medication type
  const getUnitText = () => {
    return formData.type === 'сироп' ? 'сиропа' : 'таблеток';
  };

  const getUnitTextInPackage = () => {
    return formData.type === 'сироп' ? 'Мл в упаковке' : 'Таблеток в упаковке';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const hasRequiredFields = formData.name && formData.company && formData.priceType;
    const hasQuantityData = formData.priceType === 'pachka' 
      ? (formData.packagesCount && formData.pillsPerPackage)
      : formData.quantity;
    
    if (hasRequiredFields && hasQuantityData) {
      onAdd({
        name: formData.name,
        type: formData.priceType,
        dosage: formData.dosage,
        packagesCount: formData.priceType === 'pachka' ? formData.packagesCount : formData.quantity,
        pillsPerPackage: formData.priceType === 'pachka' ? formData.pillsPerPackage : '1',
        totalPills: formData.priceType === 'pachka' 
          ? (parseInt(formData.packagesCount) || 0) * (parseInt(formData.pillsPerPackage) || 1)
          : parseInt(formData.quantity) || 0,
        company: formData.company,
        pricePerUnit: formData.sellingPrice || formData.purchasePrice || '0',
        purchasePrice: formData.purchasePrice,
        sellingPrice: formData.sellingPrice,
        composition: formData.composition
      });
      if (!editData) {
        setFormData({
          name: '',
          type: 'таблетка',
          dosage: '',
          packagesCount: '',
          pillsPerPackage: '',
          company: '',
          pricePerUnit: '',
          purchasePrice: '',
          sellingPrice: '',
          composition: '',
          priceType: 'pachka',
          quantity: '',
          unitPrice: ''
        });
      }
      onClose();
    }
  };

  const handleVirtualKey = (field: 'purchasePrice' | 'sellingPrice', key: string) => {
    setFormData(prev => {
      let value = prev[field];
      if (key === 'del') {
        value = value.slice(0, -1);
      } else {
        value += key;
      }
      return { ...prev, [field]: value };
    });
  };

  const VirtualKeyboard = ({
    field,
    onKey,
    onClose,
    darkMode
  }: {
    field: 'purchasePrice' | 'sellingPrice',
    onKey: (key: string) => void,
    onClose: () => void,
    darkMode: boolean
  }) => (
    <div className={`grid grid-cols-3 gap-2 mt-2 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} p-2 rounded-lg`}>
      {[...'123456789'].map(n => (
        <button
          key={n}
          type="button"
          className={`py-2 rounded text-lg font-bold transition-colors duration-150 ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} hover:bg-blue-500 hover:text-white active:bg-blue-700`}
          onClick={() => onKey(n)}
        >
          {n}
        </button>
      ))}
      {/* 0 button full width */}
      <button
        type="button"
        className={`col-span-3 py-2 rounded text-lg font-bold transition-colors duration-150 ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} hover:bg-blue-500 hover:text-white active:bg-blue-700`}
        onClick={() => onKey('0')}
      >
        0
      </button>
      {/* O'chirish and Bekor qilish side by side */}
      <div className="col-span-3 flex gap-2 mt-2">
        <button
          type="button"
          className={`flex-1 py-2 rounded text-lg font-bold transition-colors duration-150 ${darkMode ? 'bg-gray-600 text-white' : 'bg-gray-300 text-gray-900'} hover:bg-gray-500 hover:text-white active:bg-gray-700`}
          onClick={onClose}
        >
          Bekor qilish
        </button>
        <button
          type="button"
          className={`flex-1 py-2 rounded text-lg font-bold transition-colors duration-150 ${darkMode ? 'bg-red-700 text-white' : 'bg-red-100 text-red-600'} hover:bg-red-500 hover:text-white active:bg-red-700`}
          onClick={() => onKey('del')}
        >
          O'chirish
        </button>
      </div>
    </div>
  );

  // If used as a sheet, render just the form content
  if (isSheet) {
    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="name" className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Dori nomi
          </Label>
          <Input
            id="name"
            placeholder="Цитрамон"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`h-9 ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
            }`}
            required
          />
        </div>

        {/* Tarkibi (composition) input */}
        <div className="space-y-1">
          <Label htmlFor="composition" className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Tarkibi
          </Label>
          <Input
            id="composition"
            placeholder="Tarkibi"
            value={formData.composition}
            onChange={(e) => handleInputChange('composition', e.target.value)}
            className={`h-9 ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
            }`}
          />
        </div>
            
        <div className="space-y-1">
          <Label htmlFor="dosage" className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Dozasi
          </Label>
          <Input
            id="dosage"
            placeholder="500mg"
            value={formData.dosage}
            onChange={(e) => handleInputChange('dosage', e.target.value)}
            className={`h-9 ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
            }`}
          />
        </div>

        {/* Price Type Selection */}
        <div className="space-y-1">
          <Label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Dori turi
          </Label>
          <Select value={formData.priceType} onValueChange={(value) => handleInputChange('priceType', value)} required>
            <SelectTrigger className={`h-9 ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-200 text-gray-900'
            }`}>
              <SelectValue placeholder="Выберите тип препарата" />
            </SelectTrigger>
            <SelectContent 
              className={`z-50 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-white border-gray-200'
              }`}
            >
              <SelectItem value="pachka" className={`${
                darkMode 
                  ? 'text-white hover:bg-gray-600 focus:bg-gray-600' 
                  : 'text-gray-900 hover:bg-gray-50 focus:bg-gray-50'
              }`}>
                Пачка
              </SelectItem>
              <SelectItem value="dona" className={`${
                darkMode 
                  ? 'text-white hover:bg-gray-600 focus:bg-gray-600' 
                  : 'text-gray-900 hover:bg-gray-50 focus:bg-gray-50'
              }`}>
                Дона
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quantity Inputs - conditional based on type */}
        {formData.priceType === 'pachka' ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="packagesCount" className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Necha Pachka
              </Label>
              <Input
                id="packagesCount"
                placeholder="10"
                value={formData.packagesCount}
                onChange={(e) => handleInputChange('packagesCount', e.target.value)}
                className={`h-9 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                }`}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pillsPerPackage" className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Pachkada necha dona
              </Label>
              <Input
                id="pillsPerPackage"
                placeholder="20"
                value={formData.pillsPerPackage}
                onChange={(e) => handleInputChange('pillsPerPackage', e.target.value)}
                className={`h-9 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                }`}
                required
              />
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <Label htmlFor="quantity" className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Necha Dona
            </Label>
            <Input
              id="quantity"
              placeholder="200"
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', e.target.value)}
              className={`h-9 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
              }`}
              required
            />
          </div>
        )}

        {/* Total Pills Display for Pachka type */}
        {formData.priceType === 'pachka' && formData.packagesCount && formData.pillsPerPackage && (
          <div className={`text-xs p-2 rounded border ${
            darkMode 
              ? 'bg-gray-700/30 border-gray-600 text-gray-300' 
              : 'bg-blue-50/50 border-blue-200 text-gray-600'
          }`}>
            Umumiy: {parseInt(formData.packagesCount) * parseInt(formData.pillsPerPackage)} dona
          </div>
        )}

        {/* Company selection - only show if no specific company is pre-selected */}
        {(!selectedCompany || selectedCompany === 'all') && (
          <div className="space-y-1">
            <Label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Kompaniyalar
            </Label>
            <Select
              value={formData.company}
              onValueChange={(value) => handleInputChange('company', value)}
              required
            >
              <SelectTrigger className={`h-9 ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-200 text-gray-900'
              }`}>
                <SelectValue placeholder="Выберите компанию" />
              </SelectTrigger>
              <SelectContent
                className={`z-50 max-h-[200px] overflow-y-auto ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600'
                    : 'bg-white border-gray-200'
                }`}
              >
                {/* Always show the current selected company at the top if it's not in the list */}
                {formData.company &&
                  !companyOptions.includes(formData.company) && (
                    <SelectItem
                      key={formData.company}
                      value={formData.company}
                      className={`${
                        darkMode
                          ? 'text-white bg-blue-700'
                          : 'text-gray-900 bg-blue-100'
                      }`}
                    >
                      {formData.company}
                    </SelectItem>
                  )}
                {/* Show all company options */}
                {companyOptions.map((company) => (
                  <SelectItem
                    key={company}
                    value={company}
                    className={`${
                      darkMode
                        ? 'text-white hover:bg-gray-600 focus:bg-gray-600'
                        : 'text-gray-900 hover:bg-gray-50 focus:bg-gray-50'
                    }`}
                  >
                    {company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Display selected company when pre-selected */}
        {selectedCompany && selectedCompany !== 'all' && (
          <div className="space-y-1">
            <Label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Kompaniya
            </Label>
            <div className={`h-9 px-3 py-2 rounded-md border flex items-center ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}>
              {selectedCompany}
            </div>
          </div>
        )}

        {/* Purchase and Selling Price Section */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="purchasePrice" className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {formData.priceType === 'pachka' ? '1 pachka kirib kelgan narxi (сум)' : '1 dona kirib kelgan narxi (сум)'}
            </Label>
            <Input
              id="purchasePrice"
              placeholder={formData.priceType === 'pachka' ? '25000' : '1000'}
              value={formData.purchasePrice}
              readOnly
              onFocus={() => setActiveKeyboard('purchasePrice')}
              className={`h-9 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sellingPrice" className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {formData.priceType === 'pachka' ? '1 pachka Sotiladigan narxi (сум)' : '1 dona Sotiladigan narxi (сум)'}
            </Label>
            <Input
              id="sellingPrice"
              placeholder={formData.priceType === 'pachka' ? '30000' : '1200'}
              value={formData.sellingPrice}
              readOnly
              onFocus={() => setActiveKeyboard('sellingPrice')}
              className={`h-9 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
        </div>
        {activeKeyboard && (
          <VirtualKeyboard
            field={activeKeyboard}
            onKey={key => handleVirtualKey(activeKeyboard, key)}
            onClose={() => setActiveKeyboard(null)}
            darkMode={darkMode}
          />
        )}

        {/* Total Cost Display */}
        {(formData.purchasePrice || formData.sellingPrice) && (
          <div className={`p-3 rounded-lg border space-y-2 ${
            darkMode 
              ? 'bg-gray-700/50 border-gray-600 text-gray-300' 
              : 'bg-green-50 border-green-200 text-gray-700'
          }`}>
            <div className="text-sm font-medium">Umumiy summalar:</div>
            {formData.purchasePrice && (
              <div className="flex justify-between">
                <span>Kirib kelish summa:</span>
                <span className="font-bold">
                  {(parseFloat(formData.purchasePrice) * (formData.priceType === 'pachka' 
                    ? parseInt(formData.packagesCount) || 0 
                    : parseInt(formData.quantity) || 0
                  )).toLocaleString()} сум
                </span>
              </div>
            )}
            {formData.sellingPrice && (
              <div className="flex justify-between">
                <span>Sotish summa:</span>
                <span className="font-bold">
                  {(parseFloat(formData.sellingPrice) * (formData.priceType === 'pachka' 
                    ? parseInt(formData.packagesCount) || 0 
                    : parseInt(formData.quantity) || 0
                  )).toLocaleString()} сум
                </span>
              </div>
            )}
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-9 bg-blue-500 hover:bg-blue-600 text-white mt-4"
        >
          {editData ? 'Сохранить' : 'Добавить'}
        </Button>
      </form>
    );
  }

  // Original Dialog version for other uses
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`w-full sm:max-w-[425px] ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } overflow-y-auto max-h-[90vh]`}
      >

        <DialogHeader>
          <DialogTitle className={`text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {editData ? 'Изменение препарата' : 'Добавление препарата'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="name" className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Dori nomi
            </Label>
            <Input
              id="name"
              placeholder="Цитрамон"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`h-9 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
              }`}
              required
            />
          </div>

          {/* Tarkibi (composition) input */}
          <div className="space-y-1">
            <Label htmlFor="composition" className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Tarkibi
            </Label>
            <Input
              id="composition"
              placeholder="Tarkibi"
              value={formData.composition}
              onChange={(e) => handleInputChange('composition', e.target.value)}
              className={`h-9 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
              
          <div className="space-y-1">
            <Label htmlFor="dosage" className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Dozasi
            </Label>
            <Input
              id="dosage"
              placeholder="500mg"
              value={formData.dosage}
              onChange={(e) => handleInputChange('dosage', e.target.value)}
              className={`h-9 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>

          {/* Price Type Selection */}
          <div className="space-y-1">
            <Label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Dori turi
            </Label>
            <Select value={formData.priceType} onValueChange={(value) => handleInputChange('priceType', value)} required>
              <SelectTrigger className={`h-9 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-200 text-gray-900'
              }`}>
                <SelectValue placeholder="Выберите тип препарата" />
              </SelectTrigger>
              <SelectContent 
                className={`z-50 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-white border-gray-200'
                }`}
              >
                <SelectItem value="pachka" className={`${
                  darkMode 
                    ? 'text-white hover:bg-gray-600 focus:bg-gray-600' 
                    : 'text-gray-900 hover:bg-gray-50 focus:bg-gray-50'
                }`}>
                  Пачка
                </SelectItem>
                <SelectItem value="dona" className={`${
                  darkMode 
                    ? 'text-white hover:bg-gray-600 focus:bg-gray-600' 
                    : 'text-gray-900 hover:bg-gray-50 focus:bg-gray-50'
                }`}>
                  Дона
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantity Inputs - conditional based on type */}
          {formData.priceType === 'pachka' ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="packagesCount" className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Necha Pachka
                </Label>
                <Input
                  id="packagesCount"
                  placeholder="10"
                  value={formData.packagesCount}
                  onChange={(e) => handleInputChange('packagesCount', e.target.value)}
                  className={`h-9 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                  }`}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pillsPerPackage" className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Pachka ichidagi dona
                </Label>
                <Input
                  id="pillsPerPackage"
                  placeholder="20"
                  value={formData.pillsPerPackage}
                  onChange={(e) => handleInputChange('pillsPerPackage', e.target.value)}
                  className={`h-9 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                  }`}
                  required
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <Label htmlFor="quantity" className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Necha Dona
              </Label>
              <Input
                id="quantity"
                placeholder="200"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                className={`h-9 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                }`}
                required
              />
            </div>
          )}

          <div className="space-y-1">
            <Label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Kompaniyalar
            </Label>
            <Select
              value={formData.company}
              onValueChange={(value) => handleInputChange('company', value)}
              required
            >
              <SelectTrigger className={`h-9 ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-200 text-gray-900'
              }`}>
                <SelectValue placeholder="Выберите компанию" />
              </SelectTrigger>
              <SelectContent
                className={`z-50 ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600'
                    : 'bg-white border-gray-200'
                }`}
              >
                {/* Show selected company at the top if not in the list */}
                {formData.company &&
                  !companyOptions.includes(formData.company) && (
                    <SelectItem
                      key={formData.company}
                      value={formData.company}
                      className={`${
                        darkMode
                          ? 'text-white bg-blue-700'
                          : 'text-gray-900 bg-blue-100'
                      }`}
                    >
                      {formData.company}
                    </SelectItem>
                  )}
                {companyOptions.map((company) => (
                  <SelectItem
                    key={company}
                    value={company}
                    className={`${
                      darkMode
                        ? 'text-white hover:bg-gray-600 focus:bg-gray-600'
                        : 'text-gray-900 hover:bg-gray-50 focus:bg-gray-50'
                    }`}
                  >
                    {company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Purchase and Selling Price Section */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="purchasePrice" className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {formData.priceType === 'pachka' ? '1 pachka kirib kelgan narxi (сум)' : '1 dona kirib kelgan narxi (сум)'}
              </Label>
              <Input
                id="purchasePrice"
                placeholder={formData.priceType === 'pachka' ? '25000' : '1000'}
                value={formData.purchasePrice}
                readOnly
                onFocus={() => setActiveKeyboard('purchasePrice')}
                className={`h-9 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="sellingPrice" className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {formData.priceType === 'pachka' ? '1 pachka Sotiladigan narxi (сум)' : '1 dona Sotiladigan narxi (сум)'}
              </Label>
              <Input
                id="sellingPrice"
                placeholder={formData.priceType === 'pachka' ? '30000' : '1200'}
                value={formData.sellingPrice}
                readOnly
                onFocus={() => setActiveKeyboard('sellingPrice')}
                className={`h-9 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
          </div>
          {activeKeyboard && (
            <VirtualKeyboard
              field={activeKeyboard}
              onKey={key => handleVirtualKey(activeKeyboard, key)}
              onClose={() => setActiveKeyboard(null)}
              darkMode={darkMode}
            />
          )}

          {/* Total Cost Display */}
          {(formData.purchasePrice || formData.sellingPrice) && (
            <div className={`p-3 rounded-lg border space-y-2 ${
              darkMode 
                ? 'bg-gray-700/50 border-gray-600 text-gray-300' 
                : 'bg-green-50 border-green-200 text-gray-700'
            }`}>
              <div className="text-sm font-medium">Umumiy summalar:</div>
              {formData.purchasePrice && (
                <div className="flex justify-between">
                  <span>Kirib kelish summa:</span>
                  <span className="font-bold">
                    {(parseFloat(formData.purchasePrice) * (formData.priceType === 'pachka' 
                      ? parseInt(formData.packagesCount) || 0 
                      : parseInt(formData.quantity) || 0
                    )).toLocaleString()} сум
                  </span>
                </div>
              )}
              {formData.sellingPrice && (
                <div className="flex justify-between">
                  <span>Sotish summa:</span>
                  <span className="font-bold">
                    {(parseFloat(formData.sellingPrice) * (formData.priceType === 'pachka' 
                      ? parseInt(formData.packagesCount) || 0 
                      : parseInt(formData.quantity) || 0
                    )).toLocaleString()} сум
                  </span>
                </div>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-9 bg-blue-500 hover:bg-blue-600 text-white mt-4"
          >
            {editData ? 'Сохранить' : 'Добавить'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMedicineModal;
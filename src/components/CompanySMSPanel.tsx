import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MessageSquare, Send, Package, Receipt, Calculator } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import useCompanies, { Company } from '@/hooks/use-companies';
import { messageService } from '@/services/message.service';
import api from '@/hooks/api-settings';

interface Product {
  id: number;
  name: string;
  dosage: string;
  purchase_price: number;
  selling_price: number;
  total_stock: number;
}

interface CompanyDebt {
  company_name: string;
  total_debt: number;
  products: Array<{
    name: string;
    dosage: string;
    total_value: number;
  }>;
}

interface CompanySMSPanelProps {
  darkMode: boolean;
}

const CompanySMSPanel: React.FC<CompanySMSPanelProps> = ({ darkMode }) => {
  const { companies, loading: companiesLoading } = useCompanies();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [companyDebt, setCompanyDebt] = useState<CompanyDebt | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [sendTime, setSendTime] = useState('');
  const [dailyRepeat, setDailyRepeat] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Load company products and debt when company is selected
  useEffect(() => {
    if (selectedCompany) {
      loadCompanyData(selectedCompany.id);
    }
  }, [selectedCompany]);

  // Generate SMS message when products or debt changes
  useEffect(() => {
    if (products.length > 0 || companyDebt) {
      generateSMSMessage();
    }
  }, [products, companyDebt]);

  const loadCompanyData = async (companyId: number) => {
    setLoadingProducts(true);
    try {
      // Load company products
      const productsResponse = await api.get(`/products/?company=${companyId}`);
      setProducts(productsResponse.results || productsResponse);

      // Load company debt
      try {
        const debtResponse = await api.get(`/products/debt/company_debts/?company_id=${companyId}`);
        if (debtResponse && debtResponse.length > 0) {
          setCompanyDebt(debtResponse[0]);
        } else {
          setCompanyDebt(null);
        }
      } catch (debtError) {
        console.warn('No debt data found for company:', debtError);
        setCompanyDebt(null);
      }
    } catch (error) {
      console.error('Error loading company data:', error);
      toast({
        title: "Xatolik",
        description: "Kompaniya ma'lumotlarini yuklashda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  const generateSMSMessage = () => {
    let message = "Barcha mahsulotlar:\n\n";
    
    if (products.length > 0) {
      products.forEach((product, index) => {
        const totalPrice = product.total_stock * product.selling_price;
        message += `${index + 1}.${product.name} ${product.dosage} = ${totalPrice.toLocaleString()} so'm\n`;
      });
    }

    if (companyDebt && companyDebt.total_debt > 0) {
      message += `\numumiy qarzingiz: ${companyDebt.total_debt.toLocaleString()} so'm`;
    } else {
      message += "\nSizda hozircha qarz yo'q.";
    }

    setSmsMessage(message);
  };

  const handleCompanySelect = (companyId: string) => {
    const company = companies.find(c => c.id.toString() === companyId);
    setSelectedCompany(company || null);
    if (company) {
      setPhoneNumber(company.phone || '');
    }
  };

  const handleSendSMS = async () => {
    if (!selectedCompany || !phoneNumber || !smsMessage) {
      toast({
        title: "Xatolik",
        description: "Barcha maydonlarni to'ldiring",
        variant: "destructive",
      });
      return;
    }

    if (!phoneNumber.startsWith('+998')) {
      toast({
        title: "Xatolik", 
        description: "Telefon raqam +998 bilan boshlanishi kerak",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const messageData = {
        user_id: selectedCompany.id,
        user_name: selectedCompany.name,
        phone_number: phoneNumber,
        message: smsMessage,
        send_time: sendTime ? new Date(sendTime).toISOString() : new Date().toISOString(),
        daily_repeat: dailyRepeat,
        status: 'waiting' as const,
        id: 0,
        created_at: new Date().toISOString()
      };

      await messageService.sendMessage(messageData);
      
      toast({
        title: "Muvaffaqiyat",
        description: "SMS muvaffaqiyatli yuborildi",
      });

      // Reset form
      setSmsMessage('');
      setSendTime('');
      setDailyRepeat(false);
    } catch (error) {
      console.error('Error sending SMS:', error);
      toast({
        title: "Xatolik",
        description: "SMS yuborishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <MessageSquare className="w-5 h-5 text-blue-500" />
            Kompaniyaga SMS yuborish
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Company Selection */}
          <div className="space-y-2">
            <Label className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
              Kompaniya tanlang
            </Label>
            <Select onValueChange={handleCompanySelect}>
              <SelectTrigger className={darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white'}>
                <SelectValue placeholder="Kompaniya tanlang..." />
              </SelectTrigger>
              <SelectContent>
                {companiesLoading ? (
                  <SelectItem value="loading" disabled>Yuklanmoqda...</SelectItem>
                ) : companies.length > 0 ? (
                  companies.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-companies" disabled>Kompaniyalar topilmadi</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
              Telefon raqam
            </Label>
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+998901234567"
              className={darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white'}
            />
          </div>

          {/* Company Products Preview */}
          {selectedCompany && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-green-500" />
                <Label className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                  Kompaniya mahsulotlari
                </Label>
              </div>
              
              {loadingProducts ? (
                <div className="text-center py-4">
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Mahsulotlar yuklanmoqda...
                  </div>
                </div>
              ) : products.length > 0 ? (
                <Card className={darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50'}>
                  <CardContent className="p-4">
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {products.slice(0, 5).map((product, index) => (
                        <div key={product.id} className="flex justify-between items-center text-sm">
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                            {index + 1}. {product.name} {product.dosage}
                          </span>
                          <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {(product.total_stock * product.selling_price).toLocaleString()} so'm
                          </span>
                        </div>
                      ))}
                      {products.length > 5 && (
                        <div className={`text-xs text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          va yana {products.length - 5} ta mahsulot...
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className={`text-sm text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Bu kompaniya uchun mahsulotlar topilmadi
                </div>
              )}

              {/* Debt Information */}
              {companyDebt && companyDebt.total_debt > 0 && (
                <Card className={darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="w-4 h-4 text-red-500" />
                      <span className={`font-medium ${darkMode ? 'text-red-400' : 'text-red-700'}`}>
                        Qarz ma'lumoti
                      </span>
                    </div>
                    <div className={`text-lg font-bold ${darkMode ? 'text-red-300' : 'text-red-800'}`}>
                      {companyDebt.total_debt.toLocaleString()} so'm
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* SMS Message */}
          <div className="space-y-2">
            <Label className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
              SMS matni
            </Label>
            <Textarea
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
              placeholder="SMS matni avtomatik yaratiladi..."
              rows={8}
              className={darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white'}
            />
          </div>

          {/* Send Time */}
          <div className="space-y-2">
            <Label className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
              Yuborish vaqti (ixtiyoriy)
            </Label>
            <Input
              type="datetime-local"
              value={sendTime}
              onChange={(e) => setSendTime(e.target.value)}
              className={darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white'}
            />
          </div>

          {/* Daily Repeat */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="dailyRepeat"
              checked={dailyRepeat}
              onChange={(e) => setDailyRepeat(e.target.checked)}
              className="w-4 h-4 accent-blue-500"
            />
            <Label 
              htmlFor="dailyRepeat" 
              className={`cursor-pointer ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Har kuni yuborish
            </Label>
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSendSMS}
            disabled={isLoading || !selectedCompany || !phoneNumber || !smsMessage}
            className="w-full"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Yuborilmoqda...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                SMS yuborish
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanySMSPanel;
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import api from "@/hooks/api-settings";
import { CreditCard, Building2, TrendingDown, DollarSign } from "lucide-react";

interface Product {
  id: number;
  name: string;
  remaining_debt: number;
  initial_debt: number;
}

interface Company {
  id: string;
  name: string;
  owner_name: string;
  phone: string;
  address: string;
}

interface CompanyDebt {
  company: Company;
  total_debt: number;
  products: Product[];
}

interface DebtSummary {
  total_debt: number;
  companies_with_debt: number;
}

const DebtManagement: React.FC = () => {
  const [companyDebts, setCompanyDebts] = useState<CompanyDebt[]>([]);
  const [debtSummary, setDebtSummary] = useState<DebtSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<{ [key: string]: string }>({});
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  useEffect(() => {
    loadDebts();
    loadDebtSummary();
  }, []);

  const loadDebts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/products/debts/company_debts/");
      setCompanyDebts(response);
    } catch (error) {
      console.error("Error loading debts:", error);
      toast({
        title: "Xatolik",
        description: "Qarzlar ma'lumotlari yuklanmadi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDebtSummary = async () => {
    try {
      const response = await api.get("/products/debts/total_debt_summary/");
      setDebtSummary(response);
    } catch (error) {
      console.error("Error loading debt summary:", error);
    }
  };

  const handlePayment = async (companyId: string) => {
    const amount = parseFloat(paymentAmount[companyId] || "0");
    
    if (amount <= 0) {
      toast({
        title: "Xatolik",
        description: "To'lov miqdorini kiriting",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessingPayment(companyId);
      
      const response = await api.post("/products/debts/pay_company_debt/", {
        company_id: companyId,
        payment_amount: amount
      });

      toast({
        title: "Успех",
        description: response.message,
      });

      // Clear payment input
      setPaymentAmount(prev => ({
        ...prev,
        [companyId]: ""
      }));

      // Reload data
      await loadDebts();
      await loadDebtSummary();

    } catch (error: any) {
      console.error("Error processing payment:", error);
      toast({
        title: "Xatolik",
        description: error.response?.data?.error || "To'lov amalga oshmadi",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Summary Cards */}
      {debtSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Umumiy qarz</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(debtSummary.total_debt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Qarzli kompaniyalar</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {debtSummary.companies_with_debt}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Company Debts */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Kompaniyalar bo'yicha qarzlar
        </h2>

        {companyDebts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Qarzlar topilmadi</h3>
              <p className="text-gray-500">Hozircha hech qanday qarz mavjud emas</p>
            </CardContent>
          </Card>
        ) : (
          companyDebts.map((companyDebt) => (
            <Card key={companyDebt.company.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{companyDebt.company.name}</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {companyDebt.company.owner_name} • {companyDebt.company.phone}
                    </p>
                  </div>
                  <Badge variant="destructive" className="text-lg px-3 py-1">
                    {formatCurrency(companyDebt.total_debt)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {/* Products List */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3 flex items-center">
                    <TrendingDown className="h-4 w-4 mr-2 text-red-500" />
                    Qarzli mahsulotlar ({companyDebt.products.length})
                  </h4>
                  <div className="space-y-2">
                    {companyDebt.products.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div>
                          <span className="font-medium">{product.name}</span>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Boshlang'ich: {formatCurrency(product.initial_debt)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-red-600">
                            {formatCurrency(product.remaining_debt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Section */}
                <div className="border-t pt-4">
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-2">
                        To'lov miqdori
                      </label>
                      <Input
                        type="number"
                        placeholder="Summani kiriting..."
                        value={paymentAmount[companyDebt.company.id] || ""}
                        onChange={(e) =>
                          setPaymentAmount(prev => ({
                            ...prev,
                            [companyDebt.company.id]: e.target.value
                          }))
                        }
                        disabled={processingPayment === companyDebt.company.id}
                      />
                    </div>
                    <Button
                      onClick={() => handlePayment(companyDebt.company.id)}
                      disabled={
                        processingPayment === companyDebt.company.id ||
                        !paymentAmount[companyDebt.company.id] ||
                        parseFloat(paymentAmount[companyDebt.company.id] || "0") <= 0
                      }
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {processingPayment === companyDebt.company.id ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          To'lanmoqda...
                        </div>
                      ) : (
                        "To'lash"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default DebtManagement;
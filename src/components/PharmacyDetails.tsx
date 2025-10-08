import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Plus,
  RotateCcw,
  Trash2,
  MessageSquare,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import AddMedicineModal from "./AddMedicineModal";
import PharmacySMSPanel from "./PharmacySMSPanel";
import api from "@/hooks/api-settings";
// Notifications disabled in pharmacy section
import { toast as showToast } from "@/components/ui/use-toast";
const toast = showToast;
import PharmacyTransactionsTable from "./PharmacyTransactionsTable";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Update Medicine interface to include total_stock and selling_price
interface Medicine {
  id: number;
  name: string;
  dosage: string;
  composition?: string;
  pills_per_package: number;
  price_per_package: number;
  price_per_pill: number;
  price_type: string;
  manufacturer: string;
  stock_quantity: number;
  price_per_pill_calculated: number;
  price_per_package_calculated: number;
  archived: boolean;
  total_stock?: number;
  selling_price?: number;
  // Product type from backend: 'dona' | 'pachka'
  type?: string;
}

interface TransactionMedicine {
  medicine: Medicine;
  quantity_pills: number;
  quantity_packages: number;
  total_price: number;
}

interface PharmacyDetailsProps {
  pharmacy: {
    id: number;
    name: string;
    address: string;
    phone: string;
    manager: string;
    total_debt: number;
    remaining_debt: number;
  };
  onBack: () => void;
  darkMode: boolean;
}

const PharmacyDetails: React.FC<PharmacyDetailsProps> = ({
  pharmacy: initialPharmacy,
  onBack,
  darkMode,
}) => {
  // Change pharmacy prop to state
  const [pharmacy, setPharmacy] = useState(initialPharmacy);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isAddMedicineModalOpen, setIsAddMedicineModalOpen] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [selectedMedicines, setSelectedMedicines] = useState<
    TransactionMedicine[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [showTransactionsTable, setShowTransactionsTable] = useState(false);

  // New state for all products (from /products/) and search
  const [allProducts, setAllProducts] = useState<Medicine[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productLoading, setProductLoading] = useState(false);

  // Qo'shilgan dorilarni ko'rsatish o'rniga receiptsdan chiqarish
  const [receipts, setReceipts] = useState<any[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedReceiptToDelete, setSelectedReceiptToDelete] =
    useState<any>(null);

  // Debt payments history
  const [payments, setPayments] = useState<any[]>([]);

  // New state variables for debt management
  const [showPayDebtModal, setShowPayDebtModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");

  // SMS Panel state
  const [showSMSPanel, setShowSMSPanel] = useState(false);
  // Return modal state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnInputs, setReturnInputs] = useState<Record<number, number>>({});
  const [returnSaving, setReturnSaving] = useState(false);
  const [showReturnView, setShowReturnView] = useState(false);
  const [returnPackPiece, setReturnPackPiece] = useState<Record<number, {packages: number; pills: number}>>({});

  // Edit receipt state
  const [editReceipt, setEditReceipt] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProducts, setEditProducts] = useState<any[]>([]);

  // Add these hooks at the top of your component
  const [activeKeyboardMedicineId, setActiveKeyboardMedicineId] = useState<number | null>(null);
  const [keyboardValue, setKeyboardValue] = useState<string>('');

  useEffect(() => {
    // Ensure we have the latest pharmacy data including remaining_debt on mount
    fetchUpdatedPharmacy();
    fetchPayments();
  }, []);

  // Fetch all products for selection (for Выберите лекарства)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductLoading(true);
        const token = localStorage.getItem("access");
        const res = await fetch(import.meta.env.VITE_API_URL + "/products/products/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const products = (data.results || data).map((item: any) => ({
          id: item.id,
          name: item.name,
          dosage: item.dosage,
          composition: item.composition,
          pills_per_package: item.pills_per_package,
          price_per_package: item.price_per_package,
          price_per_pill: item.price_per_pill,
          price_type: item.price_type,
          manufacturer: item.manufacturer,
          stock_quantity: item.stock_quantity,
          price_per_pill_calculated: item.price_per_pill || 0,
          price_per_package_calculated: item.price_per_package || 0,
          archived: item.archived,
          total_stock: item.total_stock,
          selling_price: item.selling_price,
          type: item.type,
        }));
        setAllProducts(products);
      } catch (err) {
        setAllProducts([]);
      } finally {
        setProductLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleAddMedicine = async (medicineData: any) => {
    try {
      const payload = {
        name: medicineData.name,
        dosage: medicineData.dosage || "0mg",
        pills_per_package: parseInt(medicineData.pillsPerPackage) || 1,
        price_per_package:
          medicineData.priceType === "per_package"
            ? parseFloat(medicineData.pricePerUnit)
            : null,
        price_per_pill:
          medicineData.priceType === "per_pill"
            ? parseFloat(medicineData.pricePerUnit)
            : null,
        price_type: medicineData.priceType === "per_pill" ? "pill" : "package",
        manufacturer: medicineData.company,
        stock_quantity: parseInt(medicineData.packagesCount) || 0,
      };

      await api.post("/products/", payload);
      toast({
        title: "Успех",
        description: "Лекарство успешно добавлено",
      });
    } catch (error) {
      console.error("Error adding medicine:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить лекарство",
        variant: "destructive",
      });
    }
  };

  const handleArchiveMedicine = async (medicineId: number) => {
    try {
      const medicine = medicines.find((m) => m.id === medicineId);
      if (!medicine) return;

      await api.put(`/pharmacy/medicines/${medicineId}/`, {
        ...medicine,
        archived: true,
      });

      toast({
        title: "Успех",
        description: "Лекарство перемещено в архив",
      });
    } catch (error) {
      console.error("Error archiving medicine:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось архивировать лекарство",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMedicine = async (medicineId: number) => {
    try {
      await api.delete(`/pharmacy/medicines/${medicineId}/`);
      toast({
        title: "Успех",
        description: "Лекарство окончательно удалено",
      });
    } catch (error) {
      console.error("Error deleting medicine:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить лекарство",
        variant: "destructive",
      });
    }
  };

  // Выберите лекарства section (inside Add Medicine Drawer)
  // Replace old selection with new search and product list from /products/
  const handleMedicineSelect = (medicine: Medicine) => {
    const existing = selectedMedicines.find(
      (sm) => sm.medicine.id === medicine.id
    );
    if (!existing) {
      setSelectedMedicines([
        ...selectedMedicines,
        {
          medicine,
          quantity_pills: 0,
          quantity_packages: 0,
          total_price: 0,
        },
      ]);
    }
  };

  const updateMedicineQuantity = (
    medicineId: number,
    field: "quantity_pills" | "quantity_packages",
    value: number
  ) => {
    setSelectedMedicines((prev) =>
      prev.map((sm) => {
        if (sm.medicine.id !== medicineId) return sm;
        const perPack = sm.medicine.pills_per_package || 1;
        const isPachka = (sm.medicine as any).type === 'pachka';
        const updated = { ...sm };

        if (field === "quantity_packages") {
          updated.quantity_packages = isPachka ? Math.max(0, value) : 0;
        }
        if (field === "quantity_pills") {
          updated.quantity_pills = isPachka ? 0 : Math.max(0, value);
        }

        const totalUnits =
          (updated.quantity_packages || 0) * perPack +
          (updated.quantity_pills || 0);

        updated.total_price =
          totalUnits * (sm.medicine.selling_price || 0);
        return updated;
      })
    );
  };

  const removeMedicineFromSelection = (medicineId: number) => {
    setSelectedMedicines((prev) =>
      prev.filter((sm) => sm.medicine.id !== medicineId)
    );
  };

  // handleSaveTransaction: after save, remove selected medicines from sklad (products)
  const handleSaveTransaction = async () => {
    if (selectedMedicines.length === 0) {
      toast({
        title: "Ошибка",
        description: "Выберите хотя бы одно лекарство",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = {
        pharmacy_id: pharmacy.id,
        medicines: selectedMedicines.map((sm) => ({
          medicine_id: sm.medicine.id.toString(),
          quantity_pills: sm.quantity_pills.toString(),
          quantity_packages: sm.quantity_packages.toString(),
        })),
      };

      await api.post("/pharmacy/transactions/bulk_create/", payload);

      toast({
        title: "Успех",
        description: "Транзакция успешно создана",
      });

      // Remove selected medicines from sklad (products) by updating allProducts
      setAllProducts((prev) =>
        prev.map((prod) => {
          const sel = selectedMedicines.find(
            (sm) => sm.medicine.id === prod.id
          );
          if (sel) {
            // Subtract quantity (packages*pills_per_package + pieces)
            const minus = (sel.quantity_packages || 0) * (sel.medicine.pills_per_package || 1) + (sel.quantity_pills || 0);
            return {
              ...prod,
              stock_quantity: Math.max(0, (prod.stock_quantity || 0) - minus),
            };
          }
          return prod;
        })
      );

      setSelectedMedicines([]);
      setIsAddDrawerOpen(false);
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать транзакцию",
        variant: "destructive",
      });
    }
  };

  // Qo'shimcha: receipt uchun umumiy narx va mahsulotlar ro'yxatini saqlash
  const handleSaveReceipt = async () => {
    if (selectedMedicines.length === 0) {
      toast({
        title: "Ошибка",
        description: "Выберите хотя бы одно лекарство",
        variant: "destructive",
      });
      return;
    }

    try {
      // Build products array as required by API
      const products = selectedMedicines.map((sm) => {
        const perPack = sm.medicine.pills_per_package || 1;
        const units = (sm.quantity_packages || 0) * perPack + (sm.quantity_pills || 0);
        const price = sm.medicine.selling_price || 0;
        return {
          product_id: sm.medicine.id,
          name: sm.medicine.name,
          dosage: sm.medicine.dosage,
          composition: sm.medicine.composition || "",
          manufacturer: sm.medicine.manufacturer,
          selling_price: price,
          count: units,
          total: units * price,
          total_product: units,
        };
      });

      const total_price = products.reduce((sum, p) => sum + p.total, 0);
      const total_count = products.reduce((sum, p) => sum + p.count, 0);

      const payload = {
        pharmacy: pharmacy.id,
        products,
        total_price,
        total_count,
      };

      const token = localStorage.getItem("access");

      // 1. Minus stock first
      for (const sm of selectedMedicines) {
        const minusRes = await fetch(
          import.meta.env.VITE_API_URL +
            `/products/products/${sm.medicine.id}/minus_stock/`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              count: (sm.quantity_packages || 0) * (sm.medicine.pills_per_package || 1) + (sm.quantity_pills || 0),
            }),
          }
        );
        if (!minusRes.ok) {
          const errData = await minusRes.json();
          throw new Error(errData.error || "Mahsulotni minus qilishda xatolik");
        }
      }

      // 2. Save receipt
      const res = await fetch(
        import.meta.env.VITE_API_URL + "/pharmacy/pharmacy-receipts/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error("Saqlashda xatolik");

      // 3. Fetch updated pharmacy data to get new debt amount
      const updatedPharmacyRes = await fetch(
        `${import.meta.env.VITE_API_URL}/pharmacy/pharmacies/${pharmacy.id}/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (updatedPharmacyRes.ok) {
        const updatedPharmacy = await updatedPharmacyRes.json();
        setPharmacy(updatedPharmacy); // This will update the debt display
      }

      // Sklad (allProducts) dan mahsulotlarni minus qilish (frontend state update)
      setAllProducts((prev) =>
        prev.map((prod) => {
          const sel = selectedMedicines.find(
            (sm) => sm.medicine.id === prod.id
          );
          if (sel) {
            const minus = (sel.quantity_packages || 0) * (sel.medicine.pills_per_package || 1) + (sel.quantity_pills || 0);
            const perPack = prod.pills_per_package || 1;
            const newTotal = Math.max(0, (prod.total_stock || 0) - minus);
            return {
              ...prod,
              total_stock: newTotal,
              stock_quantity: Math.floor(newTotal / perPack),
            };
          }
          return prod;
        })
      );

      toast({
        title: "Успех",
        description: "Qabul qilish muvaffaqiyatli saqlandi",
      });
      setSelectedMedicines([]);
      setIsAddDrawerOpen(false);
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Qabul qilishni saqlashda xatolik",
        variant: "destructive",
      });
    }
  };

  const totalMedicinesCount = selectedMedicines.reduce((sum, sm) => {
    const perPack = sm.medicine.pills_per_package || 1;
    const units = (sm.quantity_packages || 0) * perPack + (sm.quantity_pills || 0);
    return sum + units;
  }, 0);
  const totalPrice = selectedMedicines.reduce(
    (sum, sm) => sum + sm.total_price,
    0
  );
  const activeMedicines = medicines.filter((m) => !m.archived);
  const archivedMedicines = medicines.filter((m) => m.archived);

  // Receiptsni yuklash
  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        const token = localStorage.getItem("access");
        const res = await fetch(
          import.meta.env.VITE_API_URL +
            `/pharmacy/pharmacy-receipts/?pharmacy=${pharmacy.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        setReceipts(
          Array.isArray(data.results)
            ? data.results
            : Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        setReceipts([]);
      }
    };
    fetchReceipts();
  }, [pharmacy.id, isAddDrawerOpen]); // drawer ochilib yopilganda ham yangilansin

  const handleDeleteReceipt = async (receipt: any) => {
    try {
      const token = localStorage.getItem("access");

      // Use add_stock for each product
      for (const product of receipt.products) {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/products/products/${
            product.product_id
          }/add_stock/`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              product: product.product_id,
              count: product.total_product,
            }),
          }
        );
        if (!res.ok) throw new Error("Mahsulot miqdorini qaytarishda xatolik");
      }

      // Delete the receipt
      const deleteRes = await fetch(
        `${import.meta.env.VITE_API_URL}/pharmacy/pharmacy-receipts/${
          receipt.id
        }/`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!deleteRes.ok) throw new Error("O'chirishda xatolik");

      // Update receipts list
      setReceipts((prev) => prev.filter((r) => r.id !== receipt.id));

      // Update allProducts state
      setAllProducts((prev) =>
        prev.map((prod) => {
          const restoredProduct = receipt.products.find(
            (p: any) => p.product_id === prod.id
          );
          if (restoredProduct) {
            return {
              ...prod,
              stock_quantity:
                (prod.stock_quantity || 0) + restoredProduct.total_product,
            };
          }
          return prod;
        })
      );

      // Refresh pharmacy debt at top
      await fetchUpdatedPharmacy();

      toast({
        title: "Успех",
        description: "Qabul qilish bekor qilindi va mahsulotlar qaytarildi",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "O'chirishda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  // New function to handle debt payment
  const handlePayDebt = async () => {
    try {
      const token = localStorage.getItem("access");
      const amount = parseFloat(paymentAmount);

      if (isNaN(amount) || amount <= 0) {
        toast({
          variant: "destructive",
          title: "Xatolik",
          description: "Noto'g'ri summa kiritildi",
        });
        return;
      }

      if (amount > pharmacy.remaining_debt) {
        toast({
          variant: "destructive",
          title: "Xatolik",
          description: "To'lov summasi qarzdan ko'p",
        });
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/pharmacy/pharmacies/${
          pharmacy.id
        }/pay_debt/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ amount: amount.toString() }),
        }
      );

      const data = await res.json();
      if (data.success) {
        await fetchUpdatedPharmacy(); // Fetch updated pharmacy data
        await fetchPayments();
        setPaymentAmount("");
        setShowPayDebtModal(false);
        toast({
          title: "To'lov amalga oshirildi",
          description: data.message,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: error.message || "To'lov qilishda xatolik yuz berdi",
      });
    }
  };

  // Add new function to fetch updated pharmacy data
  const fetchUpdatedPharmacy = async () => {
    try {
      const token = localStorage.getItem("access");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/pharmacy/pharmacies/${pharmacy.id}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setPharmacy(data); // Update pharmacy state with new data
    } catch (err) {
      console.error("Error fetching updated pharmacy data:", err);
    }
  };

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem("access");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/pharmacy/pharmacy-debt-payments/?pharmacy=${pharmacy.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      const list = Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : [];
      setPayments(list);
    } catch (e) {
      setPayments([]);
    }
  };

  // When edit modal opens, set editable products
  useEffect(() => {
    if (editReceipt) {
      setEditProducts(
        Array.isArray(editReceipt.products)
          ? editReceipt.products.map((p: any) => ({
              ...p,
              count: Number(p.count ?? p.total_product ?? 0),
            }))
          : []
      );
    }
  }, [editReceipt]);

  // Virtual keyboard component
  const MedicineVirtualKeyboard = ({
    value,
    onKey,
    onClose,
    darkMode
  }: {
    value: string;
    onKey: (key: string) => void;
    onClose: () => void;
    darkMode: boolean;
  }) => (
    <div className={`fixed left-0 right-0 bottom-0 z-[9999] grid grid-cols-3 gap-1 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} p-1 rounded-lg`}>
      <div className="col-span-3 mb-1 text-center text-base font-bold">{value || '0'}</div>
      {[...'123456789'].map(n => (
        <button
          key={n}
          type="button"
          className={`py-1 rounded text-base font-bold transition-colors duration-150 ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} hover:bg-blue-500 hover:text-white active:bg-blue-700`}
          onClick={() => onKey(n)}
          style={{ minHeight: 36 }}
        >
          {n}
        </button>
      ))}
      <button
        type="button"
        className={`col-span-3 py-1 rounded text-base font-bold transition-colors duration-150 ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} hover:bg-blue-500 hover:text-white active:bg-blue-700`}
        onClick={() => onKey('0')}
        style={{ minHeight: 36 }}
      >
        0
      </button>
      <div className="col-span-3 flex gap-1 mt-1">
        <button
          type="button"
          className={`flex-1 py-1 rounded text-base font-bold transition-colors duration-150 ${darkMode ? 'bg-gray-600 text-white' : 'bg-gray-300 text-gray-900'} hover:bg-gray-500 hover:text-white active:bg-gray-700`}
          onClick={onClose}
          style={{ minHeight: 36 }}
        >
          Bekor qilish
        </button>
        <button
          type="button"
          className={`flex-1 py-1 rounded text-base font-bold transition-colors duration-150 ${darkMode ? 'bg-red-700 text-white' : 'bg-red-100 text-red-600'} hover:bg-red-500 hover:text-white active:bg-red-700`}
          onClick={() => onKey('del')}
          style={{ minHeight: 36 }}
        >
          O'chirish
        </button>
      </div>
    </div>
  );

  if (showTransactionsTable) {
    return (
      <PharmacyTransactionsTable
        pharmacy={pharmacy}
        onBack={() => setShowTransactionsTable(false)}
        darkMode={darkMode}
      />
    );
  }

  if (showReturnView) {
    return (
      <div
        className={`min-h-screen ${
          darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
        }`}
      >
        <div
          className={`${
            darkMode ? "bg-gray-800" : "bg-white"
          } p-4 shadow-sm border-b ${
            darkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReturnView(false)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">Возврат — {pharmacy.name}</h1>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {(() => {
            const productMap = new Map<number, any>();
            receipts.forEach((receipt: any) => {
              (receipt.products || []).forEach((p: any) => {
                const existing = productMap.get(p.product_id);
                const totalGiven =
                  (existing?.totalGiven || 0) + (p.total_product || 0);
                const remaining =
                  (existing?.remaining || 0) +
                  (p.count ?? p.total_product ?? 0);
                productMap.set(p.product_id, {
                  product_id: p.product_id,
                  name: p.name,
                  dosage: p.dosage,
                  manufacturer: p.manufacturer,
                  price: p.selling_price || 0,
                  totalGiven,
                  remaining,
                });
              });
            });
            const items = Array.from(productMap.values()).filter(
              (it: any) => (it.remaining || 0) > 0
            );
            if (items.length === 0)
              return (
                <div className="text-center py-10 text-gray-500">
                  Ма'lumot yo'q
                </div>
              );
            return (
              <div className="space-y-2">
                {items.map((item: any, idx: number) => {
                  const sold = Math.max(
                    0,
                    (item.totalGiven || 0) - (item.remaining || 0)
                  );
                  const maxReturn = item.remaining || 0;
                  return (
                    <div
                      key={item.product_id}
                      className={`p-3 rounded border ${
                        darkMode
                          ? "border-gray-700 bg-gray-800"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-baseline justify-between">
                        <div>
                          <div className="font-medium">
                            {idx + 1}. {item.name}{" "}
                            {item.dosage ? `• ${item.dosage}` : ""}
                          </div>
                          <div
                            className={`text-xs ${
                              darkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            {item.manufacturer || ""}
                          </div>
                        </div>
                        <div className="text-sm font-semibold">
                          {Number(item.price).toLocaleString()} сум
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-2 text-xs">
                        <div>
                          Олинган:{" "}
                          <span className="font-semibold">
                            {item.totalGiven}
                          </span>
                        </div>
                        <div>
                          Сотилган:{" "}
                          <span className="font-semibold text-blue-500">
                            {sold}
                          </span>
                        </div>
                        <div>
                          Қолган:{" "}
                          <span className="font-semibold text-red-500">
                            {item.remaining}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Label className="text-xs">Возврат:</Label>
                        {(() => {
                          const prod = allProducts.find((p) => p.id === item.product_id);
                          const perPack = (prod?.pills_per_package as number) || 1;
                          const isPachka = (prod as any)?.type === 'pachka';
                          const rp = returnPackPiece[item.product_id] || { packages: 0, pills: 0 };

                          if (isPachka) {
                            return (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={rp.packages || ''}
                                  onChange={(e) => {
                                    const raw = parseInt(e.target.value) || 0;
                                    let packages = Math.max(0, raw);
                                    const pills = rp.pills || 0;
                                    let units = packages * perPack + pills;
                                    if (units > maxReturn) {
                                      packages = Math.floor((maxReturn - pills) / perPack);
                                      units = packages * perPack + pills;
                                    }
                                    setReturnPackPiece((prev) => ({
                                      ...prev,
                                      [item.product_id]: { packages, pills },
                                    }));
                                    setReturnInputs((prev) => ({
                                      ...prev,
                                      [item.product_id]: units,
                                    }));
                                  }}
                                  className={`${darkMode ? "bg-gray-700 border-gray-600 text-white" : ""} w-24 h-8`}
                                  placeholder="Pachka"
                                />
                                <Input
                                  type="number"
                                  value={rp.pills || ''}
                                  onChange={(e) => {
                                    const raw = parseInt(e.target.value) || 0;
                                    const packages = rp.packages || 0;
                                    const allowedPills = Math.max(0, maxReturn - packages * perPack);
                                    const pills = Math.max(0, Math.min(allowedPills, raw));
                                    const units = packages * perPack + pills;
                                    setReturnPackPiece((prev) => ({
                                      ...prev,
                                      [item.product_id]: { packages, pills },
                                    }));
                                    setReturnInputs((prev) => ({
                                      ...prev,
                                      [item.product_id]: units,
                                    }));
                                  }}
                                  className={`${darkMode ? "bg-gray-700 border-gray-600 text-white" : ""} w-24 h-8`}
                                  placeholder="Dona"
                                />
                              </div>
                            );
                          }

                          // type = 'dona' -> only pieces
                          return (
                            <Input
                              type="number"
                              min={0}
                              max={maxReturn}
                              value={returnInputs[item.product_id] ?? ""}
                              onChange={(e) => {
                                const raw = e.target.value;
                                if (raw === "") {
                                  const { [item.product_id]: _omit, ...rest } = returnInputs;
                                  setReturnInputs(rest);
                                  return;
                                }
                                const num = Math.max(0, Math.min(maxReturn, Number(raw)));
                                setReturnInputs((prev) => ({
                                  ...prev,
                                  [item.product_id]: num,
                                }));
                              }}
                              className={`w-28 h-8 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : ""}`}
                            />
                          );
                        })()}
                        <div
                          className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                        >
                          Max: {maxReturn}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
        <div
          className={`fixed bottom-12 left-0 right-0 border-t p-4 ${
            darkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setReturnInputs({})}
              className={darkMode ? "border-gray-600 hover:bg-gray-700" : ""}
            >
              Tozalash
            </Button>
            <Button
              onClick={async () => {
                try {
                  setReturnSaving(true);
                  const token = localStorage.getItem("access");
                  const productsToUpdate: {
                    product_id: number;
                    quantity: number;
                    receipt_id: number;
                  }[] = [];
                  const addBackTotals: Record<number, number> = {};
                  const getInstances = (pid: number) => {
                    const instances: { receipt_id: number; count: number }[] =
                      [];
                    receipts.forEach((r: any) => {
                      const p = (r.products || []).find(
                        (x: any) => x.product_id === pid
                      );
                      if (p)
                        instances.push({
                          receipt_id: r.id,
                          count: p.count ?? p.total_product ?? 0,
                        });
                    });
                    return instances;
                  };
                  for (const [pidStr, qtyRaw] of Object.entries(returnInputs)) {
                    const pid = parseInt(pidStr);
                    let remaining = Number(qtyRaw) || 0;
                    if (remaining <= 0) continue;
                    const instances = getInstances(pid);
                    for (const inst of instances) {
                      if (remaining <= 0) break;
                      const take = Math.min(remaining, inst.count);
                      if (take > 0) {
                        productsToUpdate.push({
                          product_id: pid,
                          quantity: take,
                          receipt_id: inst.receipt_id,
                        });
                        addBackTotals[pid] = (addBackTotals[pid] || 0) + take;
                        remaining -= take;
                      }
                    }
                    if (remaining > 0) {
                      toast({
                        variant: "destructive",
                        title: "Xatolik",
                        description: `Qaytarish miqdori limitdan oshdi (ID ${pid})`,
                      });
                      setReturnSaving(false);
                      return;
                    }
                  }
                  if (productsToUpdate.length === 0) {
                    toast({
                      variant: "destructive",
                      title: "Xatolik",
                      description: "Qiymatlar kiritilmagan",
                    });
                    setReturnSaving(false);
                    return;
                  }
                  const updRes = await fetch(
                    `${import.meta.env.VITE_API_URL}/pharmacy/pharmacies/${
                      pharmacy.id
                    }/update_stock/`,
                    {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ products: productsToUpdate }),
                    }
                  );
                  if (!updRes.ok)
                    throw new Error(
                      "Qaytarish uchun apteka stokini yangilashda xatolik"
                    );
                  for (const [pidStr, qty] of Object.entries(addBackTotals)) {
                    const pid = parseInt(pidStr);
                    const addRes = await fetch(
                      `${
                        import.meta.env.VITE_API_URL
                      }/products/products/${pid}/add_stock/`,
                      {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${token}`,
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ product: pid, count: qty }),
                      }
                    );
                    if (!addRes.ok)
                      throw new Error("Skladga qaytarishda xatolik");
                  }
                  let totalReturnValue = 0;
                  const priceMap: Record<number, number> = {};
                  receipts.forEach((r: any) =>
                    (r.products || []).forEach((p: any) => {
                      priceMap[p.product_id] = p.selling_price || 0;
                    })
                  );
                  for (const [pidStr, qty] of Object.entries(addBackTotals)) {
                    const pid = parseInt(pidStr);
                    totalReturnValue +=
                      (priceMap[pid] || 0) * (Number(qty) || 0);
                  }
                  if (totalReturnValue > 0) {
                    await fetch(
                      `${import.meta.env.VITE_API_URL}/pharmacy/pharmacies/${
                        pharmacy.id
                      }/pay_debt/`,
                      {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${token}`,
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          amount: String(totalReturnValue),
                        }),
                      }
                    );
                  }
                  try {
                    const res = await fetch(
                      import.meta.env.VITE_API_URL +
                        `/pharmacy/pharmacy-receipts/?pharmacy=${pharmacy.id}`,
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    const data = await res.json();
                    setReceipts(
                      Array.isArray(data.results)
                        ? data.results
                        : Array.isArray(data)
                        ? data
                        : []
                    );
                  } catch (_) {}
                  await fetchUpdatedPharmacy();
                  setReturnInputs({});
                  setShowReturnView(false);
                  toast({
                    title: "Muvaffaqiyat",
                    description: "Возврат muvaffaqiyatli",
                  });
                } catch (e: any) {
                  toast({
                    variant: "destructive",
                    title: "Xatolik",
                    description: e?.message || "Возвратda xatolik",
                  });
                } finally {
                  setReturnSaving(false);
                }
              }}
              disabled={
                returnSaving ||
                Object.values(returnInputs).every((v) => !v || v <= 0)
              }
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {returnSaving ? "Saqlanmoqda..." : "Возврат"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed min-h-screen ${
        darkMode ? "w-full bg-gray-900 text-white" : "w-full  bg-gray-50 text-gray-900"
      }`}
    >
      {/* Header */}
      <div
        className={`${
          darkMode ? "bg-gray-800" : "bg-white"
        } p-4 shadow-sm border-b ${
          darkMode ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{pharmacy.name}</h1>
              <p
                className={`text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {pharmacy.address}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSMSPanel(true)}
              className={`${
                darkMode
                  ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
            </Button>

            <Button
              onClick={() => setShowPayDebtModal(true)}
              className={`${
                (Number(pharmacy?.remaining_debt) || 0) > 0
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-500 hover:bg-green-600"
              } text-white`}
            >
              Qarz: {(Number(pharmacy?.remaining_debt) || 0).toLocaleString()}{" "}
              so'm
            </Button>
          </div>
        </div>
      </div>

      {/* Add Pay Debt Modal */}
      <Dialog open={showPayDebtModal} onOpenChange={setShowPayDebtModal}>
        <DialogContent className={darkMode ? "bg-gray-800" : "bg-white"}>
          <DialogHeader>
            <DialogTitle className={darkMode ? "text-white" : "text-gray-900"}>
              Qarzni to'lash
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Qolgan qarz</Label>
              <div
                className={`p-2 rounded ${
                  darkMode ? "bg-gray-700" : "bg-gray-100"
                }`}
              >
                {pharmacy.remaining_debt} so'm
              </div>
            </div>

            <div className="space-y-2">
              <Label>To'lov summasi</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Summani kiriting"
                className={darkMode ? "bg-gray-700 border-gray-600" : ""}
              />
            </div>

            <Button
              onClick={handlePayDebt}
              className="w-full bg-green-500 hover:bg-green-600 text-white"
            >
              To'lash
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Content */}
      <div className="p-4 pb-20">
        <div
          className={`${
            darkMode ? "bg-gray-800" : "bg-white"
          } rounded-lg p-4 shadow-sm`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Информация об аптеке</h2>
            <Button
              onClick={() => setShowTransactionsTable(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm"
            >
              Статистика
            </Button>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Телефон:</strong> {pharmacy.phone}
            </div>
            <div>
              <strong>Менеджер:</strong> {pharmacy.manager}
            </div>
          </div>
        </div>

        {/* Receipts as Active Medicines */}
        <div
          className={`${
            darkMode ? "bg-gray-800" : "bg-white"
          } rounded-lg p-4 shadow-sm mt-4`}
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            Qabul qilingan dorilar tarixi ({receipts.length})
          </h2>
          <div className="max-h-96 overflow-y-auto">
            {receipts && receipts.length > 0 ? (
              <div className="space-y-2">
                {receipts.map((receipt: any, idx: number) => (
                  <div
                    key={receipt.id}
                    className="p-2 rounded border border-green-400 bg-green-50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                          #{idx + 1}
                        </span>
                        <span className="font-medium">Narx:</span>
                        <span className="text-xs text-gray-500">
                          {Number(receipt.total_price).toLocaleString()} сум
                        </span>
                        <span className="text-xs text-gray-500">
                          ({receipt.total_count} dona)
                        </span>
                        <span className="text-xs text-gray-400">
                          {receipt.created_at?.slice(0, 16).replace("T", " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditReceipt(receipt);
                            setShowEditModal(true);
                          }}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-100"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedReceiptToDelete(receipt);
                            setDeleteConfirmOpen(true);
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="ml-4">
                      {Array.isArray(receipt.products) &&
                        receipt.products.map((prod: any, i: number) => (
                          <div
                            key={prod.product_id + "-" + i}
                            className="flex items-center gap-2 text-xs text-gray-700"
                          >
                            <span className="text-green-700">•</span>
                            <span>{prod.name}</span>
                            <span>({prod.total_product} шт)</span>
                            <span>
                              {Number(prod.selling_price).toLocaleString()} x{" "}
                              {prod.total_product} ={" "}
                              {Number(prod.total).toLocaleString()} сум
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Ma'lumot yo'q
              </div>
            )}
          </div>
        </div>

        {/* Archived Medicines */}
        {archivedMedicines.length > 0 && (
          <div
            className={`${
              darkMode ? "bg-gray-800" : "bg-white"
            } rounded-lg p-4 shadow-sm mt-4`}
          >
            <h2 className="text-lg font-semibold mb-4">
              Архив ({archivedMedicines.length})
            </h2>
            <ScrollArea className="max-h-40">
              <div className="space-y-2">
                {archivedMedicines.map((medicine, index) => (
                  <div
                    key={medicine.id}
                    className={`p-3 rounded border ${
                      darkMode
                        ? "border-gray-600 bg-gray-700"
                        : "border-gray-200 bg-gray-50"
                    } opacity-60`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium">{medicine.name}</h3>
                        <p className="text-sm">
                          {medicine.dosage} • {medicine.manufacturer}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteMedicine(medicine.id)}
                        className="ml-2"
                      >
                        Удалить
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div
        className={`fixed bottom-12 left-0 right-0 ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } border-t p-4`}
      >
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12"
            onClick={() => setShowReturnView(true)}
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Возврат
          </Button>
          <Button
            className="flex-1 h-12 bg-blue-500 hover:bg-blue-600 text-white"
            onClick={() => setIsAddDrawerOpen(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Добавить
          </Button>
        </div>
      </div>

      {/* Add Medicine Drawer */}
      <Sheet open={isAddDrawerOpen} onOpenChange={setIsAddDrawerOpen}>
        <SheetContent
          side="top"
          className={`h-full ${
            darkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          } pb-32`} // <-- add pb-32 for extra bottom padding
        >
          <SheetHeader>
            <SheetTitle className={darkMode ? "text-white" : "text-gray-900"}>
              Добавление лекарств
            </SheetTitle>
          </SheetHeader>

          <div className="mt-4 h-full flex flex-col">
            {/* Medicine Selection */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <Label
                  className={`text-sm font-medium ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Выберите лекарства
                </Label>
                <Button
                  size="sm"
                  onClick={() => setIsAddMedicineModalOpen(true)}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Новое лекарство
                </Button>
              </div>
              {/* Search input for products */}
              <div className="mb-2">
                <Input
                  placeholder="Поиск по названию или производителю..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className={
                    darkMode ? "bg-gray-700 border-gray-600 text-white" : ""
                  }
                />
              </div>
              <ScrollArea className="h-32 border rounded p-2">
                <div className="space-y-2">
                  {productLoading ? (
                    <div className="text-center text-xs text-gray-400">
                      Загрузка...
                    </div>
                  ) : (
                    allProducts
                      .filter(
                        (p) =>
                          !p.archived &&
                          (p.name
                            .toLowerCase()
                            .includes(productSearch.toLowerCase()) ||
                            (p.manufacturer || "")
                              .toLowerCase()
                              .includes(productSearch.toLowerCase()))
                      )
                      .map((medicine, index) => (
                        <div
                          key={medicine.id}
                          onClick={() => handleMedicineSelect(medicine)}
                          className={`p-2 rounded cursor-pointer hover:bg-opacity-80 ${
                            selectedMedicines.find(
                              (sm) => sm.medicine.id === medicine.id
                            )
                              ? "bg-blue-100 dark:bg-blue-900"
                              : darkMode
                              ? "bg-gray-700 hover:bg-gray-600"
                              : "bg-gray-100 hover:bg-gray-200"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                              #{index + 1}
                            </span>
                            <div>
                              <div className="font-medium text-sm">
                                {medicine.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {medicine.dosage} • {medicine.manufacturer}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )
                  }
                </div>
              </ScrollArea>
            </div>

            {/* Selected Medicines */}
            <div className="flex-1 mb-4 relative">
              <Label
                className={`text-sm font-medium ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                } mb-2 block`}
              >
                Выбранные лекарства ({selectedMedicines.length})
              </Label>

              <div className="relative h-full">
                <ScrollArea className="h-full max-h-[300px] border rounded p-3">
                  {selectedMedicines.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Лекарства не выбраны
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedMedicines.map((sm, index) => {
                        // Determine type: 'pachka' (package) or 'dona' (piece)
                        const isPachka = (sm.medicine as any).type === 'pachka';
                        const isDona = (sm.medicine as any).type === 'dona';
                        return (
                          <div
                            key={sm.medicine.id}
                            className={`p-3 rounded border ${
                              darkMode
                                ? "border-gray-600 bg-gray-700"
                                : "border-gray-200 bg-gray-50"
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                  #{index + 1}
                                </span>
                                <div>
                                  <div className="font-medium text-sm">
                                    {sm.medicine.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {sm.medicine.dosage}
                                  </div>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  removeMedicineFromSelection(sm.medicine.id)
                                }
                                className="text-red-500 hover:text-red-700"
                              >
                                ×
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {isPachka && (
                                <div>
                                  <Label className="text-xs">Упаковки</Label>
                                  <Input
                                    type="number"
                                    value={sm.quantity_packages || ""}
                                    onChange={e => {
                                      const val = Math.max(0, Number(e.target.value) || 0);
                                      updateMedicineQuantity(sm.medicine.id, "quantity_packages", val);
                                    }}
                                    className="h-8"
                                  />
                                  <div className="text-xs text-gray-400 mt-1">
                                    Sklad: {sm.medicine.total_stock ?? 0} шт
                                  </div>
                                </div>
                              )}
                              {isDona && (
                                <div>
                                  <Label className="text-xs">Штук</Label>
                                  <Input
                                    type="number"
                                    value={sm.quantity_pills || ""}
                                    onChange={e => {
                                      const val = Math.max(0, Number(e.target.value) || 0);
                                      updateMedicineQuantity(sm.medicine.id, "quantity_pills", val);
                                    }}
                                    className="h-8"
                                  />
                                  <div className="text-xs text-gray-400 mt-1">
                                    Sklad: {sm.medicine.total_stock ?? 0} шт
                                  </div>
                                </div>
                              )}
                              {/* Always show sum cell */}
                              <div>
                                <Label className="text-xs">Сумма</Label>
                                <div
                                  className={`h-8 px-2 rounded border flex items-center text-sm ${
                                    darkMode
                                      ? "bg-gray-600 border-gray-500"
                                      : "bg-gray-100 border-gray-300"
                                  }`}
                                >
                                  {(
                                    ((isPachka ? sm.quantity_packages * (sm.medicine.pills_per_package || 1) : 0) +
                                      (isDona ? sm.quantity_pills : 0)) *
                                    (sm.medicine.selling_price || 0)
                                  ).toLocaleString()}{" "}
                                  сум
                                </div>
                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
                {/* Save Button fixed at the bottom of the drawer */}
                {selectedMedicines.length > 0 && (
                  <div className=" left-0 right-0 bottom-0 px-0 pb-0 z-10">
                    <div
                      className={`p-3 rounded-t ${
                        darkMode ? "bg-gray-800" : "bg-white"
                      } border-t border-gray-300`}
                    >
                      <Button
                        onClick={handleSaveReceipt}
                        className="w-full h-12 bg-green-600 hover:bg-green-700 text-white"
                        disabled={selectedMedicines.length === 0}
                      >
                        Qabul qilishni saqlash
                      </Button>
                    </div>
                  </div>
                )}
                {/* Render the virtual keyboard fixed at the bottom if active */}
                {activeKeyboardMedicineId !== null && (
                  <div className="fixed left-0 right-0 bottom-0 z-[9999]">
                    <MedicineVirtualKeyboard
                      value={keyboardValue}
                      onKey={key => {
                        if (key === 'del') {
                          setKeyboardValue(v => v.slice(0, -1));
                        } else {
                          setKeyboardValue(v => v + key);
                        }
                      }}
                      onClose={() => {
                        // Save value to product and close keyboard
                        const sm = selectedMedicines.find(m => m.medicine.id === activeKeyboardMedicineId);
                        if (sm) {
                          if ((sm.medicine as any).type === 'pachka') {
                            updateMedicineQuantity(activeKeyboardMedicineId, "quantity_packages", keyboardValue ? parseInt(keyboardValue) : 0);
                          } else {
                            updateMedicineQuantity(activeKeyboardMedicineId, "quantity_pills", keyboardValue ? parseInt(keyboardValue) : 0);
                          }
                        }
                        setActiveKeyboardMedicineId(null);
                        setKeyboardValue('');
                      }}
                      darkMode={darkMode}
                    />
                  </div>
                )}
              </div>
            </div>
            {/* Remove old Save Button below, as it's now fixed above */}
          </div>
        </SheetContent>
      </Sheet>

      {/* Return Modal */}
      <Dialog open={showReturnModal} onOpenChange={setShowReturnModal}>
        <DialogContent
          className={darkMode ? "bg-gray-800 border-gray-700" : "bg-white"}
        >
          <DialogHeader>
            <DialogTitle className={darkMode ? "text-white" : "text-gray-900"}>
              Возврат лекарств
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {(() => {
              // Aggregate products from receipts
              const productMap = new Map<number, any>();
              receipts.forEach((receipt: any) => {
                (receipt.products || []).forEach((p: any) => {
                  const existing = productMap.get(p.product_id);
                  const totalGiven =
                    (existing?.totalGiven || 0) + (p.total_product || 0);
                  const remaining =
                    (existing?.remaining || 0) +
                    (p.count ?? p.total_product ?? 0);
                  productMap.set(p.product_id, {
                    product_id: p.product_id,
                    name: p.name,
                    dosage: p.dosage,
                    manufacturer: p.manufacturer,
                    price: p.selling_price || 0,
                    totalGiven,
                    remaining,
                  });
                });
              });
              const items = Array.from(productMap.values()).filter(
                (it: any) => (it.remaining || 0) > 0
              );
              if (items.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    Ма'lumot yo'q
                  </div>
                );
              }
              return (
                <div className="space-y-2">
                  {items.map((item: any, idx: number) => {
                    const sold = Math.max(
                      0,
                      (item.totalGiven || 0) - (item.remaining || 0)
                    );
                    const maxReturn = item.remaining || 0;
                    return (
                      <div
                        key={item.product_id}
                        className={`p-3 rounded border ${
                          darkMode
                            ? "border-gray-700 bg-gray-800"
                            : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <div className="flex items-baseline justify-between">
                          <div>
                            <div className="font-medium">
                              {idx + 1}. {item.name}{" "}
                              {item.dosage ? `• ${item.dosage}` : ""}
                            </div>
                            <div
                              className={`text-xs ${
                                darkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              {item.manufacturer || ""}
                            </div>
                          </div>
                          <div className="text-sm font-semibold">
                            {Number(item.price).toLocaleString()} сум
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mt-2 text-xs">
                          <div>
                            Олинган:{" "}
                            <span className="font-semibold">
                              {item.totalGiven}
                            </span>
                          </div>
                          <div>
                            Сотилган:{" "}
                            <span className="font-semibold text-blue-500">
                              {sold}
                            </span>
                          </div>
                          <div>
                            Қолган:{" "}
                            <span className="font-semibold text-red-500">
                              {item.remaining}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <Label className="text-xs">Возврат:</Label>
                          <Input
                            type="number"
                            min={0}
                            max={maxReturn}
                            value={returnInputs[item.product_id] ?? ""}
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (raw === "") {
                                setReturnInputs((prev) => {
                                  const { [item.product_id]: _omit, ...rest } =
                                    prev;
                                  return rest;
                                });
                                return;
                              }
                              const num = Math.max(
                                0,
                                Math.min(maxReturn, Number(raw))
                              );
                              setReturnInputs((prev) => ({
                                ...prev,
                                [item.product_id]: num,
                              }));
                            }}
                            className={`w-28 h-8 ${
                              darkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : ""
                            }`}
                          />
                          <div
                            className={`text-xs ${
                              darkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Max: {maxReturn}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setReturnInputs({})}
              className={darkMode ? "border-gray-600 hover:bg-gray-700" : ""}
            >
              Tozalash
            </Button>
            <Button
              onClick={async () => {
                try {
                  setReturnSaving(true);
                  const token = localStorage.getItem("access");

                  // Build per-receipt distribution for returns
                  const productsToUpdate: {
                    product_id: number;
                    quantity: number;
                    receipt_id: number;
                  }[] = [];
                  const addBackTotals: Record<number, number> = {};

                  const getInstances = (pid: number) => {
                    const instances: { receipt_id: number; count: number }[] =
                      [];
                    receipts.forEach((r: any) => {
                      const p = (r.products || []).find(
                        (x: any) => x.product_id === pid
                      );
                      if (p)
                        instances.push({
                          receipt_id: r.id,
                          count: p.count ?? p.total_product ?? 0,
                        });
                    });
                    return instances;
                  };

                  for (const [pidStr, qtyRaw] of Object.entries(returnInputs)) {
                    const pid = parseInt(pidStr);
                    let remaining = Number(qtyRaw) || 0;
                    if (remaining <= 0) continue;
                    const instances = getInstances(pid);
                    for (const inst of instances) {
                      if (remaining <= 0) break;
                      const take = Math.min(remaining, inst.count);
                      if (take > 0) {
                        productsToUpdate.push({
                          product_id: pid,
                          quantity: take,
                          receipt_id: inst.receipt_id,
                        });
                        addBackTotals[pid] = (addBackTotals[pid] || 0) + take;
                        remaining -= take;
                      }
                    }
                    if (remaining > 0) {
                      toast({
                        variant: "destructive",
                        title: "Xatolik",
                        description: `Qaytarish miqdori limitdan oshdi (ID ${pid})`,
                      });
                      setReturnSaving(false);
                      return;
                    }
                  }
                  if (productsToUpdate.length === 0) {
                    toast({
                      variant: "destructive",
                      title: "Xatolik",
                      description: "Qiymatlar kiritilmagan",
                    });
                    setReturnSaving(false);
                    return;
                  }

                  // 1) Decrement pharmacy stock (same endpoint as sell)
                  const updRes = await fetch(
                    `${import.meta.env.VITE_API_URL}/pharmacy/pharmacies/${
                      pharmacy.id
                    }/update_stock/`,
                    {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ products: productsToUpdate }),
                    }
                  );
                  if (!updRes.ok)
                    throw new Error(
                      "Qaytarish uchun apteka stokini yangilashda xatolik"
                    );

                  // 2) Add back to central product stock
                  for (const [pidStr, qty] of Object.entries(addBackTotals)) {
                    const pid = parseInt(pidStr);
                    const addRes = await fetch(
                      `${
                        import.meta.env.VITE_API_URL
                      }/products/products/${pid}/add_stock/`,
                      {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${token}`,
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ product: pid, count: qty }),
                      }
                    );
                    if (!addRes.ok)
                      throw new Error("Skladga qaytarishda xatolik");
                  }

                  // 3) Reduce pharmacy debt by returned value
                  let totalReturnValue = 0;
                  // Need price lookup: build map from receipts
                  const priceMap: Record<number, number> = {};
                  receipts.forEach((r: any) =>
                    (r.products || []).forEach((p: any) => {
                      priceMap[p.product_id] = p.selling_price || 0;
                    })
                  );
                  for (const [pidStr, qty] of Object.entries(addBackTotals)) {
                    const pid = parseInt(pidStr);
                    totalReturnValue +=
                      (priceMap[pid] || 0) * (Number(qty) || 0);
                  }
                  if (totalReturnValue > 0) {
                    await fetch(
                      `${import.meta.env.VITE_API_URL}/pharmacy/pharmacies/${
                        pharmacy.id
                      }/pay_debt/`,
                      {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${token}`,
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          amount: String(totalReturnValue),
                        }),
                      }
                    );
                  }

                  // Refresh receipts and pharmacy
                  // Receipts
                  try {
                    const res = await fetch(
                      import.meta.env.VITE_API_URL +
                        `/pharmacy/pharmacy-receipts/?pharmacy=${pharmacy.id}`,
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    const data = await res.json();
                    setReceipts(
                      Array.isArray(data.results)
                        ? data.results
                        : Array.isArray(data)
                        ? data
                        : []
                    );
                  } catch (_) {}
                  await fetchUpdatedPharmacy();

                  setReturnInputs({});
                  setShowReturnModal(false);
                  toast({
                    title: "Muvaffaqiyat",
                    description: "Возврат muvaffaqiyatli",
                  });
                } catch (e: any) {
                  toast({
                    variant: "destructive",
                    title: "Xatolik",
                    description: e?.message || "Возвратda xatolik",
                  });
                } finally {
                  setReturnSaving(false);
                }
              }}
              disabled={
                returnSaving ||
                Object.values(returnInputs).every((v) => !v || v <= 0)
              }
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {returnSaving ? "Saqlanmoqda..." : "Возврат"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Receipt Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className={darkMode ? "bg-gray-800 border-gray-700" : "bg-white"}>
          <DialogHeader>
            <DialogTitle className={darkMode ? "text-white" : "text-gray-900"}>
              Qabul qilingan dorilarni tahrirlash
            </DialogTitle>
          </DialogHeader>
          {editReceipt && (
            <div className="space-y-4">
              <div className="text-xs text-gray-400">
                Sana: {editReceipt.created_at?.slice(0, 16).replace("T", " ")}
              </div>
              <ScrollArea className="max-h-64">
                <div className="space-y-2">
                  {editProducts.map((prod, idx) => (
                    <div key={prod.product_id} className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{prod.name}</div>
                        <div className="text-xs text-gray-500">{prod.dosage} • {prod.manufacturer}</div>
                      </div>
                      <Input
                        type="number"
                        value={prod.count || ""}
                        onChange={e => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          setEditProducts(editProducts =>
                            editProducts.map((p, i) =>
                              i === idx ? { ...p, count: val } : p
                            )
                          );
                        }}
                        className="w-24"
                      />
                      <span className="text-xs">шт</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                  Bekor qilish
                </Button>
                <Button
                  onClick={async () => {
                    // TODO: Implement save logic (API call to update receipt)
                    // Example: await api.put(`/pharmacy/pharmacy-receipts/${editReceipt.id}/`, { products: editProducts });
                    setShowEditModal(false);
                    toast({ title: "Muvaffaqiyat", description: "O'zgartirish saqlandi" });
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Saqlash
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Medicine Modal */}
      <Dialog open={isAddMedicineModalOpen} onOpenChange={setIsAddMedicineModalOpen}>
               <AddMedicineModal
          isOpen={isAddMedicineModalOpen}
          onClose={() => setIsAddMedicineModalOpen(false)}
          onAdd={async (medicineData: any) => {
            await handleAddMedicine(medicineData);
            setIsAddMedicineModalOpen(false);
            // Sklad dorilarini yangilash uchun allProducts ni qayta yuklash
            const token = localStorage.getItem("access");
            const res = await fetch(import.meta.env.VITE_API_URL + "/products/", {
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            const products = (data.results || data).map((item: any) => ({
              id: item.id,
              name: item.name,
              dosage: item.dosage,
              composition: item.composition,
              pills_per_package: item.pills_per_package,
              price_per_package: item.price_per_package,
              price_per_pill: item.price_per_pill,
              price_type: item.price_type,
              manufacturer: item.manufacturer,
              stock_quantity: item.stock_quantity,
              price_per_pill_calculated: item.price_per_pill || 0,
              price_per_package_calculated: item.price_per_package || 0,
              archived: item.archived,
              total_stock: item.total_stock,
              selling_price: item.selling_price,
              type: item.type,
            }));
            setAllProducts(products);
          }}
          darkMode={darkMode}
        />
        {/* </DialogContent> */}
      </Dialog>

      {/* AlertDialog for deleting receipt */}

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className={darkMode ? "bg-gray-800 border-gray-700" : "bg-white"}>
          <AlertDialogHeader>
            <AlertDialogTitle className={darkMode ? "text-white" : "text-gray-900"}>
              Qabul qilishni o'chirish
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ushbu qabul qilishni o'chirishni tasdiqlaysizmi? Mahsulotlar omborga qaytariladi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmOpen(false)}>
              Bekor qilish
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={async () => {
                if (selectedReceiptToDelete) {
                  await handleDeleteReceipt(selectedReceiptToDelete);
                  setDeleteConfirmOpen(false);
                  setSelectedReceiptToDelete(null);
                }
              }}
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* SMS Panel */}
      <PharmacySMSPanel
        isOpen={showSMSPanel}
        onClose={() => setShowSMSPanel(false)}
        pharmacy={{
          id: pharmacy.id,
          name: pharmacy.name,
          phone: pharmacy.phone,
        }}
        darkMode={darkMode}
      />
  </div>
  )
};

export default PharmacyDetails;
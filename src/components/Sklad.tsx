import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  X,
  MoreVertical,
  Trash2,
  MoreHorizontal,
  Edit, 
  MessageSquare,
  Package,
  Home,
  BarChart3,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";import AddMedicineModal from "./AddMedicineModal";
import PharmacySMSPanel from "./PharmacySMSPanel";
import SkladAddProductSheet from "./SkladAddProductSheet";
import useCompanies, { Company } from "@/hooks/use-companies";
import { useToast } from "@/components/ui/use-toast";

interface Medicine {
  id: number;
  name: string;
  type: string;
  dosage: string;
  packagesCount: number;
  pillsPerPackage: number;
  totalPills: number;
  company: string;
  pricePerUnit: number;
  purchasePrice: number;
  sellingPrice: number;
  TotalPurchasePrice: number;
  TotalSellingPrice: number;
  composition?: string;
  stock_quantity?: number;
  total_stock?: number;
  remaining_debt: number; // Changed from debt object to direct number
}

interface HistoryItem {
  id: number;
  action: "added" | "deleted";
  medicineName: string;
  date: string;
  time: string;
}

interface SkladProps {
  darkMode: boolean;
  onBack: () => void;
  onSettingsClick?: () => void;
}

const Sklad: React.FC<SkladProps> = ({ darkMode, onBack, onSettingsClick }) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedMedicine, setExpandedMedicine] = useState<number | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState("100");
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [quantityFilter, setQuantityFilter] = useState("all");
  const [companyFilters, setCompanyFilters] = useState<string[]>([]);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [tempCompanyFilters, setTempCompanyFilters] = useState<string[]>([]);
  const [tempQuantityFilter, setTempQuantityFilter] = useState("all");
  const [tempCompanyFilter, setTempCompanyFilter] = useState("");
  const [tempItemsPerPage, setTempItemsPerPage] = useState(itemsPerPage);

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [currentView, setCurrentView] = useState<
    "companies" | "products" | "history"
  >("companies");
  const [selectedMedicines, setSelectedMedicines] = useState<Set<number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<Set<number>>(new Set());
  const [isCompanySelectionMode, setIsCompanySelectionMode] = useState(false);

  const { companies, addCompany, updateCompany, removeCompany, fetchCompanies, loading: companiesLoading } = useCompanies();
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [smsOpen, setSmsOpen] = useState(false);
  const [smsCompany, setSmsCompany] = useState<Company | null>(null);
  const [addCompanyForm, setAddCompanyForm] = useState({ name: "", ownerName: "", phone: "", address: "" });
  const [isAddingCompany, setIsAddingCompany] = useState(false);
  const [isEditCompanyOpen, setIsEditCompanyOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editCompanyForm, setEditCompanyForm] = useState({ name: "", ownerName: "", phone: "", address: "" });

  const filteredMedicines = medicines.filter((medicine) => {
    const matchesSearch = medicine.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCompany =
      selectedCompany === "all" || medicine.company === selectedCompany;
    return matchesSearch && matchesCompany;
  });

  const displayedMedicines = filteredMedicines.slice(0, parseInt(itemsPerPage));

  const handleCompanyFilterChange = (company: string, checked: boolean) => {
    if (checked) {
      setCompanyFilters([...companyFilters, company]);
    } else {
      setCompanyFilters(companyFilters.filter((c) => c !== company));
    }
  };

  const handleCompanyNavigation = (companyName: string) => {
    setSelectedCompany(companyName);
    setCurrentView("products");
    clearSelection();
  };

  const toggleCompanySelection = (companyId: number) => {
    const newSelectedCompanies = new Set(selectedCompanies);
    if (newSelectedCompanies.has(companyId)) {
      newSelectedCompanies.delete(companyId);
    } else {
      newSelectedCompanies.add(companyId);
    }
    setSelectedCompanies(newSelectedCompanies);
  };

  const handleBackToCompanies = () => {
    setCurrentView("companies");
    setSelectedCompany("all");
    clearSelection();
  };

  const clearAllFilters = () => {
    setQuantityFilter("all");
    setCompanyFilters([]);
  };

  const handleExpandToggle = (medicineId: number) => {
    setExpandedMedicine(expandedMedicine === medicineId ? null : medicineId);
  };

  const handleSearchClick = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setSearchQuery("");
    }
  };

  // Fetch medicines from API on mount and after add
  const fetchMedicines = async () => {
    try {
      const token = localStorage.getItem("access");
      const res = await fetch(import.meta.env.VITE_API_URL + "/products/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.results && Array.isArray(data.results)) {
        setMedicines(
          data.results.map((item: any) => ({
            id: item.id,
            name: item.name,
            type: item.type || "",
            dosage: item.dosage,
            packagesCount: item.stock_quantity || 0,
            pillsPerPackage: item.pills_per_package,
            totalPills: item.pills_per_package * (item.stock_quantity || 1),
            company: item.manufacturer || "",
            pricePerUnit: item.price_per_pill || 0,
            purchasePrice: item.purchase_price || 0,
            sellingPrice: item.selling_price || 0,
            TotalPurchasePrice: item.total_purchase_amount || 0,
            TotalSellingPrice: item.total_selling_amount || 0,
            composition: item.composition || "",
            remaining_debt: parseFloat(item.remaining_debt) || 0, // Changed this line
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching medicines:", err);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleAddMedicine = async (medicineData: {
    name: string;
    type: string;
    dosage: string;
    packagesCount: string;
    pillsPerPackage: string;
    totalPills: number;
    company?: string; // Make company optional
    pricePerUnit: string;
    purchasePrice: string;
    sellingPrice: string;
    composition?: string;
  }) => {
    try {
      const token = localStorage.getItem("access");
      const res = await fetch(import.meta.env.VITE_API_URL + "/products/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: medicineData.name,
          dosage: medicineData.dosage,
          type: medicineData.type,
          pills_per_package: parseInt(medicineData.pillsPerPackage) || 1,
          stock_quantity: parseInt(medicineData.packagesCount) || 0,
          manufacturer: selectedCompany === 'all' ? medicineData.company : selectedCompany, // Use selectedCompany if not 'all'
          composition: medicineData.composition || "",
          purchase_price: medicineData.purchasePrice
            ? parseFloat(medicineData.purchasePrice)
            : 0,
          selling_price: medicineData.sellingPrice
            ? parseFloat(medicineData.sellingPrice)
            : 0,
        }),
      });

      if (!res.ok) throw new Error("Dori qo'shishda xatolik");
      await fetchMedicines();
      setIsAddModalOpen(false);
    } catch (err) {
      console.error("Error adding medicine:", err);
    }
  };

  const handleDeleteMedicine = async (medicineId: number) => {
    try {
      const token = localStorage.getItem("access");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/products/${medicineId}/`,
        {
          method: "PATCH", // Changed from DELETE to PATCH
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ archived: true }) // Add archived field
        }
      );

      if (!res.ok) throw new Error("Dorini arxivlashda xatolik");

      const medicine = medicines.find((m) => m.id === medicineId);
      setMedicines(medicines.filter((medicine) => medicine.id !== medicineId));

      // Add to history with modified message
      if (medicine) {
        const historyItem: HistoryItem = {
          id: history.length + 1,
          action: "deleted", // You might want to add a new action type like "archived"
          medicineName: medicine.name,
          date: new Date().toLocaleDateString("ru-RU"),
          time: new Date().toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setHistory([historyItem, ...history]);
        
        toast({
          title: "Dori arxivlandi",
          description: `${medicine.name} muvaffaqiyatli arxivlandi`,
          className: darkMode ? "bg-gray-800 border-gray-700" : "",
        });
      }

      setExpandedMedicine(null);
    } catch (err) {
      console.error("Error archiving medicine:", err);
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Dorini arxivlashda xatolik yuz berdi",
        className: darkMode ? "bg-gray-800 border-gray-700" : "",
      });
    }
  };

  const handleEditMedicine = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setIsEditModalOpen(true);
  };

  const handleUpdateMedicine = async (medicineData: {
    name: string;
    type: string;
    dosage: string;
    packagesCount: string;
    pillsPerPackage: string;
    totalPills: number;
    company: string;
    pricePerUnit: string;
    purchasePrice: string;
    sellingPrice: string;
    composition?: string;
    brand?: string; // qo'shildi
  }) => {
    if (editingMedicine) {
      try {
        const token = localStorage.getItem("access");
        const res = await fetch(
          import.meta.env.VITE_API_URL + `/products/${editingMedicine.id}/`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: medicineData.name,
              dosage: medicineData.dosage,
              type: medicineData.type,
              pills_per_package: parseInt(medicineData.pillsPerPackage) || 1,
              stock_quantity: parseInt(medicineData.packagesCount) || 0,
              manufacturer: medicineData.company,
              composition: medicineData.composition || "",
              purchase_price: medicineData.purchasePrice
                ? parseFloat(medicineData.purchasePrice)
                : 0,
              selling_price: medicineData.sellingPrice
                ? parseFloat(medicineData.sellingPrice)
                : 0,
            }),
          }
        );

        if (!res.ok) throw new Error("Dorini yangilashda xatolik");
        await fetchMedicines();
        setEditingMedicine(null);
        setIsEditModalOpen(false);
        setExpandedMedicine(null);
      } catch (err) {
        console.error("Error updating medicine:", err);
      }
    }
  };

  const [paymentAmount, setPaymentAmount] = useState("");

  // Selection handlers
  const handleMedicineSelect = (medicineId: number) => {
    const newSelectedMedicines = new Set(selectedMedicines);
    if (newSelectedMedicines.has(medicineId)) {
      newSelectedMedicines.delete(medicineId);
    } else {
      newSelectedMedicines.add(medicineId);
    }
    setSelectedMedicines(newSelectedMedicines);
    setIsSelectionMode(newSelectedMedicines.size > 0);
  };

  const handleCompanySelect = (companyId: number) => {
    const newSelectedCompanies = new Set(selectedCompanies);
    if (newSelectedCompanies.has(companyId)) {
      newSelectedCompanies.delete(companyId);
    } else {
      newSelectedCompanies.add(companyId);
    }
    setSelectedCompanies(newSelectedCompanies);
  };

  const clearSelection = () => {
    setSelectedMedicines(new Set());
    setIsSelectionMode(false);
  };

  const clearCompanySelection = () => {
    setSelectedCompanies(new Set());
    setIsCompanySelectionMode(false);
  };

  const handleBulkArchive = async () => {
    try {
      const token = localStorage.getItem("access");
      const promises = Array.from(selectedMedicines).map(medicineId =>
        fetch(`${import.meta.env.VITE_API_URL}/products/${medicineId}/`, {
          method: "PATCH",
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ archived: true })
        })
      );

      await Promise.all(promises);
      
      // Remove archived medicines from state
      setMedicines(medicines.filter(m => !selectedMedicines.has(m.id)));
      
      // Add to history
      const archivedMedicines = medicines.filter(m => selectedMedicines.has(m.id));
      const newHistoryItems = archivedMedicines.map((medicine, index) => ({
        id: history.length + index + 1,
        action: "deleted" as const,
        medicineName: medicine.name,
        date: new Date().toLocaleDateString("ru-RU"),
        time: new Date().toLocaleTimeString("ru-RU", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));
      setHistory([...newHistoryItems, ...history]);
      
      toast({
        title: "Dorilar arxivlandi",
        description: `${selectedMedicines.size} ta dori muvaffaqiyatli arxivlandi`,
        className: darkMode ? "bg-gray-800 border-gray-700" : "",
      });

      clearSelection();
    } catch (err) {
      console.error("Error archiving medicines:", err);
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Dorilarni arxivlashda xatolik yuz berdi",
        className: darkMode ? "bg-gray-800 border-gray-700" : "",
      });
    }
  };

  const handleBulkDeleteCompanies = async () => {
    try {
      const promises = Array.from(selectedCompanies).map(companyId =>
        removeCompany(companyId)
      );
      await Promise.all(promises);

      toast({
        title: "O'chirildi",
        description: `${selectedCompanies.size} ta kompaniya muvaffaqiyatli o'chirildi`,
        className: darkMode ? "bg-gray-800 border-gray-700" : "",
      });

      clearCompanySelection();
      await fetchCompanies();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Kompaniyalarni o'chirishda xatolik yuz berdi",
        className: darkMode ? "bg-gray-800 border-gray-700" : "",
      });
    }
  };

  const handleDebtPayment = async (medicineId: number) => {
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
      
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/products/${medicineId}/pay_debt/`,
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
        await fetchMedicines();
        setPaymentAmount(""); // Clear input
        toast({
          title: "To'lov qabul qilindi",
          description: data.message,
          className: darkMode ? "bg-gray-800 border-gray-700" : "",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Xatolik",
          description: data.error,
          className: darkMode ? "bg-gray-800 border-gray-700" : "",
        });
      }
    } catch (err) {
      console.error("Error paying debt:", err);
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "To'lov qilishda xatolik yuz berdi",
        className: darkMode ? "bg-gray-800 border-gray-700" : "",
      });
    }
  };

  const handleArchiveCompanies = async () => {
    try {
      const token = localStorage.getItem("access");
      const res = await fetch(import.meta.env.VITE_API_URL + "/company/archive/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: Array.from(selectedCompanies) }),
      });

      if (!res.ok) throw new Error("Kompaniyalarni arxivlashda xatolik");

      toast({
        title: "O'chirildi",
        description: `${selectedCompanies.size} ta kompaniya muvaffaqiyatli arxivlandi`,
        className: darkMode ? "bg-gray-800 border-gray-700" : "",
      });

      clearCompanySelection();
      await fetchCompanies();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Kompaniyalarni arxivlashda xatolik yuz berdi",
        className: darkMode ? "bg-gray-800 border-gray-700" : "",
      });
    }
  };


  return (
    <div
      className={`min-h-screen flex flex-col ${
        darkMode ? "dark bg-gray-900" : "bg-gray-50"
      }`}
    >
      {/* Fixed Header */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 px-4 py-4 shadow-sm ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <div className="flex items-center justify-between">
          {currentView === "companies" ? (
            <>
              <button onClick={handleSearchClick}>
                <Search className="text-blue-500" size={24} />
              </button>
              {/* Replace "Склад" with X button when not in selection mode */}
              {isCompanySelectionMode ? (
                <button
                  onClick={() => {
                    setIsCompanySelectionMode(false);
                    clearCompanySelection();
                  }}
                  title="Bekor qilish"
                  className="p-1"
                >
                  <X className="text-blue-500" size={28} />
                </button>
              ) : (
                <h1
                  className={`text-xl font-bold ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Склад
                </h1>
              )}
              {isCompanySelectionMode ? (
                <div className="flex items-center space-x-2">
                  <span className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {selectedCompanies.size}
                  </span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button>
                        <Trash2 className="text-red-500" size={24} />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className={darkMode ? "bg-gray-800 border-gray-700" : ""}>
                      <AlertDialogHeader>
                        <AlertDialogTitle className={darkMode ? "text-white" : ""}>
                          Kompaniyalarni o'chirishni tasdiqlang
                        </AlertDialogTitle>
                        <AlertDialogDescription className={darkMode ? "text-gray-300" : ""}>
                          {selectedCompanies.size} ta kompaniya o'chiriladi. Bu amalni qaytarib bo'lmaydi.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className={darkMode ? "bg-gray-700 text-white border-gray-600" : ""}>
                          Bekor qilish
                        </AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleArchiveCompanies}
                          className="bg-red-500 hover:bg-red-600 text-white"
                        >
                          O'chirish
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : (
                <button onClick={() => setIsCompanySelectionMode(true)}>
                  <Trash2 className="text-red-500" size={24} />
                </button>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <button onClick={handleBackToCompanies}>
                  <ChevronDown className="text-blue-500 rotate-90" size={24} />
                </button>
                <button onClick={handleSearchClick}>
                  <Search className="text-blue-500" size={24} />
                </button>
              </div>
              {isSelectionMode ? (
                <button onClick={clearSelection}>
                  <X className="text-blue-500" size={24} />
                </button>
              ) : (
                <h1
                  className={`text-xl font-bold ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {currentView === "history"
                    ? "История"
                    : selectedCompany === "all"
                    ? "Все препараты"
                    : selectedCompany}
                </h1>
              )}
              {isSelectionMode ? (
                <div className="flex items-center space-x-2">
                  <span className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {selectedMedicines.size}
                  </span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button>
                        <Trash2 className="text-red-500" size={24} />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className={darkMode ? "bg-gray-800 border-gray-700" : ""}>
                      <AlertDialogHeader>
                        <AlertDialogTitle className={darkMode ? "text-white" : ""}>
                          Дориларни архивлашни тасдиқланг
                        </AlertDialogTitle>
                        <AlertDialogDescription className={darkMode ? "text-gray-300" : ""}>
                          {selectedMedicines.size} та дори архивланади. Бу амални қайтариб бўлмайди.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className={darkMode ? "bg-gray-700 text-white border-gray-600" : ""}>
                          Бекор қилиш
                        </AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleBulkArchive}
                          className="bg-red-500 hover:bg-red-600 text-white"
                        >
                          Архивлаш
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : currentView === "products" && (
                <div className="flex items-center gap-5">
                  <button onClick={() => setIsSelectionMode(true)} title="O'chirish rejimi">
                    <Trash2 className="text-red-500" size={24} />
                  </button>
                  
                  {selectedCompany !== "all" && (
                    <button
                      onClick={() => {
                        const c = companies.find((c) => c.name === selectedCompany);
                        if (c) {
                          setSmsCompany(c);
                          setSmsOpen(true);
                        }
                      }}
                      disabled={!companies.find((c) => c.name === selectedCompany)?.phone}
                      title={companies.find((c) => c.name === selectedCompany)?.phone ? "SMS yuborish" : "Telefon raqami kiritilmagan"}
                    >
                      <MessageSquare className="text-blue-500" size={24} />
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Animated Search Bar */}
        {(currentView === "companies" || currentView === "products") && (
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              isSearchOpen ? "max-h-16 opacity-100 mt-4" : "max-h-0 opacity-0"
            }`}
          >
            <div className="relative">
              <Input
                type="text"
                placeholder="Поиск лекарств..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pr-10 ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-200 text-gray-900 placeholder-gray-500"
                }`}
              />
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery("");
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <X className="text-gray-400" size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div
        className={`flex-1 overflow-y-auto ${
          isSearchOpen ? "pt-36" : "pt-20"
        } pb-24`}
      >
        {/* Companies View */}
        {currentView === "companies" && (
          <>
            {/* Company Filter Cards */}
            <div className="mx-4 mt-4">
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* All Companies Button */}
                {!isCompanySelectionMode && (
                  <button
                    onClick={() => handleCompanyNavigation("all")}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      darkMode
                        ? "border-gray-600 bg-gray-800 hover:border-gray-500"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="text-center">
                      <Package
                        className={`w-6 h-6 mx-auto mb-2 ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      />
                      <p
                        className={`text-sm font-medium ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Все компании
                      </p>
                      <p
                        className={`text-xs ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {medicines.length} препаратов
                      </p>
                    </div>
                  </button>
                )}

                {/* Loading state for companies */}
                {companiesLoading ? (
                  <div className={`p-4 rounded-lg border-2 ${darkMode ? "border-gray-600 bg-gray-800" : "border-gray-200 bg-white"}`}>
                    <div className="text-center">
                      <div className="animate-pulse mx-auto h-6 w-6 mb-2 rounded-full bg-blue-200 dark:bg-blue-700"></div>
                      <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                        Kompaniyalar yuklanmoqda...
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Company Cards */
                  companies.map((company) => {
                    const companyMedicines = medicines.filter(
                      (m) => m.company === company.name
                    );
                    return (
                      <div
                        key={company.id}
                        onClick={() =>
                          isCompanySelectionMode
                            ? toggleCompanySelection(company.id)
                            : handleCompanyNavigation(company.name)
                        }
                        className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                          darkMode
                            ? selectedCompanies.has(company.id)
                              ? "bg-blue-900/50 border-blue-500"
                              : "border-gray-600 bg-gray-800 hover:border-gray-500"
                            : selectedCompanies.has(company.id)
                            ? "bg-blue-50 border-blue-500"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        {isCompanySelectionMode && (
                          <Checkbox
                            checked={selectedCompanies.has(company.id)}
                            onCheckedChange={() => toggleCompanySelection(company.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-2 left-2"
                          />
                        )}
                        <div className="absolute right-2 top-2 flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCompany(company);
                              setEditCompanyForm({
                                name: company.name,
                                ownerName: company.ownerName || "",
                                phone: company.phone || "",
                                address: company.address || "",
                              });
                              setIsEditCompanyOpen(true);
                            }}
                            className={`${darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"} text-xs px-2 py-1 rounded`}
                            title="Tahrirlash"
                          >
                            <Edit size={16} />
                          </button>
                          <AlertDialog>
                            <AlertDialogContent className={darkMode ? "bg-gray-800 border-gray-700" : ""}>
                              <AlertDialogHeader>
                                <AlertDialogTitle className={darkMode ? "text-white" : ""}>
                                  Kompaniyani o'chirishni tasdiqlang
                                </AlertDialogTitle>
                                <AlertDialogDescription className={darkMode ? "text-gray-300" : ""}>
                                  Ushbu kompaniya o'chiriladi. Bu amalni qaytarib bo'lmaydi.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className={darkMode ? "bg-gray-700 text-white border-gray-600" : ""}/>
                                <AlertDialogAction
                                  className="bg-red-500 hover:bg-red-600 text-white"
                                  onClick={async () => {
                                    try {
                                      await removeCompany(company.id);
                                      toast({
                                        title: "O'chirildi",
                                        description: `${company.name} o'chirildi`,
                                        className: darkMode ? "bg-gray-800 border-gray-700" : "",
                                      });
                                    } catch (err) {
                                      toast({
                                        variant: "destructive",
                                        title: "Xatolik",
                                        description: "Kompaniyani o'chirishda xatolik",
                                        className: darkMode ? "bg-gray-800 border-gray-700" : "",
                                      });
                                    }
                                  }}
                                >
                                  O'chirish
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                        <div className="text-center">
                          <Home
                            className={`w-6 h-6 mx-auto mb-2 ${
                              darkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          />
                          <p
                            className={`text-sm font-medium ${
                              darkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {company.name}
                          </p>
                          <p
                            className={`text-xs ${
                              darkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            {companyMedicines.length} препаратов
                          </p>
                        </div>
                      </div>
                    );
                  }))
                
              }
            </div>
            </div>

            {/* History Section */}
            <div
              className={`mx-4 mt-4 p-4 rounded-lg shadow-sm cursor-pointer ${
                darkMode
                  ? "bg-gray-800 hover:bg-gray-700"
                  : "bg-white hover:bg-gray-50"
              }`}
              onClick={() => setCurrentView("history")}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-medium ${
                    darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  ИСТОРИЯ ДОБАВЛЕНИЯ
                </span>
                <ChevronDown
                  className={`w-4 h-4 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                />
              </div>
            </div>
          </>
        )}

        {/* Products View */}
        {currentView === "products" && (
          <div
            className={`mx-4 mt-4 rounded-lg shadow-sm flex-1 ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            {displayedMedicines.length === 0 ? (
              <div className="p-8 text-center">
                <span
                  className={`text-lg ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {medicines.length === 0
                    ? "Dori mavjud emas"
                    : "Filtr bo'yicha hech narsa topilmadi"}
                </span>
              </div>
            ) : (
              displayedMedicines.map((medicine, idx) => (
                <div
                  key={medicine.id}
                  className={`border-b last:border-b-0 ${
                    darkMode ? "border-gray-700" : "border-gray-100"
                  }`}
                >
                  <div
                    className={`flex items-center justify-between p-4 cursor-pointer transition-all duration-200 ${
                      selectedMedicines.has(medicine.id) 
                        ? darkMode ? "bg-blue-900/50" : "bg-blue-50" 
                        : darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                    }`}
                    onClick={() => isSelectionMode ? handleMedicineSelect(medicine.id) : handleExpandToggle(medicine.id)}
                  >
                    <div className="flex items-center space-x-3">
                      {isSelectionMode && (
                        <Checkbox
                          checked={selectedMedicines.has(medicine.id)}
                          onCheckedChange={() => handleMedicineSelect(medicine.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                      {/* Tartib raqami */}
                      <span
                        className={`text-xs font-bold ${
                          darkMode ? "text-blue-400" : "text-blue-600"
                        }`}
                      >
                        {idx + 1}.
                      </span>
                      <span
                        className={`font-medium ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {medicine.name}
                      </span>
                      {medicine.dosage && (
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            darkMode
                              ? "bg-gray-700 text-gray-300"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {medicine.dosage}
                        </span>
                      )}
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          darkMode
                            ? "bg-gray-700 text-gray-300"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {medicine.totalPills} штук
                      </span>
                    </div>
                    <div className="transition-transform duration-200">
                      {expandedMedicine === medicine.id ? (
                        <ChevronUp className="w-5 h-5 text-blue-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                  </div>

                  {expandedMedicine === medicine.id && (
                    <div
                      className={`transition-all duration-300 ease-in-out overflow-hidden ${
                        darkMode ? "bg-gray-750" : "bg-gray-50"
                      }`}
                    >
                      <div className="px-4 pb-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span
                              className={`text-sm ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              Вид
                            </span>
                            <span
                              className={`text-sm ${
                                darkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {medicine.type || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span
                              className={`text-sm ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              Компания
                            </span>
                            <span
                              className={`text-sm ${
                                darkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {medicine.company || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span
                              className={`text-sm ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              Дозировка
                            </span>
                            <span
                              className={`text-sm ${
                                darkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {medicine.dosage}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span
                              className={`text-sm ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              штук продукта
                            </span>
                            <span
                              className={`text-sm ${
                                darkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {medicine.totalPills}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span
                              className={`text-sm ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              Цена покупки за 1 шт.
                            </span>
                            <span
                              className={`text-sm ${
                                darkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {medicine.purchasePrice
                                ? medicine.purchasePrice.toLocaleString()
                                : 0}{" "}
                              сум
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span
                              className={`text-sm ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              Цена продажи за 1 шт.
                            </span>
                            <span
                              className={`text-sm ${
                                darkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {medicine.sellingPrice
                                ? medicine.sellingPrice.toLocaleString()
                                : 0}{" "}
                              сум
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span
                              className={`text-sm ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              Общая цена продажи
                            </span>
                            <span
                              className={`text-sm ${
                                darkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {medicine.TotalSellingPrice
                                ? medicine.TotalSellingPrice.toLocaleString()
                                : 0}{" "}
                              сум
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span
                              className={`text-sm ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              Состав
                            </span>
                            <span
                              className={`text-sm ${
                                darkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {medicine.composition || "N/A"}
                            </span>
                          </div>

                          {/* Add this new debt section */}
                          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className={`text-lg font-medium ${
                                darkMode ? "text-red-400" : "text-red-600"
                              }`}>
                                Qarz
                              </span>
                              <span className={`text-lg font-bold ${
                                darkMode ? "text-red-400" : "text-red-600"
                              }`}>
                                {medicine.remaining_debt.toLocaleString()} so'm
                              </span>
                            </div>
                            
                            {medicine.remaining_debt > 0 && (
                              <div className="mt-3">
                                <Input
                                  type="number"
                                  placeholder="To'lov summasi"
                                  className="mb-2"
                                  value={paymentAmount}
                                  onChange={(e) => setPaymentAmount(e.target.value)}
                                />
                                <Button 
                                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                                  onClick={() => handleDebtPayment(medicine.id)}
                                >
                                  To'lov qilish
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              onClick={() => handleEditMedicine(medicine)}
                              variant="outline"
                              size="sm"
                              className={`w-full ${
                                darkMode
                                  ? "border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                                  : "border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                              }`}
                            >
                              <Edit size={16} className="mr-2" />
                              Изменить
                            </Button>

                            <AlertDialog>
                              <AlertDialogContent
                                className={`${
                                  darkMode
                                    ? "bg-gray-800 border-gray-700"
                                    : "bg-white border-gray-200"
                                }`}
                              >
                                <AlertDialogHeader>
                                  <AlertDialogTitle
                                    className={
                                      darkMode ? "text-white" : "text-gray-900"
                                    }
                                  >
                                    Подтвердите удаление
                                  </AlertDialogTitle>
                                  <AlertDialogDescription
                                    className={
                                      darkMode
                                        ? "text-gray-300"
                                        : "text-gray-600"
                                    }
                                  >
                                    Вы уверены, что хотите удалить препарат "
                                    {medicine.name}"? Это действие нельзя
                                    отменить.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel
                                    className={
                                      darkMode
                                        ? "bg-gray-700 text-white hover:bg-gray-600"
                                        : ""
                                    }
                                  >
                                    Отмена
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDeleteMedicine(medicine.id)
                                    }
                                    className="bg-red-500 hover:bg-red-600 text-white"
                                  >
                                    Удалить
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* History View */}
        {currentView === "history" && (
          <div
            className={`mx-4 mt-4 space-y-3 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {history.length === 0 ? (
              <div className="p-8 text-center">
                <span
                  className={`text-lg ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  История пуста
                </span>
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border ${
                    darkMode
                      ? "border-gray-700 bg-gray-800"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          item.action === "added"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      ></div>
                      <span
                        className={`font-medium ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {item.medicineName}
                      </span>
                    </div>
                    <span
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {item.time}
                    </span>
                  </div>
                  <div className="mt-1">
                    <span
                      className={`text-sm ${
                        item.action === "added"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {item.action === "added" ? "Добавлено" : "Удалено"}
                    </span>
                    <span
                      className={`text-sm ml-2 ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {item.date}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* History Modal */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent
          className={`max-w-md ${
            darkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <DialogHeader>
            <DialogTitle
              className={`${darkMode ? "text-white" : "text-gray-900"}`}
            >
              История добавления
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {history.length === 0 ? (
              <div className="p-8 text-center">
                <span
                  className={`text-lg ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  История пуста
                </span>
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border ${
                    darkMode
                      ? "border-gray-700 bg-gray-750"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          item.action === "added"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      ></div>
                      <span
                        className={`font-medium ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {item.medicineName}
                      </span>
                    </div>
                    <span
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {item.time}
                    </span>
                  </div>
                  <div className="mt-1">
                    <span
                      className={`text-sm ${
                        item.action === "added"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {item.action === "added" ? "Добавлено" : "Удалено"}
                    </span>
                    <span
                      className={`text-sm ml-2 ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {item.date}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>{/* Add Medicine Modal - Updated with better scrolling */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className={`overflow-y-auto max-w-full h-[100dvh] m-0 p-0 ${
          darkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
          <div className="overflow-y-auto flex flex-col h-full ">
            <DialogHeader className={`flex-shrink-0 sticky top-0 z-50 px-4 py-2 border-b ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <DialogTitle className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Добавление препарата
                </DialogTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsAddModalOpen(false)}
                  className={darkMode ? 'text-gray-400 hover:text-white' : ''}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </DialogHeader>
            
              <div className="overflow-y-auto max-h-[100vh] max-w-2xl w-auto mx-auto px-4 py-6">
                <AddMedicineModal
                  isOpen={true}
                  onClose={() => setIsAddModalOpen(false)}
                  onAdd={handleAddMedicine}
                  darkMode={darkMode}
                  isSheet={true}
                  selectedCompany={selectedCompany}
                />
              </div>
          </div>
        </DialogContent>
      </Dialog>{/* Edit Medicine Sheet */}
      {editingMedicine && (
        <Sheet
          open={isEditModalOpen}
          onOpenChange={(open) => {
            setIsEditModalOpen(open);
            if (!open) setEditingMedicine(null);
          }}
        >
          <SheetContent
            side="bottom"
            className={`max-h-full overflow-y-auto ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <SheetHeader>
              <SheetTitle
                className={`${
                  darkMode ? "text-white" : "text-gray-900"
                } text-center`}
              >
                Изменение препарата
              </SheetTitle>
            </SheetHeader>

            <div className="mt-4">
              <AddMedicineModal
                isOpen={true}
                onClose={() => {
                  setIsEditModalOpen(false);
                  setEditingMedicine(null);
                }}
                onAdd={handleUpdateMedicine}
                darkMode={darkMode}
                isSheet={true}
                editData={{
                  name: editingMedicine.name,
                  type: editingMedicine.type,
                  dosage: editingMedicine.dosage,
                  packagesCount: editingMedicine.packagesCount.toString(),
                  pillsPerPackage: editingMedicine.pillsPerPackage.toString(),
                  company: editingMedicine.company,
                  pricePerUnit: editingMedicine.pricePerUnit.toString(),
                  purchasePrice: editingMedicine.purchasePrice.toString(),
                  sellingPrice: editingMedicine.sellingPrice.toString(),
                  composition: editingMedicine.composition || "",
                }}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Floating Action Button - only show in products view */}
      {currentView === "products" && (
        <div className="fixed bottom-24 right-6">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg"
          >
            <Plus size={24} className="text-white" />
          </Button>
        </div>
      )}

      {/* Floating Action Button - companies view: add company */}
      {currentView === "companies" && (
        <div className="fixed bottom-24 right-6">
          <Button
            onClick={() => setIsAddCompanyOpen(true)}
            className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg"
          >
            <Plus size={24} className="text-white" />
          </Button>
        </div>
      )}

      {/* Add Company Sheet (bottom slide-up) */}
      <Sheet
        open={isAddCompanyOpen}
        onOpenChange={(open) => {
          setIsAddCompanyOpen(open);
          if (!open) setAddCompanyForm({ name: "", ownerName: "", phone: "", address: "" });
        }}
      >
        <SheetContent
          side="top"
          className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} pt-12 max-h-[100vh] w-full overflow-y-auto transition-all duration-500`}
        >
          <SheetHeader>
            <SheetTitle className={`${darkMode ? "text-white" : "text-gray-900"} mt-12 text-center`}>
              Kompaniya qo'shish
            </SheetTitle>
          </SheetHeader>
          <div className="mt-2 space-y-3">
            <div>
              <Label className={darkMode ? "text-gray-300" : "text-gray-700"}>Kompaniya nomi</Label>
              <Input
                value={addCompanyForm.name}
                onChange={(e) => setAddCompanyForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Masalan: Star Farm"
                className={darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : ""}
              />
            </div>
            <div>
              <Label className={darkMode ? "text-gray-300" : "text-gray-700"}>Egasining ismi</Label>
              <Input
                value={addCompanyForm.ownerName}
                onChange={(e) => setAddCompanyForm((p) => ({ ...p, ownerName: e.target.value }))}
                placeholder="Ism Familiya"
                className={darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : ""}
              />
            </div>
            <div>
              <Label className={darkMode ? "text-gray-300" : "text-gray-700"}>Telefon raqami</Label>
              <Input
                value={addCompanyForm.phone}
                onChange={(e) => setAddCompanyForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+998901234567"
                className={darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : ""}
              />
            </div>
            <div className="mt-5 space-y-3">
              <Label className={darkMode ? "text-gray-300" : "text-gray-700"}>Manzili</Label>
              <Input
                value={addCompanyForm.address}
                onChange={(e) => setAddCompanyForm((p) => ({ ...p, address: e.target.value }))}
                placeholder="Viloyat, tuman, ko'cha"
                className={darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : ""}
              />
            </div>
            <Button
              className="w-full mt-5 bg-blue-500 hover:bg-blue-600 text-white"onClick={async () => {
                if (!addCompanyForm.name.trim()) return;
                setIsAddingCompany(true);
                try {
                  await addCompany({
                    name: addCompanyForm.name,
                    ownerName: addCompanyForm.ownerName,
                    phone: addCompanyForm.phone,
                    address: addCompanyForm.address,
                  });
                  toast({
                    title: "Kompaniya qo'shildi",
                    description: `${addCompanyForm.name} muvaffaqiyatli qo'shildi`,
                    className: darkMode ? "bg-gray-800 border-gray-700" : "",
                  });
                  setIsAddCompanyOpen(false);
                  setAddCompanyForm({ name: "", ownerName: "", phone: "", address: "" });
                } catch (err) {
                  toast({
                    variant: "destructive",
                    title: "Xatolik",
                    description: "Kompaniyani qo'shishda xatolik yuz berdi",
                    className: darkMode ? "bg-gray-800 border-gray-700" : "",
                  });
                } finally {
                  setIsAddingCompany(false);
                }
              }}
            >
              Saqlash
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {smsCompany && (
        <PharmacySMSPanel
          isOpen={smsOpen}
          onClose={() => setSmsOpen(false)}
          pharmacy={{
            id: smsCompany.id,
            name: smsCompany.name,
            phone: smsCompany.phone || "",
          }}
          darkMode={darkMode}
        />
      )}

      <Sheet
        open={isEditCompanyOpen}
        onOpenChange={(open) => {
          setIsEditCompanyOpen(open);
          if (!open) {
            setEditingCompany(null);
            setEditCompanyForm({ name: "", ownerName: "", phone: "", address: "" });
          }
        }}
      >
        <SheetContent
          side="top"
          className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} pt-12 max-h-[90vh] overflow-y-auto transition-all duration-500 `}
        >
          <SheetHeader>
            <SheetTitle className={`${darkMode ? "text-white" : "text-gray-900"} mb-1 mt-12 text-center`}>
              Kompaniyani tahrirlash
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            <div>
              <Label className={darkMode ? "text-gray-300" : "text-gray-700"}>Kompaniya nomi</Label>
              <Input
                value={editCompanyForm.name}
                onChange={(e) => setEditCompanyForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Masalan: Star Farm"
                className={darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : ""}
              />
            </div>
            <div>
              <Label className={darkMode ? "text-gray-300" : "text-gray-700"}>Egasining ismi</Label>
              <Input
                value={editCompanyForm.ownerName}
                onChange={(e) => setEditCompanyForm((p) => ({ ...p, ownerName: e.target.value }))}
                placeholder="Ism Familiya"
                className={darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : ""}
              />
            </div>
            <div>
              <Label className={darkMode ? "text-gray-300" : "text-gray-700"}>Telefon raqami</Label>
              <Input
                value={editCompanyForm.phone}
                onChange={(e) => setEditCompanyForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+998901234567"
                className={darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : ""}
              />
            </div>
            <div>
              <Label className={darkMode ? "text-gray-300" : "text-gray-700"}>Manzili</Label>
              <Input
                value={editCompanyForm.address}
                onChange={(e) => setEditCompanyForm((p) => ({ ...p, address: e.target.value }))}
                placeholder="Viloyat, tuman, ko'cha"
                className={darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : ""}
              />
            </div>
            <Button
              className="mt-5 w-full bg-blue-500 hover:bg-blue-600 text-white"
              onClick={async () => {
                if (!editingCompany) return;
                try {
                  await updateCompany(editingCompany.id, {
                    name: editCompanyForm.name,
                    ownerName: editCompanyForm.ownerName,
                    phone: editCompanyForm.phone,
                    address: editCompanyForm.address,
                  });
                  toast({
                    title: "Yangilandi",
                    description: `${editCompanyForm.name} ma'lumotlari yangilandi`,
                    className: darkMode ? "bg-gray-800 border-gray-700" : "",
                  });
                  setIsEditCompanyOpen(false);
                  setEditingCompany(null);
                } catch (err) {
                  toast({
                    variant: "destructive",
                    title: "Xatolik",
                    description: "Kompaniyani yangilashda xatolik yuz berdi",
                    className: darkMode ? "bg-gray-800 border-gray-700" : "",
                  });
                }
              }}
            >
              Saqlash
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-blue-500 px-4 py-2">
        <div className="flex justify-around items-center">
          <button
            onClick={onBack}
            className="flex flex-col items-center space-y-1"
          >
            <Home size={24} className="text-white/60" />
            <span className="text-xs text-white/60">Сводка</span>
          </button>
          <div className="flex flex-col items-center space-y-1">
            <Package size={24} className="text-white" />
            <span className="text-xs text-white font-medium">Склад</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <BarChart3 size={24} className="text-white/60" />
            <span className="text-xs text-white/60">Контроль</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <button
              onClick={onSettingsClick}
              className="flex flex-col items-center space-y-1"
            >
              <User size={24} className="text-white/60" />
              <span className="text-xs text-white/60">Настройки</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Drawer */}
      <Drawer open={isFilterDrawerOpen} onOpenChange={setIsFilterDrawerOpen}>
        <DrawerContent
          className={`max-w-lg mx-auto rounded-t-2xl transition-all duration-300 ${
            darkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <DrawerHeader>
            <DrawerTitle
              className={`${
                darkMode ? "text-white" : "text-gray-900"
              } text-center`}
            >
              Фильтр
            </DrawerTitle>
          </DrawerHeader>
          <div className="space-y-4 p-4">
            {/* Company Select */}
            <div>
              <Label className={darkMode ? "text-gray-300" : "text-gray-700"}>
                Компания
              </Label>
              <select
                value={tempCompanyFilter}
                onChange={(e) => setTempCompanyFilter(e.target.value)}
                className={`w-full mt-2 rounded border px-2 py-1 ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-200 text-gray-900"
                }`}
              >
                <option value="">Барча</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.name}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
            {/* Items per page Select */}
            <div>
              <Label className={darkMode ? "text-gray-300" : "text-gray-700"}>
                Nechtaligi
              </Label>
              <select
                value={tempItemsPerPage}
                onChange={(e) => setTempItemsPerPage(e.target.value)}
                className={`w-full mt-2 rounded border px-2 py-1 ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-200 text-gray-900"
                }`}
              >
                <option value="50">50 shtuk</option>
                <option value="100">100 shtuk</option>
                <option value="200">200 shtuk</option>
              </select>
            </div>
            {/* Apply Button */}
            <Button
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              onClick={() => {
                setCompanyFilters(tempCompanyFilter ? [tempCompanyFilter] : []);
                setItemsPerPage(tempItemsPerPage);
                setIsFilterDrawerOpen(false);
              }}
            >
              Фильтрни қўллаш
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default Sklad;

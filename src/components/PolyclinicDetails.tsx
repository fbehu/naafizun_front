import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Search, Plus, X, Edit2, Trash2, Check, X as XIcon, ChevronUp, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label'; 
import { ScrollArea } from '@/components/ui/scroll-area'; 
import PolyclinicTransactionsTable from './PolyclinicTransactionsTable';
import { toast } from '@/hooks/use-toast';
import DoctorSMSPanel from '@/components/DoctorSMSPanel';

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  phone: string;
  medicine: string;
  schedule: string;
  is_active: boolean;
}

interface Polyclinic {
  id: number;
  name: string;
  address: string;
  phone: string;
  manager: string;
  archived: boolean;
  doctors?: Doctor[];
}

interface PolyclinicDetailsProps {
  polyclinic: Polyclinic;
  onBack: () => void;
  darkMode: boolean;
  showAddButton?: boolean;
}

interface ProductForDoctor {
  product_id: number;
  name: string;
  dosage: string;
  selling_price: number;
  count: number;
  total: number;
  total_product: number;
}

const ALL_MEDICINES = [
  "Paracetamol", "Ibuprofen", "Amoxicillin", "Ceftriaxone", "Azithromycin",
  "Metronidazole", "Omeprazole", "Aspirin", "Captopril", "Dexamethasone"
];

const PolyclinicDetails: React.FC<PolyclinicDetailsProps> = ({ 
  polyclinic, 
  onBack, 
  darkMode, 
  showAddButton = false 
}) => {
  // Initialize doctors array with empty array if undefined
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isAddMode, setIsAddMode] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    specialty: '',
    phone: '',
    medicine: '',
    schedule: '',
  });
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDoctorProducts, setSelectedDoctorProducts] = useState<any>(null);
  const [smsPanelOpen, setSmsPanelOpen] = useState(false);

  // Bottom sheet modal ochiq/berkitilganini boshqarish uchun
  const [showSheet, setShowSheet] = useState(false);
  const [showTransactionsTable, setShowTransactionsTable] = useState(false);

  // Add state for error handling
  const [addDoctorError, setAddDoctorError] = useState<string | null>(null);

  const openAddDoctorSheet = () => {
    setIsAddMode(true);
    setShowSheet(true);
  };

  const closeAddDoctorSheet = () => {
    setIsAddMode(false);
    setShowSheet(false);
    setNewDoctor({
      name: '',
      specialty: '',
      phone: '',
      medicine: '',
      schedule: '',
    });
    setAddDoctorError(null); // Clear error when closing
  };

  const handleToggleActive = (doctorId: number) => {
    if (!showAddButton) return; // Don't allow changes in view-only mode
    
    setDoctors(doctors.map(doctor => 
      doctor.id === doctorId 
        ? { ...doctor, is_active: !doctor.is_active }
        : doctor
    ));
  };

  // Bir nechta dori uchun state
  const [medicines, setMedicines] = useState<{ name: string; count: string }[]>([
    { name: '', count: '' }
  ]);
  // Qidiruv uchun state
  const [medicineSearch, setMedicineSearch] = useState<string[]>(['']);
  const [showMedicineDropdown, setShowMedicineDropdown] = useState<boolean[]>([false]);
  // Qidiruv uchun state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // Qidiruv natijasi uchun filter
  const filteredDoctors = searchQuery
    ? doctors.filter(
        d =>
          d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.phone.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : doctors;

  // Dori nomini tanlash
  const handleMedicineNameChange = (idx: number, value: string) => {
    const newMeds = [...medicines];
    newMeds[idx].name = value;
    setMedicines(newMeds);

    const newSearch = [...medicineSearch];
    newSearch[idx] = value;
    setMedicineSearch(newSearch);

    const newDropdown = [...showMedicineDropdown];
    newDropdown[idx] = true;
    setShowMedicineDropdown(newDropdown);
  };

  // Dori sonini kiritish
  const handleMedicineCountChange = (idx: number, value: string) => {
    const newMeds = [...medicines];
    newMeds[idx].count = value.replace(/\D/, ''); // faqat raqam
    setMedicines(newMeds);
  };

  // Dori tanlash (dropdowndan)
  const handleSelectMedicine = (idx: number, value: string) => {
    const newMeds = [...medicines];
    newMeds[idx].name = value;
    setMedicines(newMeds);

    const newDropdown = [...showMedicineDropdown];
    newDropdown[idx] = false;
    setShowMedicineDropdown(newDropdown);
  };

  // Yangi dori inputi qo'shish
  const handleAddMedicineInput = () => {
    setMedicines([...medicines, { name: '', count: '' }]);
    setMedicineSearch([...medicineSearch, '']);
    setShowMedicineDropdown([...showMedicineDropdown, false]);
  };

  // Dori inputini o'chirish (agar bittadan ko'p bo'lsa)
  const handleRemoveMedicineInput = (idx: number) => {
    if (medicines.length === 1) return;
    setMedicines(medicines.filter((_, i) => i !== idx));
    setMedicineSearch(medicineSearch.filter((_, i) => i !== idx));
    setShowMedicineDropdown(showMedicineDropdown.filter((_, i) => i !== idx));
  };

  // Add state for all products and selected products for doctor
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [doctorProducts, setDoctorProducts] = useState<ProductForDoctor[]>([]);
  // Product search states
  const [productSearch, setProductSearch] = useState('');
  const [editProductSearch, setEditProductSearch] = useState('');

  // Add state for pharmacies selection in add doctor modal
  const [allPharmacies, setAllPharmacies] = useState<any[]>([]);
  const [selectedPharmacies, setSelectedPharmacies] = useState<any[]>([]);

  // Add state for edit doctor pharmacies
  const [editSelectedPharmacies, setEditSelectedPharmacies] = useState<any[]>([]);

  // Calculate total for doctor products
  const doctorProductsTotal = doctorProducts.reduce((sum, p) => sum + p.total, 0);

  // Product count change handler
  const handleProductCountChange = (product_id: number, count: number) => {
    setDoctorProducts(prev =>
      prev.map(p =>
        p.product_id === product_id
          ? { 
              ...p, 
              count, 
              total: (p.selling_price || 0) * count,
              total_product: count // Update total_product along with count
            }
          : p
      )
    );
  };

  // Remove product from doctor
  const handleRemoveProductFromDoctor = (product_id: number) => {
    setDoctorProducts(prev => prev.filter(p => p.product_id !== product_id));
  };

  // Dori qo'shish tugmasini bosilganda
  const handleAddDoctor = async () => {
    setAddDoctorError(null);
    if (
      newDoctor.name &&
      newDoctor.specialty &&
      newDoctor.phone &&
      doctorProducts.length > 0 &&
      selectedPharmacies.length > 0
    ) {
      try {
        const token = localStorage.getItem('access');
        
        // First create the doctor
        const doctorRes = await fetch(
          import.meta.env.VITE_API_URL + '/polyclinic_doctors/',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              polyclinic: polyclinic.id,
              name: newDoctor.name,
              specialty: newDoctor.specialty,
              phone: newDoctor.phone,
              is_active: true,
              products: doctorProducts,
              pharmacy: selectedPharmacies
            })
          }
        );
        
        if (doctorRes.ok) {
          // Reset states and close modal
          fetchDoctors();
          closeAddDoctorSheet();
          setMedicines([{ name: '', count: '' }]);
          setMedicineSearch(['']);
          setShowMedicineDropdown([false]);
          setDoctorProducts([]);
          setSelectedPharmacies([]);
        } else {
          const errData = await doctorRes.json();
          setAddDoctorError(errData.error || 'Vrach qo\'shishda xatolik');
        }
      } catch (err) {
        setAddDoctorError('Vrach qo\'shishda xatolik');
        console.error('Vrach qo\'shishda xatolik:', err);
      }
    }
  };

  // Edit & Delete modal state
  const [editDoctor, setEditDoctor] = useState<Doctor | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; specialty: string; phone: string }>({ name: '', specialty: '', phone: '' });
  const [deleteDoctorId, setDeleteDoctorId] = useState<number | null>(null);

  // Edit doctor modal animatsiya uchun
  const [editModalVisible, setEditModalVisible] = useState(false);

  // Edit doctor modal uchun products state
  const [editDoctorProducts, setEditDoctorProducts] = useState<ProductForDoctor[]>([]);

  // Calculate total for edit doctor products
  const editDoctorProductsTotal = editDoctorProducts.reduce((sum, p) => sum + p.total, 0);

  // Edit doctor handler
  const handleEditDoctor = async (doctor: Doctor) => {
    setEditDoctor(doctor);
    setEditForm({ name: doctor.name, specialty: doctor.specialty, phone: doctor.phone });
    
    // Load doctor's products and pharmacies
    try {
      const token = localStorage.getItem('access');
      const response = await fetch(
        import.meta.env.VITE_API_URL + `/polyclinic_doctors/${doctor.id}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const doctorData = await response.json();
        console.log('Doctor data:', doctorData); // Debug uchun
        
        // API javobini tekshirib, products arrayini topish
        let productsArray = [];
        if (doctorData.products && Array.isArray(doctorData.products)) {
          productsArray = doctorData.products;
        } else if (Array.isArray(doctorData)) {
          productsArray = doctorData;
        } else if (doctorData.results && Array.isArray(doctorData.results)) {
          productsArray = doctorData.results;
        }
        
        // Products arrayini to'g'ri formatga o'tkazish
        const formattedProducts = productsArray.map((product: any) => ({
          product_id: product.product_id || product.id,
          name: product.name || '',
          dosage: product.dosage || '',
          selling_price: Number(product.selling_price) || 0,
          count: Number(product.count) || 1,
          total: Number(product.total) || (Number(product.selling_price) || 0) * (Number(product.count) || 1),
          total_product: Number(product.count) || 1,
        }));
        
        setEditDoctorProducts(formattedProducts);

        // Load doctor's pharmacies
        let pharmaciesArray = [];
        if (doctorData.pharmacy && Array.isArray(doctorData.pharmacy)) {
          pharmaciesArray = doctorData.pharmacy;
        } else if (doctorData.pharmacies && Array.isArray(doctorData.pharmacies)) {
          pharmaciesArray = doctorData.pharmacies;
        }
        
        setEditSelectedPharmacies(pharmaciesArray);
      } else {
        console.error('Vrach ma\'lumotlarini yuklashda xatolik:', response.status);
        setEditDoctorProducts([]);
        setEditSelectedPharmacies([]);
      }
    } catch (err) {
      console.error('Vrach mahsulotlarini yuklashda xatolik:', err);
      setEditDoctorProducts([]);
      setEditSelectedPharmacies([]);
    }
    
    setEditModalVisible(true);
  };

  // Edit doctor products handlers
  const handleEditAddProductToDoctor = (product: any) => {
    if (!editDoctorProducts.find(p => p.product_id === product.id)) {
      setEditDoctorProducts([
        ...editDoctorProducts,
        {
          product_id: product.id,
          name: product.name,
          dosage: product.dosage,
          selling_price: Number(product.selling_price) || 0,
          count: product.count || 1,
          total: Number(product.selling_price) || 0,
          total_product: product.count || 1,
        }
      ]);
    }
  };

  const handleEditProductCountChange = (product_id: number, count: number) => {
    setEditDoctorProducts(prev =>
      prev.map(p =>
        p.product_id === product_id
          ? { ...p, count, total: (p.selling_price || 0) * count, total_product: count }
          : p
      )
    );
  };

  const handleEditRemoveProductFromDoctor = (product_id: number) => {
    setEditDoctorProducts(prev => prev.filter(p => p.product_id !== product_id));
  };

  // Edit doctor pharmacy handlers
  const handleEditPharmacySelect = (pharmacy: any) => {
    if (editSelectedPharmacies.find((p: any) => p.id === pharmacy.id)) {
      setEditSelectedPharmacies(editSelectedPharmacies.filter((p: any) => p.id !== pharmacy.id));
    } else {
      setEditSelectedPharmacies([...editSelectedPharmacies, pharmacy]);
    }
  };

  // Save edit doctor
  const handleSaveEditDoctor = async () => {
    if (!editDoctor) return;
    
    try {
      const token = localStorage.getItem('access');
      const response = await fetch(
        import.meta.env.VITE_API_URL + `/polyclinic_doctors/${editDoctor.id}/`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            polyclinic: polyclinic.id,
            name: editForm.name,
            specialty: editForm.specialty,
            phone: editForm.phone,
            is_active: editDoctor.is_active,
            products: editDoctorProducts,
            pharmacy: editSelectedPharmacies // Add pharmacy data
          })
        }
      );
      
      if (response.ok) {
        // Muvaffaqiyatli yangilanganda vrachlar ro'yxatini yangilash
        fetchDoctors();
        handleCloseEditModal();
      } else {
        console.error('Vrachni yangilashda xatolik:', await response.text());
      }
    } catch (err) {
      console.error('Vrachni yangilashda xatolik:', err);
    }
  };

  // Delete doctor handler
  const handleDeleteDoctor = async (id: number) => {
    try {
      const token = localStorage.getItem('access');
      const response = await fetch(
        import.meta.env.VITE_API_URL + `/polyclinic_doctors/${id}/`,
        {
          method: 'PATCH', // Changed from DELETE to PATCH
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ archived: true }) // Add archived field
        }
      );
      
      if (response.ok) {
        // Remove from current list since we're only showing non-archived doctors
        setDoctors(doctors.filter(d => d.id !== id));
        setDeleteDoctorId(null);
        toast({
          title: "Muvaffaqiyatli",
          description: "Vrach arxivga ko'chirildi",
        });
      } else {
        console.error('Vrachni arxivlashda xatolik:', await response.text());
        toast({
          variant: "destructive",
          title: "Xatolik",
          description: "Vrachni arxivlashda xatolik yuz berdi",
        });
      }
    } catch (err) {
      console.error('Vrachni arxivlashda xatolik:', err);
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Vrachni arxivlashda xatolik yuz berdi",
      });
    }
  };

  // Fix: Reset edit state when closing modal
  const handleCloseEditModal = () => {
    setEditDoctor(null);
    setEditModalVisible(false);
    setEditDoctorProducts([]);
    setEditSelectedPharmacies([]);
    setEditForm({ name: '', specialty: '', phone: '' });
  };

  // Hide add button when doctor details drawer or add doctor sheet is open
  const showAddDoctorButton = showAddButton && !selectedDoctor && !showSheet;

  // Polyclinicga tegishli vrachlarni yuklash
  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('access');
      const res = await fetch(
        import.meta.env.VITE_API_URL + `/polyclinic_doctors/?polyclinic=${polyclinic.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setDoctors(Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Vrachlarni yuklashda xatolik:', err);
      setDoctors([]);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [polyclinic.id]);

  // Fetch all products for selection when add doctor modal opens
  useEffect(() => {
    if (showSheet || editModalVisible) {
      const fetchProducts = async () => {
        try {
          const token = localStorage.getItem('access');
          const res = await fetch(
            import.meta.env.VITE_API_URL + '/products/products/',
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const data = await res.json();
          setAllProducts(data.results || data);
        } catch (err) {
          setAllProducts([]);
        }
      };
      fetchProducts();
    }
  }, [showSheet, editModalVisible]);

  // Fetch all pharmacies when add doctor modal opens
  useEffect(() => {
    if (showSheet || editModalVisible) {
      const fetchPharmacies = async () => {
        try {
          const token = localStorage.getItem('access');
          const res = await fetch(
            import.meta.env.VITE_API_URL + '/pharmacy/pharmacies/',
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const data = await res.json();
          setAllPharmacies(data.results || data);
        } catch (err) {
          setAllPharmacies([]);
        }
      };
      fetchPharmacies();
    }
  }, [showSheet, editModalVisible]);

  // Handler for selecting pharmacies (multi-select)
  const handlePharmacySelect = (pharmacy: any) => {
    if (selectedPharmacies.find((p: any) => p.id === pharmacy.id)) {
      setSelectedPharmacies(selectedPharmacies.filter((p: any) => p.id !== pharmacy.id));
    } else {
      setSelectedPharmacies([...selectedPharmacies, pharmacy]);
    }
  };

  // Add state for pharmacy selection modal
  const [pharmacyModalOpen, setPharmacyModalOpen] = useState(false);
  const [tempSelectedPharmacies, setTempSelectedPharmacies] = useState<any[]>([]);

  // Add state for edit pharmacy selection modal
  const [editPharmacyModalOpen, setEditPharmacyModalOpen] = useState(false);
  const [editTempSelectedPharmacies, setEditTempSelectedPharmacies] = useState<any[]>([]);

  // Open pharmacy selection modal
  const openPharmacySelectModal = () => {
    setTempSelectedPharmacies(selectedPharmacies);
    setPharmacyModalOpen(true);
  };

  // Open edit pharmacy selection modal
  const openEditPharmacySelectModal = () => {
    setEditTempSelectedPharmacies(editSelectedPharmacies);
    setEditPharmacyModalOpen(true);
  };

  // Save selected pharmacies from modal
  const handleSavePharmacies = () => {
    setSelectedPharmacies(tempSelectedPharmacies);
    setPharmacyModalOpen(false);
  };

  // Save selected pharmacies from edit modal
  const handleSaveEditPharmacies = () => {
    setEditSelectedPharmacies(editTempSelectedPharmacies);
    setEditPharmacyModalOpen(false);
  };

  // Ensure handleAddProductToDoctor is defined before usage in Add Doctor Modal
  const handleAddProductToDoctor = (product: any) => {
    if (!doctorProducts.find(p => p.product_id === product.id)) {
      const defaultCount = 1;
      setDoctorProducts([
        ...doctorProducts,
        {
          product_id: product.id,
          name: product.name,
          dosage: product.dosage,
          selling_price: Number(product.selling_price) || 0,
          count: defaultCount,
          total: (Number(product.selling_price) || 0) * defaultCount,
          total_product: defaultCount // Initialize with same value as count
        }
      ]);
    }
  };

  const [activeProductKeyboard, setActiveProductKeyboard] = useState<number | null>(null);
  const [productKeyboardValue, setProductKeyboardValue] = useState<string>('');

  // Virtual keyboard component (fixed at bottom)
  const ProductVirtualKeyboard = ({
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
    <div className={`fixed left-0 right-0 bottom-0 z-[9999] grid grid-cols-3 gap-2 p-2 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-t-xl`}>
      <div className="col-span-3 mb-2 text-center text-lg font-bold">{value || '0'}</div>
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
      <button
        type="button"
        className={`col-span-3 py-2 rounded text-lg font-bold transition-colors duration-150 ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} hover:bg-blue-500 hover:text-white active:bg-blue-700`}
        onClick={() => onKey('0')}
      >
        0
    </button>
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

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header with animated search */}
      <div className={`px-4 py-4`}>
        <div className="flex items-center justify-between">
          {/* Orqaga qaytish tugmasi chapda */}
          <button onClick={onBack}>
            <ArrowLeft className="text-blue-500" size={24} />
          </button>
          <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{polyclinic.name}</h1>
          {/* Qidirish va statistika tugmalari o'ngda */}
          <div className="flex items-center gap-2">
            {/* <Button
              onClick={() => setShowTransactionsTable(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1"
              size="sm"
            >
              Статистика
            </Button> */}
            <button onClick={() => setIsSearchOpen(!isSearchOpen)}>
              <Search className="text-blue-500" size={24} />
            </button>
          </div>
        </div>
        {/* Animated Search Bar */}
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isSearchOpen ? 'max-h-16 opacity-100 mt-4' : 'max-h-0 opacity-0'
        }`}>
          <div className="relative">
            <Input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pr-10 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
              }`}
            />
            <button
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery('');
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <X className="text-gray-400" size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Doctors List - faqat ismi va mutaxassisligi, raqam bilan */}
      <div className={`mx-4 mt-4 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {doctors.length === 0 ? (
          <div className="p-8 text-center">
            <p className={`text-gray-500 ${darkMode ? 'text-gray-400' : ''}`}>
              Врачи не найдены
            </p>
          </div>
        ) : (
          (searchQuery ? filteredDoctors : doctors).map((doctor, idx) => (
            <div
              key={doctor.id}
              className={`p-4 border-b last:border-b-0 flex items-center justify-between space-x-4 cursor-pointer ${
                darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-100'
              }`}
              // Vrach ustiga bosganda to'liq ma'lumot
              onClick={async e => {
                // faqat tugmalar bosilmasa
                if ((e.target as HTMLElement).closest('.doctor-action-btn')) return;
                setSelectedDoctor(doctor);
                // Load doctor's products
                try {
                  const token = localStorage.getItem('access');
                  const response = await fetch(
                    import.meta.env.VITE_API_URL + `/polyclinic_doctors/${doctor.id}/`,
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                  
                  if (response.ok) {
                    const products = await response.json();
                    setSelectedDoctorProducts(products);
                  } else {
                    setSelectedDoctorProducts(null);
                  }
                } catch (err) {
                  console.error('Vrach mahsulotlarini yuklashda xatolik:', err);
                  setSelectedDoctorProducts(null);
                }
              }}
            >
              <div className="flex items-center space-x-4">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                  {idx + 1}
                </div>
                <div>
                  <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {doctor.name}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {doctor.specialty}
                  </div>
                </div>
              </div>
              {showAddButton && (
                <div className="flex items-center gap-2">
                  <button
                    className="doctor-action-btn p-2 rounded hover:bg-blue-100 dark:hover:bg-gray-700"
                    onClick={e => { e.stopPropagation(); handleEditDoctor(doctor); }}
                    title="O'zgartirish"
                  >
                    <Edit2 size={18} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
                  </button>
                  <button
                    className="doctor-action-btn p-2 rounded hover:bg-red-100 dark:hover:bg-gray-700"
                    onClick={e => { e.stopPropagation(); setDeleteDoctorId(doctor.id); }}
                    title="O'chirish"
                  >
                    <Trash2 size={18} className="text-red-500" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Drawer: Vrach ustiga bosilganda to'liq ma'lumotlar */}
      {selectedDoctor && (
        <div
          className={`fixed top-0 right-0 h-full w-full max-w-md z-50 shadow-2xl transition-transform duration-300 ${
            darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
          }`}
          style={{
            transform: 'translateX(0%)',
            borderLeft: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
          }}
        >
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="text-lg font-bold">Vrach ma'lumotlari</div>
            <div className="flex items-center gap-2">
              <button className="doctor-action-btn p-2 rounded hover:bg-blue-100 dark:hover:bg-gray-700" title="SMS yuborish" onClick={() => setSmsPanelOpen(true)}>
                <MessageSquare size={20} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
              </button>
              <button onClick={() => setSelectedDoctor(null)}>
                <X className="text-gray-400" size={28} />
              </button>
            </div>
          </div>
          <div className="p-4 pb-40 h-[calc(100vh-120px)] overflow-y-auto">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-xl font-bold text-white">
                  {selectedDoctor.name.charAt(0)}
                </div>
                <div>
                  <div className="text-lg font-semibold">{selectedDoctor.name}</div>
                  <div className="text-sm text-blue-400">{selectedDoctor.specialty}</div>
                </div>
              </div>
              <div className="border-t border-gray-300 dark:border-gray-700 my-2" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-500 dark:text-gray-400">Telefon:</span>
                  <span>{selectedDoctor.phone}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-500 dark:text-gray-400">Dorilar:</span>
                  <div className="mt-2">
                    {selectedDoctorProducts && selectedDoctorProducts.products && Array.isArray(selectedDoctorProducts.products) && selectedDoctorProducts.products.length > 0 ? (
                      <div className="space-y-2">
                        {selectedDoctorProducts.products.map((prod: any, idx: number) => (
                          <div key={prod.product_id + '-' + idx} className="flex items-center gap-2 ">
                            <span className="font-medium">{prod.name}</span>
                            <span className="text-gray-400">{prod.dosage}</span>
                            <span className="text-gray-400">{prod.count} dona</span>
                            <span className="text-gray-400">{Number(prod.total).toLocaleString()} сум</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">Dorilar yo'q</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedDoctor && (
        <>
          <div
            className={`fixed left-0 right-0 bottom-20 z-40 px-4 py-3 ${darkMode ? 'bg-gray-900' : 'bg-white'} border-t border-gray-200 dark:border-gray-700`}
            style={{ maxWidth: '28rem', margin: '0 auto' }}
          >
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Umumiy summa:</span>
              <span className="text-blue-500">{Number((selectedDoctorProducts && selectedDoctorProducts.total_amount) || 0).toLocaleString()} сум</span>
            </div>
            <div className="flex items-center justify-between text-sm font-semibold mt-1">
              <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Qarzi:</span>
              <span className="text-red-500">{Number((selectedDoctorProducts && selectedDoctorProducts.debt_amount) || 0).toLocaleString()} сум</span>
            </div>
          </div>
          <DoctorSMSPanel
            isOpen={smsPanelOpen}
            onClose={() => setSmsPanelOpen(false)}
            doctor={{ id: selectedDoctor.id, name: selectedDoctor.name, phone: selectedDoctor.phone }}
            darkMode={darkMode}
          />
        </>
      )}

      {/* Bottom Sheet Add Doctor Modal */}
      {showAddButton && (
        <div>
          {/* Overlay */}
          <div
            className={`fixed inset-0 z-40 transition-opacity duration-300 ${showSheet ? 'bg-black/40 pointer-events-auto opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={closeAddDoctorSheet}
            aria-hidden="true"
          />
          {/* Bottom Sheet */}
          <div
            className={`fixed left-0 right-0 bottom-0 z-50 transition-transform duration-300 ${showSheet ? 'translate-y-0' : 'translate-y-full'} ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-t-2xl shadow-lg`}
            style={{ maxWidth: 480, margin: '0 auto' }}
          >
            <div className="p-4 mb-7">
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Добавить врача
                </h3>
                <button onClick={closeAddDoctorSheet}>
                  <span className="text-2xl text-gray-400">&times;</span>
                </button>
              </div>
              {/* Show error message if exists */}
              {addDoctorError && (
                <div className="mb-3 p-2 rounded bg-red-100 text-red-700 text-sm border border-red-300">
                  {addDoctorError}
                </div>
              )}
              <div className="space-y-3">
                <Input
                  placeholder="Имя Фамилия"
                  value={newDoctor.name}
                  onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                  className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
                <Input
                  placeholder="Специальность"
                  value={newDoctor.specialty}
                  onChange={(e) => setNewDoctor({ ...newDoctor, specialty: e.target.value })}
                  className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
                <Input
                  placeholder="Телефон"
                  value={newDoctor.phone}
                  onChange={(e) => setNewDoctor({ ...newDoctor, phone: e.target.value })}
                  className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
                {/* Pharmacies multi-select */}
                <div>
                  <Label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2 block`}>
                    Aptekalarni tanlang
                  </Label>
                  <Button
                    variant="outline"
                    onClick={openPharmacySelectModal}
                    className="mb-2"
                  >
                    {selectedPharmacies.length > 0
                      ? `Tanlangan aptekalar: ${selectedPharmacies.map((p: any) => p.name).join(', ')}`
                      : "Aptekalarni tanlash"}
                  </Button>
                </div>
                {/* Products selection */}
                <div>
                  <Label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Dorilarni tanlang
                  </Label>
                  <div className="mb-2">
                    <Input
                      placeholder="Dori nomi bo'yicha qidirish..."
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                    />
                  </div>
                  <ScrollArea className="h-32 border rounded p-2">
                    <div className="space-y-2">
                      {allProducts
                        .filter((product) => {
                          const q = productSearch.toLowerCase().trim();
                          if (!q) return true;
                          return (
                            (product.name || '').toLowerCase().includes(q) ||
                            (product.dosage || '').toLowerCase().includes(q) ||
                            (product.manufacturer || '').toLowerCase().includes(q)
                          );
                        })
                        .map((product, idx) => (
                        <div
                          key={product.id}
                          onClick={() => handleAddProductToDoctor(product)}
                          className={`p-2 rounded cursor-pointer hover:bg-opacity-80 ${
                            doctorProducts.find(p => p.product_id === product.id)
                              ? 'bg-blue-100 dark:bg-blue-900'
                              : darkMode
                              ? 'bg-gray-700 hover:bg-gray-600'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">#{idx + 1}</span>
                            <div>
                              <div className="font-medium text-sm">{product.name}</div>
                              <div className="text-xs text-gray-500">{product.dosage} • {product.manufacturer}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                {/* Selected products */}
                <div>
                  <Label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2 block`}>
                    Tanlangan dorilar ({doctorProducts.length})
                  </Label>
                  <ScrollArea className="h-32 border rounded p-2">
                    {doctorProducts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Dori tanlanmagan
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {doctorProducts.map((p, idx) => (
                          <div key={p.product_id} className="flex items-center gap-2 border-b pb-2">
                            <span className="font-medium">{p.name}</span>
                            <span className="text-xs text-gray-400">{p.dosage}</span>
                            <Input
                              type="number"
                              value={p.count || ''}
                              onChange={e => handleProductCountChange(p.product_id, e.target.value ? parseInt(e.target.value) : null)}
                              className="w-16 h-8 mx-2"
                            />
                            <span className="text-xs text-gray-400">= {p.total.toLocaleString()} сум</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveProductFromDoctor(p.product_id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                        <div className="mt-2 text-right font-bold">
                          Umumiy: {doctorProductsTotal.toLocaleString()} сум
                        </div>
                      </div>
                    )}
                  </ScrollArea>
                </div>
                <div className="flex space-x-2 pt-2">
                  <Button onClick={handleAddDoctor} className="bg-blue-500 hover:bg-blue-600 flex-1">
                    Добавить
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={closeAddDoctorSheet}
                    className={darkMode ? 'border-gray-600 text-gray-300 flex-1' : 'flex-1'}
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Button - Only show if showAddButton is true */}
      {showAddDoctorButton && (
        <div className="fixed bottom-24 right-6 z-50">
          <Button 
            onClick={openAddDoctorSheet}
            className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg"
          >
            <Plus size={24} className="text-white" />
          </Button>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteDoctorId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className={`rounded-2xl shadow-2xl p-8 w-full max-w-sm ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} flex flex-col items-center`}>
            <div className="flex items-center justify-center mb-4">
              <Trash2 size={32} className="text-red-500" />
            </div>
            <div className="mb-4 text-center text-lg font-bold">Vrachni o'chirishni tasdiqlaysizmi?</div>
            <div className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Ushbu vrachni o'chirsangiz, uning barcha ma'lumotlari o'chiriladi. Davom etishni istaysizmi?
            </div>
            <div className="flex justify-center gap-4 w-full">
              <Button
                onClick={() => handleDeleteDoctor(deleteDoctorId)}
                className="bg-red-500 hover:bg-red-600 text-white flex-1 py-2 font-semibold rounded-lg"
              >
                <Check size={18} className="inline mr-2" /> Ha, o'chirish
              </Button>
              <Button
                variant="outline"
                onClick={() => setDeleteDoctorId(null)}
                className={`flex-1 py-2 font-semibold rounded-lg ${darkMode ? 'border-gray-600 text-gray-300' : ''}`}
              >
                <XIcon size={18} className="inline mr-2" /> Bekor qilish
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit doctor modal - bottom animated sheet */}
      {editDoctor && (
        <div>
          {/* Overlay */}
          <div
            className={`fixed inset-0 z-50 transition-opacity duration-300 ${editModalVisible ? 'bg-black/40 opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={handleCloseEditModal}
            aria-hidden="true"
          />
          {/* Bottom Sheet */}
          <div
            className={`fixed left-0 right-0 bottom-0 z-50 transition-transform duration-300 ${editModalVisible ? 'translate-y-0' : 'translate-y-full'} ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-t-2xl shadow-lg`}
            style={{ maxWidth: 480, margin: '0 auto' }}
          >
            <div className="p-6 mb-12">
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Vrachni o'zgartirish
                </h3>
                <button onClick={handleCloseEditModal}>
                  <span className="text-2xl text-gray-400">&times;</span>
                </button>
              </div>
              <div className="space-y-3">
                <Input
                  placeholder="Имя Фамилия"
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
                <Input
                  placeholder="Специальность"
                  value={editForm.specialty}
                  onChange={e => setEditForm(f => ({ ...f, specialty: e.target.value }))}
                  className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
                <Input
                  placeholder="Телефон"
                  value={editForm.phone}
                  onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
                {/* Edit Pharmacies multi-select */}
                <div>
                  <Label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2 block`}>
                    Aptekalarni tanlang
                  </Label>
                  <Button
                    variant="outline"
                    onClick={openEditPharmacySelectModal}
                    className="mb-2 w-full text-left justify-start"
                  >
                    {editSelectedPharmacies.length > 0
                      ? `Tanlangan aptekalar: ${editSelectedPharmacies.map((p: any) => p.name).join(', ')}`
                      : "Aptekalarni tanlash"}
                  </Button>
                </div>
                {/* Products selection for edit */}
                <div>
                  <Label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Dorilarni tanlang
                  </Label>
                  <div className="mb-2">
                    <Input
                      placeholder="Dori nomi bo'yicha qidirish..."
                      value={editProductSearch}
                      onChange={e => setEditProductSearch(e.target.value)}
                      className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                    />
                  </div>
                  <ScrollArea className="h-32 border rounded p-2">
                    <div className="space-y-2">
                      {allProducts
                        .filter((product) => {
                          const q = editProductSearch.toLowerCase().trim();
                          if (!q) return true;
                          return (
                            (product.name || '').toLowerCase().includes(q) ||
                            (product.dosage || '').toLowerCase().includes(q) ||
                            (product.manufacturer || '').toLowerCase().includes(q)
                          );
                        })
                        .map((product, idx) => (
                        <div
                          key={product.id}
                          onClick={() => handleEditAddProductToDoctor(product)}
                          className={`p-2 rounded cursor-pointer hover:bg-opacity-80 ${
                            editDoctorProducts.find(p => p.product_id === product.id)
                              ? 'bg-blue-100 dark:bg-blue-900'
                              : darkMode
                              ? 'bg-gray-700 hover:bg-gray-600'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">#{idx + 1}</span>
                            <div>
                              <div className="font-medium text-sm">{product.name}</div>
                              <div className="text-xs text-gray-500">{product.dosage} • {product.manufacturer}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                {/* Selected products for edit */}
                <div>
                  <Label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2 block`}>
                    Tanlangan dorilar ({editDoctorProducts.length})
                  </Label>
                  <ScrollArea className="h-32 border rounded p-2">
                    {editDoctorProducts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Dori tanlanmagan
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {editDoctorProducts.map((p, idx) => (
                          <div key={p.product_id} className="flex items-center gap-2 border-b pb-2">
                            <span className="font-medium">{p.name}</span>
                            <span className="text-xs text-gray-400">{p.dosage}</span>
                            <Input
                              type="number"
                              value={p.count || ""}
                              onChange={e => handleEditProductCountChange(p.product_id, parseInt(e.target.value) || 0)}
                              className="w-16 h-8 mx-2"
                            />
                            <span className="text-xs text-gray-400">x {p.selling_price} = {p.total.toLocaleString()} сум</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditRemoveProductFromDoctor(p.product_id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                        <div className="mt-2 text-right font-bold">
                          Umumiy: {editDoctorProductsTotal.toLocaleString()} сум
                        </div>
                      </div>
                    )}
                  </ScrollArea>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button onClick={handleSaveEditDoctor} className="bg-blue-500 hover:bg-blue-600 text-white">
                    Saqlash
                  </Button>
                  <Button variant="outline" onClick={handleCloseEditModal}>
                    Bekor qilish
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pharmacy selection modal */}
      {pharmacyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className={`rounded-2xl shadow-2xl p-8 w-full max-w-sm ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} flex flex-col`}>
            <div className="mb-4 text-lg font-bold text-center">Aptekalarni tanlang</div>
            <ScrollArea className="h-64 border rounded p-2 mb-4">
              <div className="space-y-2">
                {allPharmacies.map((pharmacy: any) => (
                  <div
                    key={pharmacy.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                      tempSelectedPharmacies.find((p: any) => p.id === pharmacy.id)
                        ? 'bg-blue-100 dark:bg-blue-900'
                        : darkMode
                        ? 'bg-gray-700 hover:bg-gray-600'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    onClick={() => {
                      if (tempSelectedPharmacies.find((p: any) => p.id === pharmacy.id)) {
                        setTempSelectedPharmacies(tempSelectedPharmacies.filter((p: any) => p.id !== pharmacy.id));
                      } else {
                        setTempSelectedPharmacies([...tempSelectedPharmacies, pharmacy]);
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!tempSelectedPharmacies.find((p: any) => p.id === pharmacy.id)}
                      readOnly
                      className="accent-blue-500"
                    />
                    <span className="font-medium">{pharmacy.name}</span>
                    <span className="text-xs text-gray-400">{pharmacy.address}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex gap-2">
              <Button
                onClick={handleSavePharmacies}
                className="bg-blue-500 hover:bg-blue-600 flex-1"
              >
                Saqlash
              </Button>
              <Button
                variant="outline"
                onClick={() => setPharmacyModalOpen(false)}
                className={darkMode ? 'border-gray-600 text-gray-300 flex-1' : 'flex-1'}
              >
                Bekor qilish
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Pharmacy selection modal */}
      {editPharmacyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className={`rounded-2xl shadow-2xl p-8 w-full max-w-sm ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} flex flex-col`}>
            <div className="mb-4 text-lg font-bold text-center">Aptekalarni tanlang</div>
            <ScrollArea className="h-64 border rounded p-2 mb-4">
              <div className="space-y-2">
                {allPharmacies.map((pharmacy: any) => (
                  <div
                    key={pharmacy.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                      editTempSelectedPharmacies.find((p: any) => p.id === pharmacy.id)
                        ? 'bg-blue-100 dark:bg-blue-900'
                        : darkMode
                        ? 'bg-gray-700 hover:bg-gray-600'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    onClick={() => {
                      if (editTempSelectedPharmacies.find((p: any) => p.id === pharmacy.id)) {
                        setEditTempSelectedPharmacies(editTempSelectedPharmacies.filter((p: any) => p.id !== pharmacy.id));
                      } else {
                        setEditTempSelectedPharmacies([...editTempSelectedPharmacies, pharmacy]);
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!editTempSelectedPharmacies.find((p: any) => p.id === pharmacy.id)}
                      readOnly
                      className="accent-blue-500"
                    />
                    <span className="font-medium">{pharmacy.name}</span>
                    <span className="text-xs text-gray-400">{pharmacy.address}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveEditPharmacies}
                className="bg-blue-500 hover:bg-blue-600 flex-1"
              >
                Saqlash
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditPharmacyModalOpen(false)}
                className={darkMode ? 'border-gray-600 text-gray-300 flex-1' : 'flex-1'}
              >
                Bekor qilish
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Render the virtual keyboard fixed at the bottom if active */}
      {activeProductKeyboard !== null && (
        <ProductVirtualKeyboard
          value={productKeyboardValue}
          onKey={key => {
            if (key === 'del') {
              setProductKeyboardValue(v => v.slice(0, -1));
            } else {
              setProductKeyboardValue(v => v + key);
            }
          }}
          onClose={() => {
            // Save value to product and close keyboard
            handleProductCountChange(activeProductKeyboard, productKeyboardValue ? parseInt(productKeyboardValue) : 0);
            setActiveProductKeyboard(null);
            setProductKeyboardValue('');
          }}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

export default PolyclinicDetails;
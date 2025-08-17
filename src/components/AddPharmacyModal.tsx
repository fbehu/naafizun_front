import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { regions, Region, District } from '@/data/regions';

interface AddPharmacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (pharmacy: { name: string; address: string; phone: string; district: string }) => void;
  darkMode: boolean;
}

const AddPharmacyModal: React.FC<AddPharmacyModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdd, 
  darkMode 
}) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (name && address && phone && selectedDistrict) {
      onAdd({ 
        name, 
        address, 
        phone, 
        district: `${selectedRegion?.name} - ${selectedDistrict.name}` 
      });
      setName('');
      setAddress('');
      setPhone('');
      setSelectedRegion(null);
      setSelectedDistrict(null);
      onClose();
    }
  };

  const handleRegionChange = (regionId: string) => {
    const region = regions.find(r => r.id === regionId);
    setSelectedRegion(region || null);
    setSelectedDistrict(null);
  };

  const handleDistrictChange = (districtId: string) => {
    if (selectedRegion) {
      const district = selectedRegion.districts.find(d => d.id === districtId);
      setSelectedDistrict(district || null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-12">
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[101] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} bg-black/40`}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Centered Modal, but higher up */}
      <div
        className={`relative z-[105] w-full max-w-full rounded-2xl shadow-lg transition-transform transition-opacity duration-500
          ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
          ${darkMode ? 'bg-gray-800' : 'bg-white'} 
          max-h-[80vh] overflow-hidden `}
        style={{ transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)' }}
      >
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-6"></div>
        <div className="p-5 pb-10 max-h-[80vh] overflow-y-auto">
          <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-black'}`}>
            Apteka Qo'shish
          </h3>
          <div className="space-y-4">
            {/* Region select */}
            <select
              value={selectedRegion?.id || ''}
              onChange={e => handleRegionChange(e.target.value)}
              className={`w-full rounded-md border px-3 py-3 focus:outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}
              required
            >
              <option value="">Viloyatni tanlang</option>
              {regions.map(region => (
                <option key={region.id} value={region.id}>{region.name}</option>
              ))}
            </select>

            {/* District select */}
            <select
              value={selectedDistrict?.id || ''}
              onChange={e => handleDistrictChange(e.target.value)}
              className={`w-full rounded-md border px-3 py-3 focus:outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}
              disabled={!selectedRegion}
              required
            >
              <option value="">Tumanni tanlang</option>
              {selectedRegion?.districts.map(district => (
                <option key={district.id} value={district.id}>{district.name}</option>
              ))}
            </select>

            <Input
              ref={nameInputRef}
              type="text"
              placeholder="Apteka nomi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full p-4 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
              }`}
            />
            <Input
              type="text"
              placeholder="Manzil"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={`w-full p-4 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
              }`}
            />
            <Input
              type="text"
              placeholder="Telefon"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`w-full p-4 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
          <Button 
            onClick={handleSubmit}
            className="w-full mt-6 bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-lg font-medium"
          >
            Qo'shish
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddPharmacyModal;
// export default AddPharmacyModal;

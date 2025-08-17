import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { regions, Region, District } from '@/data/regions';
import { useKeyboardAdjustment } from '@/hooks/useKeyboardAdjustment';

interface AddPolyclinicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (polyclinic: { name: string; address: string; district: string }) => void;
  darkMode: boolean;
}

const AddPolyclinicModal: React.FC<AddPolyclinicModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdd, 
  darkMode 
}) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const { scrollInputIntoView } = useKeyboardAdjustment();
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (name && address && selectedDistrict) {
      onAdd({ 
        name, 
        address, 
        district: `${selectedRegion?.name} - ${selectedDistrict.name}` 
      });
      setName('');
      setAddress('');
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
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16">
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[101] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} bg-black/40`}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Top Slide Modal */}
      <div
        className={`relative z-[102] w-full max-w-md rounded-2xl shadow-lg transition-transform transition-opacity duration-500
          ${isOpen ? 'translate-y-0 opacity-100' : '-translate-y-32 opacity-0'}
          ${darkMode ? 'bg-gray-800' : 'bg-white'} 
          max-h-[80vh] overflow-hidden`}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div className="p-6 pb-10 max-h-[120vh] overflow-y-auto w-full">
          <h3 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-black'}`}>
            Poliklinika Qo'shish
          </h3>
          <div className="space-y-4 w-full max-w-sm">
            {/* Region select */}
            <select
              value={selectedRegion?.id || ''}
              onChange={e => handleRegionChange(e.target.value)}
              className={`w-full rounded-md border px-3 py-3 focus:outline-none text-base ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}
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
              className={`w-full rounded-md border px-3 py-3 focus:outline-none text-base ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}
              disabled={!selectedRegion}
              required
            >
              <option value="">Tumanni tanlang</option>
              {selectedRegion?.districts.map(district => (
                <option key={district.id} value={district.id}>{district.name}</option>
              ))}
            </select>

            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                Poliklinika nomi
              </label>
              <Input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Poliklinika nomini kiriting"
                className={`w-full p-4 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                Manzil
              </label>
              <Input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Manzilni kiriting"
                className={`w-full p-4 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
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

export default AddPolyclinicModal;
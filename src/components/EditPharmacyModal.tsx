import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { regions, Region, District } from "@/data/regions";

interface EditPharmacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (data: {
    name: string;
    address: string;
    phone: string;
    region: string;
    district: string;
  }) => void;
  darkMode: boolean;
  editData: any;
}

const EditPharmacyModal: React.FC<EditPharmacyModalProps> = ({
  isOpen,
  onClose,
  onEdit,
  darkMode,
  editData,
}) => {
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);

  useEffect(() => {
    if (editData) {
      // Parse manager field which might contain "Region - District" format
      const managerParts = editData.manager?.split(' - ') || [];
      
      if (managerParts.length >= 2) {
        const regionName = managerParts[0];
        const districtName = managerParts[1];
        
        // Find the region by name
        const foundRegion = regions.find(r => r.name.includes(regionName));
        if (foundRegion) {
          setSelectedRegion(foundRegion);
          
          // Find the district within that region
          const foundDistrict = foundRegion.districts.find(d => d.name === districtName);
          if (foundDistrict) {
            setSelectedDistrict(foundDistrict);
          }
        }
      } else {
        // If manager doesn't contain proper format, try to find by district name only
        const districtName = editData.manager;
        for (const region of regions) {
          const foundDistrict = region.districts.find(d => d.name === districtName);
          if (foundDistrict) {
            setSelectedRegion(region);
            setSelectedDistrict(foundDistrict);
            break;
          }
        }
      }
    }
  }, [editData]);

  const handleRegionChange = (regionId: string) => {
    const foundRegion = regions.find(r => r.id === regionId);
    setSelectedRegion(foundRegion || null);
    setSelectedDistrict(null); // Reset district when region changes
  };

  const handleDistrictChange = (districtId: string) => {
    if (selectedRegion) {
      const foundDistrict = selectedRegion.districts.find(d => d.id === districtId);
      setSelectedDistrict(foundDistrict || null);
    }
  };

  if (!isOpen || !editData) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40"
      style={{ animation: "fadeIn 0.2s" }}
    >
      <div
        className={`rounded-lg shadow-lg w-full max-w-md mx-auto ${
          darkMode
            ? "bg-gray-800 border border-gray-700"
            : "bg-white border border-gray-200"
        } animate-slideDown`}
        style={{ animation: "slideDown 0.3s" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2
            className={`text-lg font-semibold ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Aptekani tahrirlash
          </h2>
          <button className="p-1" onClick={onClose}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <form
          className="px-6 py-6 space-y-4"
          onSubmit={e => {
            e.preventDefault();
            const form = e.target as typeof e.target & {
              name: { value: string };
              address: { value: string };
              phone: { value: string };
            };
            onEdit({
              name: form.name.value,
              address: form.address.value,
              phone: form.phone.value,
              region: selectedRegion?.name || "",
              district: `${selectedRegion?.name || ""} - ${selectedDistrict?.name || ""}`,
            });
          }}
        >
          <div>
            <label className={`block mb-1 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Viloyat</label>
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
          </div>
          <div>
            <label className={`block mb-1 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Tuman</label>
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
          </div>
          <div>
            <label className={`block mb-1 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Nomi</label>
            <Input name="name" defaultValue={editData.name} />
          </div>
          <div>
            <label className={`block mb-1 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Manzil</label>
            <Input name="address" defaultValue={editData.address} />
          </div>
          <div>
            <label className={`block mb-1 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Telefon</label>
            <Input name="phone" defaultValue={editData.phone} />
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white">
              Saqlash
            </Button>
          </div>
        </form>
      </div>
      <style>
        {`
          @keyframes slideDown {
            from { transform: translateY(-40px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

export default EditPharmacyModal;
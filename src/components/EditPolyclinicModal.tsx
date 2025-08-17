import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { regions } from "@/data/regions";

interface Polyclinic {
  id: number;
  name: string;
  address: string;
  phone: string;
  manager: string;
  archived: boolean;
}

interface EditPolyclinicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, data: { name: string; address: string; district: string; phone: string }) => void;
  polyclinic: Polyclinic | null;
  darkMode?: boolean;
}

const EditPolyclinicModal: React.FC<EditPolyclinicModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
  polyclinic,
  darkMode = false,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    selectedRegion: "",
    selectedDistrict: "",
  });

  useEffect(() => {
    if (polyclinic) {
      // Parse manager field to extract region and district
      const managerParts = polyclinic.manager.split(" - ");
      const regionName = managerParts[0] || "";
      const districtName = managerParts[1] || "";
      
      const region = regions.find(r => r.name === regionName);
      const district = region?.districts.find(d => d.name === districtName);

      setFormData({
        name: polyclinic.name,
        address: polyclinic.address,
        phone: polyclinic.phone || "",
        selectedRegion: region?.id || "",
        selectedDistrict: district?.id || "",
      });
    }
  }, [polyclinic]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!polyclinic) return;

    const region = regions.find((r) => r.id === formData.selectedRegion);
    const district = region?.districts.find((d) => d.id === formData.selectedDistrict);
    
    if (!region || !district) return;

    const districtName = `${region.name} - ${district.name}`;
    
    onUpdate(polyclinic.id, {
      name: formData.name,
      address: formData.address,
      district: districtName,
      phone: formData.phone,
    });
    onClose();
  };

  const selectedRegion = regions.find((r) => r.id === formData.selectedRegion);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`sm:max-w-md ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
        <DialogHeader>
          <DialogTitle className={darkMode ? 'text-white' : 'text-gray-900'}>
            Poliklinikani tahrirlash
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className={darkMode ? 'text-gray-200' : 'text-gray-700'}>
              Poliklinika nomi
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
            />
          </div>
          
          <div>
            <Label htmlFor="address" className={darkMode ? 'text-gray-200' : 'text-gray-700'}>
              Manzil
            </Label>
            <Input
              id="address"
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
            />
          </div>

          <div>
            <Label htmlFor="phone" className={darkMode ? 'text-gray-200' : 'text-gray-700'}>
              Telefon
            </Label>
            <Input
              id="phone"
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
            />
          </div>

          <div>
            <Label htmlFor="region" className={darkMode ? 'text-gray-200' : 'text-gray-700'}>
              Viloyat
            </Label>
            <select
              id="region"
              value={formData.selectedRegion}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  selectedRegion: e.target.value,
                  selectedDistrict: "",
                });
              }}
              required
              className={`w-full rounded-md border px-3 py-2 focus:outline-none ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
            >
              <option value="">Viloyatni tanlang</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>

          {selectedRegion && (
            <div>
              <Label htmlFor="district" className={darkMode ? 'text-gray-200' : 'text-gray-700'}>
                Tuman
              </Label>
              <select
                id="district"
                value={formData.selectedDistrict}
                onChange={(e) => setFormData({ ...formData, selectedDistrict: e.target.value })}
                required
                className={`w-full rounded-md border px-3 py-2 focus:outline-none ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="">Tumanni tanlang</option>
                {selectedRegion.districts.map((district) => (
                  <option key={district.id} value={district.id}>
                    {district.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Bekor qilish
            </Button>
            <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white">
              Saqlash
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPolyclinicModal;
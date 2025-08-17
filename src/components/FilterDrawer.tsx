import React, { useState, useMemo } from 'react';
import { MoreVertical, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerFooter } from '@/components/ui/drawer';
import { regions, District } from '@/data/regions';

// Minimal clinic shape for cascading select
interface Clinic {
  id: number;
  name: string;
  manager?: string; // used as district code in current API
}

export type DebtMode = 'all' | 'hasDebt' | 'noDebt';

interface DebtFilter {
  mode: DebtMode;
}

interface FilterPayload {
  regionId: string;
  districtId: string;
  clinicId: number | null;
  debt: DebtFilter;
}

interface FilterDrawerProps {
  darkMode: boolean;
  clinics: Clinic[];
  onFilterApply: (payload: FilterPayload) => void;
}

const FilterDrawer: React.FC<FilterDrawerProps> = ({ darkMode, clinics, onFilterApply }) => {
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedClinicId, setSelectedClinicId] = useState<number | null>(null);
  const [availableDistricts, setAvailableDistricts] = useState<District[]>([]);
  const [debtMode, setDebtMode] = useState<DebtMode>('all');
  const [isOpen, setIsOpen] = useState(false);

  const availableClinics = useMemo(() => {
    if (!selectedDistrict) return [] as Clinic[];
    const d = selectedDistrict.toLowerCase();
    return (clinics || []).filter(c => (c.manager || '').toLowerCase().includes(d));
  }, [clinics, selectedDistrict]);

  const handleRegionChange = (regionId: string) => {
    setSelectedRegion(regionId);
    setSelectedDistrict('');
    setSelectedClinicId(null);

    const region = regions.find(r => r.id === regionId);
    setAvailableDistricts(region?.districts || []);
  };

  const handleApplyFilter = () => {
    onFilterApply({
      regionId: selectedRegion,
      districtId: selectedDistrict,
      clinicId: selectedClinicId,
      debt: { mode: debtMode },
    });
    setIsOpen(false);
  };

  const handleClearFilter = () => {
    setSelectedRegion('');
    setSelectedDistrict('');
    setSelectedClinicId(null);
    setAvailableDistricts([]);
    setDebtMode('all');
    onFilterApply({ regionId: '', districtId: '', clinicId: null, debt: { mode: 'all' } });
    setIsOpen(false);
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-8 h-8 p-0 rounded-full bg-blue-500 hover:bg-blue-600"
        >
          <MoreVertical className="w-4 h-4 text-white" />
        </Button>
      </DrawerTrigger>
      
      <DrawerContent className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} max-h-[80vh]`}>
        <DrawerHeader>
          <DrawerTitle className={`flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <Filter className="w-5 h-5" />
            Filtr
          </DrawerTitle>
        </DrawerHeader>
        
        <div className="px-4 pb-4 space-y-4">
          {/* Region */}
          <div className="space-y-2">
            <Label className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
              Viloyat
            </Label>
            <Select value={selectedRegion} onValueChange={handleRegionChange}>
              <SelectTrigger className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                <SelectValue placeholder="Viloyatni tanlang" />
              </SelectTrigger>
              <SelectContent className={darkMode ? 'bg-gray-700 border-gray-600' : ''}>
                {regions.map((region) => (
                  <SelectItem 
                    key={region.id} 
                    value={region.id}
                    className={darkMode ? 'text-white hover:bg-gray-600' : ''}
                  >
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* District */}
          <div className="space-y-2">
            <Label className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
              Tuman
            </Label>
            <Select 
              value={selectedDistrict} 
              onValueChange={(v) => { setSelectedDistrict(v); setSelectedClinicId(null); }}
              disabled={!selectedRegion}
            >
              <SelectTrigger className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                <SelectValue placeholder="Tumanni tanlang" />
              </SelectTrigger>
              <SelectContent className={darkMode ? 'bg-gray-700 border-gray-600' : ''}>
                {availableDistricts.map((district) => (
                  <SelectItem 
                    key={district.id} 
                    value={district.id}
                    className={darkMode ? 'text-white hover:bg-gray-600' : ''}
                  >
                    {district.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Debt filter */}
          <div className="space-y-2">
            <Label className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
              Qarz holati
            </Label>
            <Select value={debtMode} onValueChange={(v: DebtMode) => setDebtMode(v)}>
              <SelectTrigger className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                <SelectValue placeholder="Tanlang" />
              </SelectTrigger>
              <SelectContent className={darkMode ? 'bg-gray-700 border-gray-600' : ''}>
                <SelectItem value="all" className={darkMode ? 'text-white hover:bg-gray-600' : ''}>Hammasi</SelectItem>
                <SelectItem value="hasDebt" className={darkMode ? 'text-white hover:bg-gray-600' : ''}>Faqat qarzi bor</SelectItem>
                <SelectItem value="noDebt" className={darkMode ? 'text-white hover:bg-gray-600' : ''}>Faqat qarzi yo'q</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DrawerFooter className="flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={handleClearFilter}
            className={`flex-1 ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}`}
          >
            Tozalash
          </Button>
          <Button 
            onClick={handleApplyFilter}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
          >
            Filtrni qo'llash
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default FilterDrawer;
import React, { useState, useMemo } from "react";
import { Search, X, MapPin, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { regions, Region, District } from "@/data/regions";
import BottomNavigation from "@/components/BottomNavigation";
import { useNavigate } from "react-router-dom";

const RegionsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  
  const navigate = useNavigate();
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const filteredRegions = useMemo(() => {
    if (!searchQuery) return regions;
    
    const query = searchQuery.toLowerCase();
    return regions.filter(region => 
      region.name.toLowerCase().includes(query) ||
      region.districts.some(district => 
        district.name.toLowerCase().includes(query)
      )
    );
  }, [searchQuery]);

  const toggleRegionExpansion = (regionId: string) => {
    setExpandedRegions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(regionId)) {
        newSet.delete(regionId);
      } else {
        newSet.add(regionId);
      }
      return newSet;
    });
  };

  const getTotalDistrictsCount = () => {
    return regions.reduce((total, region) => total + region.districts.length, 0);
  };

  const getFilteredDistrictsCount = () => {
    return filteredRegions.reduce((total, region) => total + region.districts.length, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16">
      {/* Header */}
      <div className="p-4 shadow-sm bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Viloyat va Tumanlar
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredRegions.length} viloyat, {getFilteredDistrictsCount()} tuman
            </p>
          </div>
          <button onClick={() => setIsSearchOpen((s) => !s)}>
            <Search className="text-blue-500" size={24} />
          </button>
        </div>
        
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isSearchOpen ? "max-h-16 opacity-100 mt-4" : "max-h-0 opacity-0"
          }`}
        >
          <div className="relative">
            <Input
              type="text"
              placeholder="Viloyat yoki tuman qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="text-gray-400" size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="p-4 grid grid-cols-2 gap-4">
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {filteredRegions.length}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              Viloyatlar
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {getFilteredDistrictsCount()}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">
              Tumanlar
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regions List */}
      <div className="px-4 pb-8">
        {filteredRegions.length > 0 ? (
          <div className="space-y-3">
            {filteredRegions.map((region) => {
              const isExpanded = expandedRegions.has(region.id);
              const filteredDistricts = searchQuery 
                ? region.districts.filter(district => 
                    district.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                : region.districts;

              return (
                <Card
                  key={region.id}
                  className="overflow-hidden bg-white dark:bg-gray-800 dark:border-gray-700"
                >
                  <CardContent className="p-0">
                    {/* Region Header */}
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => toggleRegionExpansion(region.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {region.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {region.districts.length} tuman
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {filteredDistricts.length}
                          </Badge>
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Districts List */}
                    {isExpanded && (
                      <div className="border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                        <div className="p-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {filteredDistricts.map((district) => (
                              <button
                                key={district.id}
                                onClick={() => {
                                  setSelectedRegion(region);
                                  setSelectedDistrict(district);
                                }}
                                className="p-3 text-left rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-200 dark:hover:border-blue-700 transition-colors"
                              >
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {district.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {region.name}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Hech qanday viloyat yoki tuman topilmadi
            </p>
          </div>
        )}
      </div>

      {/* Selected District Info Modal */}
      {selectedDistrict && selectedRegion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {selectedDistrict.name}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {selectedRegion.name}
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedDistrict(null);
                      setSelectedRegion(null);
                    }}
                  >
                    Yopish
                  </Button>
                  <Button
                    onClick={() => {
                      // Bu yerda tuman ma'lumotlarini boshqa sahifaga jo'natish mumkin
                      console.log('Selected:', selectedRegion.name, selectedDistrict.name);
                      setSelectedDistrict(null);
                      setSelectedRegion(null);
                    }}
                  >
                    Tanlash
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <BottomNavigation 
        currentView="dashboard"
        onNavigation={(tab) => {
          if (tab === 'dashboard') navigate('/dashboard');
          else if (tab === 'sklad') navigate('/sklad');
          else if (tab === 'control') navigate('/ostatka');
          else if (tab === 'settings') navigate('/settings');
        }}
        darkMode={isDark}
      />
    </div>
  );
};

export default RegionsPage;
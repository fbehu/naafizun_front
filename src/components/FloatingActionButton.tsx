
import React, { useState } from 'react';
import { Plus, Building, Hospital } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingActionButtonProps {
  darkMode: boolean;
  onAddPharmacy: () => void;
  onAddPolyclinic: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ 
  darkMode, 
  onAddPharmacy, 
  onAddPolyclinic 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-20 right-4 z-40">
      {/* Action buttons */}
      <div className={`flex flex-col gap-2 mb-3 transition-all duration-300 ${
        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        <Button
          onClick={() => {
            onAddPharmacy();
            setIsOpen(false);
          }}
          className={`w-14 h-14 rounded-full shadow-lg ${
            darkMode 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          <Building className="h-6 w-6" />
        </Button>
        <Button
          onClick={() => {
            onAddPolyclinic();
            setIsOpen(false);
          }}
          className={`w-14 h-14 rounded-full shadow-lg ${
            darkMode 
              ? 'bg-purple-600 hover:bg-purple-700 text-white' 
              : 'bg-purple-500 hover:bg-purple-600 text-white'
          }`}
        >
          <Hospital className="h-6 w-6" />
        </Button>
      </div>

      {/* Main button */}
      <Button
        onClick={handleToggle}
        className={`w-16 h-16 rounded-full shadow-lg transition-transform duration-300 ${
          isOpen ? 'rotate-45' : 'rotate-0'
        } ${
          darkMode 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        <Plus className="h-8 w-8" />
      </Button>
    </div>
  );
};

export default FloatingActionButton;

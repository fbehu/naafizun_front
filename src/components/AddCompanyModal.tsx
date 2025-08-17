import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface AddCompanyForm {
  name: string;
  ownerName: string;
  phone: string;
  address: string;
}

interface AddCompanyModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: AddCompanyForm) => void;
  darkMode?: boolean;
}

const AddCompanyModal: React.FC<AddCompanyModalProps> = ({ open, onClose, onSave, darkMode }) => {
  const [form, setForm] = useState<AddCompanyForm>({ name: "", ownerName: "", phone: "", address: "" });

  useEffect(() => {
    if (!open) setForm({ name: "", ownerName: "", phone: "", address: "" });
  }, [open]);

  const handleChange = (field: keyof AddCompanyForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({ ...form });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className={darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}>
        <DialogHeader>
          <DialogTitle className={darkMode ? "text-white" : "text-gray-900"}>Kompaniya qo'shish</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className={darkMode ? "text-gray-300" : "text-gray-700"}>Kompaniya nomi</Label>
            <Input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
              placeholder="Masalan: Star Farm"
              className={darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : ""}
            />
          </div>
          <div>
            <Label className={darkMode ? "text-gray-300" : "text-gray-700"}>Egasining ismi</Label>
            <Input
              value={form.ownerName}
              onChange={(e) => handleChange("ownerName", e.target.value)}
              placeholder="Ism Familiya"
              className={darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : ""}
            />
          </div>
          <div>
            <Label className={darkMode ? "text-gray-300" : "text-gray-700"}>Telefon raqami</Label>
            <Input
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="+998901234567"
              className={darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : ""}
            />
          </div>
          <div>
            <Label className={darkMode ? "text-gray-300" : "text-gray-700"}>Manzili</Label>
            <Input
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Viloyat, tuman, ko'cha"
              className={darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : ""}
            />
          </div>
          <Button type="submit" className="w-full">Saqlash</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCompanyModal;

import React, { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
import useCompanies from "@/hooks/use-companies";

interface SkladAddProductSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (medicineData: {
    name: string;
    type: string; // 'pachka' | 'dona'
    dosage: string;
    packagesCount: string; // if dona -> equals total pills
    pillsPerPackage: string; // if dona -> "1"
    totalPills: number;
    company?: string;
    pricePerUnit: string;
    purchasePrice: string; // per pill
    sellingPrice: string; // per pill
    composition?: string;
  }) => void;
  darkMode: boolean;
  selectedCompany: string; // 'all' or a company name
}

const SkladAddProductSheet: React.FC<SkladAddProductSheetProps> = ({
  open,
  onOpenChange,
  onAdd,
  darkMode,
  selectedCompany,
}) => {
  const { companies } = useCompanies();

  const [name, setName] = useState("");
  const [type, setType] = useState<"pachka" | "dona">("dona");
  const [dosage, setDosage] = useState("");

  // Quantities
  const [packagesCount, setPackagesCount] = useState("");
  const [pillsPerPackage, setPillsPerPackage] = useState("");
  const [donaCount, setDonaCount] = useState("");

  // Prices (per pill)
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");

  // Company selection (only used when selectedCompany === 'all')
  const [company, setCompany] = useState("");

  const totalPills = useMemo(() => {
    if (type === "pachka") {
      return (Number(packagesCount || 0) * Number(pillsPerPackage || 0)) || 0;
    }
    return Number(donaCount || 0) || 0;
  }, [type, packagesCount, pillsPerPackage, donaCount]);

  const totalPurchase = useMemo(() => {
    const price = Number(purchasePrice || 0);
    return totalPills * price;
  }, [totalPills, purchasePrice]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalCompany = selectedCompany !== "all" ? selectedCompany : company;
    if (!finalCompany) return; // must choose a company when 'all'

    const payload = {
      name,
      type,
      dosage,
      packagesCount: type === "pachka" ? (packagesCount || "0") : (donaCount || "0"),
      pillsPerPackage: type === "pachka" ? (pillsPerPackage || "1") : "1",
      totalPills,
      company: finalCompany,
      pricePerUnit: purchasePrice || "0",
      purchasePrice: purchasePrice || "0",
      sellingPrice: sellingPrice || "0"
    };

    onAdd(payload);

    // Reset most fields but keep selected company choice
    setName("");
    setDosage("");
    setPackagesCount("");
    setPillsPerPackage("");
    setDonaCount("");
    setPurchasePrice("");
    setSellingPrice("");
    // Preserve 'company' so user doesn't need to reselect
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={`${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } max-h-[90vh] overflow-y-auto transition-all duration-700`}
      >
        <SheetHeader>
          <SheetTitle className={`${darkMode ? "text-white" : "text-gray-900"} text-center`}>
            Dori qo'shish
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          <div>
            <Label className={darkMode ? "text-gray-300" : "text-gray-700"}>Dori nomi</Label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: Paracetamol"
              className={darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : ""}
            />
          </div>


          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className={darkMode ? "text-gray-300" : "text-gray-700"}>Dori turi</Label>
              <Select value={type} onValueChange={(v) => setType(v as any)}>
                <SelectTrigger className={darkMode ? "bg-gray-700 border-gray-600 text-white" : ""}>
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent className={darkMode ? "bg-gray-800 text-white" : "bg-white"}>
                  <SelectItem value="pachka">Pachka</SelectItem>
                  <SelectItem value="dona">Dona</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className={darkMode ? "text-gray-300" : "text-gray-700"}>Dozasi</Label>
              <Input
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="Masalan: 500mg"
                className={darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : ""}
              />
            </div>
          </div>

          {selectedCompany === "all" ? (
            <div>
              <Label className={darkMode ? "text-gray-300" : "text-gray-700"}>Kompaniya</Label>
              <Select value={company} onValueChange={setCompany}>
                <SelectTrigger className={darkMode ? "bg-gray-700 border-gray-600 text-white" : ""}>
                  <SelectValue placeholder="Kompaniya tanlang" />
                </SelectTrigger>
                <SelectContent className={darkMode ? "bg-gray-800 text-white" : "bg-white"}>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div>
              <Label className={darkMode ? "text-gray-300" : "text-gray-700"}>Kompaniya</Label>
              <Input value={selectedCompany} readOnly className={darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100"} />
            </div>
          )}

          {type === "pachka" ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className={darkMode ? "text-gray-300" : "text-gray-700"}>Pachkalar soni</Label>
                <Input
                  type="number"
                  min="0"
                  value={packagesCount}
                  onChange={(e) => setPackagesCount(e.target.value)}
                  placeholder="Masalan: 10"
                  className={darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : ""}
                />
              </div>
              <div>
                <Label className={darkMode ? "text-gray-300" : "text-gray-700"}>1 pachkada nechta dona</Label>
                <Input
                  type="number"
                  min="1"
                  value={pillsPerPackage}
                  onChange={(e) => setPillsPerPackage(e.target.value)}
                  placeholder="Masalan: 10"
                  className={darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : ""}
                />
              </div>
            </div>
          ) : (
            <div>
              <Label className={darkMode ? "text-gray-300" : "text-gray-700"}>Necha dona</Label>
              <Input
                type="number"
                min="0"
                value={donaCount}
                onChange={(e) => setDonaCount(e.target.value)}
                placeholder="Masalan: 100"
                className={darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : ""}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className={darkMode ? "text-gray-300" : "text-gray-700"}>1 dona kirib kelish narxi</Label>
              <Input
                type="number"
                min="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="Masalan: 1000"
                className={darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : ""}
              />
            </div>
            <div>
              <Label className={darkMode ? "text-gray-300" : "text-gray-700"}>1 dona sotish narxi</Label>
              <Input
                type="number"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="Masalan: 1500"
                className={darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : ""}
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className={darkMode ? "text-gray-300" : "text-gray-700"}>Umumiy kirib kelish narxi</span>
            <span className={`font-semibold ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
              {new Intl.NumberFormat("uz-UZ").format(totalPurchase)}
            </span>
          </div>

          <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white">
            Qo'shish
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default SkladAddProductSheet;

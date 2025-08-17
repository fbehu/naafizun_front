import { useEffect, useState } from "react";

export type Company = {
  id: number;
  name: string;
  ownerName?: string;
  phone?: string;
  address?: string;
};

export default function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("access");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/company/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch companies");
      }
      
      const data = await response.json();
      setCompanies(data.results.map((company: any) => ({
        id: company.id,
        name: company.name || "Unnamed Company", // Fallback for missing name
        ownerName: company.ownerName,
        phone: company.phone,
        address: company.address,
      })) || []);
    } catch (err) {
      console.error("Error fetching companies:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const addCompany = async (company: Omit<Company, "id">) => {
    try {
      const token = localStorage.getItem("access");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/company/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: company.name,
          owner_name: company.ownerName || "",
          phone: company.phone || "",
          address: company.address || "",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add company");
      }

      const newCompany = await response.json();
      setCompanies((prev) => [newCompany, ...prev]);
      return newCompany;
    } catch (err) {
      console.error("Error adding company:", err);
      throw err;
    }
  };

  const updateCompany = async (id: number, patch: Partial<Omit<Company, "id">>) => {
    try {
      const token = localStorage.getItem("access");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/company/${id}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: patch.name,
          owner_name: patch.ownerName,
          phone: patch.phone,
          address: patch.address,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update company");
      }

      const updatedCompany = await response.json();
      setCompanies((prev) => 
        prev.map((c) => (c.id === id ? { ...c, ...updatedCompany } : c))
      );
    } catch (err) {
      console.error("Error updating company:", err);
      throw err;
    }
  };

  const removeCompany = async (id: number) => {
    try {
      const token = localStorage.getItem("access");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/company/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to delete company");
      }

      setCompanies((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Error removing company:", err);
      throw err;
    }
  };

  return { 
    companies, 
    addCompany, 
    updateCompany, 
    removeCompany, 
    fetchCompanies,
    loading,
    error 
  };
}

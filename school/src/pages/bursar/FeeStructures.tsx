import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Layers, 
  Trash2, 
  Edit3, 
  Copy,
  Info,
  Banknote,
  Save,
  AlertCircle,
  Loader2,
  CheckCircle,
  X,
  Search,
  Filter,
  Maximize2,
  Minimize2
} from "lucide-react";
import Card from "../../components/common/Card";
import { financeAPI, type FeeStructureCreateData, type FeeItemsAddData } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { academicAPI } from "../../services/api";
import api from "../../services/api";

/* ---------------- TYPES ---------------- */
interface FeeItem {
  name: string;
  amount: number;
  isCompulsory: boolean;
  canBePaidInInstallments: boolean;
  feeItemId?: string;
  termFeeItemId?: string;
}

interface FeeStructure {
  id: string;
  structure_name: string;
  academic_year_id: string;
  class_id?: string;
  student_type?: string;
  term_id: string;
  description?: string;
  applies_to_all_terms: boolean;
  created_at: string;
  fee_items?: FeeItem[];
  class?: {
    class_name: string;
  };
  academic_year?: {
    year_name: string;
  };
  term?: {
    term_name: string;
  };
}

interface AcademicYear {
  id: string;
  year_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface Term {
  id: string;
  term_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  academic_year_id: string;
}

interface Class {
  id: string;
  class_name: string;
  class_level: number;
}

const FeeStructures: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Search and filter
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  
  // Form state
  const [feeStructure, setFeeStructure] = useState<FeeStructureCreateData>({
    structureName: "",
    academicYearId: "",
    classId: "",
    studentType: "",
    termId: "",
    description: "",
    appliesToAllTerms: false
  });
  
  // Initialize with proper amount values
  const [feeItems, setFeeItems] = useState<FeeItem[]>([
    { 
      name: "Tuition Fee", 
      amount: 25000,  // Default non-zero value
      isCompulsory: true, 
      canBePaidInInstallments: false 
    }
  ]);
  
  // Data from API
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [existingStructures, setExistingStructures] = useState<FeeStructure[]>([]);
  
  // Load initial data
  useEffect(() => {
    fetchInitialData();
    fetchExistingStructures();
  }, []);
  
  // Debug useEffect
  useEffect(() => {
    console.log("Fee items state:", feeItems);
    console.log("Fee structure state:", feeStructure);
  }, [feeItems, feeStructure]);
  
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch academic years
      try {
        const yearsResponse = await academicAPI.getYears();
        if (yearsResponse.data.success) {
          const yearsData = Array.isArray(yearsResponse.data.data) 
            ? yearsResponse.data.data 
            : yearsResponse.data.data.years || yearsResponse.data.data;
          
          setAcademicYears(yearsData);
          
          // Set default academic year
          const currentYear = yearsData.find((year: AcademicYear) => year.is_current);
          if (currentYear) {
            setFeeStructure(prev => ({ ...prev, academicYearId: currentYear.id }));
            setSelectedYear(currentYear.id);
            fetchTerms(currentYear.id);
          }
        }
      } catch (yearsError: any) {
        console.error("Failed to fetch academic years:", yearsError);
      }
      
      // Fetch classes
      await fetchClasses();
      
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
      setError("Failed to load academic data");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes');
      if (response.data.success || Array.isArray(response.data) || Array.isArray(response.data.data)) {
        const classesData = Array.isArray(response.data.data) 
          ? response.data.data 
          : Array.isArray(response.data) 
            ? response.data 
            : [];
        
        setClasses(classesData);
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error);
      setClasses([]);
    }
  };
  
  const fetchTerms = async (academicYearId: string) => {
    try {
      const response = await academicAPI.getTerms(academicYearId);
      if (response.data.success) {
        const termsData = Array.isArray(response.data.data) 
          ? response.data.data 
          : response.data.data.terms || response.data.data;
        
        setTerms(termsData);
        
        // Set default term
        const currentTerm = termsData.find((term: Term) => term.is_current);
        if (currentTerm) {
          setFeeStructure(prev => ({ ...prev, termId: currentTerm.id }));
        } else if (termsData.length > 0) {
          setFeeStructure(prev => ({ ...prev, termId: termsData[0].id }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch terms:", error);
      setTerms([]);
    }
  };
  
  const fetchExistingStructures = async () => {
    try {
      const response = await api.get('/finance/fee-structures');
      if (response.data.success || Array.isArray(response.data) || Array.isArray(response.data.data)) {
        const structures = Array.isArray(response.data.data) 
          ? response.data.data 
          : Array.isArray(response.data) 
            ? response.data 
            : [];
        
        setExistingStructures(structures);
      }
    } catch (error) {
      console.error("Failed to fetch existing structures:", error);
      setExistingStructures([]);
    }
  };
  
  const handleAddItem = () => {
    setFeeItems([...feeItems, { 
      name: "", 
      amount: 0, 
      isCompulsory: true, 
      canBePaidInInstallments: false 
    }]);
  };
  
  const handleRemoveItem = (index: number) => {
    if (feeItems.length > 1) {
      const newItems = [...feeItems];
      newItems.splice(index, 1);
      setFeeItems(newItems);
    }
  };
  
  // Fixed: Handle name changes
  const handleNameChange = (index: number, value: string) => {
    const newItems = [...feeItems];
    newItems[index].name = value;
    setFeeItems(newItems);
  };
  
 const handleAmountChange = (index: number, value: string) => {
  const newItems = [...feeItems];
  
  // Remove any formatting (commas, currency symbols)
  const cleanValue = value.replace(/[^0-9.]/g, '');
  
  if (cleanValue === "" || cleanValue === ".") {
    newItems[index].amount = 0;
  } else {
    const numValue = parseFloat(cleanValue);
    if (!isNaN(numValue)) {
      newItems[index].amount = numValue;
    } else {
      newItems[index].amount = 0;
    }
  }
  
  console.log(`Amount changed: ${value} -> ${newItems[index].amount}`);
  setFeeItems(newItems);
};
  // Fixed: Handle checkbox changes
  const handleCheckboxChange = (index: number, field: 'isCompulsory' | 'canBePaidInInstallments', checked: boolean) => {
    const newItems = [...feeItems];
    newItems[index][field] = checked;
    setFeeItems(newItems);
  };
  
  const handleStructureChange = (field: keyof FeeStructureCreateData, value: any) => {
    setFeeStructure(prev => ({ ...prev, [field]: value }));
    
    if (field === 'academicYearId') {
      fetchTerms(value);
    }
  };
  
  const calculateTotal = (items: FeeItem[]) => 
    items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  
  const validateForm = (): boolean => {
    if (!feeStructure.structureName.trim()) {
      setError("Structure name is required");
      return false;
    }
    
    if (!feeStructure.academicYearId) {
      setError("Academic year is required");
      return false;
    }
    
    if (!feeStructure.termId) {
      setError("Term is required");
      return false;
    }
    
    if (feeItems.length === 0) {
      setError("At least one fee item is required");
      return false;
    }
    
    for (let i = 0; i < feeItems.length; i++) {
      const item = feeItems[i];
      if (!item.name?.trim()) {
        setError(`Fee item #${i + 1} name is required`);
        return false;
      }
      if (!item.amount || item.amount <= 0) {
        setError(`Fee item #${i + 1} amount must be greater than 0`);
        return false;
      }
    }
    
    return true;
  };
  
  const resetForm = () => {
    setFeeStructure({
      structureName: "",
      academicYearId: academicYears.find(y => y.is_current)?.id || "",
      classId: "",
      studentType: "",
      termId: terms.find(t => t.is_current)?.id || "",
      description: "",
      appliesToAllTerms: false
    });
    
    setFeeItems([
      { 
        name: "Tuition Fee", 
        amount: 25000, 
        isCompulsory: true, 
        canBePaidInInstallments: false 
      }
    ]);
  };
  
  const openModal = () => {
    resetForm();
    setIsModalOpen(true);
    setIsExpanded(false);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async () => {
  console.log("=== SUBMITTING FEE STRUCTURE ===");
  console.log("Fee structure data:", feeStructure);
  console.log("Fee items before formatting:", feeItems);
  
  if (!validateForm()) return;
  
  try {
    setSaving(true);
    setError(null);
    
    // Format data for API - Ensure amounts are properly formatted
    const formattedFeeItems = feeItems.map(item => {
      console.log(`Processing item: ${item.name}`, {
        originalAmount: item.amount,
        amountType: typeof item.amount,
        amountValue: item.amount
      });
      
      // Convert amount to number and fix to 2 decimal places
      let amount = Number(item.amount);
      if (isNaN(amount) || amount < 0) {
        console.warn(`Invalid amount for ${item.name}: ${item.amount}, defaulting to 0`);
        amount = 0;
      }
      
      // Round to 2 decimal places to match Decimal(10,2) in database
      amount = Math.round(amount * 100) / 100;
      
      return {
        name: item.name.trim(),
        amount: amount, // Send as regular number (Prisma will convert to Decimal)
        isCompulsory: Boolean(item.isCompulsory),
        canBePaidInInstallments: Boolean(item.canBePaidInInstallments)
      };
    });
    
    console.log("Formatted fee items for API:", formattedFeeItems);
    console.log("Sending to createFeeStructure:", feeStructure);
    
    // 1. Create the fee structure
    const structureResponse = await financeAPI.createFeeStructure(feeStructure);
    console.log("Structure response:", structureResponse.data);
    
    if (structureResponse.data.success) {
      const structureId = structureResponse.data.data.newFeeStructure.id;
      
      // 2. Add fee items to the structure
      const itemsData: FeeItemsAddData = {
        feeStructureId: structureId,
        termId: feeStructure.termId,
        items: formattedFeeItems
      };
      
      console.log("Sending to addFeeItems API:", JSON.stringify(itemsData, null, 2));
      
      const itemsResponse = await financeAPI.addFeeItems(itemsData);
      console.log("Add fee items response:", itemsResponse.data);
      
      if (itemsResponse.data.success) {
        setSuccess(`Fee structure created successfully with ${formattedFeeItems.length} items!`);
        closeModal();
        fetchExistingStructures();
        
        setTimeout(() => setSuccess(null), 5000);
      } else {
        throw new Error(itemsResponse.data.error || "Failed to add fee items");
      }
    } else {
      throw new Error(structureResponse.data.error || "Failed to create fee structure");
    }
  } catch (error: any) {
    console.error("=== SUBMISSION ERROR ===");
    console.error("Error:", error);
    console.error("Error response:", error.response?.data);
    setError(error.message || "Failed to create fee structure. Please try again.");
  } finally {
    setSaving(false);
  }
};
  
  const handleCopyStructure = (structure: FeeStructure) => {
    setFeeStructure({
      structureName: `${structure.structure_name} - Copy`,
      academicYearId: structure.academic_year_id,
      classId: structure.class_id || "",
      studentType: structure.student_type || "",
      termId: structure.term_id,
      description: structure.description || "",
      appliesToAllTerms: structure.applies_to_all_terms
    });
    
    if (structure.fee_items && structure.fee_items.length > 0) {
      setFeeItems(structure.fee_items.map(item => ({
        name: item.name || "",
        amount: item.amount || 0,
        isCompulsory: item.isCompulsory || true,
        canBePaidInInstallments: item.canBePaidInInstallments || false
      })));
    }
    
    setIsModalOpen(true);
  };
  
  const getClassName = (structure: FeeStructure) => {
    if (structure.class?.class_name) return structure.class.class_name;
    if (structure.class_id) {
      const classObj = classes.find(c => c.id === structure.class_id);
      return classObj ? classObj.class_name : "Unknown Class";
    }
    return "All Classes";
  };
  
  const getTermName = (structure: FeeStructure) => {
    if (structure.term?.term_name) return structure.term.term_name;
    const term = terms.find(t => t.id === structure.term_id);
    return term ? term.term_name : "Unknown Term";
  };
  
  const getYearName = (structure: FeeStructure) => {
    if (structure.academic_year?.year_name) return structure.academic_year.year_name;
    const year = academicYears.find(y => y.id === structure.academic_year_id);
    return year ? year.year_name : "Unknown Year";
  };
  
  // Filter structures
  const filteredStructures = existingStructures.filter(structure => {
    const matchesSearch = structure.structure_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getClassName(structure).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesYear = !selectedYear || structure.academic_year_id === selectedYear;
    const matchesClass = !selectedClass || structure.class_id === selectedClass;
    
    return matchesSearch && matchesYear && matchesClass;
  });
  
  return (
    <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Fee Architecture</h1>
          <p className="text-slate-500 font-medium">Define billing components for academic cycles.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            onClick={openModal}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <Plus size={18} />
            New Structure
          </button>
          <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-center gap-2">
            <Info className="text-amber-600" size={18} />
            <p className="text-xs text-amber-700 font-bold">
              Changes apply to new invoices only
            </p>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between mb-6 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-emerald-600" size={20} />
            <p className="text-emerald-700 font-medium">{success}</p>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-600 hover:text-emerald-800">
            <X size={18} />
          </button>
        </div>
      )}
      
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between mb-6 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-rose-600" size={20} />
            <p className="text-rose-700 font-medium">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Search and Filter Bar */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search structures by name or class..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm"
            >
              <option value="">All Years</option>
              {academicYears.map(year => (
                <option key={year.id} value={year.id}>
                  {year.year_name}
                </option>
              ))}
            </select>
            
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm"
            >
              <option value="">All Classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.class_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Structures List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-black text-slate-800">
            Active Structures ({filteredStructures.length})
          </h2>
          <button
            onClick={fetchExistingStructures}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
            title="Refresh structures"
          >
            <Loader2 size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {loading && existingStructures.length === 0 ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="animate-spin text-slate-400" size={32} />
            <span className="ml-3 text-slate-500">Loading structures...</span>
          </div>
        ) : filteredStructures.length === 0 ? (
          <Card className="p-8 text-center">
            <Banknote className="mx-auto text-slate-300" size={48} />
            <p className="text-slate-500 mt-4">No fee structures found.</p>
            <p className="text-sm text-slate-400 mt-1">
              {searchTerm || selectedYear || selectedClass ? 
                "Try adjusting your search filters." : 
                "Create your first fee structure using the button above."}
            </p>
          </Card>
        ) : (
          filteredStructures.map((struct) => (
            <Card key={struct.id} className="overflow-hidden">
              <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-600 flex items-center justify-center">
                    <Layers size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 leading-tight text-lg">
                      {struct.structure_name}
                    </h3>
                    <p className="text-xs font-bold uppercase text-slate-400 mt-1 tracking-tighter">
                      {getYearName(struct)} • {getTermName(struct)} • {getClassName(struct)}
                      {struct.student_type && ` • ${struct.student_type}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col md:items-end gap-3">
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase text-slate-400">Total</p>
                    <p className="text-lg font-black text-slate-800">
                      KES {(struct.fee_items ? calculateTotal(struct.fee_items) : 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopyStructure(struct)}
                      className="px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Copy size={16} />
                      Copy
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Fee Items Details */}
              {struct.fee_items && struct.fee_items.length > 0 && (
                <div className="border-t border-slate-100 p-4 md:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {struct.fee_items.map((item, i) => (
                      <div key={i} className="bg-slate-50/50 p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold uppercase text-slate-400 truncate">
                              {item.name || `Fee Item ${i + 1}`}
                            </p>
                            <p className="text-sm font-bold text-slate-700 mt-1">
                              KES {(item.amount || 0).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-1 ml-2">
                            {item.isCompulsory && (
                              <span className="text-[10px] font-bold uppercase bg-rose-100 text-rose-700 px-2 py-1 rounded">
                                Required
                              </span>
                            )}
                            {item.canBePaidInInstallments && (
                              <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                                Installments
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {struct.description && (
                    <div className="mt-4 text-sm text-slate-600 bg-slate-50/50 p-3 rounded-lg">
                      <span className="font-semibold">Note:</span> {struct.description}
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-4xl ${isExpanded ? 'h-[90vh]' : 'max-h-[90vh]'} flex flex-col`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-black text-slate-800">
                  {feeStructure.structureName ? `Editing: ${feeStructure.structureName}` : "Create Fee Structure"}
                </h2>
                <p className="text-sm text-slate-500">Define your fee structure details</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"
                  title={isExpanded ? "Minimize" : "Expand"}
                >
                  {isExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
                <button
                  onClick={closeModal}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-slate-50 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Basic Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Structure Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">
                      Structure Name *
                    </label>
                    <input
                      type="text"
                      value={feeStructure.structureName}
                      onChange={(e) => handleStructureChange('structureName', e.target.value)}
                      placeholder="e.g., Grade 4 Standard Fees"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={saving}
                    />
                  </div>
                  
                  {/* Academic Year */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">
                      Academic Year *
                    </label>
                    <select
                      value={feeStructure.academicYearId}
                      onChange={(e) => handleStructureChange('academicYearId', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={saving || loading}
                    >
                      <option value="">Select Year</option>
                      {academicYears.map(year => (
                        <option key={year.id} value={year.id}>
                          {year.year_name} {year.is_current && "(Current)"}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Term */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">
                      Term *
                    </label>
                    <select
                      value={feeStructure.termId}
                      onChange={(e) => handleStructureChange('termId', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={saving || !feeStructure.academicYearId || loading}
                    >
                      <option value="">Select Term</option>
                      {terms.map(term => (
                        <option key={term.id} value={term.id}>
                          {term.term_name} {term.is_current && "(Current)"}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Target Class */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">
                      Target Class (Optional)
                    </label>
                    <select
                      value={feeStructure.classId}
                      onChange={(e) => handleStructureChange('classId', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={saving}
                    >
                      <option value="">All Classes</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>
                          {cls.class_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Student Type and Description Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">
                      Student Type (Optional)
                    </label>
                    <select
                      value={feeStructure.studentType}
                      onChange={(e) => handleStructureChange('studentType', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={saving}
                    >
                      <option value="">All Students</option>
                      <option value="BOARDING">Boarding</option>
                      <option value="DAY">Day Scholar</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">
                      Description (Optional)
                    </label>
                    <textarea
                      value={feeStructure.description || ""}
                      onChange={(e) => handleStructureChange('description', e.target.value)}
                      placeholder="Add notes about this fee structure..."
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                      disabled={saving}
                    />
                  </div>
                </div>
                
                {/* Apply to all terms checkbox */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="appliesToAllTerms"
                    checked={feeStructure.appliesToAllTerms}
                    onChange={(e) => handleStructureChange('appliesToAllTerms', e.target.checked)}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                    disabled={saving}
                  />
                  <label htmlFor="appliesToAllTerms" className="text-sm font-medium text-slate-700">
                    Apply this structure to all terms in the academic year
                  </label>
                </div>
                
                {/* Fee Items Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-slate-700">
                      Fee Items *
                    </label>
                    <button
                      onClick={handleAddItem}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                      disabled={saving}
                    >
                      <Plus size={16} />
                      Add Item
                    </button>
                  </div>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {feeItems.map((item, index) => (
                      <div key={index} className="flex flex-col md:flex-row gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-200">
                        {/* Item Name */}
                        <div className="flex-1 min-w-0">
                          <label className="text-xs font-medium text-slate-500 mb-1 block">Item Name *</label>
                          <input
                            value={item.name || ""}
                            onChange={(e) => handleNameChange(index, e.target.value)}
                            placeholder="e.g., Tuition Fee, Activity Fee"
                            className="w-full bg-white border border-slate-200 rounded-lg p-3 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500"
                            disabled={saving}
                          />
                        </div>
                        
                        {/* Amount */}
                        <div className="w-full md:w-48">
                          <label className="text-xs font-medium text-slate-500 mb-1 block">Amount (KES) *</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={item.amount === 0 ? "" : item.amount.toLocaleString()}
                              onChange={(e) => handleAmountChange(index, e.target.value)}
                              placeholder="Enter amount"
                              className="w-full bg-white border border-slate-200 rounded-lg p-3 pl-10 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500"
                              disabled={saving}
                            />
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">KES</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Current value: {item.amount > 0 ? item.amount.toLocaleString() : "0"}
                          </p>
                        </div>
                        
                        {/* Options and Actions */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          <div className="flex flex-col sm:flex-row gap-4">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={item.isCompulsory}
                                onChange={(e) => handleCheckboxChange(index, 'isCompulsory', e.target.checked)}
                                className="w-4 h-4 text-indigo-600"
                                disabled={saving}
                              />
                              <span className="text-sm text-slate-600">Required</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={item.canBePaidInInstallments}
                                onChange={(e) => handleCheckboxChange(index, 'canBePaidInInstallments', e.target.checked)}
                                className="w-4 h-4 text-indigo-600"
                                disabled={saving}
                              />
                              <span className="text-sm text-slate-600">Installments</span>
                            </label>
                          </div>
                          
                          {feeItems.length > 1 && (
                            <button
                              onClick={() => handleRemoveItem(index)}
                              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white rounded-lg transition-colors"
                              disabled={saving}
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-600 rounded-xl p-4 text-white">
                    <span className="text-xs font-bold uppercase tracking-widest block">Total</span>
                    <span className="text-2xl font-black block">
                      KES {calculateTotal(feeItems).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600">
                    <p>{feeItems.length} item{feeItems.length !== 1 ? 's' : ''}</p>
                    <p className="text-xs text-slate-500">Total will be validated</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Publish Structure
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeStructures;
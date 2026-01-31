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
  Minimize2,
  Users,
  ArrowRight,
  Calendar,
  UserCheck,
  RefreshCw,
  FileText,
  Check,
  ChevronDown,
  ChevronUp,
  Eye
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

interface Stream {
  id: string;
  name: string;
  class_id: string;
}

interface StudentSummary {
  total: number;
  new: number;
  existing: number;
}

interface ApplicationLog {
  studentId: string;
  admissionNumber: string;
  name: string;
  status: 'success' | 'failed' | 'skipped';
  feeAssignmentId?: string;
  totalAmount?: number;
  invoiceId?: string;
  invoiceNumber?: string;
  reason?: string;
  studentType?: string;
}

// New types for fee application
interface FeeApplicationModalState {
  isOpen: boolean;
  selectedStructureId: string;
  selectedStructureName: string;
  classId: string;
  streamId: string;
  termId: string;
  academicYearId: string;
  applyTo: 'all' | 'new_only' | 'existing_only';
  generateInvoices: boolean;
  invoiceDueDate: string;
  notes: string;
  installmentPlan: {
    number: number;
    dueDates?: string[];
  } | null;
}

const FeeStructures: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [applyingFees, setApplyingFees] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Fee Application Modal State
  const [feeApplicationModal, setFeeApplicationModal] = useState<FeeApplicationModalState>({
    isOpen: false,
    selectedStructureId: "",
    selectedStructureName: "",
    classId: "",
    streamId: "",
    termId: "",
    academicYearId: "",
    applyTo: 'all',
    generateInvoices: true,
    invoiceDueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
    notes: "",
    installmentPlan: null
  });
  
  // Application state
  const [applicationLogs, setApplicationLogs] = useState<ApplicationLog[]>([]);
  const [applicationProgress, setApplicationProgress] = useState({
    total: 0,
    completed: 0,
    percentage: 0
  });
  const [studentSummary, setStudentSummary] = useState<StudentSummary>({
    total: 0,
    new: 0,
    existing: 0
  });
  const [showApplicationResults, setShowApplicationResults] = useState(false);
  
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
  const [streams, setStreams] = useState<Stream[]>([]);
  const [existingStructures, setExistingStructures] = useState<FeeStructure[]>([]);
  const [loadingApplicationTerms, setLoadingApplicationTerms] = useState(false);
  
  // Load initial data
  useEffect(() => {
    fetchInitialData();
    fetchExistingStructures();
  }, []);
  
  // Update fee application modal when structure changes
  useEffect(() => {
    if (feeApplicationModal.selectedStructureId) {
      const structure = existingStructures.find(s => s.id === feeApplicationModal.selectedStructureId);
      if (structure) {
        setFeeApplicationModal(prev => ({
          ...prev,
          selectedStructureName: structure.structure_name,
          classId: structure.class_id || "",
          termId: structure.term_id,
          academicYearId: structure.academic_year_id
        }));
        
        // Fetch streams for the class
        if (structure.class_id) {
          fetchStreams(structure.class_id);
        }
      }
    }
  }, [feeApplicationModal.selectedStructureId, existingStructures]);
  
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch academic years
      await fetchAcademicYears();
      
      // Fetch classes
      await fetchClasses();
      
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
      setError("Failed to load academic data");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAcademicYears = async () => {
    try {
      console.log("Fetching academic years...");
      const response = await academicAPI.getYears();
      console.log("Academic years API response:", response.data);
      
      let yearsData = [];
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          yearsData = response.data;
        } else if (response.data.data) {
          if (Array.isArray(response.data.data)) {
            yearsData = response.data.data;
          } else if (response.data.data.years && Array.isArray(response.data.data.years)) {
            yearsData = response.data.data.years;
          } else if (response.data.data.year_name) {
            yearsData = [response.data.data];
          }
        } else if (response.data.success && response.data.data) {
          if (Array.isArray(response.data.data)) {
            yearsData = response.data.data;
          } else if (response.data.data.years && Array.isArray(response.data.data.years)) {
            yearsData = response.data.data.years;
          } else if (response.data.data.year_name) {
            yearsData = [response.data.data];
          }
        }
      }
      
      console.log("Parsed academic years:", yearsData);
      
      if (yearsData.length > 0) {
        setAcademicYears(yearsData);
        
        // Set default academic year
        const currentYear = yearsData.find((year: AcademicYear) => year.is_current);
        const selectedYearId = currentYear?.id || yearsData[0]?.id;
        
        if (selectedYearId) {
          setFeeStructure(prev => ({ ...prev, academicYearId: selectedYearId }));
          setSelectedYear(selectedYearId);
          
          // Fetch terms for the selected year
          await fetchTerms(selectedYearId);
        }
      } else {
        setError("No academic years found");
      }
    } catch (error: any) {
      console.error("Failed to fetch academic years:", error);
      setError(`Failed to load academic years: ${error.message}`);
    }
  };
  
  const fetchClasses = async () => {
    try {
      console.log("Fetching classes...");
      const response = await api.get('/classes');
      console.log("Classes API response:", response.data);
      
      let classesData = [];
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          classesData = response.data;
        } else if (response.data.data) {
          if (Array.isArray(response.data.data)) {
            classesData = response.data.data;
          } else if (response.data.data.class_name) {
            classesData = [response.data.data];
          }
        } else if (response.data.success && response.data.data) {
          if (Array.isArray(response.data.data)) {
            classesData = response.data.data;
          } else {
            classesData = [];
          }
        }
      }
      
      console.log("Parsed classes:", classesData);
      setClasses(classesData);
      
    } catch (error: any) {
      console.error("Failed to fetch classes:", error);
      setClasses([]);
    }
  };
  
  const fetchStreams = async (classId: string) => {
    try {
      const response = await financeAPI.getClassStreams(classId, {
        includeStudentCount: true,
        includeFeeSummary: false
      });
      if (response.data.success) {
        const streamsData = response.data.data?.streams || [];
        setStreams(streamsData.map((s: any) => ({
          id: s.id,
          name: s.name,
          class_id: classId
        })));
      }
    } catch (error) {
      console.error("Failed to fetch streams:", error);
      setStreams([]);
    }
  };
  
  const fetchTerms = async (academicYearId: string) => {
    try {
      console.log("Fetching terms for academic year:", academicYearId);
      const response = await academicAPI.getTerms(academicYearId);
      console.log("Terms API response:", response.data);
      
      let termsData = [];
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          termsData = response.data;
        } else if (response.data.data) {
          if (Array.isArray(response.data.data)) {
            termsData = response.data.data;
          } else if (response.data.data.terms && Array.isArray(response.data.data.terms)) {
            termsData = response.data.data.terms;
          } else if (response.data.data.term_name) {
            termsData = [response.data.data];
          }
        } else if (response.data.success && response.data.data) {
          if (Array.isArray(response.data.data)) {
            termsData = response.data.data;
          } else if (response.data.data.terms && Array.isArray(response.data.data.terms)) {
            termsData = response.data.data.terms;
          } else {
            termsData = [];
          }
        }
      }
      
      console.log("Parsed terms:", termsData);
      
      // Update terms state - merge with existing terms
      setTerms(prevTerms => {
        // Remove existing terms for this academic year
        const filteredPrev = prevTerms.filter(t => t.academic_year_id !== academicYearId);
        // Add new terms
        return [...filteredPrev, ...termsData];
      });
      
      // Set default term for the form if the academic year matches
      if (academicYearId === feeStructure.academicYearId && termsData.length > 0) {
        const currentTerm = termsData.find((term: Term) => term.is_current);
        const selectedTermId = currentTerm?.id || termsData[0]?.id;
        
        if (selectedTermId) {
          console.log("Setting term for form:", selectedTermId);
          setFeeStructure(prev => ({ ...prev, termId: selectedTermId }));
        }
      }
    } catch (error: any) {
      console.error("Failed to fetch terms:", error);
      setTerms([]);
    }
  };
  
  const fetchTermsForApplicationModal = async (academicYearId: string) => {
    try {
      setLoadingApplicationTerms(true);
      console.log("Fetching terms for application modal, academic year:", academicYearId);
      const response = await academicAPI.getTerms(academicYearId);
      console.log("Terms API response for application modal:", response.data);
      
      let termsData = [];
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          termsData = response.data;
        } else if (response.data.data) {
          if (Array.isArray(response.data.data)) {
            termsData = response.data.data;
          } else if (response.data.data.terms && Array.isArray(response.data.data.terms)) {
            termsData = response.data.data.terms;
          } else if (response.data.data.term_name) {
            termsData = [response.data.data];
          }
        } else if (response.data.success && response.data.data) {
          if (Array.isArray(response.data.data)) {
            termsData = response.data.data;
          } else if (response.data.data.terms && Array.isArray(response.data.data.terms)) {
            termsData = response.data.data.terms;
          } else {
            termsData = [];
          }
        }
      }
      
      console.log("Parsed terms for application modal:", termsData);
      
      // Update terms state - merge with existing terms
      setTerms(prevTerms => {
        // Remove existing terms for this academic year
        const filteredPrev = prevTerms.filter(t => t.academic_year_id !== academicYearId);
        // Add new terms
        return [...filteredPrev, ...termsData];
      });
      
      return termsData;
      
    } catch (error: any) {
      console.error("Failed to fetch terms for application modal:", error);
      setError(`Failed to load terms: ${error.message}`);
      return [];
    } finally {
      setLoadingApplicationTerms(false);
    }
  };
  
  const fetchExistingStructures = async () => {
    try {
      console.log("Fetching existing fee structures...");
      const response = await api.get('/finance/fee-structures');
      console.log("Fee structures API response:", response.data);
      
      let structures = [];
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          structures = response.data;
        } else if (response.data.data) {
          if (Array.isArray(response.data.data)) {
            structures = response.data.data;
          } else if (response.data.data.structure_name) {
            structures = [response.data.data];
          }
        } else if (response.data.success && response.data.data) {
          if (Array.isArray(response.data.data)) {
            structures = response.data.data;
          } else {
            structures = [];
          }
        }
      }
      
      console.log("Parsed fee structures:", structures);
      setExistingStructures(structures);
      
    } catch (error: any) {
      console.error("Failed to fetch existing structures:", error);
      setExistingStructures([]);
    }
  };
  
  const openFeeApplicationModal = (structure: FeeStructure) => {
    console.log("Opening fee application modal for structure:", structure);
    
    // Immediately set the modal state
    setFeeApplicationModal({
      isOpen: true,
      selectedStructureId: structure.id,
      selectedStructureName: structure.structure_name,
      classId: structure.class_id || "",
      streamId: "",
      termId: "", // Start with empty, will be set after fetching terms
      academicYearId: structure.academic_year_id,
      applyTo: 'all',
      generateInvoices: true,
      invoiceDueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
      notes: `Applying ${structure.structure_name} to students`,
      installmentPlan: null
    });
    
    // Reset application state
    setApplicationLogs([]);
    setApplicationProgress({
      total: 0,
      completed: 0,
      percentage: 0
    });
    setShowApplicationResults(false);
    setStudentSummary({
      total: 0,
      new: 0,
      existing: 0
    });
    
    // Fetch streams if class is specified
    if (structure.class_id) {
      fetchStreams(structure.class_id);
    }
    
    // Estimate student counts
    estimateStudentCounts(structure);
    
    // Fetch terms for this academic year if not already loaded
    const existingTermsForYear = terms.filter(t => t.academic_year_id === structure.academic_year_id);
    if (existingTermsForYear.length === 0) {
      fetchTermsForApplicationModal(structure.academic_year_id).then(termsData => {
        if (termsData.length > 0) {
          const currentTerm = termsData.find(t => t.is_current);
          setFeeApplicationModal(prev => ({
            ...prev,
            termId: currentTerm?.id || structure.term_id || termsData[0].id
          }));
        }
      });
    } else {
      // Terms already exist, set the term
      const currentTerm = existingTermsForYear.find(t => t.is_current);
      setFeeApplicationModal(prev => ({
        ...prev,
        termId: currentTerm?.id || structure.term_id || existingTermsForYear[0].id
      }));
    }
  };
  
  const closeFeeApplicationModal = () => {
    setFeeApplicationModal(prev => ({ ...prev, isOpen: false }));
  };
  
  const estimateStudentCounts = async (structure: FeeStructure) => {
    try {
      // This is a simplified estimate - you might want to make an actual API call
      setStudentSummary({
        total: 40, // Example estimate
        new: 15,   // Example estimate
        existing: 25 // Example estimate
      });
    } catch (error) {
      console.error("Failed to estimate student counts:", error);
    }
  };
  
  const handleApplyFeeStructure = async () => {
    if (!feeApplicationModal.selectedStructureId) {
      setError("Please select a fee structure");
      return;
    }
    
    if (!feeApplicationModal.termId) {
      setError("Please select a term");
      return;
    }
    
    try {
      setApplyingFees(true);
      setError(null);
      setShowApplicationResults(false);
      
      // Calculate due date
      const dueDate = feeApplicationModal.invoiceDueDate 
        ? new Date(feeApplicationModal.invoiceDueDate).toISOString()
        : new Date(new Date().setDate(new Date().getDate() + 30)).toISOString();
      
      const applicationData = {
        feeStructureId: feeApplicationModal.selectedStructureId,
        classId: feeApplicationModal.classId || undefined,
        streamId: feeApplicationModal.streamId || undefined,
        termId: feeApplicationModal.termId,
        academicYearId: feeApplicationModal.academicYearId,
        applyTo: feeApplicationModal.applyTo,
        generateInvoices: feeApplicationModal.generateInvoices,
        invoiceDueDate: dueDate,
        installmentPlan: feeApplicationModal.installmentPlan,
        notes: feeApplicationModal.notes
      };
      
      console.log("Applying fee structure:", applicationData);
      
      const response = await financeAPI.applyFeeStructureToStudents(applicationData);
      
      if (response.data.success) {
        const result = response.data.data;
        
        // Update application logs
        setApplicationLogs(result.logs || []);
        setApplicationProgress({
          total: result.summary?.totalStudents || 0,
          completed: result.summary?.successful || 0,
          percentage: result.summary?.totalStudents ? 
            (result.summary.successful / result.summary.totalStudents) * 100 : 0
        });
        
        setShowApplicationResults(true);
        
        // Show success message
        setSuccess(`Fee structure applied successfully to ${result.summary?.successful || 0} students`);
        
        setTimeout(() => {
          setSuccess(null);
        }, 5000);
        
      } else {
        throw new Error(response.data.error || "Failed to apply fee structure");
      }
    } catch (error: any) {
      console.error("Error applying fee structure:", error);
      setError(error.message || "Failed to apply fee structure. Please try again.");
    } finally {
      setApplyingFees(false);
    }
  };
  
  const handleApplicationModalChange = (field: keyof FeeApplicationModalState, value: any) => {
    if (field === 'academicYearId' && value) {
      // Fetch terms for the new academic year
      fetchTermsForApplicationModal(value).then(termsData => {
        if (termsData.length > 0 && !feeApplicationModal.termId) {
          const currentTerm = termsData.find(t => t.is_current);
          setFeeApplicationModal(prev => ({
            ...prev,
            termId: currentTerm?.id || termsData[0].id
          }));
        }
      });
    }
    
    setFeeApplicationModal(prev => ({ ...prev, [field]: value }));
    
    if (field === 'classId' && value) {
      fetchStreams(value);
      setFeeApplicationModal(prev => ({ ...prev, streamId: "" }));
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
  
  const handleCheckboxChange = (index: number, field: 'isCompulsory' | 'canBePaidInInstallments', checked: boolean) => {
    const newItems = [...feeItems];
    newItems[index][field] = checked;
    setFeeItems(newItems);
  };
  
  const handleStructureChange = (field: keyof FeeStructureCreateData, value: any) => {
    setFeeStructure(prev => ({ ...prev, [field]: value }));
    
    if (field === 'academicYearId' && value) {
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
    const currentYear = academicYears.find(y => y.is_current);
    const yearId = currentYear?.id || (academicYears.length > 0 ? academicYears[0].id : "");
    
    setFeeStructure({
      structureName: "",
      academicYearId: yearId,
      classId: "",
      studentType: "",
      termId: "",
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
    
    // Fetch terms for the selected year
    if (yearId) {
      fetchTerms(yearId);
    }
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
    
    // Fetch terms for the selected academic year
    fetchTerms(structure.academic_year_id);
    
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
  
  // Filter terms for the current academic year in the application modal
  const filteredTerms = terms.filter(term => 
    term.academic_year_id === feeApplicationModal.academicYearId
  );
  
  // Filter terms for the main form
  const filteredFormTerms = terms.filter(term => 
    term.academic_year_id === feeStructure.academicYearId
  );
  
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
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
            {loading ? "Loading..." : "New Structure"}
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
              disabled={academicYears.length === 0}
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
              disabled={classes.length === 0}
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
            onClick={() => {
              fetchExistingStructures();
              fetchAcademicYears();
              fetchClasses();
            }}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
            title="Refresh data"
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {loading && existingStructures.length === 0 ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="animate-spin text-slate-400" size={32} />
            <span className="ml-3 text-slate-500">Loading data...</span>
          </div>
        ) : academicYears.length === 0 ? (
          <Card className="p-8 text-center">
            <AlertCircle className="mx-auto text-slate-300" size={48} />
            <p className="text-slate-500 mt-4">No academic years found</p>
            <p className="text-sm text-slate-400 mt-1">
              Please add academic years first before creating fee structures.
            </p>
            <button
              onClick={fetchAcademicYears}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Retry Loading
            </button>
          </Card>
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
                      disabled={loading}
                    >
                      <Copy size={16} />
                      Copy
                    </button>
                    <button
                      onClick={() => openFeeApplicationModal(struct)}
                      className="px-3 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-2"
                      disabled={loading}
                    >
                      <Users size={16} />
                      Apply Fees
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
                      {academicYears.length === 0 ? (
                        <option value="" disabled>
                          {loading ? "Loading academic years..." : "No academic years found"}
                        </option>
                      ) : (
                        academicYears.map(year => (
                          <option key={year.id} value={year.id}>
                            {year.year_name} {year.is_current && "(Current)"}
                          </option>
                        ))
                      )}
                    </select>
                    {academicYears.length === 0 && !loading && (
                      <p className="text-sm text-amber-500">Please add academic years first</p>
                    )}
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
                      {filteredFormTerms.length === 0 ? (
                        <option value="" disabled>
                          {loading ? "Loading terms..." : "No terms found for selected year"}
                        </option>
                      ) : (
                        filteredFormTerms.map(term => (
                          <option key={term.id} value={term.id}>
                            {term.term_name} {term.is_current && "(Current)"}
                          </option>
                        ))
                      )}
                    </select>
                    {!feeStructure.academicYearId && (
                      <p className="text-sm text-amber-500">Select an academic year first</p>
                    )}
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
                    disabled={saving || !feeStructure.academicYearId || !feeStructure.termId}
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

      {/* Fee Application Modal */}
      {feeApplicationModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-black text-slate-800">
                  Apply Fee Structure
                </h2>
                <p className="text-sm text-slate-500">
                  {feeApplicationModal.selectedStructureName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={closeFeeApplicationModal}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-slate-50 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {showApplicationResults ? (
                <div className="space-y-6">
                  <div className="bg-slate-50 rounded-2xl p-6">
                    <h3 className="font-bold text-slate-800 mb-4">Application Results</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-black text-slate-800">{applicationProgress.total}</p>
                        <p className="text-xs font-medium text-slate-500 mt-1">Total Students</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-black text-emerald-600">{applicationProgress.completed}</p>
                        <p className="text-xs font-medium text-slate-500 mt-1">Successfully Applied</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-black text-rose-600">{applicationProgress.total - applicationProgress.completed}</p>
                        <p className="text-xs font-medium text-slate-500 mt-1">Failed/Skipped</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${applicationProgress.percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 text-center">
                        {applicationProgress.percentage.toFixed(1)}% Complete
                      </p>
                    </div>
                  </div>
                  
                  {applicationLogs.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-slate-700">Application Logs</h4>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {applicationLogs.map((log, index) => (
                          <div key={index} className={`p-3 rounded-lg border ${
                            log.status === 'success' ? 'border-emerald-200 bg-emerald-50' :
                            log.status === 'failed' ? 'border-rose-200 bg-rose-50' :
                            'border-amber-200 bg-amber-50'
                          }`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-slate-700">{log.name}</p>
                                <p className="text-xs text-slate-500">{log.admissionNumber}</p>
                              </div>
                              <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                                log.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                                log.status === 'failed' ? 'bg-rose-100 text-rose-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {log.status}
                              </span>
                            </div>
                            {log.reason && (
                              <p className="text-sm text-slate-600 mt-2">{log.reason}</p>
                            )}
                            {log.invoiceNumber && (
                              <p className="text-xs text-slate-500 mt-1">
                                Invoice: {log.invoiceNumber} • KES {log.totalAmount?.toLocaleString()}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Student Summary */}
                  <div className="bg-slate-50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-800">Student Overview</h3>
                      <Users className="text-slate-400" size={20} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-black text-slate-800">{studentSummary.total}</p>
                        <p className="text-xs font-medium text-slate-500 mt-1">Total Students</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-black text-emerald-600">{studentSummary.new}</p>
                        <p className="text-xs font-medium text-slate-500 mt-1">New Students</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-black text-indigo-600">{studentSummary.existing}</p>
                        <p className="text-xs font-medium text-slate-500 mt-1">Existing Students</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Configuration Form */}
                  <div className="space-y-4">
                    {/* Apply To Selection */}
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700">
                        Apply To
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {['all', 'new_only', 'existing_only'].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => handleApplicationModalChange('applyTo', option as any)}
                            className={`p-4 rounded-xl border-2 text-center transition-all ${
                              feeApplicationModal.applyTo === option
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                : 'border-slate-200 hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            <p className="font-medium capitalize">
                              {option === 'all' ? 'All Students' : 
                               option === 'new_only' ? 'New Students Only' : 
                               'Existing Students Only'}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Term Selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">
                        Term *
                      </label>
                      <select
                        value={feeApplicationModal.termId}
                        onChange={(e) => handleApplicationModalChange('termId', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500"
                        required
                        disabled={loadingApplicationTerms}
                      >
                        <option value="">Select Term</option>
                        {loadingApplicationTerms ? (
                          <option value="" disabled>
                            Loading terms...
                          </option>
                        ) : filteredTerms.length === 0 ? (
                          <option value="" disabled>
                            No terms found for this academic year
                          </option>
                        ) : (
                          filteredTerms.map(term => (
                            <option key={term.id} value={term.id}>
                              {term.term_name} {term.is_current && "(Current)"}
                            </option>
                          ))
                        )}
                      </select>
                      {!feeApplicationModal.termId && (
                        <p className="text-sm text-rose-500 mt-1">Term selection is required</p>
                      )}
                    </div>
                    
                    {/* Class and Stream Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">
                          Class (Optional)
                        </label>
                        <select
                          value={feeApplicationModal.classId}
                          onChange={(e) => handleApplicationModalChange('classId', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">All Classes</option>
                          {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>
                              {cls.class_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">
                          Stream (Optional)
                        </label>
                        <select
                          value={feeApplicationModal.streamId}
                          onChange={(e) => handleApplicationModalChange('streamId', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500"
                          disabled={!feeApplicationModal.classId}
                        >
                          <option value="">All Streams</option>
                          {streams.map(stream => (
                            <option key={stream.id} value={stream.id}>
                              {stream.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {/* Invoice Settings */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="generateInvoices"
                          checked={feeApplicationModal.generateInvoices}
                          onChange={(e) => handleApplicationModalChange('generateInvoices', e.target.checked)}
                          className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="generateInvoices" className="text-sm font-medium text-slate-700">
                          Generate invoices automatically
                        </label>
                      </div>
                      
                      {feeApplicationModal.generateInvoices && (
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">
                            Invoice Due Date
                          </label>
                          <input
                            type="date"
                            value={feeApplicationModal.invoiceDueDate}
                            onChange={(e) => handleApplicationModalChange('invoiceDueDate', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500"
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Notes */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={feeApplicationModal.notes}
                        onChange={(e) => handleApplicationModalChange('notes', e.target.value)}
                        placeholder="Add any notes about this fee application..."
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-slate-600">
                  <p className="font-medium">Fee Structure: {feeApplicationModal.selectedStructureName}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Academic Year: {academicYears.find(y => y.id === feeApplicationModal.academicYearId)?.year_name || 'N/A'}
                    {feeApplicationModal.termId && ` • Term: ${terms.find(t => t.id === feeApplicationModal.termId)?.term_name || 'N/A'}`}
                  </p>
                </div>
                
                <div className="flex gap-3">
                  {showApplicationResults ? (
                    <>
                      <button
                        onClick={closeFeeApplicationModal}
                        className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => setShowApplicationResults(false)}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
                      >
                        <Eye size={18} />
                        View Details
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={closeFeeApplicationModal}
                        className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleApplyFeeStructure}
                        disabled={applyingFees || !feeApplicationModal.termId || loadingApplicationTerms}
                        className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {applyingFees ? (
                          <>
                            <Loader2 className="animate-spin" size={18} />
                            Applying...
                          </>
                        ) : (
                          <>
                            <Check size={18} />
                            Apply to Students
                          </>
                        )}
                      </button>
                    </>
                  )}
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
import React, { useState, useEffect } from "react";
import { 
  Award, 
  Percent, 
  Plus, 
  Search, 
  UserCheck, 
  Trash2, 
  ShieldCheck,
  Zap,
  Tag,
  DollarSign,
  Users,
  RefreshCw,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Edit,
  Eye,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle,
  BarChart3,
  FileSpreadsheet,
  Printer,
  Mail,
  Bell
} from "lucide-react";
import Card from "../../components/common/Card";
import { financeAPI } from "../../services/api";
import toast from "react-hot-toast";

/* ---------------- TYPES ---------------- */
type FeeWaiverType = {
  id: string;
  waiver_type: string;
  waiver_name: string;
  description?: string;
  waiver_amount?: number;
  percentage?: number;
  category: "scholarship" | "discount" | "bursary" | "sibling" | "staff" | "need_based" | "academic";
  is_active: boolean;
  max_applications?: number;
  valid_from: string;
  valid_to: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
};

type WaiverBeneficiary = {
  id: string;
  student_id: string;
  student_name: string;
  admission_no: string;
  waiver_type: string;
  waiver_amount: number;
  percentage?: number;
  applied_amount: number;
  reason?: string;
  approved_by: string;
  approved_at: string;
  academic_year: string;
  term: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  student: {
    first_name: string;
    last_name: string;
    admission_number: string;
    class?: {
      class_name: string;
    };
    stream?: {
      name: string;
    };
  };
  waiver: {
    waiver_name: string;
    waiver_type: string;
  };
  approved_by_user?: {
    first_name: string;
    last_name: string;
  };
};

type WaiverSummary = {
  total_beneficiaries: number;
  total_amount_waived: number;
  active_waivers: number;
  revenue_foregone: number;
  category_distribution: Record<string, number>;
  monthly_trend: Array<{
    month: string;
    amount_waived: number;
    beneficiaries: number;
  }>;
};

type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const ScholarshipsAndDiscounts: React.FC = () => {
  // State
  const [waiverTypes, setWaiverTypes] = useState<FeeWaiverType[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<WaiverBeneficiary[]>([]);
  const [summary, setSummary] = useState<WaiverSummary>({
    total_beneficiaries: 0,
    total_amount_waived: 0,
    active_waivers: 0,
    revenue_foregone: 0,
    category_distribution: {},
    monthly_trend: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBeneficiaries, setIsLoadingBeneficiaries] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [showNewWaiverModal, setShowNewWaiverModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedWaiverType, setSelectedWaiverType] = useState<string>("");
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  });

  // New waiver form state
  const [newWaiver, setNewWaiver] = useState({
    waiver_name: "",
    waiver_type: "scholarship",
    category: "academic",
    waiver_amount: "",
    percentage: "",
    description: "",
    max_applications: "",
    valid_from: "",
    valid_to: ""
  });

  // Assign waiver form state
  const [assignWaiver, setAssignWaiver] = useState({
    studentId: "",
    waiverTypeId: "",
    amount: "",
    reason: "",
    academicYearId: "",
    termId: "",
    startDate: "",
    endDate: ""
  });

  // Fetch waiver types
  const fetchWaiverTypes = async () => {
    setIsLoading(true);
    try {
      const response = await financeAPI.getWaiverTypes();
      
      if (response.data && response.data.success) {
        setWaiverTypes(response.data.data || []);
      } else {
        toast.error("Failed to load waiver types");
        setWaiverTypes([]);
      }
    } catch (error: any) {
      console.error("Error fetching waiver types:", error);
      toast.error(error.response?.data?.error || "Failed to load waiver types");
      setWaiverTypes([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch beneficiaries
  const fetchBeneficiaries = async (page = 1) => {
    setIsLoadingBeneficiaries(true);
    try {
      const params: any = {
        page: page,
        limit: pagination.limit
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (categoryFilter !== "all") {
        params.category = categoryFilter;
      }

      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      const response = await financeAPI.getFeeWaivers(params);
      
      if (response.data && response.data.success) {
        const data = response.data.data;
        setBeneficiaries(Array.isArray(data.waivers) ? data.waivers : []);
        
        // Update pagination
        if (data.pagination) {
          setPagination({
            total: data.pagination.total || 0,
            page: data.pagination.page || 1,
            limit: data.pagination.limit || 10,
            totalPages: data.pagination.pages || 1
          });
        }
      } else {
        toast.error("Failed to load beneficiaries");
        setBeneficiaries([]);
      }
    } catch (error: any) {
      console.error("Error fetching beneficiaries:", error);
      toast.error(error.response?.data?.error || "Failed to load beneficiaries");
      setBeneficiaries([]);
    } finally {
      setIsLoadingBeneficiaries(false);
    }
  };

  // Fetch waiver summary
  const fetchWaiverSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const response = await financeAPI.getWaiverSummary();
      
      if (response.data && response.data.success) {
        setSummary(response.data.data || {
          total_beneficiaries: 0,
          total_amount_waived: 0,
          active_waivers: 0,
          revenue_foregone: 0,
          category_distribution: {},
          monthly_trend: []
        });
      }
    } catch (error: any) {
      console.error("Error fetching waiver summary:", error);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // Create new waiver type
  const handleCreateWaiverType = async () => {
    try {
      const waiverData = {
        waiver_name: newWaiver.waiver_name,
        waiver_type: newWaiver.waiver_type,
        category: newWaiver.category,
        waiver_amount: newWaiver.waiver_amount ? parseFloat(newWaiver.waiver_amount) : undefined,
        percentage: newWaiver.percentage ? parseFloat(newWaiver.percentage) : undefined,
        description: newWaiver.description,
        max_applications: newWaiver.max_applications ? parseInt(newWaiver.max_applications) : undefined,
        valid_from: newWaiver.valid_from,
        valid_to: newWaiver.valid_to
      };

      const response = await financeAPI.createWaiverType(waiverData);
      
      if (response.data && response.data.success) {
        toast.success("Waiver type created successfully");
        setShowNewWaiverModal(false);
        setNewWaiver({
          waiver_name: "",
          waiver_type: "scholarship",
          category: "academic",
          waiver_amount: "",
          percentage: "",
          description: "",
          max_applications: "",
          valid_from: "",
          valid_to: ""
        });
        fetchWaiverTypes();
        fetchWaiverSummary();
      } else {
        toast.error(response.data?.error || "Failed to create waiver type");
      }
    } catch (error: any) {
      console.error("Error creating waiver type:", error);
      toast.error(error.response?.data?.error || "Failed to create waiver type");
    }
  };

  // Assign waiver to student
  const handleAssignWaiver = async () => {
    try {
      const waiverData = {
        studentId: assignWaiver.studentId,
        waiverTypeId: assignWaiver.waiverTypeId,
        amount: parseFloat(assignWaiver.amount),
        reason: assignWaiver.reason,
        academicYearId: assignWaiver.academicYearId,
        termId: assignWaiver.termId,
        startDate: assignWaiver.startDate,
        endDate: assignWaiver.endDate
      };

      const response = await financeAPI.applyFeeWaiver(waiverData);
      
      if (response.data && response.data.success) {
        toast.success("Waiver assigned successfully");
        setShowAssignModal(false);
        setAssignWaiver({
          studentId: "",
          waiverTypeId: "",
          amount: "",
          reason: "",
          academicYearId: "",
          termId: "",
          startDate: "",
          endDate: ""
        });
        fetchBeneficiaries(1);
        fetchWaiverSummary();
      } else {
        toast.error(response.data?.error || "Failed to assign waiver");
      }
    } catch (error: any) {
      console.error("Error assigning waiver:", error);
      toast.error(error.response?.data?.error || "Failed to assign waiver");
    }
  };

  // Deactivate waiver
  const handleDeactivateWaiver = async (waiverId: string) => {
    if (!confirm("Are you sure you want to deactivate this waiver?")) return;

    try {
      const response = await financeAPI.deactivateWaiver(waiverId);
      
      if (response.data && response.data.success) {
        toast.success("Waiver deactivated successfully");
        fetchBeneficiaries(1);
        fetchWaiverSummary();
      } else {
        toast.error(response.data?.error || "Failed to deactivate waiver");
      }
    } catch (error: any) {
      console.error("Error deactivating waiver:", error);
      toast.error(error.response?.data?.error || "Failed to deactivate waiver");
    }
  };

  // Export report
  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      const params = {
        reportType: 'waivers' as const,
        format: 'excel' as const,
        filters: {
          category: categoryFilter !== "all" ? categoryFilter : undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          search: searchTerm || undefined
        }
      };
      
      const response = await financeAPI.exportFinancialReport(params);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `waivers-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("Export started successfully");
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error(error.response?.data?.error || "Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format category name
  const formatCategoryName = (category: string) => {
    const names: Record<string, string> = {
      'scholarship': 'Scholarship',
      'discount': 'Discount',
      'bursary': 'Bursary',
      'sibling': 'Sibling',
      'staff': 'Staff Child',
      'need_based': 'Need-Based',
      'academic': 'Academic'
    };
    return names[category] || category;
  };

  // Format waiver value
  const formatWaiverValue = (waiver: FeeWaiverType) => {
    if (waiver.percentage) {
      return `${waiver.percentage}%`;
    } else if (waiver.waiver_amount) {
      return formatCurrency(waiver.waiver_amount);
    }
    return "Custom";
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'scholarship': 'bg-blue-50 text-blue-600',
      'discount': 'bg-emerald-50 text-emerald-600',
      'bursary': 'bg-purple-50 text-purple-600',
      'sibling': 'bg-amber-50 text-amber-600',
      'staff': 'bg-indigo-50 text-indigo-600',
      'need_based': 'bg-rose-50 text-rose-600',
      'academic': 'bg-sky-50 text-sky-600'
    };
    return colors[category] || 'bg-slate-50 text-slate-600';
  };

  // Get status badge
  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
      : "bg-rose-50 text-rose-600 border-rose-100";
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchBeneficiaries(page);
    }
  };

  // Refresh data
  const handleRefresh = () => {
    fetchWaiverTypes();
    fetchBeneficiaries(1);
    fetchWaiverSummary();
  };

  // Initialize
  useEffect(() => {
    fetchWaiverTypes();
    fetchBeneficiaries();
    fetchWaiverSummary();
  }, []);

  // Fetch when filters change
  useEffect(() => {
    fetchBeneficiaries(1);
  }, [searchTerm, categoryFilter, statusFilter]);

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            Grants & Waivers <Award className="text-amber-500" />
          </h1>
          <p className="text-slate-500 font-medium">Manage tuition discounts and scholarship allocations.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
          <button 
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
          >
            <UserCheck size={16} /> Assign Waiver
          </button>
          <button 
            onClick={() => setShowNewWaiverModal(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200"
          >
            <Plus size={16} /> New Waiver Type
          </button>
          <button 
            onClick={handleExportReport}
            disabled={isExporting || beneficiaries.length === 0}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet size={16} /> {isExporting ? "Exporting..." : "Export"}
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white border-none shadow-sm p-6 rounded-[2rem]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Beneficiaries</p>
              <h3 className="text-2xl font-black text-slate-800 mt-2">
                {isLoadingSummary ? "Loading..." : summary.total_beneficiaries}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Active waivers
              </p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Users size={24} />
            </div>
          </div>
        </Card>

        <Card className="bg-white border-none shadow-sm p-6 rounded-[2rem]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Amount Waived</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-2">
                {isLoadingSummary ? "Loading..." : formatCurrency(summary.total_amount_waived)}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Total savings
              </p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <DollarSign size={24} />
            </div>
          </div>
        </Card>

        <Card className="bg-white border-none shadow-sm p-6 rounded-[2rem]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Waiver Types</p>
              <h3 className="text-2xl font-black text-amber-600 mt-2">
                {isLoadingSummary ? "Loading..." : summary.active_waivers}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Available programs
              </p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <ShieldCheck size={24} />
            </div>
          </div>
        </Card>

        <Card className="bg-white border-none shadow-sm p-6 rounded-[2rem]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Revenue Foregone</p>
              <h3 className="text-2xl font-black text-rose-600 mt-2">
                {isLoadingSummary ? "Loading..." : formatCurrency(summary.revenue_foregone)}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                This term
              </p>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
              <Zap size={24} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 2. Catalog (Left Sidebar style) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Available Programs</h2>
            <span className="text-xs font-medium text-slate-500">
              {waiverTypes.length} types
            </span>
          </div>
          
          {isLoading ? (
            // Loading skeleton for waiver types
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="border-none shadow-sm p-5 rounded-[2rem] bg-white animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-200 rounded-xl"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-slate-200 rounded"></div>
                      <div className="h-3 w-24 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                  <div className="h-4 w-16 bg-slate-200 rounded"></div>
                </div>
              </Card>
            ))
          ) : waiverTypes.length === 0 ? (
            <Card className="border-none shadow-sm p-8 rounded-[2rem] bg-white text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="font-bold text-slate-700 mb-2">No waiver types</h3>
              <p className="text-slate-500 text-sm">
                Create your first waiver type to get started
              </p>
            </Card>
          ) : (
            waiverTypes.map((item) => (
              <Card key={item.id} className="border-none shadow-sm p-5 rounded-[2rem] bg-white group hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelectedWaiverType(item.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors ${getCategoryColor(item.category)}`}>
                      {item.percentage ? <Percent size={18} /> : <Tag size={18} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{item.waiver_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${getCategoryColor(item.category)}`}>
                          {formatCategoryName(item.category)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-[9px] font-black border ${getStatusBadge(item.is_active)}`}>
                          {item.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-indigo-600">{formatWaiverValue(item)}</span>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Valid until {formatDate(item.valid_to)}
                    </div>
                  </div>
                </div>
                {item.description && (
                  <p className="text-sm text-slate-600 mt-3 pl-16">{item.description}</p>
                )}
              </Card>
            ))
          )}
          
          <button 
            onClick={() => setShowNewWaiverModal(true)}
            className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-400 rounded-[2rem] font-bold text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Define New Program
          </button>
        </div>

        {/* 3. Beneficiaries List (Main View) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Active Beneficiaries</h2>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="Filter by student..."
                    className="w-full bg-slate-50 border-none rounded-xl py-2 pl-10 text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchBeneficiaries(1)}
                  />
                </div>
                <select 
                  className="bg-slate-50 border-none rounded-xl py-2 px-4 text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="scholarship">Scholarship</option>
                  <option value="bursary">Bursary</option>
                  <option value="discount">Discount</option>
                  <option value="sibling">Sibling</option>
                  <option value="staff">Staff Child</option>
                  <option value="need_based">Need-Based</option>
                  <option value="academic">Academic</option>
                </select>
                <select 
                  className="bg-slate-50 border-none rounded-xl py-2 px-4 text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="all">All</option>
                </select>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-slate-50">
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-500 font-medium">
                  Showing {beneficiaries.length} of {pagination.total} beneficiaries
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={pagination.page === 1 || isLoadingBeneficiaries}
                  className="p-2 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsLeft size={16} />
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || isLoadingBeneficiaries}
                  className="p-2 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                
                <span className="px-4 py-2 text-sm font-medium text-slate-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages || isLoadingBeneficiaries}
                  className="p-2 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={pagination.page === pagination.totalPages || isLoadingBeneficiaries}
                  className="p-2 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Student</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Waiver Type</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Amount Waived</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Period</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoadingBeneficiaries ? (
                    // Loading skeleton
                    Array.from({ length: 3 }).map((_, index) => (
                      <tr key={index} className="animate-pulse">
                        <td className="px-8 py-5">
                          <div className="h-4 w-32 bg-slate-200 rounded"></div>
                          <div className="h-3 w-24 bg-slate-200 rounded mt-2"></div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-4 w-24 bg-slate-200 rounded"></div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-4 w-20 bg-slate-200 rounded"></div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-3 w-20 bg-slate-200 rounded"></div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="h-8 w-8 bg-slate-200 rounded-lg"></div>
                        </td>
                      </tr>
                    ))
                  ) : beneficiaries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <UserCheck className="h-8 w-8 text-slate-400" />
                          </div>
                          <h3 className="text-lg font-bold text-slate-700 mb-2">No beneficiaries found</h3>
                          <p className="text-slate-500 max-w-md">
                            {searchTerm || categoryFilter !== "all" || statusFilter !== "active"
                              ? "Try adjusting your filters or search terms"
                              : "No active waiver beneficiaries. Assign waivers to students to get started."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    beneficiaries.map((b) => (
                      <tr key={b.id} className="group hover:bg-slate-50/30">
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700">
                              {b.student?.first_name} {b.student?.last_name}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                              {b.student?.admission_number}
                            </span>
                            <span className="text-xs text-slate-500 mt-1">
                              {b.student?.class?.class_name}
                              {b.student?.stream?.name && ` • ${b.student.stream.name}`}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${getCategoryColor(b.waiver_type)}`}>
                              {b.percentage ? <Percent size={14} /> : <Tag size={14} />}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-600">
                                {b.waiver?.waiver_name}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {formatCategoryName(b.waiver_type)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="font-black text-emerald-600 text-sm">
                            -{formatCurrency(b.applied_amount)}
                          </div>
                          {b.percentage && (
                            <div className="text-[10px] text-slate-500">
                              {b.percentage}% of total
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(b.is_active)}`}>
                            {b.is_active ? "Active" : "Inactive"}
                          </span>
                          {b.approved_by_user && (
                            <div className="text-[10px] text-slate-500 mt-1">
                              Approved by: {b.approved_by_user.first_name}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-xs text-slate-700">
                            <div>{formatDate(b.start_date)}</div>
                            <div className="text-slate-500">to {formatDate(b.end_date)}</div>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1">
                            Term: {b.term}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleViewStatement(b.student_id)}
                              title="View Statement" 
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all"
                            >
                              <Eye size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeactivateWaiver(b.id)}
                              title="Deactivate Waiver" 
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all"
                              disabled={!b.is_active}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                
                {/* Table Totals */}
                {beneficiaries.length > 0 && (
                  <tfoot className="bg-slate-50 border-t border-slate-200">
                    <tr>
                      <td className="px-8 py-5">
                        <div className="font-bold text-slate-800">
                          TOTAL ({beneficiaries.length} beneficiaries)
                        </div>
                      </td>
                      <td className="px-6 py-5"></td>
                      <td className="px-6 py-5">
                        <div className="font-black text-lg text-emerald-600">
                          -{formatCurrency(beneficiaries.reduce((sum, b) => sum + Number(b.applied_amount), 0))}
                        </div>
                        <div className="text-sm text-slate-500">
                          Total waived amount
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm text-slate-500">
                          {beneficiaries.filter(b => b.is_active).length} active
                        </div>
                      </td>
                      <td className="px-6 py-5"></td>
                      <td className="px-8 py-5"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Card>

          {/* Impact Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-amber-500 to-orange-600 p-8 rounded-[2.5rem] text-white shadow-lg shadow-amber-100 relative overflow-hidden">
              <Zap className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12" />
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-100">Revenue Foregone</p>
              <h3 className="text-4xl font-black mt-1">
                {isLoadingSummary ? "Loading..." : formatCurrency(summary.revenue_foregone)}
              </h3>
              <p className="text-[11px] font-medium text-amber-50 mt-4 leading-relaxed">
                Total waivers applied this term across all programs.
              </p>
            </Card>
            <Card className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex flex-col justify-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Beneficiaries</p>
              <h3 className="text-4xl font-black mt-1 text-slate-800">
                {isLoadingSummary ? "Loading..." : summary.total_beneficiaries} Students
              </h3>
              <div className="mt-4 text-sm text-slate-600">
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(summary.category_distribution).slice(0, 4).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-slate-500">{formatCategoryName(category)}</span>
                      <span className="font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* New Waiver Type Modal */}
      {showNewWaiverModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-slate-800">Create New Waiver Type</h2>
              <button 
                onClick={() => setShowNewWaiverModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600"
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Waiver Name *
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white border border-slate-200 rounded-2xl p-3 font-medium focus:ring-2 focus:ring-indigo-500"
                    value={newWaiver.waiver_name}
                    onChange={(e) => setNewWaiver({...newWaiver, waiver_name: e.target.value})}
                    placeholder="e.g., Academic Excellence Scholarship"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Waiver Type *
                  </label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-2xl p-3 font-medium focus:ring-2 focus:ring-indigo-500"
                    value={newWaiver.waiver_type}
                    onChange={(e) => setNewWaiver({...newWaiver, waiver_type: e.target.value})}
                  >
                    <option value="scholarship">Scholarship</option>
                    <option value="bursary">Bursary</option>
                    <option value="discount">Discount</option>
                    <option value="sibling">Sibling Discount</option>
                    <option value="staff">Staff Child</option>
                    <option value="need_based">Need-Based</option>
                    <option value="academic">Academic</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Category
                  </label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-2xl p-3 font-medium focus:ring-2 focus:ring-indigo-500"
                    value={newWaiver.category}
                    onChange={(e) => setNewWaiver({...newWaiver, category: e.target.value})}
                  >
                    <option value="academic">Academic</option>
                    <option value="sports">Sports</option>
                    <option value="need_based">Need-Based</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Value Type
                  </label>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <input
                        type="number"
                        className="w-full bg-white border border-slate-200 rounded-2xl p-3 font-medium focus:ring-2 focus:ring-indigo-500"
                        value={newWaiver.waiver_amount}
                        onChange={(e) => setNewWaiver({...newWaiver, waiver_amount: e.target.value, percentage: ""})}
                        placeholder="Amount (KES)"
                      />
                    </div>
                    <div className="text-slate-400 py-3">or</div>
                    <div className="flex-1">
                      <input
                        type="number"
                        className="w-full bg-white border border-slate-200 rounded-2xl p-3 font-medium focus:ring-2 focus:ring-indigo-500"
                        value={newWaiver.percentage}
                        onChange={(e) => setNewWaiver({...newWaiver, percentage: e.target.value, waiver_amount: ""})}
                        placeholder="Percentage (%)"
                        max="100"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  className="w-full bg-white border border-slate-200 rounded-2xl p-3 font-medium focus:ring-2 focus:ring-indigo-500"
                  value={newWaiver.description}
                  onChange={(e) => setNewWaiver({...newWaiver, description: e.target.value})}
                  rows={3}
                  placeholder="Describe the waiver criteria and benefits..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Max Applications
                  </label>
                  <input
                    type="number"
                    className="w-full bg-white border border-slate-200 rounded-2xl p-3 font-medium focus:ring-2 focus:ring-indigo-500"
                    value={newWaiver.max_applications}
                    onChange={(e) => setNewWaiver({...newWaiver, max_applications: e.target.value})}
                    placeholder="Unlimited if empty"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Valid From *
                  </label>
                  <input
                    type="date"
                    className="w-full bg-white border border-slate-200 rounded-2xl p-3 font-medium focus:ring-2 focus:ring-indigo-500"
                    value={newWaiver.valid_from}
                    onChange={(e) => setNewWaiver({...newWaiver, valid_from: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Valid To *
                  </label>
                  <input
                    type="date"
                    className="w-full bg-white border border-slate-200 rounded-2xl p-3 font-medium focus:ring-2 focus:ring-indigo-500"
                    value={newWaiver.valid_to}
                    onChange={(e) => setNewWaiver({...newWaiver, valid_to: e.target.value})}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-4 mt-8">
              <button
                onClick={() => setShowNewWaiverModal(false)}
                className="px-6 py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWaiverType}
                disabled={!newWaiver.waiver_name || !newWaiver.valid_from || !newWaiver.valid_to}
                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Waiver Type
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Waiver Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-slate-800">Assign Waiver to Student</h2>
              <button 
                onClick={() => setShowAssignModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600"
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Select Student *
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white border border-slate-200 rounded-2xl p-3 font-medium focus:ring-2 focus:ring-indigo-500"
                    value={assignWaiver.studentId}
                    onChange={(e) => setAssignWaiver({...assignWaiver, studentId: e.target.value})}
                    placeholder="Search student by name or admission..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Waiver Type *
                  </label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-2xl p-3 font-medium focus:ring-2 focus:ring-indigo-500"
                    value={assignWaiver.waiverTypeId}
                    onChange={(e) => setAssignWaiver({...assignWaiver, waiverTypeId: e.target.value})}
                  >
                    <option value="">Select waiver type</option>
                    {waiverTypes.filter(w => w.is_active).map(waiver => (
                      <option key={waiver.id} value={waiver.id}>
                        {waiver.waiver_name} ({formatWaiverValue(waiver)})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Amount *
                  </label>
                  <input
                    type="number"
                    className="w-full bg-white border border-slate-200 rounded-2xl p-3 font-medium focus:ring-2 focus:ring-indigo-500"
                    value={assignWaiver.amount}
                    onChange={(e) => setAssignWaiver({...assignWaiver, amount: e.target.value})}
                    placeholder="Amount to waive"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Reason *
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white border border-slate-200 rounded-2xl p-3 font-medium focus:ring-2 focus:ring-indigo-500"
                    value={assignWaiver.reason}
                    onChange={(e) => setAssignWaiver({...assignWaiver, reason: e.target.value})}
                    placeholder="Reason for waiver"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white border border-slate-200 rounded-2xl p-3 font-medium focus:ring-2 focus:ring-indigo-500"
                    value={assignWaiver.academicYearId}
                    onChange={(e) => setAssignWaiver({...assignWaiver, academicYearId: e.target.value})}
                    placeholder="e.g., 2024/2025"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Term
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white border border-slate-200 rounded-2xl p-3 font-medium focus:ring-2 focus:ring-indigo-500"
                    value={assignWaiver.termId}
                    onChange={(e) => setAssignWaiver({...assignWaiver, termId: e.target.value})}
                    placeholder="e.g., Term 1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    className="w-full bg-white border border-slate-200 rounded-2xl p-3 font-medium focus:ring-2 focus:ring-indigo-500"
                    value={assignWaiver.startDate}
                    onChange={(e) => setAssignWaiver({...assignWaiver, startDate: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  className="w-full bg-white border border-slate-200 rounded-2xl p-3 font-medium focus:ring-2 focus:ring-indigo-500"
                  value={assignWaiver.endDate}
                  onChange={(e) => setAssignWaiver({...assignWaiver, endDate: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-4 mt-8">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-6 py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignWaiver}
                disabled={!assignWaiver.studentId || !assignWaiver.waiverTypeId || !assignWaiver.amount || !assignWaiver.reason || !assignWaiver.startDate || !assignWaiver.endDate}
                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign Waiver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScholarshipsAndDiscounts;
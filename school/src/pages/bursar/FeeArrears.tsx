import React, { useState, useEffect } from "react";
import { 
  AlertCircle, 
  MessageSquare, 
  Phone, 
  ChevronRight, 
  Search, 
  Filter,
  TrendingDown,
  UserX,
  FileWarning,
  Mail,
  Bell,
  RefreshCw,
  Clock,
  Calendar,
  ArrowUpRight,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  DollarSign,
  Users,
  Percent,
  BarChart3
} from "lucide-react";
import Card from "../../components/common/Card";
import { financeAPI } from "../../services/api";
import toast from "react-hot-toast";

/* ---------------- TYPES ---------------- */
type ArrearRecord = {
  id: string;
  student_id: string;
  student_name: string;
  admission_no: string;
  parent_contact: string;
  amount_due: number;
  days_overdue: number;
  last_reminder: string;
  risk_level: "critical" | "high" | "moderate" | "low";
  invoice_count: number;
  total_invoiced: number;
  total_paid: number;
  balance: number;
  class_name: string;
  stream_name?: string;
  last_payment_date?: string;
  last_payment_amount?: number;
  student: {
    first_name: string;
    last_name: string;
    admission_number: string;
    guardian_phone: string;
    class?: {
      class_name: string;
    };
    stream?: {
      name: string;
    };
    credit_balance: number;
  };
  invoices: Array<{
    id: string;
    invoice_number: string;
    total_amount: number;
    amount_paid: number;
    balance: number;
    due_date: string;
    days_overdue: number;
  }>;
};

type ArrearsSummary = {
  total_arrears: number;
  critical_arrears: number;
  high_risk_arrears: number;
  moderate_risk_arrears: number;
  defaulting_students: number;
  collection_rate: string;
  aging_buckets: {
    "0-30": number;
    "31-60": number;
    "61-90": number;
    "91+": number;
  };
  risk_distribution: {
    critical: number;
    high: number;
    moderate: number;
    low: number;
  };
  monthly_trend: Array<{
    month: string;
    arrears: number;
    collected: number;
  }>;
};

type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const FeeArrears: React.FC = () => {
  // State
  const [arrears, setArrears] = useState<ArrearRecord[]>([]);
  const [summary, setSummary] = useState<ArrearsSummary>({
    total_arrears: 0,
    critical_arrears: 0,
    high_risk_arrears: 0,
    moderate_risk_arrears: 0,
    defaulting_students: 0,
    collection_rate: "0%",
    aging_buckets: {
      "0-30": 0,
      "31-60": 0,
      "61-90": 0,
      "91+": 0
    },
    risk_distribution: {
      critical: 0,
      high: 0,
      moderate: 0,
      low: 0
    },
    monthly_trend: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("");
  const [agingFilter, setAgingFilter] = useState<string>("all");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  });

  // Fetch arrears data
  const fetchArrears = async (page = 1) => {
    setIsLoading(true);
    try {
      const params: any = {
        page: page,
        limit: pagination.limit,
        minBalance: 1 // Only get students with outstanding balances
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (riskFilter !== "all") {
        params.riskLevel = riskFilter;
      }

      if (classFilter) {
        params.classId = classFilter;
      }

      if (agingFilter !== "all") {
        params.agingBucket = agingFilter;
      }

      const response = await financeAPI.getDebtorsReport(params);
      
      if (response.data && response.data.success) {
        const data = response.data.data;
        setArrears(Array.isArray(data.debtors) ? data.debtors : []);
        
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
        toast.error("Failed to load arrears data");
        setArrears([]);
      }
    } catch (error: any) {
      console.error("Error fetching arrears:", error);
      toast.error(error.response?.data?.error || "Failed to load arrears data");
      setArrears([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch arrears summary
  const fetchArrearsSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const response = await financeAPI.getArrearsSummary();
      
      if (response.data && response.data.success) {
        setSummary(response.data.data || {
          total_arrears: 0,
          critical_arrears: 0,
          high_risk_arrears: 0,
          moderate_risk_arrears: 0,
          defaulting_students: 0,
          collection_rate: "0%",
          aging_buckets: {
            "0-30": 0,
            "31-60": 0,
            "61-90": 0,
            "91+": 0
          },
          risk_distribution: {
            critical: 0,
            high: 0,
            moderate: 0,
            low: 0
          },
          monthly_trend: []
        });
      }
    } catch (error: any) {
      console.error("Error fetching arrears summary:", error);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // Fetch classes for filter
  const fetchClasses = async () => {
    try {
      const response = await financeAPI.getClasses({
        page: 1,
        limit: 100,
        sortBy: 'name',
        sortOrder: 'asc'
      });
      
      if (response.data && response.data.success) {
        setClasses(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      setClasses([]);
    }
  };

  // Send SMS reminders
  const handleSendSMSReminders = async () => {
    const studentIds = selectedStudents.length > 0 
      ? selectedStudents 
      : arrears.map(arr => arr.student_id);
    
    if (studentIds.length === 0) {
      toast.error("No students selected");
      return;
    }

    setIsSendingReminders(true);
    try {
      await financeAPI.sendFeeReminders({
        studentIds,
        reminderType: 'overdue',
        channel: 'sms',
        message: "URGENT: Your fee balance is overdue. Kindly clear immediately to avoid inconvenience."
      });
      
      toast.success(`SMS reminders sent to ${studentIds.length} student(s)`);
      setSelectedStudents([]);
    } catch (error: any) {
      console.error("Error sending reminders:", error);
      toast.error(error.response?.data?.error || "Failed to send reminders");
    } finally {
      setIsSendingReminders(false);
    }
  };

  // Send email reminders
  const handleSendEmailReminders = async () => {
    const studentIds = selectedStudents.length > 0 
      ? selectedStudents 
      : arrears.map(arr => arr.student_id);
    
    if (studentIds.length === 0) {
      toast.error("No students selected");
      return;
    }

    setIsSendingReminders(true);
    try {
      await financeAPI.sendFeeReminders({
        studentIds,
        reminderType: 'overdue',
        channel: 'email',
        message: "Fee Balance Overdue Notification"
      });
      
      toast.success(`Email reminders sent to ${studentIds.length} student(s)`);
      setSelectedStudents([]);
    } catch (error: any) {
      console.error("Error sending reminders:", error);
      toast.error(error.response?.data?.error || "Failed to send reminders");
    } finally {
      setIsSendingReminders(false);
    }
  };

  // Send combined reminders
  const handleSendCombinedReminders = async () => {
    const studentIds = selectedStudents.length > 0 
      ? selectedStudents 
      : arrears.map(arr => arr.student_id);
    
    if (studentIds.length === 0) {
      toast.error("No students selected");
      return;
    }

    setIsSendingReminders(true);
    try {
      await financeAPI.sendFeeReminders({
        studentIds,
        reminderType: 'overdue',
        channel: 'both',
        message: "URGENT: Fee Balance Overdue"
      });
      
      toast.success(`Reminders sent via SMS & Email to ${studentIds.length} student(s)`);
      setSelectedStudents([]);
    } catch (error: any) {
      console.error("Error sending reminders:", error);
      toast.error(error.response?.data?.error || "Failed to send reminders");
    } finally {
      setIsSendingReminders(false);
    }
  };

  // View student statement
  const handleViewStatement = (studentId: string) => {
    window.open(`/finance/statement/${studentId}`, '_blank');
  };

  // Record payment
  const handleRecordPayment = (studentId: string) => {
    window.open(`/finance/student/${studentId}/payment`, '_blank');
  };

  // Toggle student selection
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Select all students
  const toggleSelectAll = () => {
    if (selectedStudents.length === arrears.length && arrears.length > 0) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(arrears.map(arr => arr.student_id));
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

  // Get risk styles
  const getRiskStyles = (level: string) => {
    switch (level) {
      case "critical": return "text-rose-600 bg-rose-50 border-rose-100";
      case "high": return "text-amber-600 bg-amber-50 border-amber-100";
      case "moderate": return "text-blue-600 bg-blue-50 border-blue-100";
      default: return "text-emerald-600 bg-emerald-50 border-emerald-100";
    }
  };

  // Get risk icon
  const getRiskIcon = (level: string) => {
    switch (level) {
      case "critical": return <AlertCircle size={12} />;
      case "high": return <FileWarning size={12} />;
      case "moderate": return <Clock size={12} />;
      default: return <CheckCircle2 size={12} />;
    }
  };

  // Calculate aging bucket
  const getAgingBucket = (days: number) => {
    if (days <= 30) return "0-30";
    if (days <= 60) return "31-60";
    if (days <= 90) return "61-90";
    return "91+";
  };

  // Get aging bucket color
  const getAgingColor = (days: number) => {
    if (days <= 30) return "text-blue-600 bg-blue-50";
    if (days <= 60) return "text-amber-600 bg-amber-50";
    if (days <= 90) return "text-orange-600 bg-orange-50";
    return "text-rose-600 bg-rose-50";
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchArrears(page);
    }
  };

  // Refresh data
  const handleRefresh = () => {
    fetchArrears(1);
    fetchArrearsSummary();
  };

  // Initialize
  useEffect(() => {
    fetchArrears();
    fetchArrearsSummary();
    fetchClasses();
  }, []);

  // Fetch when filters change
  useEffect(() => {
    fetchArrears(1);
  }, [searchTerm, riskFilter, classFilter, agingFilter]);

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      
      {/* 1. Recovery Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            Debt Recovery <FileWarning className="text-rose-500" />
          </h1>
          <p className="text-slate-500 font-medium">Tracking aged balances and collection risks.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button 
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
          <button 
            onClick={handleSendSMSReminders}
            disabled={isLoading || isSendingReminders || arrears.length === 0}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MessageSquare size={16} /> SMS ({selectedStudents.length || "All"})
          </button>
          <button 
            onClick={handleSendEmailReminders}
            disabled={isLoading || isSendingReminders || arrears.length === 0}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mail size={16} /> Email ({selectedStudents.length || "All"})
          </button>
          <button 
            onClick={handleSendCombinedReminders}
            disabled={isLoading || isSendingReminders || arrears.length === 0}
            className="flex items-center gap-2 bg-rose-600 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Bell size={16} /> {isSendingReminders ? "Sending..." : "SMS & Email"}
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      {/* 2. Debt Aging Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm p-6 rounded-[2rem] bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Arrears</p>
              <h3 className="text-2xl font-black text-rose-600 mt-2">
                {isLoadingSummary ? "Loading..." : formatCurrency(summary.total_arrears)}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {summary.defaulting_students} students
              </p>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
              <TrendingDown size={24} />
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm p-6 rounded-[2rem] bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Critical (30 Days)</p>
              <h3 className="text-2xl font-black text-rose-500 mt-2">
                {isLoadingSummary ? "Loading..." : formatCurrency(summary.critical_arrears)}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {summary.risk_distribution.critical} students
              </p>
            </div>
            <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl">
              <AlertCircle size={24} />
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm p-6 rounded-[2rem] bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Defaulting Students</p>
              <h3 className="text-2xl font-black text-slate-700 mt-2">
                {isLoadingSummary ? "Loading..." : summary.defaulting_students}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {((summary.defaulting_students / summary.risk_distribution.critical + summary.risk_distribution.high + summary.risk_distribution.moderate + summary.risk_distribution.low) * 100).toFixed(1)}% of debtors
              </p>
            </div>
            <div className="p-3 bg-slate-50 text-slate-700 rounded-2xl">
              <UserX size={24} />
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm p-6 rounded-[2rem] bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Collection Rate</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-2">
                {isLoadingSummary ? "Loading..." : summary.collection_rate}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Overall collection efficiency
              </p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Percent size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Aging Distribution */}
      <Card className="border-none shadow-sm p-6 rounded-[2rem] bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-800">Aging Analysis</h3>
          <div className="text-sm text-slate-500">
            Total: {formatCurrency(summary.total_arrears)}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "0-30 Days", key: "0-30", color: "bg-blue-500" },
            { label: "31-60 Days", key: "31-60", color: "bg-amber-500" },
            { label: "61-90 Days", key: "61-90", color: "bg-orange-500" },
            { label: "91+ Days", key: "91+", color: "bg-rose-500" }
          ].map((bucket) => (
            <div key={bucket.key} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-700">{bucket.label}</span>
                <span className="font-bold text-slate-800">
                  {formatCurrency(summary.aging_buckets[bucket.key as keyof typeof summary.aging_buckets] || 0)}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className={`${bucket.color} h-2 rounded-full`}
                  style={{ 
                    width: `${summary.total_arrears > 0 ? 
                      (summary.aging_buckets[bucket.key as keyof typeof summary.aging_buckets] / summary.total_arrears) * 100 : 0}%` 
                  }}
                ></div>
              </div>
              <div className="text-xs text-slate-500">
                {summary.total_arrears > 0 ? 
                  ((summary.aging_buckets[bucket.key as keyof typeof summary.aging_buckets] / summary.total_arrears) * 100).toFixed(1) : 0}%
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 3. Search & Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search student or admission..."
            className="w-full bg-white border-none shadow-sm rounded-2xl p-4 pl-12 font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchArrears(1)}
          />
        </div>

        {/* Risk Filter */}
        <div className="relative">
          <select 
            className="w-full bg-white border-none shadow-sm rounded-2xl p-4 font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-indigo-500 pl-4"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
          >
            <option value="all">All Risk Levels</option>
            <option value="critical">Critical Only</option>
            <option value="high">High Risk</option>
            <option value="moderate">Moderate Risk</option>
            <option value="low">Low Risk</option>
          </select>
        </div>

        {/* Class Filter */}
        <div className="relative">
          <select 
            className="w-full bg-white border-none shadow-sm rounded-2xl p-4 font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-indigo-500 pl-4"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option value="">All Classes</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.class_name}
              </option>
            ))}
          </select>
        </div>

        {/* Aging Filter */}
        <div className="relative">
          <select 
            className="w-full bg-white border-none shadow-sm rounded-2xl p-4 font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-indigo-500 pl-4"
            value={agingFilter}
            onChange={(e) => setAgingFilter(e.target.value)}
          >
            <option value="all">All Aging Periods</option>
            <option value="0-30">0-30 Days</option>
            <option value="31-60">31-60 Days</option>
            <option value="61-90">61-90 Days</option>
            <option value="91+">91+ Days</option>
          </select>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors text-sm font-medium"
          >
            <input
              type="checkbox"
              checked={arrears.length > 0 && selectedStudents.length === arrears.length}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Select All ({selectedStudents.length} selected)
          </button>
          <span className="text-sm text-slate-500 font-medium">
            Showing {arrears.length} of {pagination.total} defaulting students
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(1)}
            disabled={pagination.page === 1 || isLoading}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsLeft size={18} />
          </button>
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1 || isLoading}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          
          <span className="px-4 py-2 text-sm font-medium text-slate-700">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages || isLoading}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRightIcon size={18} />
          </button>
          <button
            onClick={() => handlePageChange(pagination.totalPages)}
            disabled={pagination.page === pagination.totalPages || isLoading}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsRight size={18} />
          </button>
        </div>
      </div>

      {/* 4. Arrears Table */}
      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-0 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-8 py-5 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    checked={arrears.length > 0 && selectedStudents.length === arrears.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Student & Contact</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Class & Balance</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Aging Analysis</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Risk Status</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Last Payment</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-8 py-5">
                      <div className="h-4 w-4 bg-slate-200 rounded"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 w-32 bg-slate-200 rounded"></div>
                      <div className="h-3 w-24 bg-slate-200 rounded mt-2"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 w-24 bg-slate-200 rounded"></div>
                      <div className="h-3 w-20 bg-slate-200 rounded mt-2"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 w-16 bg-slate-200 rounded"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-3 w-20 bg-slate-200 rounded"></div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="h-8 w-8 bg-slate-200 rounded-lg ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : arrears.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <FileWarning className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-700 mb-2">No arrears found</h3>
                      <p className="text-slate-500 max-w-md">
                        {searchTerm || riskFilter !== "all" || classFilter || agingFilter !== "all"
                          ? "Try adjusting your filters or search terms"
                          : "Great news! No outstanding fee balances at the moment."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                arrears.map((record) => (
                  <tr key={record.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-indigo-600"
                        checked={selectedStudents.includes(record.student_id)}
                        onChange={() => toggleStudentSelection(record.student_id)}
                      />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">
                          {record.student?.first_name} {record.student?.last_name}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 flex items-center gap-1">
                          <Phone size={10} /> {record.student?.guardian_phone || "No contact"}
                        </span>
                        <span className="text-xs text-slate-500 mt-1">
                          Adm: {record.student?.admission_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-700">
                          {record.student?.class?.class_name}
                          {record.student?.stream?.name && ` • ${record.student.stream.name}`}
                        </span>
                        <span className="font-bold text-rose-600 text-lg mt-1">
                          {formatCurrency(record.balance)}
                        </span>
                        <span className="text-xs text-slate-500 mt-1">
                          Credit: {formatCurrency(record.student?.credit_balance || 0)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getAgingColor(record.days_overdue)}`}>
                          {record.days_overdue} Days
                        </span>
                        <span className="text-[9px] font-black uppercase text-slate-300 mt-1">
                          Bucket: {getAgingBucket(record.days_overdue)}
                        </span>
                        {record.invoices && record.invoices.length > 0 && (
                          <span className="text-[10px] text-slate-500 mt-1">
                            {record.invoices.length} overdue invoice(s)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${getRiskStyles(record.risk_level)}`}>
                        {getRiskIcon(record.risk_level)}
                        <span className="ml-1">
                          {record.risk_level.charAt(0).toUpperCase() + record.risk_level.slice(1)}
                        </span>
                      </div>
                      {record.last_reminder && (
                        <span className="text-[10px] text-slate-500 block mt-1">
                          Last reminder: {formatDate(record.last_reminder)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm text-slate-700">
                        {record.last_payment_date ? (
                          <>
                            <div>{formatDate(record.last_payment_date)}</div>
                            <div className="text-xs text-emerald-600 font-medium">
                              {formatCurrency(record.last_payment_amount || 0)}
                            </div>
                          </>
                        ) : (
                          <span className="text-rose-500 text-xs">No payments yet</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleViewStatement(record.student_id)}
                          title="View Statement" 
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handleRecordPayment(record.student_id)}
                          title="Record Payment" 
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all"
                        >
                          <DollarSign size={16} />
                        </button>
                        <button 
                          onClick={() => handleSendSMSReminders()}
                          title="Send Reminder" 
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all"
                        >
                          <MessageSquare size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            
            {/* Table Totals */}
            {arrears.length > 0 && (
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td className="px-8 py-5">
                    <div className="font-bold text-slate-800">
                      TOTAL ({arrears.length} students)
                    </div>
                  </td>
                  <td className="px-6 py-5"></td>
                  <td className="px-6 py-5">
                    <div className="font-black text-lg text-rose-600">
                      {formatCurrency(arrears.reduce((sum, arr) => sum + Number(arr.balance), 0))}
                    </div>
                    <div className="text-sm text-slate-500">
                      Total outstanding balance
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm text-slate-500">
                      Avg: {Math.round(arrears.reduce((sum, arr) => sum + arr.days_overdue, 0) / arrears.length)} days
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                      <span className="text-xs text-slate-600">
                        {arrears.filter(a => a.risk_level === 'critical').length} critical
                      </span>
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

      {/* Footer */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-sm text-slate-500">
          Data as of {new Date().toLocaleDateString()} • Last updated: Just now
        </div>
        <div className="flex items-center gap-3">
          {pagination.total > pagination.limit && (
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={isLoading || pagination.page === pagination.totalPages}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Load More
            </button>
          )}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeeArrears;
import React, { useState, useEffect } from "react";
import { 
  Search, 
  Calendar, 
  Download, 
  Filter, 
  CreditCard, 
  Smartphone, 
  Building2, 
  Receipt,
  ArrowUpRight,
  History,
  RefreshCw,
  Printer,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  Mail
} from "lucide-react";
import Card from "../../components/common/Card";
import { financeAPI } from "../../services/api";
import toast from "react-hot-toast";

/* ---------------- TYPES ---------------- */
type PaymentRecord = {
  id: string;
  payment_reference: string;
  receiptNo: string;
  student_id: string;
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
  amount: number;
  payment_method: "M-PESA" | "BANK" | "CASH" | "BURSARY" | "CHEQUE" | "OTHER";
  transaction_id?: string;
  payer_name: string;
  payer_phone?: string;
  payer_email?: string;
  status: "completed" | "pending" | "failed" | "reconciled";
  verified_at: string;
  created_at: string;
  invoice_id?: string;
  invoice?: {
    invoice_number: string;
    total_amount: number;
  };
  verified_by_user?: {
    first_name: string;
    last_name: string;
  };
  reconciled_at?: string;
};

type PaymentSummary = {
  total_revenue: number;
  total_payments: number;
  mpesa_total: number;
  bank_total: number;
  cash_total: number;
  today_collection: number;
  weekly_collection: number;
  monthly_collection: number;
  collection_growth: number;
  average_transaction: number;
  reconciled_total: number;
  pending_reconciliation: number;
};

type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const PaymentHistory: React.FC = () => {
  // State
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({
    total_revenue: 0,
    total_payments: 0,
    mpesa_total: 0,
    bank_total: 0,
    cash_total: 0,
    today_collection: 0,
    weekly_collection: 0,
    monthly_collection: 0,
    collection_growth: 0,
    average_transaction: 0,
    reconciled_total: 0,
    pending_reconciliation: 0
  });
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  });

  // Fetch payment history
  const fetchPayments = async (page = 1) => {
    setIsLoading(true);
    try {
      const params: any = {
        page: page,
        limit: pagination.limit
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (methodFilter !== "all") {
        params.method = methodFilter;
      }

      if (activeTab !== "all") {
        params.status = activeTab;
      }

      if (dateRange.start) {
        params.startDate = dateRange.start;
      }

      if (dateRange.end) {
        params.endDate = dateRange.end;
      }

      const response = await financeAPI.getPaymentHistory(params);
      
      if (response.data && response.data.success) {
        const data = response.data.data;
        setPayments(Array.isArray(data.payments) ? data.payments : []);
        
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
        toast.error("Failed to load payment history");
        setPayments([]);
      }
    } catch (error: any) {
      console.error("Error fetching payments:", error);
      toast.error(error.response?.data?.error || "Failed to load payment history");
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch payment summary
  const fetchPaymentSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const response = await financeAPI.getPaymentSummary();
      
      if (response.data && response.data.success) {
        setSummary(response.data.data || {
          total_revenue: 0,
          total_payments: 0,
          mpesa_total: 0,
          bank_total: 0,
          cash_total: 0,
          today_collection: 0,
          weekly_collection: 0,
          monthly_collection: 0,
          collection_growth: 0,
          average_transaction: 0,
          reconciled_total: 0,
          pending_reconciliation: 0
        });
      }
    } catch (error: any) {
      console.error("Error fetching payment summary:", error);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // Export payment report
  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      const params = {
        reportType: 'payments' as const,
        format: 'excel' as const,
        filters: {
          method: methodFilter !== "all" ? methodFilter : undefined,
          status: activeTab !== "all" ? activeTab : undefined,
          search: searchTerm || undefined,
          startDate: dateRange.start || undefined,
          endDate: dateRange.end || undefined
        }
      };
      
      const response = await financeAPI.exportFinancialReport(params);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payment-history-${new Date().toISOString().split('T')[0]}.xlsx`);
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

  // Download receipt
  const handleDownloadReceipt = async (paymentId: string) => {
    try {
      const response = await financeAPI.downloadReceiptPDF(paymentId);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("Receipt downloaded");
    } catch (error: any) {
      console.error("Error downloading receipt:", error);
      toast.error(error.response?.data?.error || "Failed to download receipt");
    }
  };

  // View receipt in browser
  const handleViewReceipt = (paymentId: string) => {
    window.open(`/finance/receipts/${paymentId}?format=html`, '_blank');
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

  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get method icon and color
  const getMethodIcon = (method: string) => {
    switch (method.toUpperCase()) {
      case "M-PESA":
      case "MPESA":
        return {
          icon: <Smartphone className="text-emerald-500" size={16} />,
          bgColor: "bg-emerald-50",
          textColor: "text-emerald-600"
        };
      case "BANK":
        return {
          icon: <Building2 className="text-blue-500" size={16} />,
          bgColor: "bg-blue-50",
          textColor: "text-blue-600"
        };
      case "BURSARY":
        return {
          icon: <CreditCard className="text-purple-500" size={16} />,
          bgColor: "bg-purple-50",
          textColor: "text-purple-600"
        };
      case "CHEQUE":
        return {
          icon: <Receipt className="text-amber-500" size={16} />,
          bgColor: "bg-amber-50",
          textColor: "text-amber-600"
        };
      default:
        return {
          icon: <CreditCard className="text-slate-500" size={16} />,
          bgColor: "bg-slate-50",
          textColor: "text-slate-600"
        };
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "reconciled":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "pending":
        return "bg-amber-50 text-amber-600 border-amber-100";
      case "failed":
        return "bg-rose-50 text-rose-600 border-rose-100";
      default:
        return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 size={12} />;
      case "reconciled":
        return <CheckCircle2 size={12} />;
      case "pending":
        return <Clock size={12} />;
      case "failed":
        return <XCircle size={12} />;
      default:
        return <AlertCircle size={12} />;
    }
  };

  // Calculate date ranges
  const getDateRanges = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    return {
      today: today.toISOString().split('T')[0],
      yesterday: yesterday.toISOString().split('T')[0],
      lastWeek: lastWeek.toISOString().split('T')[0],
      lastMonth: lastMonth.toISOString().split('T')[0]
    };
  };

  // Handle quick date filter
  const handleQuickDateFilter = (range: string) => {
    const dates = getDateRanges();
    const today = new Date().toISOString().split('T')[0];
    
    switch (range) {
      case "today":
        setDateRange({ start: today, end: today });
        break;
      case "yesterday":
        setDateRange({ start: dates.yesterday, end: dates.yesterday });
        break;
      case "week":
        setDateRange({ start: dates.lastWeek, end: today });
        break;
      case "month":
        setDateRange({ start: dates.lastMonth, end: today });
        break;
      default:
        setDateRange({});
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchPayments(page);
    }
  };

  // Refresh data
  const handleRefresh = () => {
    fetchPayments(1);
    fetchPaymentSummary();
  };

  // Initialize
  useEffect(() => {
    fetchPayments();
    fetchPaymentSummary();
  }, []);

  // Fetch when filters change
  useEffect(() => {
    fetchPayments(1);
  }, [searchTerm, methodFilter, activeTab, dateRange]);

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            Payment Ledger <History className="text-indigo-500" />
          </h1>
          <p className="text-slate-500 font-medium">Historical record of all verified school revenue.</p>
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
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            <Printer size={16} /> Print
          </button>
          <button 
            onClick={handleExportReport}
            disabled={isLoading || isExporting || payments.length === 0}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet size={16} /> {isExporting ? "Exporting..." : "Export Report"}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border-none shadow-sm p-6 rounded-[2rem]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Revenue</p>
              <h3 className="text-2xl font-black text-slate-800 mt-2">
                {isLoadingSummary ? "Loading..." : formatCurrency(summary.total_revenue)}
              </h3>
              <div className="flex items-center mt-2">
                <span className={`text-xs font-bold ${summary.collection_growth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {summary.collection_growth >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(summary.collection_growth)}%
                </span>
                <span className="text-xs text-slate-500 ml-2">from last month</span>
              </div>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <DollarSign size={24} />
            </div>
          </div>
        </Card>

        <Card className="bg-white border-none shadow-sm p-6 rounded-[2rem]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transactions</p>
              <h3 className="text-2xl font-black text-slate-800 mt-2">
                {isLoadingSummary ? "Loading..." : summary.total_payments.toLocaleString()}
              </h3>
              <p className="text-xs text-slate-500 mt-2">
                Avg: {formatCurrency(summary.average_transaction)}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <CreditCard size={24} />
            </div>
          </div>
        </Card>

        <Card className="bg-white border-none shadow-sm p-6 rounded-[2rem]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Collection</p>
              <h3 className="text-2xl font-black text-slate-800 mt-2">
                {isLoadingSummary ? "Loading..." : formatCurrency(summary.monthly_collection)}
              </h3>
              <p className="text-xs text-slate-500 mt-2">
                Weekly: {formatCurrency(summary.weekly_collection)}
              </p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Calendar size={24} />
            </div>
          </div>
        </Card>

        <Card className="bg-white border-none shadow-sm p-6 rounded-[2rem]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reconciliation</p>
              <h3 className="text-2xl font-black text-slate-800 mt-2">
                {isLoadingSummary ? "Loading..." : formatCurrency(summary.reconciled_total)}
              </h3>
              <p className="text-xs text-slate-500 mt-2">
                Pending: {formatCurrency(summary.pending_reconciliation)}
              </p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <CheckCircle2 size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Payment Methods Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-none shadow-sm p-6 rounded-[2rem]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">M-PESA</p>
            <Smartphone className="text-emerald-500" size={20} />
          </div>
          <h3 className="text-2xl font-black text-emerald-600">
            {isLoadingSummary ? "Loading..." : formatCurrency(summary.mpesa_total)}
          </h3>
          <div className="mt-4">
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-emerald-500 h-2 rounded-full"
                style={{ 
                  width: `${summary.total_revenue > 0 ? (summary.mpesa_total / summary.total_revenue) * 100 : 0}%` 
                }}
              ></div>
            </div>
          </div>
        </Card>

        <Card className="bg-white border-none shadow-sm p-6 rounded-[2rem]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BANK TRANSFERS</p>
            <Building2 className="text-blue-500" size={20} />
          </div>
          <h3 className="text-2xl font-black text-blue-600">
            {isLoadingSummary ? "Loading..." : formatCurrency(summary.bank_total)}
          </h3>
          <div className="mt-4">
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full"
                style={{ 
                  width: `${summary.total_revenue > 0 ? (summary.bank_total / summary.total_revenue) * 100 : 0}%` 
                }}
              ></div>
            </div>
          </div>
        </Card>

        <Card className="bg-white border-none shadow-sm p-6 rounded-[2rem]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CASH & OTHERS</p>
            <CreditCard className="text-slate-500" size={20} />
          </div>
          <h3 className="text-2xl font-black text-slate-600">
            {isLoadingSummary ? "Loading..." : formatCurrency(summary.cash_total)}
          </h3>
          <div className="mt-4">
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-slate-500 h-2 rounded-full"
                style={{ 
                  width: `${summary.total_revenue > 0 ? (summary.cash_total / summary.total_revenue) * 100 : 0}%` 
                }}
              ></div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Status Tabs */}
        <div className="flex bg-slate-200/50 p-1 rounded-2xl">
          {['all', 'completed', 'reconciled', 'pending', 'failed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex-1 text-center ${
                activeTab === tab ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search student, receipt, or reference..."
            className="w-full bg-white border-none shadow-sm rounded-2xl p-4 pl-12 font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchPayments(1)}
          />
        </div>

        {/* Method Filter */}
        <div className="relative">
          <select 
            className="w-full bg-white border-none shadow-sm rounded-2xl p-4 font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-indigo-500 pl-4"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="all">All Payment Methods</option>
            <option value="M-PESA">M-PESA</option>
            <option value="BANK">Bank Transfer</option>
            <option value="CASH">Cash</option>
            <option value="BURSARY">Bursary</option>
            <option value="CHEQUE">Cheque</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Quick Date Filters */}
        <div className="flex gap-2">
          {['today', 'week', 'month', 'clear'].map((range) => (
            <button
              key={range}
              onClick={() => range === 'clear' ? setDateRange({}) : handleQuickDateFilter(range)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                range === 'clear' 
                  ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500 font-medium">
            Showing {payments.length} of {pagination.total} payments
          </span>
          {dateRange.start && (
            <span className="text-xs text-slate-500">
              Period: {formatDate(dateRange.start)} {dateRange.end && `to ${formatDate(dateRange.end)}`}
            </span>
          )}
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
            <ChevronRight size={18} />
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

      {/* Ledger Table */}
      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-0 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Receipt & Date</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Student Details</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Payment Method</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Amount</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-8 py-5">
                      <div className="h-4 w-24 bg-slate-200 rounded"></div>
                      <div className="h-3 w-20 bg-slate-200 rounded mt-2"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 w-32 bg-slate-200 rounded"></div>
                      <div className="h-3 w-24 bg-slate-200 rounded mt-2"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-slate-200 rounded-lg"></div>
                        <div className="h-4 w-20 bg-slate-200 rounded"></div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 w-20 bg-slate-200 rounded ml-auto"></div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="h-8 w-8 bg-slate-200 rounded-lg ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-700 mb-2">No payment records found</h3>
                      <p className="text-slate-500 max-w-md">
                        {searchTerm || methodFilter !== "all" || activeTab !== "all" || dateRange.start
                          ? "Try adjusting your filters or search terms"
                          : "No payment data available for the selected period."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                payments.map((payment) => {
                  const method = getMethodIcon(payment.payment_method);
                  return (
                    <tr key={payment.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-indigo-600 uppercase tracking-tighter">
                            {payment.payment_reference}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400 mt-1">
                            {formatDate(payment.verified_at || payment.created_at)}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">
                            {formatTime(payment.verified_at || payment.created_at)}
                          </span>
                          {payment.invoice && (
                            <span className="text-[9px] text-slate-500 mt-1">
                              Invoice: {payment.invoice.invoice_number}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">
                            {payment.student.first_name} {payment.student.last_name}
                          </span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                            Adm: {payment.student.admission_number}
                          </span>
                          <span className="text-xs text-slate-500 mt-1">
                            {payment.student.class?.class_name}
                            {payment.student.stream?.name && ` • ${payment.student.stream.name}`}
                          </span>
                          {payment.payer_name && (
                            <span className="text-[10px] text-slate-400 mt-1">
                              Payer: {payment.payer_name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${method.bgColor}`}>
                            {method.icon}
                          </div>
                          <div className="flex flex-col">
                            <span className={`text-xs font-bold ${method.textColor}`}>
                              {payment.payment_method}
                            </span>
                            {payment.transaction_id && (
                              <span className="text-[10px] font-mono text-slate-400 uppercase truncate max-w-[120px]">
                                {payment.transaction_id}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusBadge(payment.status)}`}>
                          {getStatusIcon(payment.status)}
                          <span className="ml-1">
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                        </div>
                        {payment.reconciled_at && (
                          <span className="text-[10px] text-blue-500 block mt-1">
                            Reconciled: {formatDate(payment.reconciled_at)}
                          </span>
                        )}
                        {payment.verified_by_user && (
                          <span className="text-[10px] text-slate-400 block mt-1">
                            Verified by: {payment.verified_by_user.first_name} {payment.verified_by_user.last_name}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="font-black text-slate-900 text-lg">
                          {formatCurrency(payment.amount)}
                        </div>
                        {payment.invoice && (
                          <div className="text-xs text-slate-500 mt-1">
                            Invoice Total: {formatCurrency(payment.invoice.total_amount)}
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleViewReceipt(payment.id)}
                            title="View Receipt" 
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => handleDownloadReceipt(payment.id)}
                            title="Download Receipt" 
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all"
                          >
                            <Download size={16} />
                          </button>
                          <button 
                            onClick={() => window.open(`/finance/student/${payment.student_id}/statement`, '_blank')}
                            title="View Student Statement" 
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all"
                          >
                            <Receipt size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            
            {/* Table Totals */}
            {payments.length > 0 && (
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td className="px-8 py-5">
                    <div className="font-bold text-slate-800">
                      TOTAL ({payments.length} payments)
                    </div>
                  </td>
                  <td className="px-6 py-5"></td>
                  <td className="px-6 py-5"></td>
                  <td className="px-6 py-5">
                    <div className="text-sm text-slate-500">
                      {payments.filter(p => p.status === 'completed' || p.status === 'reconciled').length} completed
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="font-black text-lg text-emerald-600">
                      {formatCurrency(payments.reduce((sum, p) => sum + Number(p.amount), 0))}
                    </div>
                    <div className="text-sm text-slate-500">
                      Total collected amount
                    </div>
                  </td>
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

export default PaymentHistory;
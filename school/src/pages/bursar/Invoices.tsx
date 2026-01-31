import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Send, 
  Printer, 
  Search, 
  Filter, 
  MoreHorizontal, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Zap,
  Download,
  Mail,
  Eye,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Users,
  CreditCard,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  Bell,
  FileSpreadsheet,
  BarChart3,
  Receipt,
  Wallet,
  FileBarChart,
  Award,
  Target
} from "lucide-react";
import Card from "../../components/common/Card";
import { financeAPI } from "../../services/api";
import toast from "react-hot-toast";

/* ---------------- TYPES ---------------- */
type Invoice = {
  id: string;
  invoice_number: string;
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
  class_id: string;
  amount: number;
  total_amount: number;
  amount_paid: number;
  balance: number;
  date: string;
  due_date: string;
  status: "paid" | "partial" | "pending" | "overdue" | "cancelled";
  academic_year_id: string;
  term_id: string;
  created_at: string;
  invoice_items: InvoiceItem[];
  term?: {
    term_name: string;
  };
  academic_year?: {
    year_name: string;
  };
};

type InvoiceItem = {
  id: string;
  item_name: string;
  amount: number;
  total_amount: number;
  description?: string;
};

type InvoiceSummary = {
  total_invoiced: number;
  total_paid: number;
  total_outstanding: number;
  total_invoices: number;
  pending_invoices: number;
  paid_invoices: number;
  overdue_invoices: number;
  collection_rate: string;
};

type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const Invoices: React.FC = () => {
  // State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary>({
    total_invoiced: 0,
    total_paid: 0,
    total_outstanding: 0,
    total_invoices: 0,
    pending_invoices: 0,
    paid_invoices: 0,
    overdue_invoices: 0,
    collection_rate: "0%"
  });
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [classes, setClasses] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  });

  // Fetch invoices data
  const fetchInvoices = async (page = 1) => {
    setIsLoading(true);
    try {
      const params: any = {
        page: page,
        limit: pagination.limit
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (classFilter) {
        params.classId = classFilter;
      }

      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      const response = await financeAPI.getInvoices(params);
      
      if (response.data && response.data.success) {
        const data = response.data.data;
        setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
        
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
        toast.error("Failed to load invoices");
        setInvoices([]);
      }
    } catch (error: any) {
      console.error("Error fetching invoices:", error);
      toast.error(error.response?.data?.error || "Failed to load invoices");
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch invoice summary
  const fetchInvoiceSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const response = await financeAPI.getInvoiceSummary();
      
      if (response.data && response.data.success) {
        setSummary(response.data.data || {
          total_invoiced: 0,
          total_paid: 0,
          total_outstanding: 0,
          total_invoices: 0,
          pending_invoices: 0,
          paid_invoices: 0,
          overdue_invoices: 0,
          collection_rate: "0%"
        });
      }
    } catch (error: any) {
      console.error("Error fetching invoice summary:", error);
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

  // Generate invoices for a class
  const handleGenerateClassInvoices = async () => {
    if (!classFilter) {
      toast.error("Please select a class first");
      return;
    }

    setIsGenerating(true);
    try {
      const currentDate = new Date();
      const dueDate = new Date(currentDate.setDate(currentDate.getDate() + 30)).toISOString().split('T')[0];
      
      const payload = {
        classId: classFilter,
        termId: "", // You'll need to get current term ID
        academicYearId: "", // You'll need to get current academic year ID
        dueDate: dueDate,
        notes: "Auto-generated invoices"
      };

      const response = await financeAPI.generateClassInvoices(payload);
      
      if (response.data && response.data.success) {
        toast.success(`Generated ${response.data.count} invoices successfully`);
        fetchInvoices(1);
        fetchInvoiceSummary();
      } else {
        toast.error(response.data?.error || "Failed to generate invoices");
      }
    } catch (error: any) {
      console.error("Error generating invoices:", error);
      toast.error(error.response?.data?.error || "Failed to generate invoices");
    } finally {
      setIsGenerating(false);
    }
  };

  // Export invoices
  const handleExportInvoices = async () => {
    setIsExporting(true);
    try {
      const params = {
        reportType: 'ledger' as const,
        format: 'excel' as const,
        filters: {
          classId: classFilter || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          search: searchTerm || undefined
        }
      };
      
      const response = await financeAPI.exportFinanceReport(params);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoices-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("Export started successfully");
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error(error.response?.data?.error || "Failed to export invoices");
    } finally {
      setIsExporting(false);
    }
  };

  // Send invoice reminders
  const handleSendReminders = async () => {
    const invoiceIds = selectedInvoices.length > 0 
      ? selectedInvoices 
      : invoices.map(inv => inv.id);
    
    if (invoiceIds.length === 0) {
      toast.error("No invoices selected");
      return;
    }

    try {
      // Get student IDs from selected invoices
      const studentIds = invoices
        .filter(inv => invoiceIds.includes(inv.id))
        .map(inv => inv.student_id);

      await financeAPI.sendFeeReminders({
        studentIds,
        reminderType: 'overdue',
        channel: 'both',
        message: "Kindly clear your outstanding invoice balance."
      });
      
      toast.success(`Reminders sent for ${studentIds.length} invoice(s)`);
      setSelectedInvoices([]);
    } catch (error: any) {
      console.error("Reminder error:", error);
      toast.error(error.response?.data?.error || "Failed to send reminders");
    }
  };

  // View individual invoice
  const handleViewInvoice = (invoiceId: string) => {
    window.open(`/finance/invoices/${invoiceId}`, '_blank');
  };

  // View receipt for payment
  const handleViewReceipt = (paymentId: string) => {
    if (paymentId) {
      window.open(`/finance/receipts/${paymentId}`, '_blank');
    }
  };

  // Toggle invoice selection
  const toggleInvoiceSelection = (invoiceId: string) => {
    setSelectedInvoices(prev =>
      prev.includes(invoiceId)
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  // Select all invoices
  const toggleSelectAll = () => {
    if (selectedInvoices.length === invoices.length && invoices.length > 0) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(invoices.map(inv => inv.id));
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

  // Get status badge styles
  const getStatusBadge = (status: string) => {
    const styles = {
      paid: "bg-emerald-50 text-emerald-600 border-emerald-100",
      partial: "bg-amber-50 text-amber-600 border-amber-100",
      pending: "bg-blue-50 text-blue-600 border-blue-100",
      overdue: "bg-rose-50 text-rose-600 border-rose-100",
      cancelled: "bg-slate-50 text-slate-600 border-slate-100",
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid": return <CheckCircle2 size={12} className="mr-1" />;
      case "overdue": return <AlertCircle size={12} className="mr-1" />;
      case "partial": return <Clock size={12} className="mr-1" />;
      default: return <Clock size={12} className="mr-1" />;
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchInvoices(page);
    }
  };

  // Refresh all data
  const handleRefresh = () => {
    fetchInvoices(1);
    fetchInvoiceSummary();
  };

  // Initial data fetch
  useEffect(() => {
    fetchInvoices();
    fetchInvoiceSummary();
    fetchClasses();
  }, []);

  // Fetch when filters change
  useEffect(() => {
    fetchInvoices(1);
  }, [searchTerm, classFilter, statusFilter]);

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      
      {/* 1. Top Navigation & Global Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Invoicing Engine</h1>
          <p className="text-slate-500 font-medium">Generate and manage student fee statements.</p>
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
            onClick={handleSendReminders}
            disabled={isLoading || invoices.length === 0}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Bell size={16} /> Send Reminders ({selectedInvoices.length || "All"})
          </button>
          <button 
            onClick={handleExportInvoices}
            disabled={isLoading || isExporting || invoices.length === 0}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet size={16} /> {isExporting ? "Exporting..." : "Export Excel"}
          </button>
          <button 
            onClick={handleGenerateClassInvoices}
            disabled={isGenerating || !classFilter}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap size={16} /> {isGenerating ? "Generating..." : "Bulk Generate"}
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      {/* 2. Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-none shadow-sm p-6 rounded-[2rem] flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><FileText size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Invoiced</p>
            <h3 className="text-2xl font-black text-slate-800">
              {isLoadingSummary ? "Loading..." : formatCurrency(summary.total_invoiced)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {summary.total_invoices} invoices
            </p>
          </div>
        </Card>
        <Card className="bg-white border-none shadow-sm p-6 rounded-[2rem] flex items-center gap-4">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><Clock size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting Payment</p>
            <h3 className="text-2xl font-black text-slate-800">
              {isLoadingSummary ? "Loading..." : formatCurrency(summary.total_outstanding)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {summary.pending_invoices + summary.overdue_invoices} pending
            </p>
          </div>
        </Card>
        <Card className="bg-white border-none shadow-sm p-6 rounded-[2rem] flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><CheckCircle size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Collection Rate</p>
            <h3 className="text-2xl font-black text-slate-800">
              {isLoadingSummary ? "Loading..." : summary.collection_rate}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {summary.paid_invoices} fully paid
            </p>
          </div>
        </Card>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search invoice #, student name, or admission number..."
            className="w-full bg-white border-none shadow-sm rounded-2xl p-4 pl-12 font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchInvoices(1)}
          />
        </div>
        <div className="relative">
          <select 
            className="w-full bg-white border border-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all appearance-none pl-10"
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
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        </div>
        <div className="relative">
          <select 
            className="w-full bg-white border border-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all appearance-none pl-10"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
          <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
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
              checked={invoices.length > 0 && selectedInvoices.length === invoices.length}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Select All ({selectedInvoices.length} selected)
          </button>
          <span className="text-sm text-slate-500 font-medium">
            Showing {invoices.length} of {pagination.total} invoices
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

      {/* 4. Invoices Table */}
      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-0 bg-white overflow-hidden">
        {selectedInvoices.length > 0 && (
          <div className="bg-indigo-600 p-4 flex items-center justify-between animate-in slide-in-from-top duration-300">
            <p className="text-white text-xs font-bold">{selectedInvoices.length} Invoices selected</p>
            <div className="flex gap-2">
              <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Print All</button>
              <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Email All</button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-8 py-5 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    checked={invoices.length > 0 && selectedInvoices.length === invoices.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Invoice #</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Student</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Due Date</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
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
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 w-48 bg-slate-200 rounded"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 w-24 bg-slate-200 rounded"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 w-24 bg-slate-200 rounded"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="h-8 w-8 bg-slate-200 rounded-lg"></div>
                    </td>
                  </tr>
                ))
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-700 mb-2">No invoices found</h3>
                      <p className="text-slate-500 max-w-md">
                        {searchTerm || statusFilter !== "all" || classFilter
                          ? "Try adjusting your filters or search terms"
                          : "No invoice data available. Try generating invoices for a class."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-indigo-600"
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={() => toggleInvoiceSelection(invoice.id)}
                      />
                    </td>
                    <td className="px-6 py-5 font-black text-xs text-slate-800 uppercase tracking-tighter">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700">
                          {invoice.student.first_name} {invoice.student.last_name}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                          {invoice.student.admission_number}
                        </span>
                        <span className="text-xs text-slate-500 mt-1">
                          {invoice.student.class?.class_name}
                          {invoice.student.stream?.name && ` • ${invoice.student.stream.name}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-900">
                        {formatCurrency(invoice.total_amount)}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Paid: {formatCurrency(invoice.amount_paid)} | 
                        Balance: {formatCurrency(invoice.balance)}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-medium text-slate-500">
                        {formatDate(invoice.due_date)}
                      </div>
                      <div className="text-xs text-slate-400">
                        Issued: {formatDate(invoice.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase border flex items-center justify-center ${getStatusBadge(invoice.status)}`}>
                        {getStatusIcon(invoice.status)}
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleViewInvoice(invoice.id)}
                          title="View Invoice" 
                          className="p-2 text-slate-400 hover:text-indigo-600"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handleSendReminders()}
                          title="Send Reminder" 
                          className="p-2 text-slate-400 hover:text-indigo-600"
                        >
                          <Mail size={16} />
                        </button>
                        <button title="Print" className="p-2 text-slate-400 hover:text-indigo-600">
                          <Printer size={16} />
                        </button>
                        <div className="relative group">
                          <button className="p-2 text-slate-400 hover:text-slate-600">
                            <MoreHorizontal size={16} />
                          </button>
                          <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <div className="py-2">
                              <button
                                onClick={() => handleViewInvoice(invoice.id)}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <FileText size={14} />
                                View Invoice Details
                              </button>
                              <button
                                onClick={() => handleSendReminders()}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Bell size={14} />
                                Send Reminder
                              </button>
                              <button
                                onClick={() => window.open(`/finance/student/${invoice.student_id}/payment`, '_blank')}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <CreditCard size={14} />
                                Record Payment
                              </button>
                              <div className="border-t border-slate-100 my-1"></div>
                              <button
                                onClick={() => window.print()}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Printer size={14} />
                                Print Invoice
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            
            {/* Table Totals */}
            {invoices.length > 0 && (
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td className="px-8 py-5">
                    <div className="font-bold text-slate-800">TOTAL ({invoices.length} invoices)</div>
                  </td>
                  <td className="px-6 py-5"></td>
                  <td className="px-6 py-5"></td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <div className="font-black text-lg text-slate-900">
                        {formatCurrency(invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0))}
                      </div>
                      <div className="text-sm text-slate-500">
                        Total Invoiced
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <div className="font-bold text-lg text-emerald-600">
                        {formatCurrency(invoices.reduce((sum, inv) => sum + Number(inv.amount_paid), 0))}
                      </div>
                      <div className="text-sm text-slate-500">
                        Total Collected
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <div className={`font-bold text-lg ${invoices.reduce((sum, inv) => sum + Number(inv.balance), 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {formatCurrency(invoices.reduce((sum, inv) => sum + Number(inv.balance), 0))}
                      </div>
                      <div className="text-sm text-slate-500">
                        Outstanding
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>

      {/* Footer Actions */}
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

export default Invoices;
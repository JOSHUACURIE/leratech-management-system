import React, { useState, useEffect, useCallback } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  RefreshCcw, 
  Smartphone, 
  Building2, 
  Search, 
  ArrowRightLeft,
  Link,
  ShieldCheck,
  AlertCircle,
  Download,
  Filter,
  ChevronDown,
  User,
  Calendar,
  FileText,
  TrendingUp,
  Clock,
  Loader2
} from "lucide-react";
import Card from "../../components/common/Card";
import { financeAPI } from "../../services/api";

/* ---------------- TYPES ---------------- */
interface Transaction {
  id: string;
  ref: string;
  amount: number;
  date: string;
  sender: string;
  status: "unmatched" | "matched" | "pending" | "disputed";
  source: "M-Pesa" | "Bank";
  student_id?: string;
  student_name?: string;
  admission_number?: string;
  class_name?: string;
  matched_at?: string;
  notes?: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  class_name: string;
  outstanding_balance: number;
  email?: string;
  phone?: string;
}

interface ReconciliationStats {
  total_transactions: number;
  matched_transactions: number;
  unmatched_transactions: number;
  pending_transactions: number;
  disputed_transactions: number;
  total_amount: number;
  matched_amount: number;
  unmatched_amount: number;
  pending_amount: number;
  disputed_amount: number;
}

interface ReconciliationSummary {
  daily: number;
  weekly: number;
  monthly: number;
}

interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

interface SearchParams {
  source?: "M-Pesa" | "Bank" | "all";
  status?: "all" | "unmatched" | "matched" | "pending" | "disputed";
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  limit?: number;
}

const Reconciliation: React.FC = () => {
  const [source, setSource] = useState<"M-Pesa" | "Bank" | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "unmatched" | "matched" | "pending" | "disputed">("all");
  const [dateRange, setDateRange] = useState<"today" | "week" | "month">("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState({
    transactions: false,
    stats: false,
    students: false,
    matching: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Data states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<ReconciliationStats | null>(null);
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  // Fetch transactions from API
  const fetchTransactions = useCallback(async (params?: SearchParams) => {
    setIsLoading(prev => ({ ...prev, transactions: true }));
    
    try {
      const queryParams: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (source !== "all") queryParams.source = source;
      if (statusFilter !== "all") queryParams.status = statusFilter;
      if (searchQuery) queryParams.search = searchQuery;

      // Add date range
      const now = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case "today":
          startDate.setDate(now.getDate() - 1);
          break;
        case "week":
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      queryParams.start_date = startDate.toISOString().split('T')[0];
      queryParams.end_date = now.toISOString().split('T')[0];

      // Using your existing finance API
      const response = await financeAPI.getUnreconciledItems(queryParams);
      
      if (response.data.success) {
        setTransactions(response.data.data.transactions || []);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      // Fallback to mock data for development
      setTransactions(getMockTransactions());
    } finally {
      setIsLoading(prev => ({ ...prev, transactions: false }));
    }
  }, [source, statusFilter, searchQuery, dateRange, pagination.page, pagination.limit]);

  // Fetch reconciliation stats
  const fetchStats = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, stats: true }));
    
    try {
      const response = await financeAPI.getReconciliationReport({
        startDate: getDateRangeStart(dateRange),
        endDate: new Date().toISOString().split('T')[0],
      });

      if (response.data.success) {
        setStats(response.data.data.stats);
        setSummary(response.data.data.summary);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Fallback to mock data
      setStats({
        total_transactions: 85,
        matched_transactions: 45,
        unmatched_transactions: 25,
        pending_transactions: 10,
        disputed_transactions: 5,
        total_amount: 1250000,
        matched_amount: 750000,
        unmatched_amount: 300000,
        pending_amount: 150000,
        disputed_amount: 50000,
      });
      setSummary({ daily: 8, weekly: 45, monthly: 185 });
    } finally {
      setIsLoading(prev => ({ ...prev, stats: false }));
    }
  }, [dateRange]);

  // Fetch students for matching
  const fetchStudents = useCallback(async (search = "") => {
    setIsLoading(prev => ({ ...prev, students: true }));
    
    try {
      const params: any = {
        feeStatus: "pending",
        minBalance: 0,
      };
      if (search) params.search = search;

      const response = await financeAPI.getStudentsByClassAndStream(params);
      
      if (response.data.success) {
        setStudents(response.data.data.students || []);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudents(getMockStudents());
    } finally {
      setIsLoading(prev => ({ ...prev, students: false }));
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchTransactions();
    fetchStats();
    fetchStudents();
  }, [fetchTransactions, fetchStats, fetchStudents]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await Promise.all([
      fetchTransactions(),
      fetchStats(),
      fetchStudents(),
    ]);
  }, [fetchTransactions, fetchStats, fetchStudents]);

  // Handle transaction match
  const handleMatchTransaction = useCallback(async (transactionId: string, studentId: string) => {
    setIsLoading(prev => ({ ...prev, matching: true }));
    
    try {
      const response = await financeAPI.reconcileTransactions({
        transaction_ids: [transactionId],
        student_id: studentId,
        notes: "Matched via reconciliation interface",
        verified_by: "system",
      });

      if (response.data.success) {
        // Update local state
        setTransactions(prev => prev.map(t => 
          t.id === transactionId 
            ? { 
                ...t, 
                status: "matched" as const, 
                student_id: studentId,
                matched_at: new Date().toISOString()
              } 
            : t
        ));
        
        // Refresh stats
        await fetchStats();
        setSelectedTransaction(null);
      }
    } catch (error) {
      console.error("Error matching transaction:", error);
      alert("Failed to match transaction. Please try again.");
    } finally {
      setIsLoading(prev => ({ ...prev, matching: false }));
    }
  }, [fetchStats]);

  // Handle export
  const handleExportReport = useCallback(async () => {
    try {
      const response = await financeAPI.exportFinancialReport({
        reportType: "payments",
        format: "excel",
        filters: {
          startDate: getDateRangeStart(dateRange),
          endDate: new Date().toISOString().split('T')[0],
          reconciliationStatus: statusFilter === "all" ? undefined : statusFilter,
          source: source === "all" ? undefined : source,
        },
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reconciliation-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error exporting report:", error);
      alert("Failed to export report. Please try again.");
    }
  }, [dateRange, statusFilter, source]);

  // Handle pagination
  const handlePageChange = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  // Utility functions
  const getDateRangeStart = (range: "today" | "week" | "month"): string => {
    const date = new Date();
    switch (range) {
      case "today":
        date.setDate(date.getDate() - 1);
        break;
      case "week":
        date.setDate(date.getDate() - 7);
        break;
      case "month":
        date.setMonth(date.getMonth() - 1);
        break;
    }
    return date.toISOString().split('T')[0];
  };

  const getStatusColor = (status: Transaction["status"]) => {
    switch(status) {
      case "matched": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "unmatched": return "bg-amber-100 text-amber-700 border-amber-200";
      case "pending": return "bg-blue-100 text-blue-700 border-blue-200";
      case "disputed": return "bg-rose-100 text-rose-700 border-rose-200";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusIcon = (status: Transaction["status"]) => {
    switch(status) {
      case "matched": return <CheckCircle2 size={12} />;
      case "unmatched": return <XCircle size={12} />;
      case "pending": return <Clock size={12} />;
      case "disputed": return <AlertCircle size={12} />;
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Mock data for development (remove in production)
  const getMockTransactions = (): Transaction[] => [
    { id: "e1", ref: "RQL7X9P2J", amount: 15000, date: "2026-01-26T14:30:00", sender: "MARY JAOKO", status: "unmatched", source: "M-Pesa" },
    { id: "e2", ref: "RQY2M4N9K", amount: 5000, date: "2026-01-26T09:15:00", sender: "JOHN DOE", status: "matched", source: "M-Pesa", student_id: "stu1", student_name: "John Doe", admission_number: "STU1001", class_name: "Form 4A", matched_at: "2026-01-26T10:00:00" },
    { id: "e3", ref: "BANK00123", amount: 25000, date: "2026-01-25T11:45:00", sender: "Safaricom LTD", status: "pending", source: "Bank" },
    { id: "e4", ref: "MPESA8H7D", amount: 8000, date: "2026-01-25T16:20:00", sender: "PETER MWANGI", status: "disputed", source: "M-Pesa", student_id: "stu2", student_name: "Peter Mwangi", admission_number: "STU1002", class_name: "Form 3B" },
  ];

  const getMockStudents = (): Student[] => [
    { id: "stu1", first_name: "Michael", last_name: "Johnson", admission_number: "STU1005", class_name: "Form 4B", outstanding_balance: 15000 },
    { id: "stu2", first_name: "Sarah", last_name: "James", admission_number: "STU1006", class_name: "Form 3A", outstanding_balance: 8000 },
    { id: "stu3", first_name: "David", last_name: "Kamau", admission_number: "STU1007", class_name: "Form 2C", outstanding_balance: 12000 },
  ];

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      
      {/* 1. Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            Statement Reconciliation <ArrowRightLeft className="text-indigo-600" />
          </h1>
          <p className="text-slate-500 font-medium">Matching external statements with internal student ledgers.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportReport}
            disabled={isLoading.transactions}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-all text-sm font-medium disabled:opacity-50"
          >
            <Download size={16} />
            Export Report
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-all text-sm font-medium"
          >
            <Filter size={16} />
            Filters
            <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="bg-white border-none shadow-sm rounded-3xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">Source</label>
              <div className="flex flex-wrap gap-2">
                {["all", "M-Pesa", "Bank"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSource(s as any)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all capitalize ${
                      source === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">Status</label>
              <div className="flex flex-wrap gap-2">
                {["all", "unmatched", "matched", "pending", "disputed"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s as any)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all capitalize ${
                      statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">Date Range</label>
              <div className="flex flex-wrap gap-2">
                {["today", "week", "month"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range as any)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all capitalize ${
                      dateRange === range ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-slate-100 border-none rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={fetchTransactions}
              disabled={isLoading.transactions}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading.transactions ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Applying Filters...
                </>
              ) : (
                "Apply Filters"
              )}
            </button>
          </div>
        </Card>
      )}

      {/* 2. Stats Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <p className="text-sm font-bold uppercase tracking-widest text-indigo-200">Connection Status</p>
              <h2 className="text-2xl font-black mt-1 flex items-center gap-3">
                Live Banking Feed <ShieldCheck className="text-emerald-300" />
              </h2>
              <p className="text-indigo-100 text-sm mt-2 max-w-lg">
                Real-time sync with your banking institutions. Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
            <button 
              onClick={handleRefresh}
              disabled={isLoading.stats || isLoading.transactions}
              className="bg-white/20 hover:bg-white/30 p-4 rounded-2xl transition-all disabled:opacity-50"
            >
              <RefreshCcw size={24} className={`text-white ${isLoading.stats ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10">
            <TrendingUp size={200} />
          </div>
        </Card>

        {summary && (
          <>
            <Card className="bg-white border-none shadow-xl shadow-slate-200/50 rounded-3xl p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Calendar size={12} /> Today's Summary
              </p>
              <h3 className="text-3xl font-black text-slate-800 mt-2">{summary.daily}</h3>
              <p className="text-sm text-slate-500 mt-1">Transactions to reconcile</p>
            </Card>

            <Card className="bg-white border-none shadow-xl shadow-slate-200/50 rounded-3xl p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Unreconciled</p>
              <h3 className="text-3xl font-black text-rose-500 mt-2">
                {stats?.unmatched_transactions || 0}
              </h3>
              <p className="text-sm text-slate-500 mt-1">Need attention</p>
            </Card>
          </>
        )}
      </div>

      {/* 3. Detailed Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border-none rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400">Total</p>
                <h4 className="text-2xl font-black text-slate-800 mt-1">{stats.total_transactions}</h4>
                <p className="text-sm text-slate-500 mt-1">Transactions</p>
              </div>
              <div className="p-3 bg-slate-100 rounded-2xl">
                <FileText size={24} className="text-slate-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white border-none rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400">Matched</p>
                <h4 className="text-2xl font-black text-emerald-600 mt-1">{stats.matched_transactions}</h4>
                <p className="text-sm text-slate-500 mt-1">{formatCurrency(stats.matched_amount)}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-2xl">
                <CheckCircle2 size={24} className="text-emerald-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white border-none rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400">Unmatched</p>
                <h4 className="text-2xl font-black text-amber-600 mt-1">{stats.unmatched_transactions}</h4>
                <p className="text-sm text-slate-500 mt-1">{formatCurrency(stats.unmatched_amount)}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-2xl">
                <XCircle size={24} className="text-amber-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white border-none rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400">Others</p>
                <h4 className="text-2xl font-black text-blue-600 mt-1">{stats.pending_transactions + stats.disputed_transactions}</h4>
                <p className="text-sm text-slate-500 mt-1">Pending/Disputed</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-2xl">
                <AlertCircle size={24} className="text-blue-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 4. Reconciliation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: Transactions List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText size={18} /> 
              {isLoading.transactions ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Loading Transactions...
                </span>
              ) : (
                `Transactions (${transactions.length})`
              )}
            </h3>
            <div className="flex items-center gap-2">
              <div className="text-xs font-medium text-slate-500">
                Showing {transactions.length} of {pagination.total}
              </div>
            </div>
          </div>
          
          {isLoading.transactions ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 size={32} className="animate-spin text-indigo-600" />
            </div>
          ) : transactions.length === 0 ? (
            <Card className="border-none shadow-sm rounded-3xl p-8 text-center">
              <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
              <h4 className="text-lg font-bold text-slate-600 mb-2">No Transactions Found</h4>
              <p className="text-sm text-slate-500">
                No transactions match your current filters. Try adjusting your search criteria.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <Card 
                  key={transaction.id}
                  className={`border-none shadow-sm rounded-3xl p-5 transition-all cursor-pointer hover:shadow-md ${
                    selectedTransaction?.id === transaction.id ? 'ring-2 ring-indigo-500 bg-indigo-50' : 'bg-white'
                  }`}
                  onClick={() => setSelectedTransaction(transaction)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                          {transaction.ref}
                        </span>
                        <span className={`text-xs font-bold px-2 py-1 rounded border ${getStatusColor(transaction.status)} flex items-center gap-1`}>
                          {getStatusIcon(transaction.status)} {transaction.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-slate-100 rounded-lg">
                          {transaction.source === "M-Pesa" ? <Smartphone size={14} /> : <Building2 size={14} />}
                        </div>
                        <h4 className="font-bold text-slate-800">{transaction.sender}</h4>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Amount</p>
                          <p className="text-base font-black text-slate-900">{formatCurrency(transaction.amount)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Date</p>
                          <p className="text-sm font-medium text-slate-600">{formatDate(transaction.date)}</p>
                        </div>
                      </div>

                      {transaction.student_name && (
                        <div className="mt-3 p-3 bg-emerald-50 rounded-xl">
                          <div className="flex items-center gap-2 text-emerald-700">
                            <User size={12} />
                            <span className="text-xs font-bold">Matched to Student</span>
                          </div>
                          <p className="text-sm font-medium mt-1">
                            {transaction.student_name} ({transaction.admission_number})
                          </p>
                          <p className="text-xs text-slate-500 mt-1">Class: {transaction.class_name}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Right: Matching Panel */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Link size={18} /> Matching Tool
          </h3>
          
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-white p-6 sticky top-6">
            <div className="space-y-6">
              {selectedTransaction ? (
                <>
                  {/* Selected Transaction Details */}
                  <div className="p-5 bg-slate-50 rounded-2xl border-2 border-indigo-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-slate-700">Selected Transaction</span>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                        {selectedTransaction.ref}
                      </span>
                    </div>
                    <p className="text-lg font-black text-slate-900">{selectedTransaction.sender}</p>
                    <p className="text-2xl font-black text-indigo-600 mt-2">{formatCurrency(selectedTransaction.amount)}</p>
                    <p className="text-xs text-slate-500 mt-1">{formatDate(selectedTransaction.date)}</p>
                  </div>

                  {/* Search for Match */}
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Search student name, admission number..."
                        onChange={(e) => fetchStudents(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 pl-12 font-medium text-slate-700 text-sm"
                      />
                    </div>

                    {/* Suggested Matches */}
                    {isLoading.students ? (
                      <div className="flex justify-center py-8">
                        <Loader2 size={24} className="animate-spin text-indigo-600" />
                      </div>
                    ) : students.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-xs font-bold uppercase text-slate-400">Suggested Matches</p>
                        {students.map((student) => (
                          <div 
                            key={student.id}
                            onClick={() => handleMatchTransaction(selectedTransaction.id, student.id)}
                            className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between hover:border-indigo-500 hover:shadow cursor-pointer transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black">
                                {student.first_name[0]}{student.last_name[0]}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">
                                  {student.first_name} {student.last_name} ({student.admission_number})
                                </p>
                                <p className="text-xs font-medium text-slate-400">
                                  Outstanding: {formatCurrency(student.outstanding_balance)} • {student.class_name}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-slate-500">Amount due</p>
                              <p className="text-base font-black text-slate-900">
                                {formatCurrency(student.outstanding_balance)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <AlertCircle className="mx-auto text-slate-300 mb-2" size={24} />
                        <p className="text-sm text-slate-500">No matching students found</p>
                      </div>
                    )}

                    {/* Manual Matching Options */}
                    <div className="border-t border-slate-200 pt-4">
                      <p className="text-xs font-bold uppercase text-slate-400 mb-3">Manual Options</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => alert("New student creation would open a modal here")}
                          className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-700 transition-all"
                        >
                          Create New Student
                        </button>
                        <button 
                          onClick={() => alert("Marking as disputed would update transaction status")}
                          className="p-3 bg-amber-100 hover:bg-amber-200 rounded-xl text-sm font-medium text-amber-700 transition-all"
                        >
                          Mark as Disputed
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Empty State */
                <div className="p-8 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 text-center">
                  <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
                  <h4 className="text-lg font-bold text-slate-600 mb-2">No Transaction Selected</h4>
                  <p className="text-sm text-slate-500">
                    Select a transaction from the list to begin the matching process.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Reconciliation;
import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  MoreVertical,
  Mail,
  FileSpreadsheet,
  Eye,
  Printer,
  Bell,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  Users,
  TrendingUp,
  Percent,
  CreditCard,
  DollarSign,
  BarChart3,
  UserCheck,
  Receipt,
  ShieldCheck,
  FileText,
  Calculator,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  LineChart,
  Calendar,
  TrendingUp as TrendingUpIcon,
  Wallet,
  FileBarChart,
  Award,
  Target,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import Card from "../../components/common/Card";
import { financeAPI } from "../../services/api";
import toast from "react-hot-toast";

/* ---------------- TYPES ---------------- */
type StudentBalance = {
  id: string;
  name: string;
  admissionNo: string;
  className: string;
  streamName?: string;
  totalBilled: number;
  paid: number;
  balance: number;
  status: "cleared" | "pending" | "overdue" | "partial";
  phone?: string;
  gender?: string;
  studentType?: string;
  lastPayment?: {
    date: string;
    amount: number;
  };
  invoiceCount?: number;
  creditBalance?: number;
};

type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type ClassItem = {
  id: string;
  name: string;
  class_name: string;
  class_level?: string;
};

type StreamItem = {
  id: string;
  name: string;
};

type StatsData = {
  totalBalance: number;
  totalStudents: number;
  pendingStudents: number;
  clearedStudents: number;
  collectionRate: string;
  recentCollections: number;
  advancePayments: number;
  outstandingInvoices: number;
  totalCollected?: number;
  growthRate?: number;
};

type Debtor = {
  id: string;
  student: string;
  admissionNumber: string;
  class: string;
  netBalance: number;
  lastPaymentDate: string;
  daysSinceLastPayment: number | null;
};

type CollectionTrend = {
  period: string;
  collected: number;
  invoiced: number;
  collectionRate: string;
  growth: number | string;
};

type PaymentMethod = {
  method: string;
  amount: number;
  percentage: string;
  transactions: number;
};

const StudentBalances: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [classId, setClassId] = useState<string>("");
  const [streamId, setStreamId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [trendPeriod, setTrendPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [showChart, setShowChart] = useState(false);
  
  // State for data
  const [balances, setBalances] = useState<StudentBalance[]>([]);
  const [stats, setStats] = useState<StatsData>({
    totalBalance: 0,
    totalStudents: 0,
    pendingStudents: 0,
    clearedStudents: 0,
    collectionRate: "0%",
    recentCollections: 0,
    advancePayments: 0,
    outstandingInvoices: 0
  });
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [collectionTrend, setCollectionTrend] = useState<CollectionTrend[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [classSummary, setClassSummary] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  });
  
  // Filters state
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [streams, setStreams] = useState<StreamItem[]>([]);

  // Fetch student ledger using getStudentLedger endpoint
  const fetchStudentLedger = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await financeAPI.getStudentLedger({
        page,
        limit: pagination.limit,
        status: filterStatus === "all" ? undefined : filterStatus,
        search: searchTerm || undefined,
        classId: classId || undefined,
        streamId: streamId || undefined
      });
      
      console.log("Ledger API Response:", response.data);
      
      if (response.data && response.data.data) {
        const data = response.data.data;
        
        // Transform ledger data to StudentBalance
        const transformedData: StudentBalance[] = data.ledger?.map((item: any) => ({
          id: item.id,
          name: item.student,
          admissionNo: item.admissionNumber,
          className: item.class,
          streamName: item.stream,
          totalBilled: item.totalOutstanding + (item.creditBalance || 0),
          paid: item.totalOutstanding + (item.creditBalance || 0) - item.netBalance,
          balance: item.netBalance,
          status: getBalanceStatus(item.netBalance, item.totalOutstanding + (item.creditBalance || 0)),
          creditBalance: item.creditBalance,
          lastPayment: item.lastPayment,
          invoiceCount: item.invoiceCount,
          studentType: item.studentType
        })) || [];
        
        setBalances(transformedData);
        
        // Update pagination
        const meta = response.data.data.pagination || {};
        setPagination(prev => ({
          ...prev,
          page: page,
          total: meta.total || 0,
          totalPages: meta.pages || 1
        }));
      }
      
    } catch (error: any) {
      console.error("Error fetching student ledger:", error);
      toast.error(error.response?.data?.message || "Failed to load student ledger");
      setBalances([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await financeAPI.getDashboardSummary();
      
      if (response.data && response.data.data) {
        const data = response.data.data;
        setStats({
          totalBalance: data.summary.totalBalance || 0,
          totalStudents: data.summary.totalStudents || 0,
          pendingStudents: data.summary.pendingStudents || 0,
          clearedStudents: data.summary.clearedStudents || 0,
          collectionRate: data.summary.collectionRate || "0%",
          recentCollections: data.summary.recentCollections || 0,
          advancePayments: data.summary.advancePayments || 0,
          outstandingInvoices: data.summary.outstandingInvoices || 0
        });
      }
    } catch (error: any) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Fetch top debtors
  const fetchTopDebtors = async () => {
    try {
      const response = await financeAPI.getTopDebtors({ limit: 5 });
      if (response.data && response.data.data) {
        setDebtors(response.data.data.debtors || []);
      }
    } catch (error) {
      console.error("Error fetching top debtors:", error);
    }
  };

  // Fetch collection trend
  const fetchCollectionTrend = async () => {
    try {
      const response = await financeAPI.getCollectionTrend({
        period: trendPeriod,
        months: 6
      });
      if (response.data && response.data.data) {
        setCollectionTrend(response.data.data.trend || []);
      }
    } catch (error) {
      console.error("Error fetching collection trend:", error);
    }
  };

  // Fetch payment methods summary
  const fetchPaymentMethods = async () => {
    try {
      const response = await financeAPI.getPaymentMethodsSummary();
      if (response.data && response.data.data) {
        setPaymentMethods(response.data.data.paymentMethods || []);
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    }
  };

  // Fetch class-wise summary
  const fetchClassSummary = async () => {
    try {
      const response = await financeAPI.getClassWiseSummary();
      if (response.data && response.data.data) {
        setClassSummary(response.data.data.classSummary || []);
      }
    } catch (error) {
      console.error("Error fetching class summary:", error);
    }
  };

  // Fetch recent activities
  const fetchRecentActivities = async () => {
    try {
      const response = await financeAPI.getRecentActivities({ limit: 5 });
      // Store in state if needed
      console.log("Recent activities:", response.data);
    } catch (error) {
      console.error("Error fetching recent activities:", error);
    }
  };

  // Fetch classes for filters
  const fetchClasses = async () => {
    try {
      const response = await financeAPI.getClasses({ 
        page: 1, 
        limit: 100,
        sortBy: 'name',
        sortOrder: 'asc'
      });
      
      let classesData: any[] = [];
      
      if (response.data && Array.isArray(response.data.data)) {
        classesData = response.data.data;
      }
      
      const formattedClasses: ClassItem[] = classesData.map((cls: any) => ({
        id: cls.id || '',
        name: cls.class_name || cls.name || '',
        class_name: cls.class_name || cls.name || '',
        class_level: cls.class_level || ''
      })).filter(cls => cls.id && cls.name);
      
      setClasses(formattedClasses);
      
    } catch (error: any) {
      console.error("Error fetching classes:", error);
      toast.error("Failed to load classes");
      setClasses([]);
    }
  };

  // Fetch streams for selected class
  const fetchStreams = async () => {
    if (!classId) {
      setStreams([]);
      setStreamId("");
      return;
    }
    
    try {
      const response = await financeAPI.getClassStreams(classId, {
        includeStudentCount: true,
        includeFeeSummary: false,
        includeTeachers: false
      });
      
      let streamsData: any[] = [];
      
      if (response.data && response.data.data && response.data.data.streams) {
        streamsData = response.data.data.streams;
      }
      
      const formattedStreams: StreamItem[] = streamsData.map((stream: any) => ({
        id: stream.id || '',
        name: stream.name || ''
      })).filter(stream => stream.id && stream.name);
      
      setStreams(formattedStreams);
      
    } catch (error: any) {
      console.error("Error fetching streams:", error);
      toast.error("Failed to load streams");
      setStreams([]);
    }
  };

  // Determine status based on balance
  const getBalanceStatus = (balance: number, billed: number): "cleared" | "pending" | "overdue" | "partial" => {
    if (billed === 0) return "cleared";
    if (balance <= 0) return "cleared";
    if (balance >= billed * 0.8) return "overdue";
    if (balance >= billed * 0.3) return "pending";
    return "partial";
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "cleared": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "overdue": return "bg-rose-50 text-rose-600 border-rose-100";
      case "partial": return "bg-blue-50 text-blue-600 border-blue-100";
      default: return "bg-amber-50 text-amber-600 border-amber-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "cleared": return <CheckCircle2 size={12} className="mr-1" />;
      case "overdue": return <AlertCircle size={12} className="mr-1" />;
      case "partial": return <Clock size={12} className="mr-1" />;
      default: return <Clock size={12} className="mr-1" />;
    }
  };

  // Export to Excel
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const params = {
        reportType: 'ledger' as const,
        format: 'excel' as const,
        filters: {
          classId: classId || undefined,
          streamId: streamId || undefined,
          status: filterStatus === "all" ? undefined : filterStatus,
          search: searchTerm || undefined
        }
      };
      
      const response = await financeAPI.exportFinanceReport(params);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `student-ledger-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("Export started successfully");
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error(error.response?.data?.message || "Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  // Send reminders
  const handleSendReminders = async () => {
    const studentIds = selectedStudents.length > 0 
      ? selectedStudents 
      : balances.map(student => student.id);
    
    if (studentIds.length === 0) {
      toast.error("No students selected");
      return;
    }

    try {
      await financeAPI.sendFeeReminders({
        studentIds,
        reminderType: 'overdue',
        channel: 'both',
        message: "Kindly clear your fee balance to avoid inconvenience."
      });
      
      toast.success(`Reminders sent to ${studentIds.length} student(s)`);
      setSelectedStudents([]);
    } catch (error: any) {
      console.error("Reminder error:", error);
      toast.error(error.response?.data?.message || "Failed to send reminders");
    }
  };

  // View individual statement
  const handleViewStatement = (studentId: string) => {
    window.open(`/finance/statement/${studentId}`, '_blank');
  };

  // View receipt
  const handleViewReceipt = (paymentId: string) => {
    window.open(`/finance/receipt/${paymentId}`, '_blank');
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
    if (selectedStudents.length === balances.length && balances.length > 0) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(balances.map(student => student.id));
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

  // Format percentage
  const formatPercentage = (value: string | number) => {
    if (typeof value === 'string') {
      return value;
    }
    return `${value.toFixed(1)}%`;
  };

  // Calculate table totals
  const tableTotals = balances.reduce((acc, student) => ({
    totalBilled: acc.totalBilled + student.totalBilled,
    totalPaid: acc.totalPaid + student.paid,
    totalBalance: acc.totalBalance + student.balance,
    totalCredit: acc.totalCredit + (student.creditBalance || 0)
  }), { totalBilled: 0, totalPaid: 0, totalBalance: 0, totalCredit: 0 });

  // Pagination handlers
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchStudentLedger(page);
    }
  };

  // Load more options
  const handleLoadMore = () => {
    const newLimit = pagination.limit + 10;
    setPagination(prev => ({ ...prev, limit: newLimit }));
    fetchStudentLedger(1);
  };

  // Refresh all data
  const handleRefresh = () => {
    fetchStudentLedger(1);
    fetchDashboardStats();
    fetchTopDebtors();
    fetchCollectionTrend();
    fetchPaymentMethods();
    fetchClassSummary();
    fetchRecentActivities();
    if (classId) {
      fetchStreams();
    }
  };

  // Calculate collection trend chart data
  const getTrendChartData = () => {
    return {
      labels: collectionTrend.map(item => item.period),
      datasets: [
        {
          label: 'Collected Amount',
          data: collectionTrend.map(item => item.collected),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        }
      ]
    };
  };

  // Initial fetch
  useEffect(() => {
    fetchClasses();
    handleRefresh();
  }, []);

  useEffect(() => {
    fetchStudentLedger();
  }, [filterStatus, classId, streamId, pagination.limit]);

  // Update trend when period changes
  useEffect(() => {
    fetchCollectionTrend();
  }, [trendPeriod]);

  // Fetch streams when class changes
  useEffect(() => {
    fetchStreams();
  }, [classId]);

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Finance Dashboard</h1>
          <p className="text-slate-500 font-medium">Monitor and manage all financial activities</p>
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
            disabled={isLoading || balances.length === 0}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Bell size={16} /> Send Reminders ({selectedStudents.length || "All"})
          </button>
          <button 
            onClick={handleExportExcel}
            disabled={isLoading || exporting || balances.length === 0}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet size={16} /> {exporting ? "Exporting..." : "Export Excel"}
          </button>
          <button 
            onClick={() => setShowChart(!showChart)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
          >
            <LineChart size={16} /> {showChart ? "Hide Chart" : "Show Chart"}
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      {/* STATS CARDS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Outstanding Card */}
        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl p-6 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-indigo-100 mb-1">Total Outstanding</p>
              <p className="text-3xl font-black">{formatCurrency(stats.totalBalance)}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="font-medium">Collection Rate</span>
            <div className="flex items-center">
              <span className="font-bold">{stats.collectionRate}</span>
            </div>
          </div>
        </Card>

        {/* Students Summary Card */}
        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-emerald-100 mb-1">Total Students</p>
              <p className="text-3xl font-black">{stats.totalStudents}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-emerald-100">Pending</p>
              <p className="font-bold">{stats.pendingStudents}</p>
            </div>
            <div>
              <p className="text-emerald-100">Cleared</p>
              <p className="font-bold">{stats.clearedStudents}</p>
            </div>
          </div>
        </Card>

        {/* Recent Collections Card */}
        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-blue-100 mb-1">Recent Collections</p>
              <p className="text-3xl font-black">{formatCurrency(stats.recentCollections)}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <CreditCard className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-1" />
            <span className="font-medium">Last 30 days</span>
          </div>
        </Card>

        {/* Advance Payments Card */}
        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl p-6 bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-amber-100 mb-1">Advance Payments</p>
              <p className="text-3xl font-black">{formatCurrency(stats.advancePayments)}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <Wallet className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 text-sm">
            <p className="text-amber-100">Available credit for future invoices</p>
          </div>
        </Card>
      </div>

      {/* Additional Quick Stats & Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Debtors */}
        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              Top Debtors
            </h3>
            <span className="text-sm font-medium text-slate-500">{debtors.length} students</span>
          </div>
          <div className="space-y-4">
            {debtors.slice(0, 5).map((debtor, index) => (
              <div key={debtor.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{debtor.student}</p>
                    <p className="text-xs text-slate-500">{debtor.admissionNumber} • {debtor.class}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-rose-600">{formatCurrency(debtor.netBalance)}</p>
                  {debtor.daysSinceLastPayment !== null && (
                    <p className="text-xs text-slate-500">{debtor.daysSinceLastPayment} days since last payment</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Payment Methods */}
        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-indigo-500" />
              Payment Methods
            </h3>
            <span className="text-sm font-medium text-slate-500">{paymentMethods.length} methods</span>
          </div>
          <div className="space-y-4">
            {paymentMethods.slice(0, 5).map((method, index) => (
              <div key={method.method} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">{method.method.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{method.method}</p>
                    <p className="text-xs text-slate-500">{method.transactions} transactions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-indigo-600">{formatCurrency(method.amount)}</p>
                  <p className="text-xs text-slate-500">{method.percentage}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Class Performance */}
        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileBarChart className="h-5 w-5 text-emerald-500" />
              Class Performance
            </h3>
            <span className="text-sm font-medium text-slate-500">{classSummary.length} classes</span>
          </div>
          <div className="space-y-4">
            {classSummary.slice(0, 5).map((cls, index) => (
              <div key={cls.classId} className="p-3 bg-slate-50 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-slate-800">{cls.className}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    cls.status === 'good' ? 'bg-emerald-100 text-emerald-600' :
                    cls.status === 'fair' ? 'bg-amber-100 text-amber-600' :
                    'bg-rose-100 text-rose-600'
                  }`}>
                    {cls.collectionRate}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">{cls.studentCount} students</span>
                  <span className="font-medium text-slate-800">{formatCurrency(cls.totalOutstanding)}</span>
                </div>
                <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      cls.status === 'good' ? 'bg-emerald-500' :
                      cls.status === 'fair' ? 'bg-amber-500' :
                      'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(parseFloat(cls.collectionRate), 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Collection Trend Toggle */}
      {showChart && (
        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5 text-blue-500" />
              Collection Trend
            </h3>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setTrendPeriod(period)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    trendPeriod === period
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 flex items-center justify-center">
            {collectionTrend.length > 0 ? (
              <div className="w-full h-full">
                {/* Simple bar chart using divs */}
                <div className="flex items-end justify-between h-48 gap-2">
                  {collectionTrend.map((item, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all hover:from-blue-600 hover:to-blue-500"
                        style={{ height: `${(item.collected / Math.max(...collectionTrend.map(i => i.collected))) * 100}%` }}
                      ></div>
                      <div className="mt-2 text-xs text-slate-600 font-medium text-center">
                        <div>{item.period}</div>
                        <div className="font-bold text-slate-800">{formatCurrency(item.collected)}</div>
                        <div className={`text-xs ${typeof item.growth === 'number' && item.growth > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {typeof item.growth === 'number' && item.growth > 0 ? '+' : ''}{item.growth}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-500">
                <LineChart className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                <p>No trend data available</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Filters & Search */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Search */}
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or admission number..."
            className="w-full bg-white border-none shadow-sm rounded-2xl p-4 pl-12 font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchStudentLedger()}
          />
        </div>

        {/* Class Filter */}
        <div className="relative">
          <select 
            className="w-full bg-white border-none shadow-sm rounded-2xl p-4 font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-indigo-500 pl-4"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            <option value="">All Classes</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>

        {/* Stream Filter */}
        <div className="relative">
          <select 
            className="w-full bg-white border-none shadow-sm rounded-2xl p-4 font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-indigo-500 pl-4"
            value={streamId}
            onChange={(e) => setStreamId(e.target.value)}
            disabled={!classId || streams.length === 0}
          >
            <option value="">All Streams</option>
            {streams.map(stream => (
              <option key={stream.id} value={stream.id}>{stream.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select 
            className="w-full bg-white border-none shadow-sm rounded-2xl p-4 font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-indigo-500 pl-4"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="cleared">Cleared</option>
            <option value="credit">Credit</option>
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
              checked={balances.length > 0 && selectedStudents.length === balances.length}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Select All ({selectedStudents.length} selected)
          </button>
          <span className="text-sm text-slate-500 font-medium">
            Showing {balances.length} of {pagination.total} students
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

      {/* Main Table */}
      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-6 font-black text-slate-700 text-xs uppercase tracking-widest">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={balances.length > 0 && selectedStudents.length === balances.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Student Details
                  </div>
                </th>
                <th className="text-left p-6 font-black text-slate-700 text-xs uppercase tracking-widest">Total Billed</th>
                <th className="text-left p-6 font-black text-slate-700 text-xs uppercase tracking-widest">Amount Paid</th>
                <th className="text-left p-6 font-black text-slate-700 text-xs uppercase tracking-widest">Balance</th>
                <th className="text-left p-6 font-black text-slate-700 text-xs uppercase tracking-widest">Status</th>
                <th className="text-left p-6 font-black text-slate-700 text-xs uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                // Loading Skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-slate-200 rounded-xl"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-slate-200 rounded"></div>
                          <div className="h-3 w-24 bg-slate-200 rounded"></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="h-4 w-24 bg-slate-200 rounded"></div>
                    </td>
                    <td className="p-6">
                      <div className="h-4 w-24 bg-slate-200 rounded"></div>
                    </td>
                    <td className="p-6">
                      <div className="h-4 w-24 bg-slate-200 rounded"></div>
                    </td>
                    <td className="p-6">
                      <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
                    </td>
                    <td className="p-6">
                      <div className="h-8 w-8 bg-slate-200 rounded-lg"></div>
                    </td>
                  </tr>
                ))
              ) : balances.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-700 mb-2">No student records found</h3>
                      <p className="text-slate-500 max-w-md">
                        {searchTerm || filterStatus !== "all" || classId || streamId
                          ? "Try adjusting your filters or search terms"
                          : "No student ledger data available"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                balances.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => toggleStudentSelection(student.id)}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-800">{student.name}</h4>
                            {student.studentType && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs font-bold rounded-full">
                                {student.studentType}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1">
                            <span className="text-sm text-slate-500 font-medium">
                              {student.admissionNo}
                            </span>
                            <span className="text-sm text-slate-500">
                              {student.className}
                              {student.streamName && ` • ${student.streamName}`}
                            </span>
                            {student.lastPayment && (
                              <span className="text-xs text-slate-400">
                                Last paid: {new Date(student.lastPayment.date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="font-bold text-slate-800">{formatCurrency(student.totalBilled)}</div>
                      {student.creditBalance && student.creditBalance > 0 && (
                        <div className="text-xs text-emerald-600 font-medium mt-1">
                          +{formatCurrency(student.creditBalance)} credit
                        </div>
                      )}
                    </td>
                    <td className="p-6">
                      <div className="font-bold text-emerald-600">{formatCurrency(student.paid)}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {student.invoiceCount ? `${student.invoiceCount} invoices` : ''}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className={`font-bold ${
                        student.balance > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {student.balance > 0 
                          ? `-${formatCurrency(student.balance)}`
                          : formatCurrency(Math.abs(student.balance))
                        }
                      </div>
                      {student.lastPayment && (
                        <div className="text-xs text-slate-500 mt-1">
                          Last: {formatCurrency(student.lastPayment.amount)}
                        </div>
                      )}
                    </td>
                    <td className="p-6">
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusStyle(student.status)}`}>
                        {getStatusIcon(student.status)}
                        {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewStatement(student.id)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Statement"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleSendReminders()}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Send Reminder"
                        >
                          <Mail size={18} />
                        </button>
                        <div className="relative group">
                          <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                            <MoreVertical size={18} />
                          </button>
                          <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <div className="py-2">
                              <button
                                onClick={() => handleViewStatement(student.id)}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <FileText size={14} />
                                View Detailed Statement
                              </button>
                              <button
                                onClick={() => handleSendReminders()}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Bell size={14} />
                                Send Fee Reminder
                              </button>
                              <button
                                onClick={() => window.open(`/finance/student/${student.id}/payment`, '_blank')}
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
                                Print Statement
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
            {balances.length > 0 && (
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td className="p-6">
                    <div className="font-bold text-slate-800">TOTAL ({balances.length} students)</div>
                  </td>
                  <td className="p-6">
                    <div className="font-black text-lg text-slate-900">{formatCurrency(tableTotals.totalBilled)}</div>
                    {tableTotals.totalCredit > 0 && (
                      <div className="text-sm text-emerald-600 font-medium">
                        +{formatCurrency(tableTotals.totalCredit)} total credit
                      </div>
                    )}
                  </td>
                  <td className="p-6">
                    <div className="font-black text-lg text-emerald-600">{formatCurrency(tableTotals.totalPaid)}</div>
                    <div className="text-sm text-slate-500">
                      {((tableTotals.totalPaid / tableTotals.totalBilled) * 100).toFixed(1)}% collection rate
                    </div>
                  </td>
                  <td className="p-6">
                    <div className={`font-black text-lg ${tableTotals.totalBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {tableTotals.totalBalance > 0 
                        ? `-${formatCurrency(tableTotals.totalBalance)}`
                        : formatCurrency(Math.abs(tableTotals.totalBalance))
                      }
                    </div>
                    <div className="text-sm text-slate-500">
                      Outstanding balance
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1"></div>
                        <span className="text-xs text-slate-600">
                          {balances.filter(s => s.status === 'cleared').length} cleared
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mr-1"></div>
                        <span className="text-xs text-slate-600">
                          {balances.filter(s => s.status === 'partial').length} partial
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-6"></td>
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
              onClick={handleLoadMore}
              disabled={isLoading}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Load More (+10)
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

export default StudentBalances;
import React, { useState, useEffect } from "react";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import { 
  Users, 
  TrendingDown, 
  TrendingUp, 
  BarChart3, 
  Clock, 
  ArrowUpRight, 
  PlusCircle, 
  FileSpreadsheet, 
  Activity,
  ChevronRight,
  DollarSign,
  CreditCard,
  Wallet,
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react";
import {  financeAPI, type FeeDashboardSummary,  type RecentActivityItem } from "../../services/api";
import { useAuth } from "../../context/AuthContext";


interface SummaryItem {
  title: string;
  value: string | number;
  icon: JSX.Element;
  color: string;
  bg: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

interface NotificationItem {
  message: string;
  time: string;
  priority: "high" | "medium" | "low";
}

interface DashboardStats {
  summary: FeeDashboardSummary;
  loading: boolean;
  error: string | null;
}

const BursarDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    summary: {
      summary: {
        totalBalance: 0,
        totalStudents: 0,
        pendingStudents: 0,
        clearedStudents: 0,
        collectionRate: "0%",
        recentCollections: 0,
        advancePayments: 0,
        outstandingInvoices: 0
      },
      academicYear: null
    },
    loading: true,
    error: null
  });
  
  const [recentActivities, setRecentActivities] = useState<RecentActivityItem[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { message: "Loading financial data...", time: "Just now", priority: "medium" }
  ]);

  // Fetch dashboard summary
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true }));
        const response = await financeAPI.getDashboardSummary();
        
        if (response.data.success) {
          setStats({
            summary: response.data.data,
            loading: false,
            error: null
          });
        }
      } catch (error: any) {
        console.error("Failed to fetch dashboard data:", error);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: error.message || "Failed to load financial data"
        }));
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch recent activities
  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        setLoadingActivities(true);
        const response = await financeAPI.getRecentActivities({ limit: 10 });
        
        if (response.data.success) {
          setRecentActivities(response.data.data.activities);
          
          // Update notifications with real data
          const newNotifications: NotificationItem[] = [
            {
              message: `Collection rate is ${response.data.data.summary.collectionRate}`,
              time: "Updated just now",
              priority: response.data.data.summary.totalAmount > 100000 ? "high" : "medium"
            },
            {
              message: `${response.data.data.summary.totalPayments} payments processed today`,
              time: "Today",
              priority: "medium"
            }
          ];
          setNotifications(newNotifications);
        }
      } catch (error) {
        console.error("Failed to fetch recent activities:", error);
      } finally {
        setLoadingActivities(false);
      }
    };

    fetchRecentActivities();
  }, []);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format summary data
  const summaryData: SummaryItem[] = [
    { 
      title: "Total Students", 
      value: stats.summary.summary.totalStudents, 
      icon: <Users size={20} />, 
      color: "text-blue-600", 
      bg: "bg-blue-50",
      trend: { value: "+5%", isPositive: true }
    },
    { 
      title: "Outstanding Balance", 
      value: formatCurrency(stats.summary.summary.totalBalance), 
      icon: <TrendingDown size={20} />, 
      color: "text-rose-600", 
      bg: "bg-rose-50",
      trend: { value: "-2.3%", isPositive: false }
    },
    { 
      title: "Collected (MTD)", 
      value: formatCurrency(stats.summary.summary.recentCollections), 
      icon: <TrendingUp size={20} />, 
      color: "text-emerald-600", 
      bg: "bg-emerald-50",
      trend: { value: "+12.4%", isPositive: true }
    },
    { 
      title: "Outstanding Invoices", 
      value: stats.summary.summary.outstandingInvoices, 
      icon: <BarChart3 size={20} />, 
      color: "text-amber-600", 
      bg: "bg-amber-50",
      trend: { value: "+3", isPositive: false }
    },
  ];

  // Format recent activities for table
  const formatActivities = recentActivities.map(item => ({
    activity: (
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          item.type === 'PAYMENT' ? 'bg-emerald-50 text-emerald-600' :
          item.type === 'INVOICE' ? 'bg-blue-50 text-blue-600' :
          'bg-amber-50 text-amber-600'
        }`}>
          {item.type === 'PAYMENT' ? <DollarSign size={14} /> :
           item.type === 'INVOICE' ? <FileSpreadsheet size={14} /> :
           <CreditCard size={14} />}
        </div>
        <div>
          <p className="font-medium text-slate-800">{item.studentName}</p>
          <p className="text-xs text-slate-500">{item.description}</p>
        </div>
      </div>
    ),
    method: (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
        item.type === 'PAYMENT' ? 'bg-emerald-100 text-emerald-700' :
        item.type === 'INVOICE' ? 'bg-blue-100 text-blue-700' :
        'bg-amber-100 text-amber-700'
      }`}>
        {item.type}
      </span>
    ),
    date: new Date(item.date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }),
    amount: item.type === 'WAIVER' 
      ? `-${formatCurrency(item.amount)}`
      : formatCurrency(item.amount),
    status: item.type === 'PAYMENT' ? (
      <span className="flex items-center gap-1 text-emerald-600 font-medium">
        <CheckCircle size={14} /> Completed
      </span>
    ) : (
      <span className="text-amber-600 font-medium">Pending</span>
    )
  }));

  // Calculate collection rate color
  const collectionRate = parseFloat(stats.summary.summary.collectionRate);
  const getRateColor = () => {
    if (collectionRate >= 80) return "text-emerald-600";
    if (collectionRate >= 60) return "text-amber-600";
    return "text-rose-600";
  };

  // Export data function
  const handleExport = async () => {
    try {
      const response = await financeAPI.exportFinanceReport({
        reportType: 'summary',
        format: 'csv',
        filters: {}
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bursar-dashboard-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            Treasury Overview <Activity className="text-emerald-500" size={24} />
          </h1>
          <p className="text-slate-500 font-medium">
            Welcome back, <span className="font-bold text-slate-700">{user?.name || "Bursar"}</span> • 
            {stats.summary.academicYear ? (
              <span className="ml-2">
                {stats.summary.academicYear.name} • Term {stats.summary.academicYear.currentTerm}
              </span>
            ) : (
              <span className="ml-2">Loading academic year...</span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            <FileSpreadsheet size={16} /> Export CSV
          </button>
          <button className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">
            <PlusCircle size={16} /> New Receipt
          </button>
        </div>
      </div>

      {/* Error State */}
      {stats.error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="text-rose-600" size={20} />
          <p className="text-rose-700 font-medium">{stats.error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="ml-auto text-sm font-medium text-rose-600 hover:text-rose-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Fiscal Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryData.map((item, index) => (
          <Card 
            key={index} 
            className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] p-7 group hover:bg-slate-900 transition-all duration-300 relative overflow-hidden"
          >
            {/* Loading overlay */}
            {stats.loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-[2rem]">
                <Loader2 className="animate-spin text-slate-400" size={24} />
              </div>
            )}

            <div className="flex items-start justify-between">
              <div className={`${item.bg} ${item.color} p-4 rounded-2xl group-hover:bg-white/10 group-hover:text-white transition-colors`}>
                {item.icon}
              </div>
              {item.trend && (
                <div className={`flex items-center gap-1 text-xs font-bold ${
                  item.trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
                } group-hover:text-white`}>
                  {item.trend.isPositive ? '↑' : '↓'} {item.trend.value}
                </div>
              )}
            </div>
            <div className="mt-6">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 group-hover:text-slate-400">
                {item.title}
              </p>
              <h2 className={`text-3xl font-black mt-1 tracking-tight ${item.color} group-hover:text-white transition-colors`}>
                {stats.loading ? "..." : item.value}
              </h2>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 3. Transaction Log (Left/Center) */}
        <div className="lg:col-span-8">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-0 bg-white overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Recent Financial Activities</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Latest transactions and fee operations
                </p>
              </div>
              <div className="text-[10px] font-black uppercase text-slate-400 flex gap-4">
                <button className="text-indigo-600 border-b-2 border-indigo-600 pb-1">All Records</button>
                <button className="pb-1 hover:text-slate-600 transition-colors">Only Receipts</button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {loadingActivities ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="animate-spin text-slate-400" size={32} />
                  <span className="ml-3 text-slate-500">Loading transactions...</span>
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="text-center p-12">
                  <Wallet className="mx-auto text-slate-300" size={48} />
                  <p className="text-slate-500 mt-3">No recent transactions found</p>
                </div>
              ) : (
                <Table
                  columns={[
                    { header: "Activity", accessor: "activity" },
                    { header: "Type", accessor: "method" },
                    { header: "Date", accessor: "date" },
                    { header: "Amount", accessor: "amount" },
                    { header: "Status", accessor: "status" },
                  ]}
                  data={formatActivities}
                />
              )}
            </div>
            <div className="p-6 bg-slate-50/50 flex justify-center border-t border-slate-50">
              <button 
                onClick={() => window.location.href = '/ledger'}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 flex items-center gap-2 transition-all"
              >
                View Full Treasury Ledger <ChevronRight size={14} />
              </button>
            </div>
          </Card>
        </div>

        {/* 4. Alerts & Quick Stats (Right) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Alerts Card */}
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-8 bg-white overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">System Alerts</h2>
              <span className="bg-rose-100 text-rose-700 text-xs font-bold px-3 py-1 rounded-full">
                {notifications.length} Active
              </span>
            </div>
            
            <div className="space-y-6 relative">
              {/* Vertical line connector */}
              <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-slate-100" />

              {notifications.map((notif, index) => (
                <div key={index} className="relative flex gap-5 group">
                  <div className={`z-10 w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 ${
                    notif.priority === 'high' 
                      ? 'border-rose-100 bg-rose-50 text-rose-600 group-hover:border-rose-500' 
                      : notif.priority === 'medium'
                      ? 'border-amber-100 bg-amber-50 text-amber-600 group-hover:border-amber-500'
                      : 'border-blue-100 bg-blue-50 text-blue-600 group-hover:border-blue-500'
                  }`}>
                    <Clock size={16} />
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-slate-700 leading-snug group-hover:text-slate-900">
                        {notif.message}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] font-black uppercase tracking-tighter text-slate-300">
                        {notif.time}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        notif.priority === 'high' 
                          ? 'bg-rose-100 text-rose-700' 
                          : notif.priority === 'medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {notif.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-6 py-4 border border-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">
              Manage All Alerts
            </button>
          </Card>

          {/* Quick Stats Bonus Card */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
            <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Collection Rate</p>
                <div className={`text-xs font-bold px-3 py-1 rounded-full ${
                  collectionRate >= 80 ? 'bg-emerald-500/20 text-emerald-200' :
                  collectionRate >= 60 ? 'bg-amber-500/20 text-amber-200' :
                  'bg-rose-500/20 text-rose-200'
                }`}>
                  {collectionRate >= 80 ? 'Excellent' : collectionRate >= 60 ? 'Good' : 'Needs Attention'}
                </div>
              </div>
              
              <h3 className={`text-4xl font-black mt-1 ${getRateColor()}`}>
                {stats.summary.summary.collectionRate}
              </h3>
              
              <div className="mt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-indigo-200">Pending Students</span>
                  <span className="font-bold">{stats.summary.summary.pendingStudents}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-indigo-200">Cleared Students</span>
                  <span className="font-bold text-emerald-300">{stats.summary.summary.clearedStudents}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-indigo-200">Advance Payments</span>
                  <span className="font-bold text-blue-300">
                    {formatCurrency(stats.summary.summary.advancePayments)}
                  </span>
                </div>
              </div>
              
              <p className="text-[11px] font-medium text-indigo-100 mt-6 leading-relaxed">
                Collection is {collectionRate >= 80 ? 'exceeding' : collectionRate >= 60 ? 'meeting' : 'below'} 
                targets. {collectionRate >= 80 ? 'Keep up the great work!' : 'Consider sending payment reminders.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BursarDashboard;
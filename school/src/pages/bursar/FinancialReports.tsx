import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  AlertCircle,
  PiggyBank,
  RefreshCcw,
  Download,
  Calendar,
  Filter,
  User,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  CreditCard,
  Wallet,
  Building2,
  ChevronDown,
  X,
  FileText,
  BarChart3,
} from 'lucide-react';
import { financeAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';

/* ============= TYPES ============= */
interface FinancialOverview {
  totals: {
    revenuePotential: number;
    actualCash: number;
    outstandingDebt: number;
    advancePayments: number;
    collectionRate: number;
    growthRate: number;
  };
  counts: {
    totalInvoices: number;
    totalPayments: number;
    outstandingInvoices: number;
  };
  healthStatus: string;
  recentActivity: {
    recentPayments: Array<{
      id: string;
      amount: number;
      payment_method: string;
      reference_number: string;
      created_at: string;
      student: {
        first_name: string;
        last_name: string;
        admission_number: string;
      };
    }>;
    topDebtors: Array<{
      id: string;
      invoice_number: string;
      total_amount: number;
      amount_paid: number;
      balance: number;
      due_date: string;
      student: {
        first_name: string;
        last_name: string;
        admission_number: string;
        class: {
          class_name: string;
        };
      };
    }>;
  };
  timeRange: {
    academicYearId?: string;
    termId?: string;
    generatedAt: string;
  };
}

interface MonthlyReport {
  month: number;
  year: number;
  summary: {
    totalInvoiced: number;
    totalCollected: number;
    totalOutstanding: number;
    collectionRate: number;
  };
  dailyBreakdown: Array<{
    date: string;
    invoiced: number;
    collected: number;
    paymentsCount: number;
  }>;
  paymentMethodBreakdown: Array<{
    method: string;
    amount: number;
    percentage: number;
  }>;
  topStudents: Array<{
    student_id: string;
    name: string;
    amount_paid: number;
  }>;
}

interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface Term {
  id: string;
  name: string;
  academic_year_id: string;
  start_date: string;
  end_date: string;
}

/* ============= COMPONENTS ============= */

// Stat Card Component
const StatCard: React.FC<{
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}> = ({ title, value, subtitle, icon, trend, variant = 'primary', isLoading }) => {
  const variantStyles = {
    primary: 'from-indigo-500 to-purple-600',
    success: 'from-emerald-500 to-teal-600',
    danger: 'from-rose-500 to-pink-600',
    warning: 'from-amber-500 to-orange-600',
    info: 'from-blue-500 to-cyan-600',
  };

  return (
    <div className="group relative bg-white rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border-2 border-slate-100 hover:border-slate-200 overflow-hidden">
      {/* Animated Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${variantStyles[variant]} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
      
      {/* Icon Circle */}
      <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${variantStyles[variant]} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
        <div className="text-white">
          {icon}
        </div>
      </div>

      {/* Content */}
      <div className="relative">
        <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">{title}</p>
        {isLoading ? (
          <div className="h-10 bg-slate-200 rounded-xl animate-pulse" />
        ) : (
          <>
            <h3 className="text-3xl font-black text-slate-900 mb-1">{value}</h3>
            {subtitle && (
              <p className="text-xs font-semibold text-slate-500">{subtitle}</p>
            )}
            {trend && (
              <div className={`flex items-center gap-1 mt-2 ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {trend.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                <span className="text-xs font-black">{Math.abs(trend.value)}%</span>
                <span className="text-[10px] font-semibold text-slate-400">vs last period</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Decorative Element */}
      <div className={`absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-br ${variantStyles[variant]} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity duration-500`} />
    </div>
  );
};

// Tab Button Component
const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm transition-all duration-300 ${
      active
        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200 scale-105'
        : 'bg-white text-slate-600 hover:bg-slate-50 shadow-sm border-2 border-slate-100'
    }`}
  >
    {icon}
    {label}
  </button>
);

// Health Status Badge
const HealthBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig: Record<string, { color: string; bg: string; text: string }> = {
    EXCELLENT: { color: 'emerald', bg: 'bg-emerald-100', text: 'text-emerald-700' },
    GOOD: { color: 'green', bg: 'bg-green-100', text: 'text-green-700' },
    FAIR: { color: 'amber', bg: 'bg-amber-100', text: 'text-amber-700' },
    NEEDS_ATTENTION: { color: 'rose', bg: 'bg-rose-100', text: 'text-rose-700' },
  };

  const config = statusConfig[status] || statusConfig.FAIR;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${config.bg} ${config.text} text-xs font-black uppercase tracking-wide`}>
      <div className={`w-2 h-2 rounded-full bg-${config.color}-500 animate-pulse`} />
      {status.replace('_', ' ')}
    </span>
  );
};

// Progress Circle Component
const ProgressCircle: React.FC<{ value: number; size?: number }> = ({ value, size = 100 }) => {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (value / 100) * circumference;

  const getColor = () => {
    if (value >= 80) return '#10b981';
    if (value >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r="40"
          stroke="#e5e7eb"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r="40"
          stroke={getColor()}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-black text-slate-900">{value.toFixed(0)}%</span>
      </div>
    </div>
  );
};

/* ============= MAIN COMPONENT ============= */
const FinancialReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'monthly'>('overview');
  const [overview, setOverview] = useState<FinancialOverview | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState({ overview: false, monthly: false });
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    academicYearId: '',
    termId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (filters.academicYearId) {
      fetchTerms(filters.academicYearId);
    }
  }, [filters.academicYearId]);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchFinancialOverview();
    } else {
      fetchMonthlyReport();
    }
  }, [activeTab, filters]);

  const fetchAcademicYears = async () => {
    setAcademicYears([
      { id: '1', name: '2024-2025', start_date: '2024-09-01', end_date: '2025-06-30', is_active: true },
      { id: '2', name: '2023-2024', start_date: '2023-09-01', end_date: '2024-06-30', is_active: false },
    ]);
  };

  const fetchTerms = async (academicYearId: string) => {
    setTerms([
      { id: '1', name: 'Term 1', academic_year_id: academicYearId, start_date: '2024-09-01', end_date: '2024-12-20' },
      { id: '2', name: 'Term 2', academic_year_id: academicYearId, start_date: '2025-01-08', end_date: '2025-04-04' },
      { id: '3', name: 'Term 3', academic_year_id: academicYearId, start_date: '2025-04-28', end_date: '2025-06-30' },
    ]);
  };

  const fetchFinancialOverview = async () => {
    setLoading(prev => ({ ...prev, overview: true }));
    setError(null);
    
    try {
      const params: any = {};
      if (filters.academicYearId) params.academicYearId = filters.academicYearId;
      if (filters.termId) params.termId = filters.termId;
      
      const response = await financeAPI.getFinancialOverview(params);
      setOverview(response.data.data);
    } catch (err: any) {
      console.error('Error fetching financial overview:', err);
      setError(err.response?.data?.message || 'Failed to fetch financial overview');
    } finally {
      setLoading(prev => ({ ...prev, overview: false }));
    }
  };

  const fetchMonthlyReport = async () => {
    setLoading(prev => ({ ...prev, monthly: true }));
    setError(null);
    
    try {
      const response = await financeAPI.generateMonthlyReport({
        month: filters.month,
        year: filters.year,
      });
      setMonthlyReport(response.data.data);
    } catch (err: any) {
      console.error('Error fetching monthly report:', err);
      setError(err.response?.data?.message || 'Failed to fetch monthly report');
    } finally {
      setLoading(prev => ({ ...prev, monthly: false }));
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (activeTab === 'overview') {
      await fetchFinancialOverview();
    } else {
      await fetchMonthlyReport();
    }
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleExportReport = async () => {
    try {
      const params: any = {
        reportType: activeTab === 'overview' ? 'summary' : 'trend',
        format: 'excel',
        filters: activeTab === 'overview' 
          ? { academicYearId: filters.academicYearId, termId: filters.termId }
          : { month: filters.month, year: filters.year },
      };
      
      const response = await financeAPI.exportFinancialReport(params);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `financial-${activeTab}-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting report:', err);
      setError('Failed to export report');
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-2">
              Financial Reports
            </h1>
            <p className="text-slate-600 font-semibold flex items-center gap-2">
              <BarChart3 size={18} className="text-indigo-500" />
              Real-time financial analytics and insights
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-slate-200 rounded-2xl font-bold text-slate-700 hover:border-indigo-300 hover:shadow-lg transition-all disabled:opacity-50"
            >
              <RefreshCcw size={18} className={isRefreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-slate-200 rounded-2xl font-bold text-slate-700 hover:border-indigo-300 hover:shadow-lg transition-all"
            >
              <Filter size={18} />
              Filters
              <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={handleExportReport}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold hover:shadow-xl transition-all"
            >
              <Download size={18} />
              Export
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 flex items-start justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-rose-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-rose-900">Error</p>
                <p className="text-sm text-rose-700">{error}</p>
              </div>
            </div>
            <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800">
              <X size={20} />
            </button>
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="text-indigo-600" size={20} />
              <h3 className="text-lg font-black text-slate-900">Filter Options</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-600 mb-2">Academic Year</label>
                <select
                  value={filters.academicYearId}
                  onChange={(e) => setFilters({ ...filters, academicYearId: e.target.value, termId: '' })}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-semibold text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                >
                  <option value="">All Years</option>
                  {academicYears.map(year => (
                    <option key={year.id} value={year.id}>
                      {year.name} {year.is_active ? '(Active)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-600 mb-2">Term</label>
                <select
                  value={filters.termId}
                  onChange={(e) => setFilters({ ...filters, termId: e.target.value })}
                  disabled={!filters.academicYearId}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-semibold text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">All Terms</option>
                  {terms.map(term => (
                    <option key={term.id} value={term.id}>{term.name}</option>
                  ))}
                </select>
              </div>

              {activeTab === 'monthly' && (
                <>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-600 mb-2">Month</label>
                    <select
                      value={filters.month}
                      onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-semibold text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                    >
                      {months.map((month, idx) => (
                        <option key={idx} value={idx + 1}>{month}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-600 mb-2">Year</label>
                    <input
                      type="number"
                      value={filters.year}
                      onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-semibold text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-3 bg-white p-2 rounded-3xl shadow-lg border-2 border-slate-100 w-fit">
          <TabButton
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            icon={<Building2 size={18} />}
            label="Financial Overview"
          />
          <TabButton
            active={activeTab === 'monthly'}
            onClick={() => setActiveTab('monthly')}
            icon={<Calendar size={18} />}
            label="Monthly Report"
          />
        </div>

        {/* Content */}
        {activeTab === 'overview' ? (
          <OverviewTab overview={overview} loading={loading.overview} />
        ) : (
          <MonthlyTab monthlyReport={monthlyReport} loading={loading.monthly} filters={filters} />
        )}
      </div>
    </div>
  );
};

/* ============= OVERVIEW TAB ============= */
const OverviewTab: React.FC<{ overview: FinancialOverview | null; loading: boolean }> = ({ overview, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">Loading financial data...</p>
        </div>
      </div>
    );
  }

  if (!overview) return null;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Revenue Potential"
          value={formatCurrency(overview.totals.revenuePotential)}
          subtitle={`${overview.counts.totalInvoices} invoices`}
          icon={<DollarSign size={24} />}
          variant="primary"
        />
        <StatCard
          title="Actual Cash"
          value={formatCurrency(overview.totals.actualCash)}
          subtitle={`${overview.counts.totalPayments} payments`}
          icon={<Wallet size={24} />}
          variant="success"
        />
        <StatCard
          title="Outstanding Debt"
          value={formatCurrency(overview.totals.outstandingDebt)}
          subtitle={`${overview.counts.outstandingInvoices} pending`}
          icon={<AlertCircle size={24} />}
          variant="danger"
        />
        <StatCard
          title="Advance Payments"
          value={formatCurrency(overview.totals.advancePayments)}
          subtitle={<HealthBadge status={overview.healthStatus} />}
          icon={<PiggyBank size={24} />}
          variant="info"
        />
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collection Performance */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-slate-100">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-xl font-black text-slate-900 mb-1">Collection Performance</h3>
              <p className="text-sm text-slate-500 font-semibold">Target: 80%+</p>
            </div>
            {overview.totals.collectionRate > 80 ? (
              <TrendingUp className="text-emerald-500" size={32} />
            ) : (
              <TrendingDown className="text-rose-500" size={32} />
            )}
          </div>
          
          <div className="flex items-end gap-4 mb-4">
            <h2 className="text-5xl font-black text-indigo-600">
              {overview.totals.collectionRate.toFixed(1)}%
            </h2>
          </div>

          <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ${
                overview.totals.collectionRate > 80
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : overview.totals.collectionRate > 60
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                  : 'bg-gradient-to-r from-rose-500 to-pink-500'
              }`}
              style={{ width: `${Math.min(overview.totals.collectionRate, 100)}%` }}
            />
          </div>
        </div>

        {/* Growth Rate */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-black mb-1">Growth Rate</h3>
                <p className="text-sm text-slate-400 font-semibold">Compared to previous period</p>
              </div>
              {overview.totals.growthRate >= 0 ? (
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                  <ArrowUpRight className="text-emerald-400" size={24} />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center">
                  <ArrowDownRight className="text-rose-400" size={24} />
                </div>
              )}
            </div>
            
            <h2 className={`text-5xl font-black mb-2 ${overview.totals.growthRate >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {overview.totals.growthRate >= 0 ? '+' : ''}{overview.totals.growthRate.toFixed(1)}%
            </h2>
          </div>
          
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-indigo-500/10 to-transparent rounded-full blur-3xl" />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="bg-white rounded-3xl shadow-xl border-2 border-slate-100 overflow-hidden">
          <div className="p-6 border-b-2 border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Recent Payments</h3>
                  <p className="text-xs font-semibold text-slate-600">Last 30 days</p>
                </div>
              </div>
              <span className="text-xs font-black text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                {overview.recentActivity.recentPayments.length} transactions
              </span>
            </div>
          </div>
          
          <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
            {overview.recentActivity.recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xs">
                    {payment.student.first_name[0]}{payment.student.last_name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">
                      {payment.student.first_name} {payment.student.last_name}
                    </p>
                    <p className="text-xs text-slate-500 font-semibold">{payment.student.admission_number}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900">{formatCurrency(payment.amount)}</p>
                  <div className="flex items-center gap-1 justify-end mt-1">
                    <CreditCard size={12} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-500">{payment.payment_method}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Debtors */}
        <div className="bg-white rounded-3xl shadow-xl border-2 border-slate-100 overflow-hidden">
          <div className="p-6 border-b-2 border-slate-100 bg-gradient-to-r from-rose-50 to-pink-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center">
                  <AlertCircle className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Top Debtors</h3>
                  <p className="text-xs font-semibold text-slate-600">Highest outstanding balances</p>
                </div>
              </div>
              <span className="text-xs font-black text-rose-600 bg-rose-100 px-3 py-1 rounded-full">
                {formatCurrency(overview.totals.outstandingDebt)}
              </span>
            </div>
          </div>
          
          <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
            {overview.recentActivity.topDebtors.map((invoice, idx) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-black text-xs">
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">
                      {invoice.student.first_name} {invoice.student.last_name}
                    </p>
                    <p className="text-xs text-slate-500 font-semibold">
                      {invoice.student.class?.class_name || 'N/A'} • {invoice.student.admission_number}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-rose-600">{formatCurrency(invoice.balance)}</p>
                  <div className="flex items-center gap-1 justify-end mt-1">
                    <Clock size={12} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-500">
                      Due {formatDate(invoice.due_date, 'MMM dd')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Report Info */}
      <div className="text-center">
        <p className="text-xs text-slate-500 font-semibold">
          Report generated: {formatDate(overview.timeRange.generatedAt)}
          {overview.timeRange.academicYearId && ' • Filtered by Academic Year & Term'}
        </p>
      </div>
    </div>
  );
};

/* ============= MONTHLY TAB ============= */
const MonthlyTab: React.FC<{ 
  monthlyReport: MonthlyReport | null; 
  loading: boolean;
  filters: { month: number; year: number };
}> = ({ monthlyReport, loading, filters }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">Loading monthly report...</p>
        </div>
      </div>
    );
  }

  if (!monthlyReport) return null;

  const monthName = new Date(monthlyReport.year, monthlyReport.month - 1).toLocaleString('default', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="space-y-6">
      {/* Monthly Summary Card */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-indigo-200 mb-2">Monthly Summary</p>
            <h2 className="text-3xl font-black">{monthName}</h2>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
            <ProgressCircle value={monthlyReport.summary.collectionRate} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
            <p className="text-xs font-black uppercase tracking-widest text-indigo-200 mb-2">Invoiced</p>
            <p className="text-3xl font-black">{formatCurrency(monthlyReport.summary.totalInvoiced)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
            <p className="text-xs font-black uppercase tracking-widest text-emerald-200 mb-2">Collected</p>
            <p className="text-3xl font-black text-emerald-300">{formatCurrency(monthlyReport.summary.totalCollected)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
            <p className="text-xs font-black uppercase tracking-widest text-rose-200 mb-2">Outstanding</p>
            <p className="text-3xl font-black text-rose-300">{formatCurrency(monthlyReport.summary.totalOutstanding)}</p>
          </div>
        </div>
      </div>

      {/* Payment Methods & Top Students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="bg-white rounded-3xl shadow-xl border-2 border-slate-100 overflow-hidden">
          <div className="p-6 border-b-2 border-slate-100 bg-gradient-to-r from-blue-50 to-cyan-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                <CreditCard className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Payment Methods</h3>
                <p className="text-xs font-semibold text-slate-600">Distribution breakdown</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-3">
            {monthlyReport.paymentMethodBreakdown.map((method) => (
              <div key={method.method} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <CreditCard className="text-white" size={18} />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-sm">{method.method}</p>
                    <p className="text-xs text-slate-500 font-semibold">{method.percentage.toFixed(1)}% of total</p>
                  </div>
                </div>
                <p className="font-black text-slate-900 text-lg">{formatCurrency(method.amount)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Students */}
        <div className="bg-white rounded-3xl shadow-xl border-2 border-slate-100 overflow-hidden">
          <div className="p-6 border-b-2 border-slate-100 bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
                <User className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Top Paying Students</h3>
                <p className="text-xs font-semibold text-slate-600">Highest contributors</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-3">
            {monthlyReport.topStudents.map((student, idx) => (
              <div key={student.student_id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-xs">
                    #{idx + 1}
                  </div>
                  <p className="font-bold text-slate-900 text-sm">{student.name}</p>
                </div>
                <p className="font-black text-emerald-600 text-lg">{formatCurrency(student.amount_paid)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <div className="bg-white rounded-3xl shadow-xl border-2 border-slate-100 overflow-hidden">
        <div className="p-6 border-b-2 border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center">
              <Calendar className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Daily Collection Breakdown</h3>
              <p className="text-xs font-semibold text-slate-600">Day-by-day performance</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b-2 border-slate-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-600">Date</th>
                <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-wider text-slate-600">Invoiced</th>
                <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-wider text-slate-600">Collected</th>
                <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-wider text-slate-600">Payments</th>
                <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-wider text-slate-600">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyReport.dailyBreakdown.map((day) => {
                const collectionRate = day.invoiced > 0 ? (day.collected / day.invoiced) * 100 : 0;
                return (
                  <tr key={day.date} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      {formatDate(day.date, 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-slate-700">
                      {formatCurrency(day.invoiced)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-emerald-600">
                      {formatCurrency(day.collected)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black">
                        {day.paymentsCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black ${
                        collectionRate >= 80
                          ? 'bg-emerald-100 text-emerald-700'
                          : collectionRate >= 60
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {collectionRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;
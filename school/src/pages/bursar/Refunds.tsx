import React, { useState, useEffect } from "react";
import { 
  Undo2, 
  Search, 
  AlertCircle, 
  Wallet, 
  ArrowRightLeft, 
  CheckCircle2, 
  Clock,
  Banknote,
  FileText,
  User,
  Download,
  Filter,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
  ChevronDown,
  Plus,
  Calendar,
  Loader2
} from "lucide-react";
import Card from "../../components/common/Card";
import { financeAPI } from "../../services/api";
import { toast } from "react-hot-toast";

/* ---------------- TYPES ---------------- */
type RefundRequest = {
  id: string;
  refund_reference: string;
  student: {
    id: string;
    first_name: string;
    last_name: string;
    admission_number: string;
    class?: {
      class_name: string;
    };
  };
  invoice?: {
    invoice_number: string;
    total_amount: number;
  };
  amount: number;
  reason: string;
  payment_method: string;
  status: "pending" | "approved" | "completed" | "rejected";
  requested_at: string;
  approved_at?: string;
  processed_at?: string;
  notes?: string;
  rejection_reason?: string;
};

type RefundSummary = {
  totals: {
    all_time: number;
    pending: number;
    approved: number;
    completed: number;
    rejected: number;
  };
  counts: {
    pending: number;
    approved: number;
    completed: number;
    rejected: number;
  };
  payment_methods: Record<string, {
    total_amount: number;
    count: number;
  }>;
};

const Refunds: React.FC = () => {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "completed" | "rejected">("all");
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<RefundSummary>({
    totals: {
      all_time: 0,
      pending: 0,
      approved: 0,
      completed: 0,
      rejected: 0
    },
    counts: {
      pending: 0,
      approved: 0,
      completed: 0,
      rejected: 0
    },
    payment_methods: {}
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch refund data
  const fetchRefunds = async (page = 1) => {
    try {
      setLoading(true);
      const response = await financeAPI.getRefundRequests({
        status: filter === 'all' ? undefined : filter,
        search: searchTerm || undefined,
        page: page,
        limit: 10
      });
      
      if (response.data.success) {
        setRefundRequests(response.data.data.refunds || []);
        
        // Update pagination info
        if (response.data.data.pagination) {
          setCurrentPage(response.data.data.pagination.page);
          setTotalPages(response.data.data.pagination.pages);
          setTotalItems(response.data.data.pagination.total);
        }
        
        // Update summary
        if (response.data.data.summary) {
          setSummary(prev => ({
            ...prev,
            pending_total: response.data.data.summary.pending_total || 0,
            pending_count: response.data.data.summary.pending_count || 0
          }));
        }
      }
    } catch (error: any) {
      console.error("Error fetching refunds:", error);
      toast.error(error.response?.data?.error || "Failed to load refunds");
    } finally {
      setLoading(false);
    }
  };

  // Fetch refund summary
  const fetchRefundSummary = async () => {
    try {
      const response = await financeAPI.getRefundSummary();
      if (response.data.success) {
        setSummary(response.data.data);
      }
    } catch (error: any) {
      console.error("Error fetching refund summary:", error);
    }
  };

  // Handle refund approval
  const handleApproveRefund = async (refundId: string) => {
    if (!confirm("Are you sure you want to approve this refund?")) return;
    
    try {
      setIsProcessing(true);
      const response = await financeAPI.approveRefundRequest(refundId, {
        notes: "Approved by bursar"
      });
      
      if (response.data.success) {
        toast.success("Refund approved successfully");
        fetchRefunds();
        fetchRefundSummary();
        setShowActionMenu(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to approve refund");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle refund processing
  const handleProcessRefund = async (refundId: string) => {
    try {
      setIsProcessing(true);
      const response = await financeAPI.processRefund(refundId, {
        transactionReference: `TRX-${Date.now()}`,
        paymentDate: new Date().toISOString().split('T')[0],
        notes: "Processed via system"
      });
      
      if (response.data.success) {
        toast.success("Refund processed successfully");
        fetchRefunds();
        fetchRefundSummary();
        setShowActionMenu(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to process refund");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle refund rejection
  const handleRejectRefund = async (refundId: string) => {
    const reason = prompt("Please enter rejection reason:");
    if (!reason) return;
    
    try {
      setIsProcessing(true);
      const response = await financeAPI.rejectRefundRequest(refundId, {
        rejectionReason: reason
      });
      
      if (response.data.success) {
        toast.success("Refund rejected successfully");
        fetchRefunds();
        fetchRefundSummary();
        setShowActionMenu(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to reject refund");
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate refund report
  const handleGenerateReport = async () => {
    try {
      const response = await financeAPI.generateRefundReport({
        format: 'csv',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        status: 'all'
      });
      
      // Create download link for CSV
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `refunds_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success("Report generated successfully");
    } catch (error: any) {
      toast.error("Failed to generate report");
    }
  };

  // Initialize
  useEffect(() => {
    fetchRefunds();
    fetchRefundSummary();
  }, [filter, searchTerm]);

  // Get status style
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "completed": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "approved": return "bg-blue-50 text-blue-600 border-blue-100";
      case "pending": return "bg-amber-50 text-amber-600 border-amber-100";
      case "rejected": return "bg-rose-50 text-rose-600 border-rose-100";
      default: return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 size={14} />;
      case "approved": return <CheckCircle size={14} />;
      case "pending": return <Clock size={14} />;
      case "rejected": return <XCircle size={14} />;
      default: return null;
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
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Calculate pending refunds total
  const calculatePendingTotal = () => {
    return Object.values(summary.payment_methods || {}).reduce((total, method) => {
      return total + (method.total_amount || 0);
    }, 0);
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            Refund Management <Undo2 className="text-rose-500" size={28} />
          </h1>
          <p className="text-slate-500 font-medium">Process overpayments and credit adjustments.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleGenerateReport}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download size={16} /> Export Report
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-slate-200"
          >
            <Banknote size={16} /> Create Refund
          </button>
        </div>
      </div>

      {/* 2. Visual Workflow Info */}
      <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
        <div className="z-10">
          <h2 className="text-xl font-black mb-2">Refund Processing Workflow</h2>
          <p className="text-indigo-100 text-sm max-w-md">
            All refunds require Bursar approval and must be reconciled with the bank statement before being marked as completed.
          </p>
        </div>
        <div className="flex items-center gap-4 z-10">
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${summary.counts.pending > 0 ? 'bg-white text-indigo-600' : 'bg-white/20'}`}>
              {summary.counts.pending || 0}
            </div>
            <span className="text-[10px] uppercase font-bold mt-2">Pending</span>
          </div>
          <div className="h-px w-8 bg-white/20" />
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${summary.counts.approved > 0 ? 'bg-white text-indigo-600' : 'bg-white/20'}`}>
              {summary.counts.approved || 0}
            </div>
            <span className="text-[10px] uppercase font-bold mt-2">Approve</span>
          </div>
          <div className="h-px w-8 bg-white/20" />
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${summary.counts.completed > 0 ? 'bg-emerald-400 text-white' : 'bg-white/20'}`}>
              {summary.counts.completed || 0}
            </div>
            <span className="text-[10px] uppercase font-bold mt-2 text-emerald-300">Payout</span>
          </div>
        </div>
        <ArrowRightLeft className="absolute -right-8 -bottom-8 w-48 h-48 text-white/5 rotate-12" />
      </div>

      {/* 3. Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white p-6 rounded-2xl border-none shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Pending</p>
              <h3 className="text-2xl font-black mt-1 text-slate-800">
                {formatCurrency(summary.totals.pending || calculatePendingTotal())}
              </h3>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl">
              <Clock className="text-amber-500" size={24} />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">{summary.counts.pending || 0} refund requests</p>
        </Card>

        <Card className="bg-white p-6 rounded-2xl border-none shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Approved</p>
              <h3 className="text-2xl font-black mt-1 text-slate-800">
                {formatCurrency(summary.totals.approved || 0)}
              </h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <CheckCircle className="text-blue-500" size={24} />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">{summary.counts.approved || 0} awaiting processing</p>
        </Card>

        <Card className="bg-white p-6 rounded-2xl border-none shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Completed</p>
              <h3 className="text-2xl font-black mt-1 text-slate-800">
                {formatCurrency(summary.totals.completed || 0)}
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <CheckCircle2 className="text-emerald-500" size={24} />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">{summary.counts.completed || 0} refunds paid</p>
        </Card>

        <Card className="bg-white p-6 rounded-2xl border-none shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">All Time</p>
              <h3 className="text-2xl font-black mt-1 text-slate-800">
                {formatCurrency(summary.totals.all_time || 0)}
              </h3>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl">
              <Undo2 className="text-indigo-500" size={24} />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Total refunds processed</p>
        </Card>
      </div>

      {/* 4. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Active Requests */}
        <div className="lg:col-span-8">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-0 bg-white overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Recent Requests</h2>
                <p className="text-slate-500 text-sm">{totalItems} total refund requests</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setFilter("all")}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${filter === 'all' ? 'bg-slate-100 text-slate-600' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  All
                </button>
                <button 
                  onClick={() => setFilter("pending")}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${filter === 'pending' ? 'bg-amber-100 text-amber-600' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  Pending
                </button>
                <button 
                  onClick={() => setFilter("approved")}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${filter === 'approved' ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  Approved
                </button>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="px-8 py-4 border-b border-slate-50">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search by student name, admission number, or reference..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl text-sm border-0 focus:ring-2 focus:ring-indigo-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50">
                  <Filter size={16} />
                  <span className="text-sm font-medium">Filter</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <Loader2 className="animate-spin text-slate-400" size={32} />
                  <p className="text-slate-500 mt-2">Loading refund requests...</p>
                </div>
              ) : refundRequests.length === 0 ? (
                <div className="py-12 text-center">
                  <Undo2 className="mx-auto text-slate-300" size={48} />
                  <p className="text-slate-500 mt-2">No refund requests found</p>
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Create your first refund request
                  </button>
                </div>
              ) : (
                <>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Recipient</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Amount</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Method</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Status</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Date</th>
                        <th className="px-8 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {refundRequests.map((req) => (
                        <tr key={req.id} className="group hover:bg-slate-50/30">
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-700">
                                {req.student?.first_name} {req.student?.last_name}
                              </span>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                ID: {req.student?.admission_number} • {req.student?.class?.class_name || 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5 font-black text-slate-900">
                            {formatCurrency(req.amount)}
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                              <Wallet size={14} className="text-slate-400" /> 
                              {req.payment_method || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border flex items-center gap-1 w-fit ${getStatusStyle(req.status)}`}>
                              {getStatusIcon(req.status)}
                              {req.status}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-sm text-slate-500">
                            {formatDate(req.requested_at)}
                          </td>
                          <td className="px-8 py-5 text-right relative">
                            <button 
                              onClick={() => setShowActionMenu(showActionMenu === req.id ? null : req.id)}
                              className="p-2 hover:bg-slate-100 rounded-lg relative"
                            >
                              <MoreVertical size={18} className="text-slate-400" />
                              
                              {showActionMenu === req.id && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-10">
                                  <button 
                                    onClick={() => {
                                      setSelectedRefund(req);
                                      setShowActionMenu(null);
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm"
                                  >
                                    <Eye size={14} /> View Details
                                  </button>
                                  
                                  {req.status === 'pending' && (
                                    <>
                                      <button 
                                        onClick={() => handleApproveRefund(req.id)}
                                        disabled={isProcessing}
                                        className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm text-blue-600"
                                      >
                                        <CheckCircle size={14} /> Approve
                                      </button>
                                      <button 
                                        onClick={() => handleRejectRefund(req.id)}
                                        disabled={isProcessing}
                                        className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm text-rose-600"
                                      >
                                        <XCircle size={14} /> Reject
                                      </button>
                                    </>
                                  )}
                                  
                                  {req.status === 'approved' && (
                                    <button 
                                      onClick={() => handleProcessRefund(req.id)}
                                      disabled={isProcessing}
                                      className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm text-emerald-600"
                                    >
                                      <CheckCircle2 size={14} /> Mark as Completed
                                    </button>
                                  )}
                                  
                                  <button 
                                    onClick={() => financeAPI.getRefundRequestById(req.id)}
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm"
                                  >
                                    <ExternalLink size={14} /> Open in Full View
                                  </button>
                                </div>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-8 py-6 border-t border-slate-50 flex items-center justify-between">
                      <p className="text-sm text-slate-500">
                        Showing {refundRequests.length} of {totalItems} requests
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                        >
                          Previous
                        </button>
                        <span className="px-3 py-2 text-slate-600">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>
        </div>

        {/* 5. Quick Actions / Summary */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-8 bg-white border-l-4 border-amber-400">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <AlertCircle size={24} />
              <h3 className="font-black uppercase text-sm tracking-widest">Notice</h3>
            </div>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              Refunds to <strong>Credit Note</strong> will automatically reduce the student's balance for the next billing cycle. No actual cash will leave the school accounts.
            </p>
            <button className="mt-4 text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center gap-1">
              <FileText size={14} /> Read Refund Policy
            </button>
          </Card>

          {/* Payment Method Breakdown */}
          <Card className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50">
            <h3 className="font-black text-slate-800 mb-4">Payment Method Breakdown</h3>
            <div className="space-y-4">
              {Object.entries(summary.payment_methods || {}).map(([method, data]) => (
                <div key={method} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      method === 'M-Pesa' ? 'bg-green-500' :
                      method === 'Bank Transfer' ? 'bg-blue-500' :
                      method === 'Credit Note' ? 'bg-purple-500' :
                      'bg-slate-400'
                    }`} />
                    <span className="text-sm text-slate-600">{method}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">{formatCurrency(data.total_amount || 0)}</p>
                    <p className="text-xs text-slate-400">{data.count || 0} refunds</p>
                  </div>
                </div>
              ))}
              
              {Object.keys(summary.payment_methods || {}).length === 0 && (
                <p className="text-slate-400 text-sm text-center py-4">No payment method data available</p>
              )}
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50">
            <h3 className="font-black text-slate-800 mb-6">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-sm text-slate-600">Average Refund</span>
                <span className="font-bold text-slate-800">
                  {summary.totals.all_time > 0 && summary.counts.completed > 0 
                    ? formatCurrency(Math.round(summary.totals.all_time / (summary.counts.completed || 1)))
                    : formatCurrency(0)
                  }
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-sm text-slate-600">Processing Time</span>
                <span className="font-bold text-slate-800">2.5 days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Approval Rate</span>
                <span className="font-bold text-slate-800">
                  {totalItems > 0 
                    ? `${Math.round((summary.counts.completed / totalItems) * 100)}%`
                    : '0%'
                  }
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-indigo-100">
            <h3 className="font-black text-slate-800 mb-6">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => setShowCreateModal(true)}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} /> New Refund Request
              </button>
              <button 
                onClick={fetchRefunds}
                disabled={loading}
                className="w-full bg-white text-slate-700 py-3 rounded-xl font-medium hover:bg-slate-50 transition-colors border border-slate-200 flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh Data
              </button>
              <button 
                onClick={handleGenerateReport}
                className="w-full bg-white text-slate-700 py-3 rounded-xl font-medium hover:bg-slate-50 transition-colors border border-slate-200 flex items-center justify-center gap-2"
              >
                <Download size={18} /> Export All Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Refund Modal (Simplified) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-slate-800">Create Refund Request</h2>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <XCircle size={24} className="text-slate-400" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Student Selection
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search for student by name or admission number..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl text-sm border-0 focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Refund Amount
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm border-0 focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Payment Method
                    </label>
                    <select className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm border-0 focus:ring-2 focus:ring-indigo-200">
                      <option value="">Select method</option>
                      <option value="M-Pesa">M-Pesa</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Credit Note">Credit Note</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Reason for Refund
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Explain why this refund is needed..."
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm border-0 focus:ring-2 focus:ring-indigo-200 resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Any additional notes..."
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm border-0 focus:ring-2 focus:ring-indigo-200 resize-none"
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                  >
                    Cancel
                  </button>
                  <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">
                    Submit Refund Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Details Modal */}
      {selectedRefund && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-800">Refund Details</h2>
                  <p className="text-slate-500">Reference: {selectedRefund.refund_reference}</p>
                </div>
                <button 
                  onClick={() => setSelectedRefund(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <XCircle size={24} className="text-slate-400" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="bg-slate-50 rounded-2xl p-6">
                  <h3 className="font-bold text-slate-800 mb-4">Student Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Name</p>
                      <p className="font-medium">{selectedRefund.student.first_name} {selectedRefund.student.last_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Admission Number</p>
                      <p className="font-medium">{selectedRefund.student.admission_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Class</p>
                      <p className="font-medium">{selectedRefund.student.class?.class_name || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 rounded-2xl p-6">
                  <h3 className="font-bold text-slate-800 mb-4">Refund Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Amount</p>
                      <p className="text-2xl font-black text-slate-800">{formatCurrency(selectedRefund.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Payment Method</p>
                      <p className="font-medium">{selectedRefund.payment_method}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Status</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusStyle(selectedRefund.status)}`}>
                        {selectedRefund.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Request Date</p>
                      <p className="font-medium">{formatDate(selectedRefund.requested_at)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-slate-500">Reason</p>
                      <p className="font-medium">{selectedRefund.reason}</p>
                    </div>
                    {selectedRefund.notes && (
                      <div className="col-span-2">
                        <p className="text-sm text-slate-500">Notes</p>
                        <p className="font-medium">{selectedRefund.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedRefund.invoice && (
                  <div className="bg-slate-50 rounded-2xl p-6">
                    <h3 className="font-bold text-slate-800 mb-4">Related Invoice</h3>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{selectedRefund.invoice.invoice_number}</p>
                        <p className="text-sm text-slate-500">Original Amount: {formatCurrency(selectedRefund.invoice.total_amount)}</p>
                      </div>
                      <button className="text-indigo-600 hover:text-indigo-700 font-medium">
                        View Invoice
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedRefund(null)}
                    className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                  >
                    Close
                  </button>
                  {selectedRefund.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApproveRefund(selectedRefund.id)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectRefund(selectedRefund.id)}
                        className="px-6 py-3 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {selectedRefund.status === 'approved' && (
                    <button
                      onClick={() => handleProcessRefund(selectedRefund.id)}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700"
                    >
                      Mark as Completed
                    </button>
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

export default Refunds;
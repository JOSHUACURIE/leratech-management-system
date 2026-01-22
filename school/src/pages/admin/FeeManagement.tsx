import React, { useState, useEffect } from "react";
import { 
    Wallet, Users, CheckCircle, AlertCircle, Receipt, Send, 
    TrendingUp, BarChart3, PieChart, Calendar, Download, Filter 
} from "lucide-react";
import Card from "../../components/common/Card";
import api from "../../services/api";

const FeeManagement: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [studentLedger, setStudentLedger] = useState<any[]>([]);
    const [classSummary, setClassSummary] = useState<any[]>([]);
    const [recentActivities, setRecentActivities] = useState<any[]>([]);
    const [topDebtors, setTopDebtors] = useState<any[]>([]);
    const [collectionTrend, setCollectionTrend] = useState<any[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState('monthly');

    // Fetch all dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                
                const [
                    summaryRes,
                    ledgerRes,
                    classRes,
                    activitiesRes,
                    debtorsRes,
                    trendRes
                ] = await Promise.all([
                    api.get('/admin/finance/dashboard/summary'),
                    api.get('/admin/finance/dashboard/ledger?limit=50'),
                    api.get('/admin/finance/dashboard/class-summary'),
                    api.get('/admin/finance/dashboard/recent-activities?limit=10'),
                    api.get('/admin/finance/dashboard/top-debtors?limit=10'),
                    api.get(`/admin/finance/dashboard/collection-trend?period=${selectedPeriod}&months=6`)
                ]);

                setDashboardData(summaryRes.data?.data || {});
                setStudentLedger(ledgerRes.data?.data?.ledger || []);
                setClassSummary(classRes.data?.data?.classSummary || []);
                setRecentActivities(activitiesRes.data?.data?.activities || []);
                setTopDebtors(debtorsRes.data?.data?.debtors || []);
                setCollectionTrend(trendRes.data?.data?.trend || []);

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [selectedPeriod]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-slate-500 font-bold">Loading Fee Dashboard...</p>
                </div>
            </div>
        );
    }

    const summary = dashboardData?.summary || {};
    const academicYear = dashboardData?.academicYear || {};

    return (
        <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">Fee Management Dashboard</h1>
                    <p className="text-slate-500 font-medium">Financial overview and monitoring (Admin View)</p>
                    {academicYear.name && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-indigo-600 font-medium">
                            <Calendar size={16} />
                            <span>{academicYear.name} • {academicYear.currentTerm}</span>
                        </div>
                    )}
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all text-sm">
                        <Filter size={16} />
                        Filters
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all text-sm">
                        <Download size={16} />
                        Export
                    </button>
                </div>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { 
                        label: "Total Balance Due", 
                        val: `KES ${(summary.totalBalance || 0).toLocaleString()}`, 
                        icon: <Wallet />, 
                        color: "from-rose-500 to-orange-500",
                        subText: `${summary.outstandingInvoices || 0} invoices`
                    },
                    { 
                        label: "Total Students", 
                        val: summary.totalStudents || 0, 
                        icon: <Users />, 
                        color: "from-blue-500 to-indigo-600",
                        subText: `${summary.pendingStudents || 0} pending, ${summary.clearedStudents || 0} cleared`
                    },
                    { 
                        label: "Collection Rate", 
                        val: summary.collectionRate || "0%", 
                        icon: <TrendingUp />, 
                        color: "from-emerald-400 to-teal-500",
                        subText: `${(summary.recentCollections || 0).toLocaleString()} collected recently`
                    },
                    { 
                        label: "Advance Payments", 
                        val: `KES ${(summary.advancePayments || 0).toLocaleString()}`, 
                        icon: <AlertCircle />, 
                        color: "from-amber-400 to-orange-500",
                        subText: "Credit balance available"
                    },
                ].map((stat, i) => (
                    <div key={i} className={`relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
                        <div className="relative z-10">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-3 border border-white/30">
                                {stat.icon}
                            </div>
                            <p className="text-xs font-bold uppercase tracking-widest opacity-80">{stat.label}</p>
                            <p className="text-2xl font-black mt-1">{stat.val}</p>
                            {stat.subText && (
                                <p className="text-xs font-medium opacity-90 mt-2">{stat.subText}</p>
                            )}
                        </div>
                        <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
                    </div>
                ))}
            </div>

            {/* Top Debtors and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Debtors Card */}
                <Card className="border-none shadow-lg rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Top Debtors</h3>
                        <span className="text-xs font-bold text-slate-400">
                            {topDebtors.length} students
                        </span>
                    </div>
                    <div className="space-y-4">
                        {topDebtors.slice(0, 5).map((debtor, index) => (
                            <div key={debtor.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold
                                        ${index === 0 ? 'bg-rose-500' : 
                                          index === 1 ? 'bg-orange-500' : 
                                          index === 2 ? 'bg-amber-500' : 
                                          'bg-slate-400'}`}>
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-700">{debtor.student}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-slate-500">{debtor.class}</span>
                                            {debtor.stream !== 'N/A' && (
                                                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                                    {debtor.stream}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-rose-600">KES {debtor.netBalance.toLocaleString()}</p>
                                    {debtor.daysSinceLastPayment !== null && (
                                        <p className="text-xs text-slate-400">
                                            {debtor.daysSinceLastPayment} days since last payment
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Recent Activity Card */}
                <Card className="border-none shadow-lg rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Recent Activity</h3>
                        <div className="flex gap-2">
                            <button className="text-xs font-bold text-slate-400 hover:text-slate-700">
                                All
                            </button>
                            <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                                Payments
                            </button>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {recentActivities.slice(0, 5).map((activity) => (
                            <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                                    ${activity.type === 'PAYMENT' ? 'bg-emerald-100 text-emerald-600' :
                                      activity.type === 'INVOICE' ? 'bg-blue-100 text-blue-600' :
                                      'bg-amber-100 text-amber-600'}`}>
                                    {activity.type === 'PAYMENT' ? <CheckCircle size={16} /> :
                                     activity.type === 'INVOICE' ? <Receipt size={16} /> :
                                     <AlertCircle size={16} />}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-slate-700">{activity.description}</p>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-xs text-slate-500">{activity.studentName}</span>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                                            ${activity.type === 'PAYMENT' ? 'bg-emerald-50 text-emerald-600' :
                                              activity.type === 'INVOICE' ? 'bg-blue-50 text-blue-600' :
                                              'bg-amber-50 text-amber-600'}`}>
                                            KES {activity.amount.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Collection Trend */}
            <Card className="border-none shadow-lg rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Collection Trend</h3>
                    <div className="flex gap-2">
                        {['daily', 'weekly', 'monthly'].map((period) => (
                            <button
                                key={period}
                                onClick={() => setSelectedPeriod(period)}
                                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all
                                    ${selectedPeriod === period 
                                        ? 'bg-indigo-600 text-white' 
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                {period.charAt(0).toUpperCase() + period.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="h-64 flex items-end gap-2">
                    {collectionTrend.map((item, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center">
                            <div 
                                className="w-10 bg-gradient-to-t from-indigo-500 to-indigo-600 rounded-t-lg hover:from-indigo-600 hover:to-indigo-700 transition-all cursor-pointer"
                                style={{ height: `${Math.min(100, (item.collected / Math.max(...collectionTrend.map(t => t.collected)) * 100))}%` }}
                                title={`${item.period}: KES ${item.collected.toLocaleString()}`}
                            />
                            <div className="mt-2 text-center">
                                <p className="text-xs font-bold text-slate-700">{item.period}</p>
                                <p className="text-xs text-slate-500">KES {(item.collected / 1000).toFixed(0)}K</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Class-wise Summary */}
            <Card className="border-none shadow-lg rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Class-wise Performance</h3>
                    <div className="flex items-center gap-2">
                        <BarChart3 size={18} className="text-slate-400" />
                        <span className="text-sm font-bold text-slate-500">Collection Rate</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="pb-3">Class</th>
                                <th className="pb-3 text-right">Students</th>
                                <th className="pb-3 text-right">Outstanding</th>
                                <th className="pb-3 text-right">Collection Rate</th>
                                <th className="pb-3 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {classSummary.slice(0, 8).map((cls) => (
                                <tr key={cls.classId} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-3">
                                        <div>
                                            <p className="font-bold text-slate-700">{cls.className}</p>
                                            <p className="text-xs text-slate-500">Level {cls.classLevel}</p>
                                        </div>
                                    </td>
                                    <td className="py-3 text-right">
                                        <span className="font-bold text-slate-700">{cls.studentCount}</span>
                                        <div className="flex gap-1 justify-end mt-1">
                                            <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
                                                {cls.clearedStudents} paid
                                            </span>
                                            <span className="text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">
                                                {cls.pendingStudents} due
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-3 text-right">
                                        <p className="font-bold text-slate-700">
                                            KES {cls.totalOutstanding.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Avg: KES {cls.avgBalance}
                                        </p>
                                    </td>
                                    <td className="py-3 text-right">
                                        <div className="inline-flex items-center gap-2">
                                            <div className="w-20 bg-slate-100 rounded-full h-2">
                                                <div 
                                                    className={`h-2 rounded-full ${
                                                        parseFloat(cls.collectionRate) > 80 ? 'bg-emerald-500' :
                                                        parseFloat(cls.collectionRate) > 60 ? 'bg-amber-500' :
                                                        'bg-rose-500'
                                                    }`}
                                                    style={{ width: `${Math.min(100, parseFloat(cls.collectionRate))}%` }}
                                                />
                                            </div>
                                            <span className={`font-bold ${
                                                parseFloat(cls.collectionRate) > 80 ? 'text-emerald-600' :
                                                parseFloat(cls.collectionRate) > 60 ? 'text-amber-600' :
                                                'text-rose-600'
                                            }`}>
                                                {cls.collectionRate}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-3 text-right">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            cls.status === 'good' ? 'bg-emerald-50 text-emerald-600' :
                                            cls.status === 'fair' ? 'bg-amber-50 text-amber-600' :
                                            'bg-rose-50 text-rose-600'
                                        }`}>
                                            {cls.status === 'good' ? 'Excellent' :
                                             cls.status === 'fair' ? 'On Track' : 'Needs Attention'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default FeeManagement;
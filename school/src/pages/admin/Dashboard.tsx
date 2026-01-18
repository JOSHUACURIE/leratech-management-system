import React from "react";

import Card from "../../components/common/Card";
import { useAuth } from "../../context/AuthContext";


const mockSummary = [
  { title: "Total Students", value: 120, gradient: "from-indigo-500 to-purple-600", icon: "🎓" },
  { title: "Total Teachers", value: 15, gradient: "from-emerald-400 to-cyan-500", icon: "👩‍🏫" },
  { title: "Fee Collection", value: "KES 500k", gradient: "from-orange-400 to-rose-400", icon: "💰" },
  { title: "Active Classes", value: 5, gradient: "from-blue-400 to-indigo-500", icon: "🏫" }
];

const AdminDashboard: React.FC = () => {
  const { user, school, getUserFullName, getUserAvatar } = useAuth();

  const formatSchoolName = (schoolName?: string) => {
    if (!schoolName) return "";
    return schoolName
      .replace(/^\w/, (c) => c.toUpperCase())
      .replace(/([a-z])([A-Z])/g, '$1 $2');
  };

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen font-sans text-slate-900">
   
      <header className="mb-10">
 
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {school?.logo_url && (
              <img 
                src={school.logo_url} 
                alt={`${school.name} logo`}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm"
              />
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                {school?.portal_title || school?.name || "LeraTech SMS"}
              </h1>
              <p className="text-slate-500 text-sm font-medium">
                {school?.school_code && `School Code: ${school.school_code}`}
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="px-4 py-2 bg-white shadow-sm rounded-full border border-slate-200 text-sm font-semibold flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              System Live
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-2xl p-6 border border-indigo-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-800">
                {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  {user?.first_name || "Admin"}
                </span>
              </h2>
              <p className="text-slate-600 mt-2 text-lg font-medium">
                Welcome to the {formatSchoolName(school?.name)} {user?.role.toUpperCase()} Dashboard
              </p>
              <p className="text-slate-500 mt-1">
                Here is what's happening in your school today.
              </p>
            </div>
            
            {/* Quick User Info */}
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-xl border border-slate-200">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white">
                {getUserAvatar() ? (
                  <img 
                    src={getUserAvatar()} 
                    alt={getUserFullName()} 
                    className="h-full w-full rounded-lg object-cover" 
                  />
                ) : (
                  <span className="text-lg font-bold">
                    {(user?.first_name?.[0] || "A").toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <div className="font-semibold text-slate-800">{getUserFullName()}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold uppercase">
                    {user?.role || "admin"}
                  </span>
                  • Admin Dashboard
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Modern Gradient Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {mockSummary.map((item, index) => (
          <div
            key={index}
            className={`relative overflow-hidden group rounded-3xl p-6 text-white shadow-xl bg-gradient-to-br ${item.gradient} transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl`}
          >
            <div className="relative z-10">
              <div className="text-4xl mb-4 opacity-80 group-hover:scale-110 transition-transform">{item.icon}</div>
              <span className="text-sm font-medium uppercase tracking-wider opacity-90">{item.title}</span>
              <div className="text-3xl font-bold mt-1 tracking-tight">{item.value}</div>
            </div>
            {/* Decorative background circle */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions - Floating Style */}
        <div className="lg:col-span-1">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
            <h3 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">⚡</span>
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {['Add Student', 'Add Teacher', 'Open Result Portal'].map((label) => (
                <button
                  key={label}
                  className="w-full text-left px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-semibold text-slate-700 hover:bg-indigo-600 hover:text-white transition-all group flex justify-between items-center"
                >
                  {label}
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Notifications & Tables - Clean & High Contrast */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl">
            <h3 className="text-xl font-bold mb-6 text-slate-800">Recent Updates</h3>
            <div className="divide-y divide-slate-100">
              {[
                { msg: "New teacher Tom Teacher registered", time: "2h ago", type: "user" },
                { msg: "Fee report generated for Grade 4", time: "5h ago", type: "file" }
              ].map((n, i) => (
                <div key={i} className="py-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    {n.type === 'user' ? '👤' : '📄'}
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-700 font-medium leading-tight">{n.msg}</p>
                    <span className="text-xs text-slate-400 mt-1 block">{n.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          
          {/* School Info Card */}
          {school && (
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl">
              <h3 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">🏫</span>
                School Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 font-medium">School Name</p>
                  <p className="text-lg font-semibold text-slate-800">{school.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">School Code</p>
                  <p className="text-lg font-semibold text-slate-800">{school.school_code}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Portal URL</p>
                  <p className="text-lg font-semibold text-slate-800">
                    {school.slug}.leratech.ac.ke
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Portal Title</p>
                  <p className="text-lg font-semibold text-slate-800">
                    {school.portal_title || "LeraTech School Portal"}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
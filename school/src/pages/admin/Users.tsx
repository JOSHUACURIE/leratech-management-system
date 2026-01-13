import React, { useState } from "react";
import { Search, UserPlus, MoreVertical, Filter, Download, UserCheck, ShieldAlert, Users as UsersIcon, Activity } from "lucide-react";
import Card from "../../components/common/Card";
// Types for our user data
type UserRole = "Admin" | "Teacher" | "Student" | "Parent";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "Active" | "Inactive" | "Suspended";
  joinedDate: string;
  avatar?: string;
}

const mockUsers: User[] = [
  { id: "1", name: "Alice Admin", email: "alice@school.com", role: "Admin", status: "Active", joinedDate: "2024-01-10" },
  { id: "2", name: "John Mwalimu", email: "john.t@school.com", role: "Teacher", status: "Active", joinedDate: "2024-02-15" },
  { id: "3", name: "Sarah Kid", email: "sarah.s@school.com", role: "Student", status: "Active", joinedDate: "2025-01-05" },
  { id: "4", name: "Peter Parent", email: "peter.p@gmail.com", role: "Parent", status: "Inactive", joinedDate: "2025-01-08" },
];
const Users: React.FC = () => {
  const [activeTab, setActiveTab] = useState<UserRole | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");

  const tabs: (UserRole | "All")[] = ["All", "Admin", "Teacher", "Student", "Parent"];

  const filteredUsers = mockUsers.filter(user => {
    const matchesTab = activeTab === "All" || user.role === activeTab;
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8 font-sans">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">User Management</h1>
          <p className="text-slate-500 font-medium mt-1">Directory of all school stakeholders and permissions.</p>
        </div>
        <button className="group flex items-center gap-2 bg-slate-900 hover:bg-indigo-600 text-white px-6 py-3.5 rounded-[1.25rem] font-bold transition-all duration-300 shadow-xl shadow-slate-200 active:scale-95">
          <UserPlus size={20} className="group-hover:rotate-12 transition-transform" />
          Add Stakeholder
        </button>
      </div>

      {/* Modern Stats Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Users', val: mockUsers.length, icon: <UsersIcon size={20}/>, color: "text-indigo-600 bg-indigo-50" },
          { label: 'Active Now', val: 12, icon: <Activity size={20}/>, color: "text-emerald-600 bg-emerald-50" },
          { label: 'Pending', val: 3, icon: <UserCheck size={20}/>, color: "text-amber-600 bg-amber-50" },
          { label: 'Suspended', val: 1, icon: <ShieldAlert size={20}/>, color: "text-rose-600 bg-rose-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                {stat.icon}
            </div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">{stat.label}</p>
            <p className="text-3xl font-black text-slate-800 mt-1">{stat.val}</p>
          </div>
        ))}
      </div>

      {/* Main Table Container */}
      <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
        {/* Advanced Toolbar */}
        <div className="p-8 border-b border-slate-50 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex bg-slate-50 p-1.5 rounded-[1.25rem] w-fit border border-slate-100">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-[0.9rem] text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  activeTab === tab 
                    ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200" 
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab}s
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Find by name or email..."
                className="pl-12 pr-6 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 w-full sm:w-80 transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="p-3.5 text-slate-400 hover:bg-slate-50 hover:text-slate-800 rounded-2xl transition-all border border-slate-100">
                <Download size={20} />
            </button>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 uppercase text-[10px] font-black tracking-[0.2em]">
                <th className="px-10 py-6">Personal Identity</th>
                <th className="px-10 py-6 text-center">Security Level</th>
                <th className="px-10 py-6 text-center">Status</th>
                <th className="px-10 py-6">Registry Date</th>
                <th className="px-10 py-6 text-right pr-12">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/60">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="group hover:bg-indigo-50/30 transition-all duration-300 cursor-pointer">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-100">
                            {user.name.charAt(0)}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center border border-slate-100">
                            <div className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        </div>
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{user.name}</p>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-center">
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                        user.role === 'Admin' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                        user.role === 'Teacher' ? 'bg-cyan-50 text-cyan-600 border-cyan-100' :
                        'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                        {user.role}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center justify-center">
                        <div className={`px-3 py-1 rounded-lg text-[10px] font-black flex items-center gap-1.5 ${
                            user.status === 'Active' ? 'text-emerald-500 bg-emerald-50' : 
                            user.status === 'Inactive' ? 'text-slate-400 bg-slate-50' : 'text-rose-500 bg-rose-50'
                        }`}>
                            <div className={`w-1 h-1 rounded-full ${user.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-current'}`} />
                            {user.status}
                        </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className="text-xs font-bold text-slate-500 tracking-tight">{user.joinedDate}</span>
                  </td>
                  <td className="px-10 py-6 text-right pr-12">
                    <button className="p-2.5 text-slate-300 hover:text-slate-800 hover:bg-white hover:shadow-sm rounded-xl transition-all">
                      <MoreVertical size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="p-8 bg-slate-50/50 flex items-center justify-between">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Entry: {filteredUsers.length} of {mockUsers.length}</p>
            <div className="flex gap-3">
                <button className="px-5 py-2 text-xs font-black text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Previous</button>
                <button className="px-5 py-2 text-xs font-black text-white bg-slate-900 rounded-xl hover:bg-indigo-600 transition-colors shadow-lg shadow-slate-200">Next Page</button>
            </div>
        </div>
      </Card>
    </div>
  );
};

export default Users;
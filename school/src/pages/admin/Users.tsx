import React, { useState, useEffect } from "react";
import { 
  Search, UserPlus, MoreVertical, Filter, Download, UserCheck, 
  ShieldAlert, Users as UsersIcon, Activity, Mail, Phone, Edit3, 
  Trash2, Shield, Calendar
} from "lucide-react";
import Card from "../../components/common/Card";
import CreateUserModal from "../../components/modals/CreateUserModal";
import api from "../../services/api";

// Types for our user data
type UserRole = "admin" | "teacher" | "bursar" | "parent" | "student" | "secretary" | "support_staff";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  role: UserRole;
  status: "active" | "inactive" | "suspended";
  created_at: string;
  staff_id?: string;
  teacher_id?: string;
  admission_number?: string;
  parent_code?: string;
  title?: string;
  department?: string;
  last_login?: string;
  profile_image?: string;
}

const Users: React.FC = () => {
  const [activeTab, setActiveTab] = useState<UserRole | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await api.get("/auth/users");
        setUsers(response.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  const tabs: (UserRole | "all")[] = ["all", "admin", "teacher", "student", "parent", "bursar", "secretary", "support_staff"];

  const filteredUsers = users.filter(user => {
    const matchesTab = activeTab === "all" || user.role === activeTab;
    const matchesSearch = 
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.staff_id && user.staff_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.admission_number && user.admission_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.parent_code && user.parent_code.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesTab && matchesSearch;
  });

  // Statistics calculation
  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    suspended: users.filter(u => u.status === 'suspended').length,
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-emerald-100 text-emerald-600';
      case 'inactive': return 'bg-slate-100 text-slate-600';
      case 'suspended': return 'bg-rose-100 text-rose-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch(role) {
      case 'admin': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'teacher': return 'bg-cyan-50 text-cyan-600 border-cyan-100';
      case 'bursar': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'student': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'parent': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'secretary': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'support_staff': return 'bg-gray-50 text-gray-600 border-gray-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    
    try {
      await api.delete(`/auth/users/${userId}`);
      setUsers(users.filter(user => user.id !== userId));
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'reactivate' : 'deactivate';
    
    if (!window.confirm(`Are you sure you want to ${action} ${user.first_name} ${user.last_name}?`)) return;
    
    try {
      await api.patch(`/auth/users/${user.id}/status`, { status: newStatus });
      setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
    } catch (error) {
      console.error("Failed to update user status:", error);
    }
  };

  const handleUserCreated = () => {
    // Refresh the users list
    const fetchUsers = async () => {
      try {
        const response = await api.get("/auth/users");
        setUsers(response.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };
    fetchUsers();
  };

  if (loading) {
    return (
      <div className="p-6 bg-[#F8FAFC] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8 font-sans">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">User Management</h1>
          <p className="text-slate-500 font-medium mt-1">Directory of all school stakeholders and permissions.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="group flex items-center gap-2 bg-slate-900 hover:bg-indigo-600 text-white px-6 py-3.5 rounded-[1.25rem] font-bold transition-all duration-300 shadow-xl shadow-slate-200 active:scale-95"
        >
          <UserPlus size={20} className="group-hover:rotate-12 transition-transform" />
          Add Stakeholder
        </button>
      </div>

      {/* Modern Stats Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <UsersIcon size={20} />
          </div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">Total Users</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{stats.total}</p>
        </div>
        
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <Activity size={20} />
          </div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">Active</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{stats.active}</p>
        </div>
        
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <UserCheck size={20} />
          </div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">Inactive</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{stats.inactive}</p>
        </div>
        
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <ShieldAlert size={20} />
          </div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">Suspended</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{stats.suspended}</p>
        </div>
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
                {tab === "all" ? "All" : tab}s
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Find by name, email, or ID..."
                className="pl-12 pr-6 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 w-full sm:w-80 transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="p-3.5 text-slate-400 hover:bg-slate-50 hover:text-slate-800 rounded-2xl transition-all border border-slate-100">
              <Filter size={20} />
            </button>
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
                <th className="px-10 py-6">Contact</th>
                <th className="px-10 py-6 text-center">Security Level</th>
                <th className="px-10 py-6 text-center">Status</th>
                <th className="px-10 py-6">Registry Date</th>
                <th className="px-10 py-6 text-right pr-12">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/60">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-100">
                          {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center border border-slate-100">
                          <div className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        </div>
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-800 text-sm">{user.first_name} {user.last_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {user.staff_id && (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                              {user.staff_id}
                            </span>
                          )}
                          {user.title && (
                            <span className="text-[10px] font-bold text-slate-400">
                              {user.title}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail size={12} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-600">{user.email}</span>
                      </div>
                      {user.phone_number && (
                        <div className="flex items-center gap-2">
                          <Phone size={12} className="text-slate-400" />
                          <span className="text-sm font-medium text-slate-600">{user.phone_number}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-10 py-6 text-center">
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center justify-center">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black flex items-center gap-1.5 ${getStatusColor(user.status)}`}>
                        <div className={`w-1 h-1 rounded-full ${user.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-current'}`} />
                        {user.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-2">
                      <Calendar size={12} className="text-slate-400" />
                      <span className="text-xs font-bold text-slate-500 tracking-tight">
                        {formatDate(user.created_at)}
                      </span>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right pr-12">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        <Shield size={16} />
                      </button>
                      <button
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit User"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && (
            <div className="p-20 text-center">
              <UsersIcon className="mx-auto mb-4 text-slate-300" size={48} />
              <p className="text-slate-400 font-bold italic">
                {searchQuery ? "No users found matching your search." : "No users found."}
              </p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-8 bg-slate-50/50 flex items-center justify-between">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
            Showing {filteredUsers.length} of {users.length} users
          </p>
          <div className="flex gap-3">
            <button className="px-5 py-2 text-xs font-black text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              Previous
            </button>
            <button className="px-5 py-2 text-xs font-black text-white bg-slate-900 rounded-xl hover:bg-indigo-600 transition-colors shadow-lg shadow-slate-200">
              Next Page
            </button>
          </div>
        </div>
      </Card>

      {/* Create User Modal */}
      <CreateUserModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleUserCreated}
      />
    </div>
  );
};

export default Users;
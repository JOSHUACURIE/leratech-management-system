import React, { useState } from "react";
import { Bell, User, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

type TopNavbarProps = {
  notificationsCount?: number;
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
};

const TopNavbar: React.FC<TopNavbarProps> = ({
  notificationsCount = 0,
  onNotificationClick = () => {},
  onProfileClick = () => {}
}) => {
  const { user, logout, getUserFullName, getUserAvatar } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: "bg-red-500",
      teacher: "bg-blue-500",
      parent: "bg-green-500",
      bursar: "bg-purple-500",
      student: "bg-amber-500",
    };
    return colors[role as keyof typeof colors] || "bg-gray-500";
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Dashboard title */}
        <div className="flex items-center">
          <h1 className="text-lg font-semibold text-gray-800">Dashboard</h1>
          {user.role && (
            <span className={`ml-3 px-2 py-1 text-xs font-medium text-white rounded-full ${getRoleColor(user.role)}`}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          )}
        </div>

        {/* Right side - User controls */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Notifications button */}
          <button 
            onClick={onNotificationClick}
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            aria-label={`Notifications ${notificationsCount > 0 ? `(${notificationsCount} unread)` : ''}`}
          >
            <Bell size={20} />
            {notificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                {notificationsCount > 9 ? "9+" : notificationsCount}
              </span>
            )}
          </button>

          {/* User dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              aria-label="User menu"
              aria-expanded={showDropdown}
            >
              {/* Avatar - using getUserAvatar helper */}
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white overflow-hidden">
                {getUserAvatar() ? (
                  <img 
                    src={getUserAvatar()} 
                    alt={getUserFullName()} 
                    className="h-full w-full object-cover" 
                  />
                ) : (
                  <User size={16} />
                )}
              </div>
              
              {/* User info - using getUserFullName helper */}
              <div className="text-left hidden sm:block">
                <div className="font-medium text-sm text-gray-800 truncate max-w-[120px]">
                  {getUserFullName()}
                </div>
                <div className="text-xs text-gray-500 truncate max-w-[120px]">
                  {user.email}
                </div>
              </div>
              
              <ChevronDown 
                size={16} 
                className={`text-gray-500 transition-transform ${showDropdown ? "rotate-180" : ""}`} 
              />
            </button>

            {/* Dropdown menu */}
            {showDropdown && (
              <>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="font-medium text-sm text-gray-800">{getUserFullName()}</div>
                    <div className="text-xs text-gray-500 mt-1">{user.email}</div>
                  </div>
                  
                  <button
                    onClick={() => {
                      onProfileClick();
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                  >
                    <User size={16} className="mr-2 text-gray-400" />
                    Profile Settings
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
                  >
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </button>
                </div>
                
                {/* Click outside to close */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowDropdown(false)} 
                />
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
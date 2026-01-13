import React from "react";
import { Bell, User, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

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
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = React.useState(false);

  if (!user) return null; 

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold text-gray-800">Dashboard</div>

        <div className="flex items-center space-x-4">
          <button 
            onClick={onNotificationClick}
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
          >
            <Bell size={20} />
            {notificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {notificationsCount}
              </span>
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                {user.avatar ? <img src={user.avatar} alt={user.name} className="h-full w-full rounded-full" /> : <User size={16} />}
              </div>
              <div className="text-left hidden md:block">
                <div className="font-medium text-sm">{user.name}</div>
                <div className="text-xs text-gray-500">{user.role}</div>
              </div>
              <ChevronDown size={16} className="text-gray-500" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                <button
                  onClick={() => {
                    onProfileClick();
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <User size={16} className="mr-2" />
                  Profile Settings
                </button>
                <button
                  onClick={() => {
                    logout(); // Call logout from context
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                >
                  <LogOut size={16} className="mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDropdown && (
        <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
      )}
    </header>
  );
};

export default TopNavbar;

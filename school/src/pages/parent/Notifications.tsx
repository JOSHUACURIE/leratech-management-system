import React, { useState } from "react";
import Card from "../../components/common/Card";
import { Bell, CheckCircle, Clock, AlertCircle, Trash2 } from "lucide-react";

const Notifications: React.FC = () => {
  const [notifications] = useState([
    { id: 1, title: "Fee Reminder", message: "Term 2 fees due in 5 days", time: "2h ago", type: "finance", read: false },
    { id: 2, title: "Assignment Graded", message: "Math assignment has been graded", time: "5h ago", type: "academic", read: true },
    { id: 3, title: "School Event", message: "Parent-teacher meeting next week", time: "1d ago", type: "event", read: true },
  ]);

  const getIcon = (type: string) => {
    switch(type) {
      case "finance": return <AlertCircle className="text-rose-500" />;
      case "academic": return <CheckCircle className="text-emerald-500" />;
      case "event": return <Clock className="text-blue-500" />;
      default: return <Bell className="text-slate-500" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Bell className="text-indigo-600" /> Notifications
          </h1>
          <p className="text-slate-500">Stay updated with school alerts</p>
        </div>
        <button className="px-4 py-2 bg-rose-100 text-rose-700 rounded-lg font-bold">
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total</p>
              <h2 className="text-2xl font-black text-slate-800 mt-1">{notifications.length}</h2>
            </div>
            <Bell className="text-indigo-500" size={24} />
          </div>
        </Card>
        
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Unread</p>
              <h2 className="text-2xl font-black text-slate-800 mt-1">
                {notifications.filter(n => !n.read).length}
              </h2>
            </div>
            <AlertCircle className="text-amber-500" size={24} />
          </div>
        </Card>
        
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Read</p>
              <h2 className="text-2xl font-black text-slate-800 mt-1">
                {notifications.filter(n => n.read).length}
              </h2>
            </div>
            <CheckCircle className="text-emerald-500" size={24} />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-black text-slate-800 mb-6">Recent Notifications</h2>
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`p-4 rounded-xl border ${
                notification.read 
                  ? "bg-white border-slate-200" 
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{notification.title}</h3>
                    <p className="text-slate-600 mt-1">{notification.message}</p>
                    <span className="text-sm text-slate-400 mt-2 block">{notification.time}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!notification.read && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                      NEW
                    </span>
                  )}
                  <button className="p-2 text-slate-400 hover:text-rose-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Notifications;
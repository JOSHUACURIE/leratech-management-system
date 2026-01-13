import React from "react";
import Card from "../../components/common/Card";
import { Settings as SettingsIcon, Bell, Lock, User, Smartphone, Shield } from "lucide-react";

const Settings: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <SettingsIcon className="text-indigo-600" /> Settings
        </h1>
        <p className="text-slate-500">Manage your account preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
            <User className="text-indigo-500" /> Profile Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
              <input 
                type="text" 
                defaultValue="Jane Parent"
                className="w-full p-3 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
              <input 
                type="email" 
                defaultValue="jane@example.com"
                className="w-full p-3 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Phone Number</label>
              <input 
                type="tel" 
                defaultValue="+254 712 345 678"
                className="w-full p-3 border border-slate-200 rounded-lg"
              />
            </div>
            <button className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">
              Save Changes
            </button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
            <Bell className="text-amber-500" /> Notifications
          </h2>
          <div className="space-y-4">
            {[
              { label: "Fee Reminders", checked: true },
              { label: "Academic Updates", checked: true },
              { label: "School Events", checked: true },
              { label: "Assignment Deadlines", checked: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="font-medium text-slate-700">{item.label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={item.checked} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
            <Smartphone className="text-blue-500" /> Mobile App
          </h2>
          <div className="space-y-4">
            <p className="text-slate-600">Get notifications on your phone</p>
            <div className="flex gap-3">
              <button className="flex-1 py-3 bg-black text-white rounded-lg font-bold">
                App Store
              </button>
              <button className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-bold">
                Play Store
              </button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
            <Shield className="text-emerald-500" /> Security
          </h2>
          <div className="space-y-4">
            <button className="w-full py-3 border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-50">
              Change Password
            </button>
            <button className="w-full py-3 border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-50">
              Two-Factor Authentication
            </button>
            <button className="w-full py-3 border border-rose-200 text-rose-600 rounded-lg font-bold hover:bg-rose-50">
              Logout All Devices
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
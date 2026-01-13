import React from "react";
import { 
  Database, RefreshCw, FileUp, FileDown, 
  Send, Trash2, ChevronRight, History, 
  ShieldCheck, Zap 
} from "lucide-react";
import Card from "../../components/common/Card";

const toolCategories = [
  {
    category: "Data Recovery & Safety",
    icon: <Database size={18} />,
    color: "text-indigo-600 bg-indigo-50",
    items: [
      {
        label: "Backup Database",
        description: "Generate a .sql snapshot of all school records.",
        lastRun: "2 hours ago",
        icon: <Database />,
        action: () => alert("Backup initiated!")
      },
      {
        label: "Restore Database",
        description: "Revert system state from a previous backup point.",
        lastRun: "3 months ago",
        icon: <RefreshCw />,
        action: () => alert("Restore started!"),
        danger: true
      }
    ]
  },
  {
    category: "Bulk Operations",
    icon: <Zap size={18} />,
    color: "text-amber-600 bg-amber-50",
    items: [
      {
        label: "Bulk Import Students",
        description: "Onboard students using CSV or Excel templates.",
        lastRun: "Never",
        icon: <FileUp />,
        action: () => alert("Import students clicked!")
      },
      {
        label: "Bulk Export Students",
        description: "Download the entire student directory as CSV.",
        lastRun: "Yesterday",
        icon: <FileDown />,
        action: () => alert("Export students clicked!")
      }
    ]
  },
  {
    category: "System Maintenance",
    icon: <ShieldCheck size={18} />,
    color: "text-emerald-600 bg-emerald-50",
    items: [
      {
        label: "Send Notifications",
        description: "Blast SMS/Email alerts to parents and staff.",
        lastRun: "10 mins ago",
        icon: <Send />,
        action: () => alert("Send notifications clicked!")
      },
      {
        label: "Data Cleanup",
        description: "Purge temporary files and duplicate logs.",
        lastRun: "Weekly",
        icon: <Trash2 />,
        action: () => alert("Data cleanup clicked!"),
        danger: true
      }
    ]
  }
];

const ToolsUtilities: React.FC = () => {
  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">System Utilities</h1>
          <p className="text-slate-500 font-medium">Advanced maintenance tools for database and communication management.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <History size={16} className="text-slate-400" />
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Last Sync: 12:04 PM</span>
        </div>
      </div>

      <div className="space-y-12">
        {toolCategories.map((group, idx) => (
          <div key={idx} className="space-y-6">
            {/* Category Label */}
            <div className="flex items-center gap-3 ml-2">
              <div className={`p-2 rounded-xl ${group.color}`}>{group.icon}</div>
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">{group.category}</h2>
            </div>

            {/* Tool Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {group.items.map((tool, i) => (
                <Card 
                  key={i} 
                  className="group border-none shadow-xl shadow-slate-200/50 rounded-[2rem] p-8 bg-white hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex gap-5">
                      <div className={`p-4 rounded-2xl ${tool.danger ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-600 group-hover:bg-indigo-600 group-hover:text-white'} transition-all duration-300 shadow-sm`}>
                        {React.cloneElement(tool.icon as React.ReactElement, { size: 24 })}
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-black text-slate-800">{tool.label}</h3>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[240px]">
                          {tool.description}
                        </p>
                        <div className="flex items-center gap-1.5 pt-2">
                           <span className="text-[10px] font-black text-slate-300 uppercase">Last Run:</span>
                           <span className="text-[10px] font-black text-slate-500 uppercase">{tool.lastRun}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={tool.action}
                      className={`p-3 rounded-2xl transition-all active:scale-90 ${
                        tool.danger 
                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white' 
                        : 'bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white'
                      }`}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>

                  {/* Decorative Background Icon */}
                  <div className="absolute -bottom-4 -right-4 text-slate-50 opacity-40 group-hover:opacity-100 transition-opacity">
                    {React.cloneElement(tool.icon as React.ReactElement, { size: 100 })}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Warning Footer */}
      <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem] flex items-center gap-4">
        <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-200">
           <ShieldCheck size={24} />
        </div>
        <div>
            <h4 className="font-black text-amber-800 text-sm uppercase tracking-wide">Security Protocol Active</h4>
            <p className="text-amber-700/70 text-xs font-bold mt-0.5">Some operations require multi-factor authentication. Action logs are automatically sent to the system auditor.</p>
        </div>
      </div>
    </div>
  );
};

export default ToolsUtilities;
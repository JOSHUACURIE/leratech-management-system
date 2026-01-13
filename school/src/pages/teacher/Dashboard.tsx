import React from "react";
import {
  BookOpen,
  ClipboardCheck,
  Users,
  AlertCircle,
  TrendingUp,
  Calendar,
  ArrowRight,
  Clock,
  ChevronRight,
  CheckCircle2
} from "lucide-react";
import Card from "../../components/common/Card";

const summaryCards = [
  { title: "My Classes", value: "4", icon: <Users size={22} />, color: "text-indigo-600", bg: "bg-indigo-50" },
  { title: "Active Subjects", value: "6", icon: <BookOpen size={22} />, color: "text-emerald-600", bg: "bg-emerald-50" },
  { title: "Pending Tasks", value: "3", icon: <ClipboardCheck size={22} />, color: "text-amber-600", bg: "bg-amber-50" },
  { title: "Class Avg", value: "68%", icon: <TrendingUp size={22} />, color: "text-blue-600", bg: "bg-blue-50" },
];

const pendingSubmissions = [
  { id: 1, class: "Grade 4 East", subject: "Mathematics", assessment: "CAT 1", deadline: "Jan 15", status: "Urgent" },
  { id: 2, class: "Grade 5 West", subject: "English", assessment: "CBC Rubric", deadline: "Jan 16", status: "Upcoming" },
  { id: 3, class: "Grade 6 North", subject: "Science", assessment: "End Term", deadline: "Jan 18", status: "Upcoming" },
];

const TeacherDashboard: React.FC = () => {
  const teacher = { name: "John Teacher" };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">
            Hello, <span className="text-indigo-600">{teacher.name.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            You have <span className="text-slate-800 font-bold">3 assessments</span> requiring scores this week.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Calendar size={18} className="text-indigo-500" />
          <span className="text-sm font-bold text-slate-700">Term 1, 2026</span>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card, index) => (
          <div key={index} className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-transparent hover:border-indigo-100 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${card.bg} ${card.color} group-hover:scale-110 transition-transform`}>
                {card.icon}
              </div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-indigo-400">View Details</span>
            </div>
            <p className="text-3xl font-black text-slate-800 tracking-tight">{card.value}</p>
            <p className="text-sm font-bold text-slate-400 mt-1">{card.title}</p>
          </div>
        ))}
      </div>

      {/* Quick Action Bar */}
      <div className="flex flex-wrap gap-4">
        <button className="flex-1 min-w-[200px] flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-all shadow-lg active:scale-95">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white/10 rounded-lg"><ClipboardCheck size={18} /></div>
             <span className="text-sm">Submit Exam Scores</span>
          </div>
          <ArrowRight size={18} />
        </button>
        <button className="flex-1 min-w-[200px] flex items-center justify-between p-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold hover:border-indigo-400 transition-all shadow-sm active:scale-95">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><BookOpen size={18} /></div>
             <span className="text-sm">Assess CBC Rubric</span>
          </div>
          <ArrowRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Pending Submissions Feed */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black text-slate-800">Priority Submissions</h3>
            <button className="text-xs font-black text-indigo-600 uppercase tracking-widest">Full Schedule</button>
          </div>
          <div className="grid gap-4">
            {pendingSubmissions.map((sub) => (
              <div key={sub.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-50 flex items-center justify-between hover:shadow-md transition-all group">
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${sub.status === 'Urgent' ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'}`}>
                    <Clock size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{sub.subject} - {sub.class}</h4>
                    <p className="text-xs text-slate-400 font-medium">{sub.assessment} • Due {sub.deadline}</p>
                  </div>
                </div>
                <button className="flex items-center gap-2 px-6 py-2 bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white rounded-xl text-xs font-black transition-all">
                  ENTER SCORES
                  <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Notices & Activity */}
        <div className="lg:col-span-4 space-y-8">
          {/* Admin Notices */}
          <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] p-8 bg-indigo-600 text-white relative overflow-hidden">
             <div className="relative z-10">
               <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                 <AlertCircle size={20} /> Official Notices
               </h3>
               <div className="space-y-4">
                 <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                    <p className="text-xs font-bold leading-relaxed">Result portal closes on 18th January. Ensure all scores are synced.</p>
                 </div>
                 <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                    <p className="text-xs font-bold leading-relaxed">New Grade 5 CBC Rubrics available.</p>
                 </div>
               </div>
             </div>
             <div className="absolute -bottom-6 -right-6 text-white/5 rotate-12">
                <AlertCircle size={140} />
             </div>
          </Card>

          {/* Activity Log */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-50">
            <h3 className="text-lg font-black text-slate-800 mb-6">Recent Activity</h3>
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center z-10 relative">
                      <CheckCircle2 size={16} />
                    </div>
                    {i === 1 && <div className="absolute top-8 left-1/2 -translate-x-1/2 w-0.5 h-10 bg-slate-100" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Submitted Maths Scores</p>
                    <p className="text-[10px] text-slate-400 font-medium">Jan 12, 09:40 AM</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
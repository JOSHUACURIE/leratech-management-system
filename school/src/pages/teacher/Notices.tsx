import React, { useState } from "react";
import Card from "../../components/common/Card";
import { 
  Megaphone, 
  Send, 
  Layers, 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  MoreVertical, 
  Users,
  BellRing
} from "lucide-react";

/* ---------------- TYPES ---------------- */
type Notice = {
  id: number;
  title: string;
  content: string;
  className: string;
  stream: string;
  date: string;
  category: "Academic" | "Event" | "Urgent" | "General";
};

const classes = ["Grade 1", "Grade 2", "Class 6"];
const streams = ["East", "West"];

const mockNotices: Notice[] = [
  {
    id: 1,
    title: "Math Quiz",
    content: "The termly Mathematics quiz covering Whole Numbers and Fractions will be conducted next Monday. Please ensure students have their geometry sets.",
    className: "Grade 2",
    stream: "East",
    date: "2026-01-10",
    category: "Academic"
  },
  {
    id: 2,
    title: "Homework Reminder",
    content: "Kindly submit science homework by Friday. Focus on the Environmental Activities project.",
    className: "Class 6",
    stream: "West",
    date: "2026-01-08",
    category: "Urgent"
  },
];

const categoryColors = {
  Academic: "bg-blue-50 text-blue-600 border-blue-100",
  Event: "bg-purple-50 text-purple-600 border-purple-100",
  Urgent: "bg-rose-50 text-rose-600 border-rose-100",
  General: "bg-slate-50 text-slate-600 border-slate-100",
};

const Notices: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>(mockNotices);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [category, setCategory] = useState<Notice["category"]>("General");

  const handleAddNotice = () => {
    if (!title || !content || !selectedClass || !selectedStream) return;
    
    const newNotice: Notice = {
      id: Date.now(),
      title,
      content,
      className: selectedClass,
      stream: selectedStream,
      date: new Date().toLocaleDateString('en-CA'),
      category
    };
    setNotices([newNotice, ...notices]);
    setTitle("");
    setContent("");
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-rose-100 animate-pulse">
            <BellRing size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Notice Board</h1>
            <p className="text-slate-500 font-medium">Broadcast announcements to parents and students.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 2. Composition Form (Left) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-8 space-y-6 sticky top-6">
            <div className="flex items-center gap-2 mb-2">
              <Plus className="text-rose-500" size={20} />
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Draft Announcement</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Mid-term Trip Update"
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Class</label>
                  <select
                    className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-rose-500/20 outline-none"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                  >
                    <option value="">Select Class</option>
                    {classes.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Stream</label>
                  <select
                    className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-rose-500/20 outline-none"
                    value={selectedStream}
                    onChange={(e) => setSelectedStream(e.target.value)}
                  >
                    <option value="">Stream</option>
                    {streams.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Priority</label>
                <div className="flex gap-2">
                  {(Object.keys(categoryColors) as Array<keyof typeof categoryColors>).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all border ${
                        category === cat 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                        : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Message Body</label>
                <textarea
                  placeholder="Type your message here..."
                  rows={4}
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all resize-none"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              <button
                onClick={handleAddNotice}
                className="w-full py-4 bg-rose-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-rose-100 hover:bg-rose-600 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                <Send size={18} /> Broadcast Now
              </button>
            </div>
          </Card>
        </div>

        {/* 3. Feed (Right) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Recent Broadcasts</h2>
            <button className="p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-slate-600">
              <MoreVertical size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {notices.map((notice) => (
              <Card key={notice.id} className="border-none shadow-lg shadow-slate-200/40 rounded-[2rem] p-6 bg-white hover:shadow-xl transition-all group border-l-4 border-l-transparent hover:border-l-rose-500">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3">
                    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${categoryColors[notice.category]}`}>
                      {notice.category}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                      <Users size={12} />
                      {notice.className} • {notice.stream}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-black text-slate-300 uppercase italic">
                    <Clock size={12} />
                    {notice.date}
                  </div>
                </div>

                <h3 className="text-lg font-black text-slate-800 mb-2 group-hover:text-rose-600 transition-colors">
                  {notice.title}
                </h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">
                  {notice.content}
                </p>

                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100" />
                    ))}
                    <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-[8px] font-black text-slate-400">
                      +42
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Read by 45 Parents</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notices;
import React, { useState } from "react";
import { UserPlus, BookOpen, GraduationCap, Layers, Trash2, CheckCircle2, Search } from "lucide-react";
import Card from "../../components/common/Card";

const initialStudents = [
  { id: 1, name: "Jane Smith", class: "Grade 4", stream: "A", subjects: ["Math", "English"] },
  { id: 2, name: "Mary Jaoko", class: "Grade 5", stream: "B", subjects: ["Science", "English"] },
  { id: 3, name: "Mary Johnson", class: "Grade 6", stream: "C", subjects: ["Math", "Kiswahili"] }
];

const allSubjects = ["Math", "English", "Science", "Kiswahili", "History", "Geography"];

const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState(initialStudents);
  const [name, setName] = useState("");
  const [className, setClassName] = useState("Grade 4");
  const [stream, setStream] = useState("A");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const addStudent = () => {
    if (!name) return;
    const newStudent = {
      id: students.length + 1,
      name,
      class: className,
      stream,
      subjects: selectedSubjects
    };
    setStudents([...students, newStudent]);
    setName("");
    setSelectedSubjects([]);
  };

  const toggleSubject = (subject: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Student Registry</h1>
          <p className="text-slate-500 font-medium">Enroll students and manage their subject profiles.</p>
        </div>
        <div className="hidden md:flex bg-white p-2 rounded-2xl shadow-sm border border-slate-100 items-center gap-3 px-4">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{students.length} Enrolled</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Registration Form Card */}
        <div className="xl:col-span-4">
          <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] p-8 bg-white sticky top-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                <UserPlus size={24} />
              </div>
              <h2 className="text-xl font-black text-slate-800">New Enrollment</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Samuel Otieno"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-2 px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Class</label>
                  <select
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full mt-2 px-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  >
                    {["Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Stream</label>
                  <select
                    value={stream}
                    onChange={(e) => setStream(e.target.value)}
                    className="w-full mt-2 px-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  >
                    {["A", "B", "C"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Assign Subjects</label>
                <div className="flex flex-wrap gap-2 mt-3">
                  {allSubjects.map((subj) => (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => toggleSubject(subj)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        selectedSubjects.includes(subj)
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                          : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={addStudent}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-[0.98] mt-4"
              >
                Complete Registration
              </button>
            </div>
          </Card>
        </div>

        {/* Students Directory List */}
        <div className="xl:col-span-8">
          <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
               <h3 className="text-xl font-extrabold text-slate-800">Student Directory</h3>
               <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search registry..." className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none" />
               </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                    <th className="px-8 py-5">Student</th>
                    <th className="px-8 py-5">Academic Level</th>
                    <th className="px-8 py-5">Learning Subjects</th>
                    <th className="px-8 py-5 text-right pr-10">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {students.map((s) => (
                    <tr key={s.id} className="group hover:bg-slate-50/50 transition-all">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">
                            {s.name.charAt(0)}
                          </div>
                          <p className="font-bold text-slate-700">{s.name}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                           <span className="text-sm font-bold text-slate-600">{s.class}</span>
                           <span className="text-[10px] font-black text-slate-300 uppercase italic">Stream {s.stream}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-wrap gap-1.5 max-w-[240px]">
                          {s.subjects.map((sub, i) => (
                            <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded-md text-[9px] font-black uppercase tracking-tighter">
                              {sub}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right pr-10">
                        <button className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentManagement;
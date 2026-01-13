import React from "react";
import Card from "../../components/common/Card";
import { BookOpen, Clock, CheckCircle, FileText } from "lucide-react";

const Homework: React.FC = () => {
  const assignments = [
    { subject: "Mathematics", title: "Algebra Worksheet", due: "Tomorrow", status: "Pending" },
    { subject: "English", title: "Essay Writing", due: "2 days", status: "Submitted" },
    { subject: "Science", title: "Lab Report", due: "Next week", status: "Pending" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <BookOpen className="text-indigo-600" /> Homework & Assignments
        </h1>
        <p className="text-slate-500">Mary Jaoko • Grade 4</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pending</p>
              <h2 className="text-2xl font-black text-slate-800 mt-1">2</h2>
            </div>
            <Clock className="text-amber-500" size={24} />
          </div>
        </Card>
        
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Submitted</p>
              <h2 className="text-2xl font-black text-slate-800 mt-1">1</h2>
            </div>
            <CheckCircle className="text-emerald-500" size={24} />
          </div>
        </Card>
        
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Overdue</p>
              <h2 className="text-2xl font-black text-slate-800 mt-1">0</h2>
            </div>
            <FileText className="text-rose-500" size={24} />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-black text-slate-800 mb-6">Current Assignments</h2>
        <div className="space-y-4">
          {assignments.map((assignment, i) => (
            <div key={i} className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                      {assignment.subject}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      assignment.status === "Submitted" 
                        ? "bg-emerald-100 text-emerald-700" 
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {assignment.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 mt-2">{assignment.title}</h3>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Due: {assignment.due}</p>
                  <button className="mt-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-bold">
                    {assignment.status === "Pending" ? "Submit" : "View"}
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

export default Homework;
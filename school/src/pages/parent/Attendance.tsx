import React, { useState } from "react";
import Card from "../../components/common/Card";
import { Calendar, TrendingUp, Clock, CheckCircle } from "lucide-react";

const StudentAttendance: React.FC = () => {
  const [selectedMonth] = useState("January 2026");
  
  const attendanceData = [
    { date: "Mon 1", status: "Present" },
    { date: "Tue 2", status: "Present" },
    { date: "Wed 3", status: "Absent" },
    { date: "Thu 4", status: "Present" },
    { date: "Fri 5", status: "Present" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Calendar className="text-indigo-600" /> Attendance
        </h1>
        <p className="text-slate-500">Term 1 2026 • Mary Jaoko • Grade 4</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Attendance Rate</p>
              <h2 className="text-2xl font-black text-slate-800 mt-1">95%</h2>
            </div>
            <TrendingUp className="text-emerald-500" size={24} />
          </div>
        </Card>
        
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Days Present</p>
              <h2 className="text-2xl font-black text-slate-800 mt-1">19</h2>
            </div>
            <CheckCircle className="text-emerald-500" size={24} />
          </div>
        </Card>
        
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Days Absent</p>
              <h2 className="text-2xl font-black text-slate-800 mt-1">1</h2>
            </div>
            <Clock className="text-rose-500" size={24} />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-slate-800">Monthly View: {selectedMonth}</h2>
          <select className="border rounded-lg px-3 py-2">
            <option>January 2026</option>
            <option>December 2025</option>
          </select>
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
            <div key={day} className="text-center text-slate-500 font-bold p-2">{day}</div>
          ))}
          {attendanceData.map((day, i) => (
            <div key={i} className={`p-3 rounded-lg text-center ${
              day.status === "Present" 
                ? "bg-emerald-100 text-emerald-700" 
                : "bg-rose-100 text-rose-700"
            }`}>
              <div className="font-bold">{day.date.split(" ")[1]}</div>
              <div className="text-xs mt-1">{day.status}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default StudentAttendance;
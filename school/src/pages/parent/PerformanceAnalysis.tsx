import React from "react";
import Card from "../../components/common/Card";
import { TrendingUp, Target, Award, BarChart3 } from "lucide-react";

const PerfomanceAnalysis: React.FC = () => {
  const subjects = [
    { name: "Mathematics", score: 85, trend: "up" },
    { name: "English", score: 88, trend: "stable" },
    { name: "Science", score: 78, trend: "up" },
    { name: "Kiswahili", score: 75, trend: "up" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <BarChart3 className="text-indigo-600" /> Performance Analysis
        </h1>
        <p className="text-slate-500">Vin Jaoko • Grade 4 • Term 1 2026</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
            <Target className="text-indigo-500" /> Subject Scores
          </h2>
          <div className="space-y-4">
            {subjects.map((subject, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-700">{subject.name}</span>
                  <span className="font-bold text-slate-800">{subject.score}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      subject.score >= 80 ? "bg-emerald-500" :
                      subject.score >= 70 ? "bg-blue-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${subject.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
            <Award className="text-amber-500" /> Key Metrics
          </h2>
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-5xl font-black text-indigo-600">82.5%</div>
              <p className="text-slate-500 mt-2">Overall Average</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <div className="text-2xl font-black text-slate-800">3rd</div>
                <p className="text-sm text-slate-500">Class Rank</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <div className="text-2xl font-black text-slate-800">+12%</div>
                <p className="text-sm text-slate-500">Improvement</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <TrendingUp className="text-emerald-500" /> Performance Trend
        </h2>
        <div className="flex items-end h-40 gap-2">
          {[65, 70, 75, 78, 82, 85].map((score, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-gradient-to-t from-indigo-400 to-indigo-600 rounded-t-lg"
                style={{ height: `${score}%` }}
              />
              <span className="text-xs text-slate-500 mt-2">Month {i+1}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default PerfomanceAnalysis;
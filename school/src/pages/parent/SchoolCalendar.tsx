import React, { useState } from "react";
import Card from "../../components/common/Card";
import { Calendar, Clock, MapPin, Users } from "lucide-react";

const SchoolCalendar: React.FC = () => {
  const [selectedDate] = useState("January 2026");
  
  const events = [
    { date: "15 Jan", title: "Parent-Teacher Meeting", time: "2:00 PM", location: "School Hall" },
    { date: "20 Jan", title: "Sports Day", time: "8:00 AM", location: "School Field" },
    { date: "25 Jan", title: "Mid-Term Break", time: "All Day", location: "-" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Calendar className="text-indigo-600" /> School Calendar
        </h1>
        <p className="text-slate-500">Term 1 2026 • Important dates and events</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-slate-800">{selectedDate}</h2>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-slate-100 rounded-lg">←</button>
              <button className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-bold">Today</button>
              <button className="px-4 py-2 bg-slate-100 rounded-lg">→</button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
              <div key={day} className="text-center text-slate-500 font-bold p-3">{day}</div>
            ))}
            {[...Array(31)].map((_, i) => (
              <div 
                key={i} 
                className={`p-3 rounded-lg text-center ${
                  i === 14 ? "bg-indigo-100 text-indigo-700" : 
                  i === 19 ? "bg-emerald-100 text-emerald-700" :
                  i === 24 ? "bg-amber-100 text-amber-700" : 
                  "bg-slate-50"
                }`}
              >
                <div className="font-bold">{i + 1}</div>
                {i === 14 && <div className="text-xs mt-1">PTM</div>}
                {i === 19 && <div className="text-xs mt-1">Sports</div>}
                {i === 24 && <div className="text-xs mt-1">Break</div>}
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-black text-slate-800 mb-6">Upcoming Events</h2>
            <div className="space-y-4">
              {events.map((event, i) => (
                <div key={i} className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50">
                  <div className="flex items-start gap-3">
                    <div className="text-center">
                      <div className="font-black text-slate-800">{event.date.split(" ")[0]}</div>
                      <div className="text-sm text-slate-500">{event.date.split(" ")[1]}</div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800">{event.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
                        <Clock size={14} /> {event.time}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <MapPin size={14} /> {event.location}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Users className="text-white" />
              <h3 className="font-bold">Important Dates</h3>
            </div>
            <ul className="space-y-2">
              <li className="flex justify-between">
                <span>Term 1 Starts</span>
                <span className="font-bold">5 Jan</span>
              </li>
              <li className="flex justify-between">
                <span>Mid-Term Break</span>
                <span className="font-bold">25-29 Jan</span>
              </li>
              <li className="flex justify-between">
                <span>Term 1 Ends</span>
                <span className="font-bold">20 Mar</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SchoolCalendar;
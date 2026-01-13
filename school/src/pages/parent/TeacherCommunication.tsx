import React, { useState } from "react";
import Card from "../../components/common/Card";
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  Search, 
  Phone, 
  Mail, 
  BookOpen,
  User,
  Calendar,
  Clock
} from "lucide-react";

type Teacher = {
  id: string;
  name: string;
  subject: string;
  avatar: string;
  lastActive: string;
  unread: number;
};

type Message = {
  id: string;
  sender: "parent" | "teacher";
  text: string;
  time: string;
  read: boolean;
};

const mockTeachers: Teacher[] = [
  { id: "1", name: "Mr. Johnson", subject: "Mathematics", avatar: "MJ", lastActive: "2 min ago", unread: 2 },
  { id: "2", name: "Ms. Wanjiru", subject: "English", avatar: "MW", lastActive: "1 hour ago", unread: 0 },
  { id: "3", name: "Mrs. Omondi", subject: "Science", avatar: "MO", lastActive: "Yesterday", unread: 1 },
  { id: "4", name: "Mr. Kamau", subject: "Kiswahili", avatar: "MK", lastActive: "3 days ago", unread: 0 },
];

const mockMessages: Record<string, Message[]> = {
  "1": [
    { id: "1", sender: "teacher", text: "John is doing great in algebra, but needs more practice with fractions.", time: "10:30 AM", read: true },
    { id: "2", sender: "parent", text: "Thank you for the update. Any recommended resources?", time: "11:15 AM", read: true },
    { id: "3", sender: "teacher", text: "I'll send some worksheets. Parent-teacher meeting next week?", time: "2:45 PM", read: false },
    { id: "4", sender: "teacher", text: "Math test scheduled for Friday.", time: "3:20 PM", read: false },
  ],
  "2": [
    { id: "1", sender: "parent", text: "Jane's essay grades improved!", time: "Yesterday", read: true },
  ],
  "3": [
    { id: "1", sender: "teacher", text: "Science project deadline extended.", time: "2 days ago", read: true },
  ],
  "4": [
    { id: "1", sender: "teacher", text: "Swahili oral exam next Monday.", time: "1 week ago", read: true },
  ],
};

const TeacherCommunication: React.FC = () => {
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher>(mockTeachers[0]);
  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTeachers = mockTeachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentMessages = mockMessages[selectedTeacher.id] || [];

  const sendMessage = () => {
    if (!messageText.trim()) return;
    setMessageText("");
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <MessageSquare className="text-indigo-600" /> Teacher Communication
          </h1>
          <p className="text-slate-500">Connect with your child's teachers</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-xl font-bold hover:bg-slate-50">
            <Phone size={18} /> Call
          </button>
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-xl font-bold hover:bg-slate-50">
            <Mail size={18} /> Email
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Teacher List - Left Sidebar */}
        <div className="lg:col-span-4">
          <Card className="border-none shadow-lg rounded-2xl p-0 overflow-hidden h-[600px] flex flex-col">
            <div className="p-6 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Search teachers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredTeachers.map((teacher) => (
                <button
                  key={teacher.id}
                  onClick={() => setSelectedTeacher(teacher)}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    selectedTeacher.id === teacher.id
                      ? "bg-indigo-50 border-2 border-indigo-200"
                      : "bg-white border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                      selectedTeacher.id === teacher.id 
                        ? "bg-gradient-to-br from-indigo-500 to-purple-600" 
                        : "bg-gradient-to-br from-slate-600 to-slate-800"
                    }`}>
                      {teacher.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-slate-800">{teacher.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <BookOpen size={14} className="text-slate-400" />
                            <span className="text-sm text-slate-500">{teacher.subject}</span>
                          </div>
                        </div>
                        {teacher.unread > 0 && (
                          <span className="px-2 py-1 bg-rose-500 text-white text-xs font-bold rounded-full">
                            {teacher.unread}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-2">
                        <Clock size={12} />
                        Last active: {teacher.lastActive}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Chat Area - Right Side */}
        <div className="lg:col-span-8">
          <Card className="border-none shadow-lg rounded-2xl p-0 overflow-hidden h-[600px] flex flex-col">
            {/* Chat Header */}
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {selectedTeacher.avatar}
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800">{selectedTeacher.name}</h2>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <BookOpen size={14} />
                        {selectedTeacher.subject}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        Class: Grade 4
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-500">Active now</div>
                  <div className="text-xs text-emerald-500 font-bold">● Online</div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
              {currentMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "parent" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[70%] rounded-2xl p-4 ${
                    message.sender === "parent"
                      ? "bg-indigo-500 text-white rounded-br-none"
                      : "bg-white text-slate-800 rounded-bl-none border border-slate-200"
                  }`}>
                    <p>{message.text}</p>
                    <div className={`text-xs mt-2 flex justify-between items-center ${
                      message.sender === "parent" ? "text-indigo-200" : "text-slate-400"
                    }`}>
                      <span>{message.time}</span>
                      {message.sender === "teacher" && !message.read && (
                        <span className="text-rose-500">● Unread</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-slate-100 bg-white">
              <div className="flex gap-3">
                <button className="p-3 text-slate-400 hover:text-slate-600">
                  <Paperclip size={20} />
                </button>
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type your message here..."
                  className="flex-1 p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageText.trim()}
                  className={`px-6 rounded-xl font-bold ${
                    messageText.trim()
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Send size={20} />
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">
                Messages are monitored by school administration
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <Phone size={20} />
            </div>
            <div>
              <p className="font-bold text-slate-800">Schedule Call</p>
              <p className="text-sm text-slate-500">Book appointment</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <Mail size={20} />
            </div>
            <div>
              <p className="font-bold text-slate-800">Send Email</p>
              <p className="text-sm text-slate-500">Direct email contact</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
              <Calendar size={20} />
            </div>
            <div>
              <p className="font-bold text-slate-800">Meeting Request</p>
              <p className="text-sm text-slate-500">Request parent-teacher meeting</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TeacherCommunication;
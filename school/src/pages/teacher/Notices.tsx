import React, { useState, useEffect } from "react";
import Card from "../../components/common/Card";
import { 
  Megaphone, 
  Send, 
  MessageSquare, 
  Inbox,
  Bell,
  BellRing,
  Users,
  User,
  Clock,
  MoreVertical,
  Search,
  Filter,
  CheckCircle,
  Eye,
  Reply,
  Archive,
  Download,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  BookOpen,
  FileText,
  Image,
  Paperclip,
  X,
  ChevronDown,
  Plus,
  Trash2
} from "lucide-react";
import toast from "react-hot-toast";

/* ---------------- TYPES ---------------- */
type Notice = {
  id: number;
  title: string;
  content: string;
  className: string;
  stream: string;
  date: string;
  category: "Academic" | "Event" | "Urgent" | "General" | "Reminder";
  attachments?: string[];
  readBy: number;
  totalRecipients: number;
  status: "draft" | "sent" | "scheduled";
  scheduledFor?: string;
};

type Message = {
  id: number;
  parentName: string;
  parentEmail: string;
  studentName: string;
  className: string;
  stream: string;
  subject: string;
  content: string;
  timestamp: string;
  read: boolean;
  replied: boolean;
  urgency: "low" | "medium" | "high";
  attachments?: string[];
  lastReply?: string;
};

type Conversation = {
  id: number;
  parentName: string;
  studentName: string;
  className: string;
  stream: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  messages: Message[];
};

const classes = ["Grade 1", "Grade 2", "Class 6", "Class 7", "Class 8"];
const streams = ["East", "West", "North", "South"];

const initialNotices: Notice[] = [
  {
    id: 1,
    title: "Math Quiz Announcement",
    content: "The termly Mathematics quiz covering Whole Numbers and Fractions will be conducted next Monday. Please ensure students have their geometry sets.",
    className: "Grade 2",
    stream: "East",
    date: "2026-01-10",
    category: "Academic",
    readBy: 45,
    totalRecipients: 60,
    status: "sent",
    attachments: ["quiz_schedule.pdf"]
  },
  {
    id: 2,
    title: "Science Homework Reminder",
    content: "Kindly submit science homework by Friday. Focus on the Environmental Activities project.",
    className: "Class 6",
    stream: "West",
    date: "2026-01-08",
    category: "Urgent",
    readBy: 38,
    totalRecipients: 45,
    status: "sent"
  },
  {
    id: 3,
    title: "Parent-Teacher Meeting",
    content: "Quarterly parent-teacher meetings scheduled for next week. Please book your slot through the portal.",
    className: "Grade 1",
    stream: "North",
    date: "2026-01-12",
    category: "Event",
    readBy: 52,
    totalRecipients: 65,
    status: "scheduled",
    scheduledFor: "2026-01-15 14:00"
  },
];

const initialMessages: Conversation[] = [
  {
    id: 1,
    parentName: "John Kamau",
    studentName: "Sarah Kamau",
    className: "Grade 2",
    stream: "East",
    lastMessage: "Regarding the math homework difficulty",
    timestamp: "2 hours ago",
    unreadCount: 2,
    messages: [
      {
        id: 1,
        parentName: "John Kamau",
        parentEmail: "john.kamau@email.com",
        studentName: "Sarah Kamau",
        className: "Grade 2",
        stream: "East",
        subject: "Math Homework Difficulty",
        content: "Hello Teacher, Sarah is finding the fractions homework quite challenging. Could you provide some additional resources?",
        timestamp: "2026-01-10 14:30",
        read: true,
        replied: true,
        urgency: "medium",
        attachments: ["homework_attempt.jpg"]
      }
    ]
  },
  {
    id: 2,
    parentName: "Mary Wanjiku",
    studentName: "Peter Mwangi",
    className: "Class 6",
    stream: "West",
    lastMessage: "Request for sick leave",
    timestamp: "1 day ago",
    unreadCount: 1,
    messages: [
      {
        id: 2,
        parentName: "Mary Wanjiku",
        parentEmail: "mary.w@email.com",
        studentName: "Peter Mwangi",
        className: "Class 6",
        stream: "West",
        subject: "Sick Leave Request",
        content: "Peter will be absent for two days due to flu. Please share any classwork he should catch up on.",
        timestamp: "2026-01-09 09:15",
        read: true,
        replied: false,
        urgency: "low"
      }
    ]
  },
  {
    id: 3,
    parentName: "David Ochieng",
    studentName: "Lisa Ochieng",
    className: "Grade 1",
    stream: "North",
    lastMessage: "Urgent: Lost school bag",
    timestamp: "Just now",
    unreadCount: 3,
    messages: [
      {
        id: 3,
        parentName: "David Ochieng",
        parentEmail: "david.o@email.com",
        studentName: "Lisa Ochieng",
        className: "Grade 1",
        stream: "North",
        subject: "URGENT: Lost School Bag",
        content: "Lisa lost her school bag with all her books today. Could you check if it was found in class?",
        timestamp: "2026-01-10 16:45",
        read: false,
        replied: false,
        urgency: "high"
      }
    ]
  }
];

const categoryColors = {
  Academic: "bg-blue-50 text-blue-600 border-blue-100",
  Event: "bg-purple-50 text-purple-600 border-purple-100",
  Urgent: "bg-rose-50 text-rose-600 border-rose-100",
  General: "bg-slate-50 text-slate-600 border-slate-100",
  Reminder: "bg-amber-50 text-amber-600 border-amber-100"
};

const urgencyColors = {
  high: "bg-rose-50 text-rose-600",
  medium: "bg-amber-50 text-amber-600",
  low: "bg-emerald-50 text-emerald-600"
};

const Notices: React.FC = () => {
  // State for notices
  const [notices, setNotices] = useState<Notice[]>(initialNotices);
  const [conversations, setConversations] = useState<Conversation[]>(initialMessages);
  const [activeTab, setActiveTab] = useState<"notices" | "messages">("notices");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [replyContent, setReplyContent] = useState("");
  
  // Notice form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [category, setCategory] = useState<Notice["category"]>("General");
  const [scheduleDateTime, setScheduleDateTime] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filterUnread, setFilterUnread] = useState(false);

  // Stats
  const stats = {
    totalNotices: notices.length,
    unreadMessages: conversations.reduce((acc, conv) => acc + conv.unreadCount, 0),
    totalMessages: conversations.length,
    scheduledNotices: notices.filter(n => n.status === "scheduled").length
  };

  // Handle adding new notice
  const handleAddNotice = () => {
    if (!title || !content || !selectedClass || !selectedStream) {
      toast.error("Please fill all required fields");
      return;
    }

    const newNotice: Notice = {
      id: Date.now(),
      title,
      content,
      className: selectedClass,
      stream: selectedStream,
      date: new Date().toLocaleDateString('en-CA'),
      category,
      readBy: 0,
      totalRecipients: 60, // Mock data
      status: scheduleDateTime ? "scheduled" : "sent",
      scheduledFor: scheduleDateTime,
      attachments: attachments.map(f => f.name)
    };

    setNotices([newNotice, ...notices]);
    
    // Reset form
    setTitle("");
    setContent("");
    setSelectedClass("");
    setSelectedStream("");
    setCategory("General");
    setScheduleDateTime("");
    setAttachments([]);
    
    toast.success(scheduleDateTime ? "Notice scheduled successfully!" : "Notice published successfully!");
  };

  // Handle file attachment
  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...files]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Handle message reply
  const handleSendReply = () => {
    if (!replyContent.trim() || !selectedConversation) {
      toast.error("Please type a reply");
      return;
    }

    // Update conversation
    setConversations(prev => 
      prev.map(conv => 
        conv.id === selectedConversation.id 
          ? {
              ...conv,
              unreadCount: 0,
              lastMessage: "You: " + replyContent.substring(0, 50) + "...",
              timestamp: "Just now",
              messages: [
                ...conv.messages,
                {
                  id: conv.messages.length + 1,
                  parentName: "You",
                  parentEmail: "",
                  studentName: conv.studentName,
                  className: conv.className,
                  stream: conv.stream,
                  subject: "Re: " + conv.messages[0].subject,
                  content: replyContent,
                  timestamp: new Date().toISOString(),
                  read: true,
                  replied: false,
                  urgency: "low"
                }
              ]
            }
          : conv
      )
    );

    setReplyContent("");
    toast.success("Reply sent successfully!");
  };

  // Mark conversation as read
  const markAsRead = (conversationId: number) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, unreadCount: 0, messages: conv.messages.map(msg => ({ ...msg, read: true })) }
          : conv
      )
    );
  };

  // Filtered data
  const filteredNotices = notices.filter(notice => {
    if (filterCategory !== "all" && notice.category !== filterCategory) return false;
    if (filterClass !== "all" && notice.className !== filterClass) return false;
    if (searchQuery && !notice.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !notice.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredConversations = conversations.filter(conv => {
    if (filterUnread && conv.unreadCount === 0) return false;
    if (searchQuery && !conv.parentName.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !conv.studentName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
            <MessageSquare size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Communication Center</h1>
            <p className="text-slate-500 font-medium">Manage notices and communicate with parents</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex gap-2 bg-white rounded-full p-1 shadow-sm">
            <button
              onClick={() => setActiveTab("notices")}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                activeTab === "notices"
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Megaphone size={14} />
                Notices
              </div>
            </button>
            <button
              onClick={() => setActiveTab("messages")}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                activeTab === "messages"
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 relative">
                <Inbox size={14} />
                Messages
                {stats.unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {stats.unreadMessages}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-none rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Notices</p>
              <p className="text-2xl font-black text-blue-800">{stats.totalNotices}</p>
            </div>
            <Megaphone className="text-blue-400" size={24} />
          </div>
        </Card>
        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-none rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Unread Messages</p>
              <p className="text-2xl font-black text-purple-800">{stats.unreadMessages}</p>
            </div>
            <Bell className="text-purple-400" size={24} />
          </div>
        </Card>
        <Card className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-none rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">Total Conversations</p>
              <p className="text-2xl font-black text-emerald-800">{stats.totalMessages}</p>
            </div>
            <Users className="text-emerald-400" size={24} />
          </div>
        </Card>
        <Card className="bg-gradient-to-r from-amber-50 to-amber-100 border-none rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600">Scheduled</p>
              <p className="text-2xl font-black text-amber-800">{stats.scheduledNotices}</p>
            </div>
            <Calendar className="text-amber-400" size={24} />
          </div>
        </Card>
      </div>

      {/* Main Content */}
      {activeTab === "notices" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Create Notice */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-8 space-y-6 sticky top-6">
              <div className="flex items-center gap-2 mb-2">
                <Plus className="text-indigo-500" size={20} />
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Create Notice</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Mid-term Trip Update"
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Class *</label>
                    <select
                      className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                    >
                      <option value="">Select Class</option>
                      {classes.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Stream *</label>
                    <select
                      className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      value={selectedStream}
                      onChange={(e) => setSelectedStream(e.target.value)}
                    >
                      <option value="">Stream</option>
                      {streams.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Priority *</label>
                  <div className="flex gap-2 flex-wrap">
                    {(Object.keys(categoryColors) as Array<keyof typeof categoryColors>).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
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
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Schedule (Optional)</label>
                  <input
                    type="datetime-local"
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    value={scheduleDateTime}
                    onChange={(e) => setScheduleDateTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Attachments</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileAttach}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className="text-center">
                        <Paperclip className="mx-auto mb-2 text-slate-400" size={24} />
                        <p className="text-sm text-slate-600">Click to add attachments</p>
                        <p className="text-xs text-slate-400 mt-1">PDF, DOC, Images up to 10MB</p>
                      </div>
                    </label>
                  </div>
                  
                  {attachments.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-slate-400" />
                            <span className="text-sm font-medium">{file.name}</span>
                          </div>
                          <button
                            onClick={() => removeAttachment(index)}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Message *</label>
                  <textarea
                    placeholder="Type your message here..."
                    rows={4}
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>

                <button
                  onClick={handleAddNotice}
                  className="w-full py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  <Send size={18} />
                  {scheduleDateTime ? "Schedule Notice" : "Publish Now"}
                </button>
              </div>
            </Card>
          </div>

          {/* Right Column: Notices Feed */}
          <div className="lg:col-span-7 space-y-6">
            {/* Filters */}
            <Card className="border-none shadow-lg rounded-2xl p-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search notices..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm outline-none"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    className="bg-slate-50 border-none rounded-xl px-3 py-2 text-sm"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {Object.keys(categoryColors).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <select
                    className="bg-slate-50 border-none rounded-xl px-3 py-2 text-sm"
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                  >
                    <option value="all">All Classes</option>
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </Card>

            {/* Notices List */}
            <div className="space-y-4">
              {filteredNotices.map((notice) => (
                <Card key={notice.id} className="border-none shadow-lg shadow-slate-200/40 rounded-2xl p-6 bg-white hover:shadow-xl transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3 flex-wrap">
                      <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${categoryColors[notice.category]}`}>
                        {notice.category}
                      </div>
                      {notice.status === "scheduled" && (
                        <div className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100">
                          Scheduled
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-400">
                        <Users size={12} />
                        {notice.className} • {notice.stream}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-black text-slate-300 uppercase">
                      <Clock size={12} />
                      {notice.date}
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-slate-800 mb-2">
                    {notice.title}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed mb-4">
                    {notice.content}
                  </p>

                  {notice.attachments && notice.attachments.length > 0 && (
                    <div className="mb-4">
                      <div className="flex gap-2 flex-wrap">
                        {notice.attachments.map((attachment, idx) => (
                          <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                            <FileText size={14} className="text-slate-400" />
                            <span className="text-xs font-medium">{attachment}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Eye size={14} className="text-slate-400" />
                        <span className="text-xs font-medium text-slate-600">
                          {notice.readBy}/{notice.totalRecipients} parents
                        </span>
                      </div>
                      <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-full rounded-full"
                          style={{ width: `${(notice.readBy / notice.totalRecipients) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 text-slate-400 hover:text-indigo-600">
                        <Eye size={16} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-indigo-600">
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Messages Tab */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Conversations List */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-none shadow-lg rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black text-slate-800">Parent Conversations</h2>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filterUnread}
                      onChange={(e) => setFilterUnread(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    Unread only
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => {
                      setSelectedConversation(conversation);
                      markAsRead(conversation.id);
                    }}
                    className={`p-4 rounded-2xl cursor-pointer transition-all ${
                      selectedConversation?.id === conversation.id
                        ? 'bg-indigo-50 border border-indigo-100'
                        : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-slate-800">{conversation.parentName}</h3>
                        <p className="text-sm text-slate-500">
                          {conversation.studentName} • {conversation.className} {conversation.stream}
                        </p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-rose-500 text-white text-xs rounded-full px-2 py-1">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 truncate mb-2">{conversation.lastMessage}</p>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{conversation.timestamp}</span>
                      {conversation.messages[0].replied && (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle size={12} />
                          Replied
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right: Message Thread */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border-none shadow-lg rounded-2xl p-6">
              {selectedConversation ? (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <h2 className="text-xl font-black text-slate-800">{selectedConversation.parentName}</h2>
                      <p className="text-sm text-slate-500">
                        Parent of {selectedConversation.studentName} • {selectedConversation.className} {selectedConversation.stream}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 text-slate-400 hover:text-indigo-600">
                        <Phone size={18} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-indigo-600">
                        <Mail size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Messages Thread */}
                  <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {selectedConversation.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-4 rounded-2xl ${
                          message.parentName === "You"
                            ? 'bg-indigo-50 ml-8'
                            : 'bg-slate-50 mr-8'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{message.parentName}</span>
                            {message.urgency === "high" && (
                              <span className={`px-2 py-1 rounded text-xs font-bold ${urgencyColors[message.urgency]}`}>
                                Urgent
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">{new Date(message.timestamp).toLocaleString()}</span>
                        </div>
                        <h4 className="font-semibold text-slate-700 mb-2">{message.subject}</h4>
                        <p className="text-slate-600">{message.content}</p>
                        
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-3">
                            <div className="flex gap-2">
                              {message.attachments.map((attachment, idx) => (
                                <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg">
                                  <FileText size={14} className="text-slate-400" />
                                  <span className="text-xs">{attachment}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Reply Box */}
                  <div className="pt-4 border-t border-slate-100">
                    <textarea
                      placeholder="Type your reply..."
                      rows={3}
                      className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm resize-none mb-3"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                    />
                    <div className="flex justify-between">
                      <div className="flex gap-2">
                        <button className="p-2 text-slate-400 hover:text-indigo-600">
                          <Paperclip size={18} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-indigo-600">
                          <Image size={18} />
                        </button>
                      </div>
                      <button
                        onClick={handleSendReply}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                      >
                        <Send size={16} />
                        Send Reply
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Inbox size={48} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-bold text-slate-600 mb-2">No Conversation Selected</h3>
                  <p className="text-slate-400">Select a conversation from the list to view messages</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notices;
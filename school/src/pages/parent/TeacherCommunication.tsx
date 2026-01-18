import React, { useState, useEffect, useRef } from "react";
import Card from "../../components/common/Card";
import { TrendingUp, Target, Award, BarChart3, Brain, Loader2, AlertCircle, Send, User, Bot, Users } from "lucide-react";

interface SubjectScore {
  name: string;
  score: number;
  trend: string;
  teacher?: string;
}

interface StudentInfo {
  id: number;
  name: string;
  grade: string;
  email: string;
  class: string;
  teacher?: string;
  parentContact?: string;
}

interface PerformanceData {
  subjects: SubjectScore[];
  overall: number;
  rank: number;
  improvement: number;
}

interface MonthlyTrend {
  month: string;
  score: number;
}

interface AIQuery {
  query: string;
  thread_id?: string;
}

interface AIResponse {
  success: boolean;
  data: {
    answer: string;
    thread_id: string;
    status: string;
  };
  thread_id: string;
  timestamp: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const PerformanceAnalysis: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectScore[]>([]);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<Message[]>([
    { id: "1", text: "Hello! I'm your AI performance analyst. Ask me anything about student performance, study strategies, or academic analysis.", sender: 'ai', timestamp: new Date() }
  ]);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Fetch all data from backend APIs
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch student info (using student ID 1 for now)
      const studentResponse = await fetch('http://localhost:3000/api/v1/students/1');
      const studentData = await studentResponse.json();
      
      if (studentData.success) {
        setStudentInfo(studentData.data);
        
        // Fetch subject scores
        const subjectsResponse = await fetch('http://localhost:3000/api/v1/students/1/subjects');
        const subjectsData = await subjectsResponse.json();
        
        if (subjectsData.success) {
          setSubjects(subjectsData.data);
        }
        
        // Fetch performance data
        const performanceResponse = await fetch('http://localhost:3000/api/v1/students/1/performance');
        const performanceData = await performanceResponse.json();
        
        if (performanceData.success) {
          setPerformanceData(performanceData);
          
          // Extract monthly trend from performance data
          if (performanceData.monthly_trend) {
            setMonthlyTrend(performanceData.monthly_trend);
          }
        }
      }
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load performance data from server');
      
      // Fallback to mock data if API fails
      setFallbackData();
    } finally {
      setLoading(false);
    }
  };

  // Fallback mock data if API fails
  const setFallbackData = () => {
    setStudentInfo({
      id: 1,
      name: 'Vin Jaoko',
      grade: '4th',
      email: 'vin.jaoko@school.edu',
      class: 'Grade 4A',
      teacher: 'Ms. Johnson',
      parentContact: 'parent@email.com'
    });
    
    setSubjects([
      { name: "Mathematics", score: 85, trend: "up", teacher: "Mr. Smith" },
      { name: "English", score: 88, trend: "stable", teacher: "Ms. Davis" },
      { name: "Science", score: 78, trend: "up", teacher: "Dr. Wilson" },
      { name: "Kiswahili", score: 75, trend: "up", teacher: "Mr. Omondi" },
      { name: "Social Studies", score: 82, trend: "stable", teacher: "Mrs. Patel" },
      { name: "Arts", score: 90, trend: "up", teacher: "Ms. Taylor" }
    ]);
    
    setPerformanceData({
      subjects: [
        { name: "Mathematics", score: 85, trend: "up" },
        { name: "English", score: 88, trend: "stable" },
        { name: "Science", score: 78, trend: "up" },
        { name: "Kiswahili", score: 75, trend: "up" }
      ],
      overall: 82.5,
      rank: 3,
      improvement: 12
    });
    
    setMonthlyTrend([
      { month: "Jan", score: 65 },
      { month: "Feb", score: 70 },
      { month: "Mar", score: 75 },
      { month: "Apr", score: 78 },
      { month: "May", score: 82 },
      { month: "Jun", score: 85 }
    ]);
  };

  // Function to query AI for performance analysis
  const queryAI = async (question: string) => {
    if (!question.trim()) return;
    
    setAiLoading(true);
    setError(null);
    
    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      text: question,
      sender: 'user',
      timestamp: new Date()
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    setUserInput("");

    try {
      const aiQuery: AIQuery = {
        query: question,
        thread_id: threadId || undefined
      };

      const response = await fetch('http://localhost:3000/api/v1/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(aiQuery)
      });

      const data: AIResponse = await response.json();

      if (data.success) {
        // Add AI response to chat
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.data.answer,
          sender: 'ai',
          timestamp: new Date()
        };
        
        setChatHistory(prev => [...prev, aiMessage]);
        setThreadId(data.data.thread_id);
      } else {
        throw new Error(data.data?.answer || 'AI request failed');
      }
    } catch (err) {
      console.error('AI Query Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get AI analysis');
      
      // Add error message to chat
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "Sorry, I encountered an error. Please try again.",
        sender: 'ai',
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setAiLoading(false);
    }
  };

  // Predefined AI questions for performance analysis
  const aiQuestions = [
    "Analyze my Mathematics performance",
    "What are my areas of improvement?",
    "Suggest study strategies based on my scores",
    "Compare my performance across all subjects"
  ];

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim()) {
      queryAI(userInput);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (userInput.trim() && !aiLoading) {
        queryAI(userInput);
      }
    }
  };

  // Clear chat history
  const clearChat = () => {
    setChatHistory([
      { id: "1", text: "Hello! I'm your AI performance analyst. Ask me anything about student performance, study strategies, or academic analysis.", sender: 'ai', timestamp: new Date() }
    ]);
    setThreadId(null);
    setError(null);
  };

  // Function to update a subject score (simulated - would normally call an API)
  const updateSubjectScore = async (subjectName: string, newScore: number) => {
    try {
      setSubjects(prev => prev.map(subject => 
        subject.name === subjectName ? { ...subject, score: newScore } : subject
      ));
      
      await queryAI(`I scored ${newScore}% in ${subjectName}. Analyze this result.`);
    } catch (err) {
      console.error('Error updating score:', err);
    }
  };

  // Calculate overall average from subjects
  const calculateOverallAverage = () => {
    if (subjects.length === 0) return 0;
    const total = subjects.reduce((acc, subject) => acc + subject.score, 0);
    return total / subjects.length;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Student Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100">
        <div className="flex justify-between items-start">
          <div>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 w-48 bg-slate-200 rounded mb-2"></div>
                <div className="h-4 w-64 bg-slate-200 rounded"></div>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                  <Users className="text-indigo-600" />
                  {studentInfo?.name || 'Student Name'}
                </h1>
                <div className="mt-2 flex flex-wrap gap-4 text-slate-600">
                  <span className="flex items-center gap-2">
                    <span className="font-medium">Grade:</span> {studentInfo?.grade}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-medium">Class:</span> {studentInfo?.class}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-medium">Teacher:</span> {studentInfo?.teacher}
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-500">Term 1 2026</div>
            <button
              onClick={() => fetchAllData()}
              className="mt-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Refreshing...
                </>
              ) : (
                <>
                  <span>Refresh Data</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* AI Chat Interface */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Brain className="text-purple-500" /> AI Performance Analyst
          </h2>
          <button
            onClick={clearChat}
            className="text-sm px-3 py-1 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Clear Chat
          </button>
        </div>
        
        {/* Chat History */}
        <div 
          ref={chatContainerRef}
          className="h-96 mb-4 p-4 bg-slate-50 rounded-lg overflow-y-auto space-y-4"
        >
          {chatHistory.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  message.sender === 'user'
                    ? 'bg-indigo-500 text-white rounded-br-none'
                    : 'bg-white border border-slate-200 rounded-bl-none'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {message.sender === 'ai' ? (
                    <Bot size={16} className="text-purple-500" />
                  ) : (
                    <User size={16} className="text-indigo-300" />
                  )}
                  <span className="text-xs font-medium">
                    {message.sender === 'ai' ? 'AI Analyst' : 'You'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{message.text}</p>
              </div>
            </div>
          ))}
          
          {aiLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none p-4 max-w-[80%]">
                <div className="flex items-center gap-2">
                  <Bot size={16} className="text-purple-500" />
                  <span className="text-xs font-medium">AI Analyst</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-2 w-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="h-2 w-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="h-2 w-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Action Buttons */}
        <div className="mb-4">
          <p className="text-slate-600 mb-3 text-sm font-medium">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {aiQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => queryAI(question)}
                disabled={aiLoading}
                className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors disabled:opacity-50"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* Text Input Form */}
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about performance, study strategies, or analysis..."
              className="w-full p-4 pr-12 bg-white border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none resize-none"
              rows={3}
              disabled={aiLoading}
            />
            <button
              type="submit"
              disabled={!userInput.trim() || aiLoading}
              className="absolute right-3 bottom-3 p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-slate-500">
              Press Enter to send • Shift+Enter for new line
            </p>
            {threadId && (
              <p className="text-xs text-slate-500">
                Session: {threadId.substring(0, 8)}...
              </p>
            )}
          </div>
        </form>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-600 p-3 bg-red-50 rounded-lg">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </Card>

      {/* Main Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subject Scores Card */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Target className="text-indigo-500" /> Subject Scores
            </h2>
            {loading ? (
              <Loader2 className="animate-spin text-slate-400" size={20} />
            ) : (
              <span className="text-sm text-slate-500">{subjects.length} subjects</span>
            )}
          </div>
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-slate-200 rounded mb-2 w-1/4"></div>
                  <div className="h-2 bg-slate-200 rounded-full"></div>
                </div>
              ))}
            </div>
          ) : subjects.length > 0 ? (
            <div className="space-y-4">
              {subjects.map((subject, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <div>
                      <span className="font-bold text-slate-700">{subject.name}</span>
                      {subject.teacher && (
                        <span className="text-xs text-slate-500 ml-2">({subject.teacher})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateSubjectScore(subject.name, Math.min(100, subject.score + 5))}
                        className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"
                      >
                        +5
                      </button>
                      <span className="font-bold text-slate-800">{subject.score}%</span>
                      <button
                        onClick={() => updateSubjectScore(subject.name, Math.max(0, subject.score - 5))}
                        className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        -5
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        subject.score >= 80 ? "bg-emerald-500" :
                        subject.score >= 70 ? "bg-blue-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${subject.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              No subject data available
            </div>
          )}
          
          <button
            onClick={() => queryAI("Analyze all my subject scores and provide recommendations")}
            className="mt-6 w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
            disabled={aiLoading || subjects.length === 0}
          >
            <Brain size={20} />
            Get AI Analysis of All Subjects
          </button>
        </Card>

        {/* Key Metrics Card */}
        <Card className="p-6">
          <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
            <Award className="text-amber-500" /> Key Metrics
          </h2>
          <div className="space-y-6">
            <div className="text-center">
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-12 bg-slate-200 rounded mx-auto w-32 mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-24 mx-auto"></div>
                </div>
              ) : (
                <>
                  <div className="text-5xl font-black text-indigo-600">
                    {calculateOverallAverage().toFixed(1)}%
                  </div>
                  <p className="text-slate-500 mt-2">Overall Average</p>
                  <button
                    onClick={() => queryAI(`My overall average is ${calculateOverallAverage().toFixed(1)}%. What does this mean?`)}
                    className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                    disabled={aiLoading}
                  >
                    Ask AI about this →
                  </button>
                </>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {loading ? (
                <>
                  <div className="animate-pulse p-4 bg-slate-50 rounded-xl">
                    <div className="h-8 bg-slate-200 rounded mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded"></div>
                  </div>
                  <div className="animate-pulse p-4 bg-slate-50 rounded-xl">
                    <div className="h-8 bg-slate-200 rounded mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded"></div>
                  </div>
                </>
              ) : performanceData ? (
                <>
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className="text-2xl font-black text-slate-800">{performanceData.rank}</div>
                    <p className="text-sm text-slate-500">Class Rank</p>
                    <button
                      onClick={() => queryAI(`I am ranked ${performanceData.rank} in class. Analyze this ranking`)}
                      className="mt-1 text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                      disabled={aiLoading}
                    >
                      AI Analysis
                    </button>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className="text-2xl font-black text-slate-800">+{performanceData.improvement}%</div>
                    <p className="text-sm text-slate-500">Improvement</p>
                    <button
                      onClick={() => queryAI(`I improved by ${performanceData.improvement}%. Analyze my improvement trend`)}
                      className="mt-1 text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                      disabled={aiLoading}
                    >
                      AI Analysis
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className="text-2xl font-black text-slate-800">N/A</div>
                    <p className="text-sm text-slate-500">Class Rank</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className="text-2xl font-black text-slate-800">N/A</div>
                    <p className="text-sm text-slate-500">Improvement</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Trend Card */}
      <Card className="p-6">
        <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <TrendingUp className="text-emerald-500" /> Performance Trend
        </h2>
        
        {loading ? (
          <div className="animate-pulse">
            <div className="flex items-end h-40 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex-1 bg-slate-200 rounded-t-lg"></div>
              ))}
            </div>
          </div>
        ) : monthlyTrend.length > 0 ? (
          <>
            <div className="flex items-end h-40 gap-2">
              {monthlyTrend.map((month, i) => (
                <div key={i} className="flex-1 flex flex-col items-center group">
                  <div 
                    className="w-full bg-gradient-to-t from-indigo-400 to-indigo-600 rounded-t-lg transition-all duration-300 group-hover:opacity-80 cursor-pointer"
                    style={{ height: `${month.score}%` }}
                    onClick={() => queryAI(`In ${month.month}, I scored ${month.score}%. Analyze this performance.`)}
                  />
                  <span className="text-xs text-slate-500 mt-2">{month.month}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => queryAI("Analyze my performance trend over the last few months")}
                className="px-6 py-3 border-2 border-indigo-200 text-indigo-700 font-bold rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                disabled={aiLoading}
              >
                <Brain size={18} />
                Analyze Trend with AI
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-slate-500">
            No trend data available
          </div>
        )}
      </Card>

      {/* Status Indicator */}
      <div className="fixed bottom-4 right-4 flex items-center gap-3">
        <div className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
          aiLoading ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
        }`}>
          <div className={`h-2 w-2 rounded-full ${aiLoading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
          <span className="text-sm font-medium">
            {aiLoading ? 'AI Processing...' : 'AI Ready'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PerformanceAnalysis;
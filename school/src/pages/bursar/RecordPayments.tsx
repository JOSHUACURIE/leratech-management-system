import React, { useState, useEffect, useRef } from "react";
import { 
  ArrowLeft, 
  Save, 
  Search, 
  User, 
  CreditCard, 
  CheckCircle2,
  Loader2,
  Download,
  Printer,
  FileText,
  DollarSign,
  Calendar,
  Receipt,
  X,
  AlertCircle,
  CheckCircle,
  Eye,
  RefreshCw,
  Filter,
  Info
} from "lucide-react";
import Card from "../../components/common/Card";
import { financeAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface ClassLevel { 
  id: string; 
  class_name: string;
  class_level: number;
}

interface Stream { 
  id: string; 
  name: string; 
  class_id: string; 
}

interface Student { 
  id: string; 
  first_name: string;
  last_name: string;
  admission_number: string; 
  class_id: string;
  stream_id: string;
  credit_balance?: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  balance: number;
  due_date: string;
  status: string;
  invoice_items: Array<{
    item_name: string;
    amount: number;
  }>;
}

interface PaymentMethod {
  value: string;
  label: string;
  icon: JSX.Element;
}

interface ReceiptData {
  receiptNo: string;
  date: string;
  time: string;
  studentName: string;
  admissionNo: string;
  className: string;
  paymentMethod: string;
  transactionId?: string;
  amount: number;
  previousBalance: number;
  newBalance: number;
  items: Array<{
    description: string;
    amount: number;
  }>;
}

interface PaymentFormData {
  invoiceId?: string;
  studentId: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  payerName: string;
  paymentReference: string;
}

interface School {
  id: string;
  name: string;
  slug: string;
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  school?: School;
}

const RecordPayments: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth() as { user: AuthUser | null };
  const receiptRef = useRef<HTMLDivElement>(null);
  
  // Data State
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [filteredStreams, setFilteredStreams] = useState<Stream[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [studentInvoices, setStudentInvoices] = useState<Invoice[]>([]);
  
  // Selection State
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Form State
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("M-PESA");
  const [transactionId, setTransactionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchingStreams, setFetchingStreams] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const [fetchingInvoices, setFetchingInvoices] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Payment methods
  const paymentMethods: PaymentMethod[] = [
    { value: "M-PESA", label: "M-Pesa", icon: <CreditCard size={16} /> },
    { value: "BANK_TRANSFER", label: "Bank Transfer", icon: <CreditCard size={16} /> },
    { value: "CASH", label: "Cash", icon: <DollarSign size={16} /> },
    { value: "CHEQUE", label: "Cheque", icon: <FileText size={16} /> },
    { value: "BURSARY", label: "Bursary", icon: <Receipt size={16} /> },
  ];

  // 1. Fetch Classes on Mount using Finance API
  useEffect(() => {
    const loadInitialData = async () => {
      setFetching(true);
      try {
        const response = await financeAPI.getClasses();
        if (response.data.success) {
          const classesData = response.data.data?.classes || response.data.data || [];
          setClasses(Array.isArray(classesData) ? classesData : []);
        } else {
          setError("Failed to load classes. Please try again.");
        }
      } catch (err: any) {
        console.error("Failed to fetch classes", err);
        setError(err.message || "Failed to load classes. Please try again.");
      } finally {
        setFetching(false);
      }
    };
    loadInitialData();
  }, []);

  // 2. Fetch Streams when Class changes using Finance API
  useEffect(() => {
    if (!selectedClass) {
      setStreams([]);
      setFilteredStreams([]);
      setSelectedStream("");
      return;
    }
    
    const loadStreams = async () => {
      try {
        setFetchingStreams(true);
        setError(null);
        
        let streamsData: Stream[] = [];
        
        // Use finance API to get streams for the selected class
        try {
          const response = await financeAPI.getClassStreams(selectedClass, {
            includeStudentCount: false,
            includeFeeSummary: false
          });
          
          console.log("Finance streams API response:", response.data);
          
          if (response.data.success) {
            // Extract streams from response
            const streamsResponse = response.data.data?.streams || [];
            streamsData = streamsResponse.map((stream: any) => ({
              id: stream.id,
              name: stream.name || stream.stream_name,
              class_id: selectedClass
            }));
          } else {
            throw new Error("Failed to fetch streams");
          }
        } catch (financeErr) {
          console.log("Finance streams endpoint failed, trying fallback...");
          
          // Fallback: Use finance API to get all streams and filter by class
          try {
            const allStreamsResponse = await financeAPI.getStreams({
              classId: selectedClass
            });
            
            if (allStreamsResponse.data.success) {
              streamsData = allStreamsResponse.data.data || [];
            }
          } catch (fallbackErr) {
            console.log("Stream fallback also failed");
          }
        }
        
        // Ensure it's an array
        streamsData = Array.isArray(streamsData) ? streamsData : [];
        
        setStreams(streamsData);
        setFilteredStreams(streamsData);
        
        // Auto-select first stream if only one exists
        if (streamsData.length === 1) {
          setSelectedStream(streamsData[0].id);
        } else if (streamsData.length === 0) {
          setSelectedStream("");
          setError("No streams available for this class");
        }
        
      } catch (err: any) {
        console.error("Failed to fetch streams", err);
        setStreams([]);
        setFilteredStreams([]);
        setError("Unable to load streams. You can still proceed by selecting students directly.");
      } finally {
        setFetchingStreams(false);
      }
    };
    
    loadStreams();
  }, [selectedClass]);

  // 3. Fetch Students when Stream changes using Finance API
  useEffect(() => {
    if (!selectedStream || !selectedClass) {
      setStudents([]);
      setFilteredStudents([]);
      return;
    }
    
    const loadStudents = async () => {
      try {
        setFetchingStudents(true);
        setError(null);
        
        let studentsData: Student[] = [];
        
        // Use finance API to get students for the stream
        try {
          const response = await financeAPI.getStreamStudents(selectedStream, {
            includeInactive: false,
            feeStatus: 'all'
          });
          
          console.log("Finance students API response:", response.data);
          
          if (response.data.success) {
            const data = response.data.data?.students || response.data.data || [];
            studentsData = Array.isArray(data) ? data : [];
          } else {
            throw new Error("Failed to fetch students");
          }
        } catch (financeErr) {
          console.log("Finance stream students endpoint failed, trying fallback...");
          
          // Fallback: Use finance API to get all students and filter
          try {
            const allStudentsResponse = await financeAPI.getStudentsByClassAndStream({
              classId: selectedClass,
              streamId: selectedStream
            });
            
            if (allStudentsResponse.data.success) {
              const data = allStudentsResponse.data.data?.students || allStudentsResponse.data.data || [];
              studentsData = Array.isArray(data) ? data : [];
            }
          } catch (fallbackErr) {
            console.log("Students fallback also failed");
          }
        }
        
        setStudents(studentsData);
        setFilteredStudents(studentsData);
        
        if (studentsData.length === 0) {
          setError("No students found in this stream");
        }
        
      } catch (err: any) {
        console.error("Failed to fetch students", err);
        setStudents([]);
        setFilteredStudents([]);
        setError("Failed to load students for selected stream.");
      } finally {
        setFetchingStudents(false);
      }
    };
    
    loadStudents();
  }, [selectedClass, selectedStream]);

  // Filter students based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStudents(students);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = students.filter(student => 
      student.first_name.toLowerCase().includes(query) ||
      student.last_name.toLowerCase().includes(query) ||
      student.admission_number.toLowerCase().includes(query)
    );
    setFilteredStudents(filtered);
  }, [searchQuery, students]);

  // Load student invoices when student is selected
  useEffect(() => {
    if (!selectedStudent) {
      setStudentInvoices([]);
      setSelectedInvoice(null);
      return;
    }
    
    const loadStudentInvoices = async () => {
      try {
        setFetchingInvoices(true);
        const response = await financeAPI.getStudentStatement(selectedStudent.id);
        if (response.data.success) {
          // Get pending invoices
          const ledgerData = response.data.data?.ledger || [];
          const pendingInvoices = ledgerData
            .filter((item: any) => item.type === 'INVOICE' && item.balance > 0)
            .map((item: any) => ({
              id: item.reference,
              invoice_number: item.reference,
              total_amount: item.debit,
              balance: item.balance,
              due_date: item.date,
              status: 'pending',
              invoice_items: [{
                item_name: item.description,
                amount: item.debit
              }]
            }));
          setStudentInvoices(pendingInvoices);
        } else {
          console.error("Failed to fetch student invoices:", response.data);
          setStudentInvoices([]);
        }
      } catch (err: any) {
        console.error("Failed to fetch student invoices", err);
        setStudentInvoices([]);
        setError("Failed to load student invoices.");
      } finally {
        setFetchingInvoices(false);
      }
    };
    
    loadStudentInvoices();
  }, [selectedStudent]);

  // Alternative: Load student invoices from finance API
  const loadStudentFeeDetails = async (studentId: string) => {
    try {
      setFetchingInvoices(true);
      const response = await financeAPI.getStudentFeeDetails(studentId);
      if (response.data.success) {
        const feeData = response.data.data;
        if (feeData && feeData.invoices) {
          const pendingInvoices = feeData.invoices
            .filter((invoice: any) => invoice.balance > 0)
            .map((invoice: any) => ({
              id: invoice.id,
              invoice_number: invoice.invoice_number || invoice.reference,
              total_amount: invoice.total_amount || invoice.amount,
              balance: invoice.balance,
              due_date: invoice.due_date || invoice.created_at,
              status: invoice.status || 'pending',
              invoice_items: invoice.items || [{
                item_name: 'Tuition Fee',
                amount: invoice.balance
              }]
            }));
          setStudentInvoices(pendingInvoices);
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch student fee details", err);
      setStudentInvoices([]);
    } finally {
      setFetchingInvoices(false);
    }
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setSearchQuery("");
    // Load student fee details from finance API
    loadStudentFeeDetails(student.id);
    // Auto-focus amount input
    setTimeout(() => {
      document.getElementById('amount-input')?.focus();
    }, 100);
  };

  const handleInvoiceSelect = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setAmount(invoice.balance.toString());
  };

  const validateForm = (): boolean => {
    setError(null);
    
    if (!selectedStudent) {
      setError("Please select a student");
      return false;
    }
    
    const amountNum = Number(amount);
    if (!amount || amountNum <= 0 || isNaN(amountNum)) {
      setError("Please enter a valid amount");
      return false;
    }
    
    if (!method) {
      setError("Please select a payment method");
      return false;
    }
    
    if (method === "M-PESA" && !transactionId.trim()) {
      setError("Please enter M-Pesa transaction ID");
      return false;
    }
    
    const totalBalance = getTotalBalance();
    if (amountNum > totalBalance) {
      setError(`Amount cannot exceed total outstanding balance of KES ${totalBalance.toLocaleString()}`);
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const paymentData: PaymentFormData = {
        invoiceId: selectedInvoice?.id || undefined,
        studentId: selectedStudent?.id || "",
        amount: Number(amount),
        paymentMethod: method,
        transactionId: method === "M-PESA" ? transactionId : undefined,
        payerName: `${selectedStudent?.first_name} ${selectedStudent?.last_name}`,
        paymentReference: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
      };
      
      const response = await financeAPI.processPayment(paymentData);
      
      if (response.data.success) {
        const payment = response.data.data.payment;
        const updatedInvoice = response.data.data.updatedInvoice;
        
        // Generate receipt data
        const receipt: ReceiptData = {
          receiptNo: payment.payment_reference || paymentData.paymentReference,
          date: new Date().toLocaleDateString('en-GB'),
          time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          studentName: `${selectedStudent?.first_name} ${selectedStudent?.last_name}`,
          admissionNo: selectedStudent?.admission_number || "",
          className: classes.find(c => c.id === selectedStudent?.class_id)?.class_name || "N/A",
          paymentMethod: method,
          transactionId: method === "M-PESA" ? transactionId : undefined,
          amount: Number(amount),
          previousBalance: selectedInvoice?.balance || getTotalBalance(),
          newBalance: updatedInvoice?.balance || (getTotalBalance() - Number(amount)),
          items: studentInvoices.map(inv => ({
            description: `Invoice: ${inv.invoice_number}`,
            amount: inv.balance
          }))
        };
        
        setReceiptData(receipt);
        setSuccess("Payment recorded successfully!");
        
        // Reset form and show receipt
        setTimeout(() => {
          setShowReceiptModal(true);
          resetForm();
        }, 1000);
      } else {
        setError(response.data.message || "Failed to process payment.");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to record payment. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedStudent(null);
    setAmount("");
    setTransactionId("");
    setSelectedInvoice(null);
    setStudentInvoices([]);
    setSearchQuery("");
    setSelectedStream("");
    setSelectedClass("");
  };

  const handleRefresh = () => {
    resetForm();
    setStreams([]);
    setFilteredStreams([]);
    setStudents([]);
    setFilteredStudents([]);
    setError(null);
    setSuccess(null);
  };

  const generateReceiptPDF = async () => {
    if (!receiptRef.current || !receiptData) return;
    
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10;
      
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Receipt_${receiptData.receiptNo}_${receiptData.admissionNo}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError("Failed to generate PDF. Please try again.");
    }
  };

  const printReceipt = () => {
    if (!receiptRef.current || !receiptData) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - ${receiptData.receiptNo}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; background: white; }
              .receipt-container { max-width: 800px; margin: 0 auto; }
              @media print {
                body { margin: 0; }
                button { display: none; }
              }
            </style>
          </head>
          <body>
            ${receiptRef.current.innerHTML}
            <script>
              window.onload = function() {
                window.print();
                setTimeout(() => window.close(), 1000);
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const getTotalBalance = () => {
    return studentInvoices.reduce((sum, invoice) => sum + invoice.balance, 0);
  };

  const getRemainingBalance = () => {
    const total = getTotalBalance();
    const paymentAmount = Number(amount) || 0;
    return Math.max(0, total - paymentAmount);
  };

  // Get selected class name for display
  const getSelectedClassName = () => {
    const selectedClassObj = classes.find(c => c.id === selectedClass);
    return selectedClassObj ? selectedClassObj.class_name : "N/A";
  };

  // Get selected stream name for display
  const getSelectedStreamName = () => {
    const selectedStreamObj = streams.find(s => s.id === selectedStream);
    return selectedStreamObj ? selectedStreamObj.name : "N/A";
  };

  // Get school name safely
  const getSchoolName = () => {
    return user?.school?.name || "SCHOOL NAME";
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-semibold transition-colors mb-2 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Record Payment</h1>
          <p className="text-slate-500 font-medium">New financial entry into the school ledger.</p>
          {selectedClass && (
            <p className="text-sm text-slate-600 mt-1">
              Class: <span className="font-medium">{getSelectedClassName()}</span>
              {selectedStream && <span className="ml-2">Stream: <span className="font-medium">{getSelectedStreamName()}</span></span>}
            </p>
          )}
        </div>
        
        {selectedStudent && (
          <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-4 border-r border-slate-100 text-center">
              <p className="text-xs text-slate-500 font-semibold">Total Outstanding</p>
              <p className="text-sm font-bold text-rose-600">KES {getTotalBalance().toLocaleString()}</p>
            </div>
            <div className="px-4 border-r border-slate-100 text-center">
              <p className="text-xs text-slate-500 font-semibold">This Payment</p>
              <p className="text-sm font-bold text-emerald-600">
                {amount ? `KES ${Number(amount).toLocaleString()}` : "—"}
              </p>
            </div>
            <div className="px-4 text-center">
              <p className="text-xs text-slate-500 font-semibold">New Balance</p>
              <p className="text-sm font-bold text-slate-800">KES {getRemainingBalance().toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-600" size={20} />
            <span className="text-red-700 font-medium">{error}</span>
          </div>
          <button 
            onClick={() => setError(null)}
            className="p-1 hover:bg-red-100 rounded transition-colors"
          >
            <X size={16} className="text-red-500" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-emerald-600" size={20} />
            <span className="text-emerald-700 font-medium">{success}</span>
          </div>
          <button 
            onClick={() => setSuccess(null)}
            className="p-1 hover:bg-emerald-100 rounded transition-colors"
          >
            <X size={16} className="text-emerald-500" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Selection Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-8 bg-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-indigo-500" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Student Selection</h2>
              </div>
              <button
                onClick={handleRefresh}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                title="Refresh form"
                disabled={loading || fetching}
              >
                <RefreshCw size={16} className={fetching ? "animate-spin" : ""} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Class and Stream Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Class Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Class Level
                  </label>
                  <select 
                    value={selectedClass}
                    onChange={(e) => {
                      setSelectedClass(e.target.value);
                      setSelectedStream("");
                      setSelectedStudent(null);
                      setStudentInvoices([]);
                    }}
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-slate-700 font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                    disabled={fetching || loading}
                  >
                    <option value="">{fetching ? "Loading classes..." : "Select Class"}</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.class_name}
                      </option>
                    ))}
                  </select>
                  {selectedClass && (
                    <p className="text-xs text-slate-500 ml-1">
                      Selected: {getSelectedClassName()}
                    </p>
                  )}
                </div>

                {/* Stream Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Stream / Wing
                  </label>
                  <select 
                    disabled={!selectedClass || fetchingStreams || loading}
                    value={selectedStream}
                    onChange={(e) => {
                      setSelectedStream(e.target.value);
                      setSelectedStudent(null);
                      setStudentInvoices([]);
                    }}
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-slate-700 font-bold focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <option value="">
                      {fetchingStreams ? "Loading streams..." : 
                        filteredStreams.length === 0 ? "No streams available" : "Select Stream"}
                    </option>
                    {filteredStreams.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {selectedClass && filteredStreams.length === 0 && !fetchingStreams && (
                    <p className="text-xs text-amber-500 ml-1">
                      No streams found for this class
                    </p>
                  )}
                  {selectedStream && (
                    <p className="text-xs text-slate-500 ml-1">
                      Selected: {getSelectedStreamName()}
                    </p>
                  )}
                </div>
              </div>

              {/* Student Search and Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Search Student
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or admission number..."
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 pl-12 text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500"
                    disabled={!selectedStream || loading}
                  />
                </div>
                
                {/* Student List */}
                {selectedStream && searchQuery && (
                  <div className="max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-2xl mt-2 shadow-lg">
                    {filteredStudents.length === 0 ? (
                      <div className="p-4 text-center text-slate-500">
                        {fetchingStudents ? "Loading students..." : 
                          students.length === 0 ? "No students in this stream" : "No students found"}
                      </div>
                    ) : (
                      filteredStudents.map(student => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => handleStudentSelect(student)}
                          className={`w-full p-4 text-left hover:bg-slate-50 transition-colors flex items-center justify-between ${
                            selectedStudent?.id === student.id ? 'bg-indigo-50' : ''
                          }`}
                        >
                          <div>
                            <p className="font-bold text-slate-800">
                              {student.first_name} {student.last_name}
                            </p>
                            <p className="text-sm text-slate-500">
                              {student.admission_number}
                            </p>
                          </div>
                          <User className="text-slate-400" size={18} />
                        </button>
                      ))
                    )}
                  </div>
                )}
                
                {/* Selected Student Info */}
                {selectedStudent && (
                  <div className="bg-indigo-50 p-4 rounded-2xl mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-bold text-indigo-600">
                          {selectedStudent.first_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">
                            {selectedStudent.first_name} {selectedStudent.last_name}
                          </p>
                          <p className="text-sm text-slate-600">
                            Admission: {selectedStudent.admission_number}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudent(null);
                          setSelectedInvoice(null);
                          setAmount("");
                          setStudentInvoices([]);
                        }}
                        className="p-2 text-slate-400 hover:text-rose-500"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Student Invoices */}
              {selectedStudent && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Outstanding Invoices {fetchingInvoices && <span className="text-xs normal-case">(Loading...)</span>}
                    </label>
                    {studentInvoices.length > 0 && (
                      <span className="text-xs font-bold text-slate-500">
                        Total: KES {getTotalBalance().toLocaleString()}
                      </span>
                    )}
                  </div>
                  
                  {studentInvoices.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {studentInvoices.map(invoice => (
                        <button
                          key={invoice.id}
                          type="button"
                          onClick={() => handleInvoiceSelect(invoice)}
                          className={`p-4 rounded-2xl text-left transition-all ${
                            selectedInvoice?.id === invoice.id 
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-slate-50 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold">{invoice.invoice_number}</p>
                              <p className="text-sm opacity-75">
                                Due: {new Date(invoice.due_date).toLocaleDateString()}
                              </p>
                            </div>
                            <p className={`font-black ${selectedInvoice?.id === invoice.id ? 'text-white' : 'text-indigo-600'}`}>
                              KES {invoice.balance.toLocaleString()}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-2xl text-center">
                      <p className="text-slate-500 text-sm">No outstanding invoices found</p>
                      <p className="text-slate-400 text-xs mt-1">You can still record a general payment</p>
                    </div>
                  )}
                </div>
              )}

              <hr className="border-slate-50" />

              {/* Payment Details */}
              {selectedStudent && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Amount */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                        Amount (KES) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">KES</span>
                        <input 
                          id="amount-input"
                          type="number" 
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full bg-slate-50 border-none rounded-2xl p-4 pl-16 text-xl font-black text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                          min="0"
                          step="100"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                        Payment Method *
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {paymentMethods.map((methodOption) => (
                          <button
                            key={methodOption.value}
                            type="button"
                            onClick={() => {
                              setMethod(methodOption.value);
                              if (methodOption.value !== "M-PESA") {
                                setTransactionId("");
                              }
                            }}
                            className={`py-3 rounded-2xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                              method === methodOption.value 
                                ? 'bg-slate-900 text-white shadow-lg' 
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }`}
                            disabled={loading}
                          >
                            {methodOption.icon}
                            {methodOption.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Transaction ID for M-PESA */}
                  {method === "M-PESA" && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                        M-Pesa Transaction ID *
                      </label>
                      <input
                        type="text"
                        placeholder="Enter transaction ID (e.g., OAT8X4HABC)"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500"
                        disabled={loading}
                      />
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={loading || !selectedStudent || !amount || Number(amount) <= 0}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 transition-all disabled:bg-slate-200 disabled:shadow-none disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {loading ? "Processing..." : "Confirm & Post Transaction"}
                  </button>
                </>
              )}
            </form>
          </Card>
        </div>

        {/* Right: Summary / Info */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
            <h2 className="text-lg font-black mb-6 tracking-tight flex items-center gap-3">
              <DollarSign size={22} className="text-indigo-300" />
              Payment Summary
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-700">
                <span className="text-slate-300 text-sm">Selected Student</span>
                <span className="font-bold text-right">
                  {selectedStudent 
                    ? `${selectedStudent.first_name} ${selectedStudent.last_name}`
                    : "—"
                  }
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-slate-700">
                <span className="text-slate-300 text-sm">Admission No.</span>
                <span className="font-mono font-bold">
                  {selectedStudent?.admission_number || "—"}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-slate-700">
                <span className="text-slate-300 text-sm">Class & Stream</span>
                <span className="font-bold text-right">
                  {selectedClass 
                    ? `${getSelectedClassName()} ${selectedStream ? `- ${getSelectedStreamName()}` : ''}`
                    : "—"
                  }
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-slate-700">
                <span className="text-slate-300 text-sm">Outstanding Balance</span>
                <span className="font-bold text-rose-300">
                  KES {getTotalBalance().toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-slate-700">
                <span className="text-slate-300 text-sm">Payment Amount</span>
                <span className="font-bold text-emerald-300">
                  {amount ? `KES ${Number(amount).toLocaleString()}` : "—"}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3">
                <span className="text-slate-300 text-sm">New Balance</span>
                <span className="font-bold text-white">
                  KES {getRemainingBalance().toLocaleString()}
                </span>
              </div>
            </div>
            
            {selectedInvoice && (
              <div className="mt-6 p-4 bg-slate-800 rounded-2xl">
                <p className="text-sm font-bold text-indigo-300 mb-2">Selected Invoice</p>
                <p className="font-mono text-sm">{selectedInvoice.invoice_number}</p>
                <p className="text-xs text-slate-400">
                  Balance: KES {selectedInvoice.balance.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-8 bg-gradient-to-br from-white to-indigo-50">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-2">
              <Info size={16} />
              Payment Guidelines
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-indigo-600 font-bold text-xs">1</span>
                </div>
                <p className="text-sm text-slate-600">
                  Select a class, stream, then search and select student
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-indigo-600 font-bold text-xs">2</span>
                </div>
                <p className="text-sm text-slate-600">
                  Choose an invoice (optional) or enter payment amount
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-indigo-600 font-bold text-xs">3</span>
                </div>
                <p className="text-sm text-slate-600">
                  Select payment method and provide required details
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-indigo-600 font-bold text-xs">4</span>
                </div>
                <p className="text-sm text-slate-600">
                  Confirm payment to generate receipt
                </p>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Today's Date</span>
                <span className="font-bold text-slate-700">
                  {new Date().toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-slate-500">Processed By</span>
                <span className="font-bold text-slate-700">
                  {user?.name || "System User"}
                </span>
              </div>
            </div>
          </Card>

          {/* Recent Payments Summary */}
          {selectedStudent && studentInvoices.length > 0 && (
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-8 bg-white">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-4 flex items-center gap-2">
                <Receipt size={16} />
                Invoices Summary
              </h2>
              
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {studentInvoices.map(invoice => (
                  <div 
                    key={invoice.id}
                    className={`p-3 rounded-xl border ${
                      selectedInvoice?.id === invoice.id 
                        ? 'border-indigo-300 bg-indigo-50' 
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-bold text-slate-800 text-sm">
                        {invoice.invoice_number}
                      </p>
                      <p className="font-black text-indigo-600">
                        KES {invoice.balance.toLocaleString()}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500">
                      Due: {new Date(invoice.due_date).toLocaleDateString()}
                    </p>
                    {invoice.invoice_items.length > 0 && (
                      <p className="text-xs text-slate-600 mt-1 truncate">
                        {invoice.invoice_items[0].item_name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Total Outstanding:</span>
                  <span className="font-bold text-rose-600">
                    KES {getTotalBalance().toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && receiptData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <div>
                <h2 className="text-2xl font-black">Payment Receipt</h2>
                <p className="text-indigo-100">Transaction completed successfully</p>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Receipt Content */}
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Printable Receipt */}
              <div 
                ref={receiptRef}
                className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-200 max-w-3xl mx-auto"
              >
                {/* Receipt Header */}
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-black text-slate-900 mb-2">{getSchoolName()}</h1>
                  <p className="text-slate-600 font-medium">OFFICIAL PAYMENT RECEIPT</p>
                  <p className="text-slate-500 text-sm mt-1">This is an official receipt for school fees payment</p>
                </div>

                {/* Receipt Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        Receipt Number
                      </p>
                      <p className="text-xl font-black text-indigo-600 font-mono">
                        {receiptData.receiptNo}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        Date & Time
                      </p>
                      <p className="font-bold text-slate-800">
                        {receiptData.date} at {receiptData.time}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        Student Details
                      </p>
                      <p className="font-bold text-slate-800">{receiptData.studentName}</p>
                      <p className="text-slate-600">Admission: {receiptData.admissionNo}</p>
                      <p className="text-slate-600">Class: {receiptData.className}</p>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        Payment Method
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                          {paymentMethods.find(m => m.value === receiptData.paymentMethod)?.icon}
                        </div>
                        <p className="font-bold text-slate-800">
                          {paymentMethods.find(m => m.value === receiptData.paymentMethod)?.label}
                        </p>
                      </div>
                      {receiptData.transactionId && (
                        <p className="text-sm text-slate-600 mt-2">
                          Transaction ID: <span className="font-mono font-bold">{receiptData.transactionId}</span>
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        Processed By
                      </p>
                      <p className="font-bold text-slate-800">{user?.name || "Finance Office"}</p>
                    </div>
                  </div>
                </div>

                {/* Amount Box */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl mb-8 border border-indigo-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">
                        Amount Received
                      </p>
                      <p className="text-4xl font-black text-indigo-600">
                        KES {receiptData.amount.toLocaleString()}
                      </p>
                      <p className="text-indigo-500 font-medium mt-2">
                        {receiptData.amount.toLocaleString()} Kenya Shillings Only
                      </p>
                    </div>
                    <CheckCircle2 size={48} className="text-indigo-400" />
                  </div>
                </div>

                {/* Balance Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      Previous Balance
                    </p>
                    <p className="text-xl font-black text-rose-600">
                      KES {receiptData.previousBalance.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      Payment Made
                    </p>
                    <p className="text-xl font-black text-emerald-600">
                      KES {receiptData.amount.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="bg-slate-900 p-4 rounded-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1">
                      New Balance
                    </p>
                    <p className="text-xl font-black text-white">
                      KES {receiptData.newBalance.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Items Breakdown */}
                {receiptData.items.length > 0 && (
                  <div className="mb-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                      Payment Allocation
                    </p>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      {receiptData.items.map((item, index) => (
                        <div 
                          key={index}
                          className="flex justify-between items-center p-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                        >
                          <p className="font-medium text-slate-800">{item.description}</p>
                          <p className="font-bold text-slate-900">KES {item.amount.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="pt-8 border-t border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                        School Stamp & Signature
                      </p>
                      <div className="h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center">
                        <p className="text-slate-400">Authorized Stamp</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                        Parent/Guardian Signature
                      </p>
                      <div className="h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center">
                        <p className="text-slate-400">Signature</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 text-center">
                    <p className="text-sm text-slate-500">
                      This is a computer-generated receipt. No signature required.
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      Generated on {new Date().toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer with Actions */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-slate-600">
                <CheckCircle className="text-emerald-500" size={18} />
                <span className="text-sm font-medium">Payment recorded successfully</span>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="px-6 py-3 border-2 border-slate-300 text-slate-700 font-bold rounded-2xl hover:bg-slate-100 transition-colors"
                >
                  Close Receipt
                </button>
                
                <button
                  onClick={printReceipt}
                  className="px-6 py-3 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-900 transition-colors flex items-center gap-2"
                >
                  <Printer size={18} />
                  Print Receipt
                </button>
                
                <button
                  onClick={generateReceiptPDF}
                  className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Download size={18} />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add the missing CSS animation
const styles = `
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}
`;

// Add styles to document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default RecordPayments;
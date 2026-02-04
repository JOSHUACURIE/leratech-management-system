import React, { useState, useEffect } from "react";
import { 
  Plus, Settings, BookOpen, Layers, Calendar, GraduationCap, 
  Percent, Trash2, Loader2, X, AlertCircle, Edit3, Save,
  ChevronDown, Clock, Calendar as CalendarIcon, Grid, Star, Award,
  FileText, Hash, Type, Filter, CheckCircle, AlertTriangle, Copy,
  ChevronRight, ChevronLeft, Book, Tag, Target, BarChart, BarChart3,
  TrendingUp, Users, School, BookMarked, ClipboardCheck, 
  FolderTree, List, Grid3x3, Table, Eye, EyeOff, Download,
  Upload, Share2, Lock, Unlock, RefreshCw, Zap, Layers3,
  Search, MoreVertical, ArrowUpDown
} from "lucide-react";
import Card from "../../components/common/Card";
import api from "../../services/api";
import { toast } from "react-hot-toast";

// Type Definitions
interface Class {
  id: string;
  class_name: string;
  class_level: number;
  is_active: boolean;
}

interface Stream {
  id: string;
  name: string;
  class_id: string;
  class?: Class;
}

interface Subject {
  id: string;
  name: string;
  code?: string;
  subject_code?: string;
  category?: string;
  curriculum_id?: string;
  is_compulsory?: boolean;
  max_score?: number;
  curriculum?: Curriculum;
}

interface Term {
  id: string;
  term_name: string;
  academic_year_id: string;
  start_date: string;
  end_date: string;
  fee_deadline?: string;
  is_current: boolean;
}

interface AcademicYear {
  id: string;
  year_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  terms: Term[];
  _count?: {
    terms: number;
  };
}

// Curriculum Types
interface Curriculum {
  id: string;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  subjects?: Subject[];
}

// Grading System Types
interface GradeScale {
  id: string;
  grade: string;
  min_score: number;
  max_score: number;
  points: number;
  description: string;
  color_code?: string;
  is_passing: boolean;
  cbc_level?: string;
  display_order: number;
}

interface GradingSystem {
  id: string;
  name: string;
  description: string;
  min_pass_mark: number;
  is_default: boolean;
  type: 'subject' | 'overall_points' | 'cbc_strand' | 'cbc_sub_strand';
  curriculum_id?: string;
  subject_id?: string;
  applies_to_class_id?: string;
  applies_to_stream_id?: string;
  applies_to_student_type?: string;
  grades: GradeScale[];
  curriculum?: Curriculum;
  subject?: Subject;
  class?: Class;
  stream?: Stream;
}

// CBC Strand Types
interface CBCSubStrand {
  id: string;
  name: string;
  code: string;
  description: string;
  order: number;
  learning_outcomes?: string[];
  assessment_criteria?: string[];
}

interface CBCStrand {
  id: string;
  name: string;
  code: string;
  description: string;
  subject_id: string;
  subject?: Subject;
  sub_strands: CBCSubStrand[];
}

interface SchemeTopic {
  id: string;
  topic_title: string;
  week_number: number;
  cbc_strand_id?: string;
  cbc_sub_strand_id?: string;
  cbc_strand?: CBCStrand;
  cbc_sub_strand?: CBCSubStrand;
}

// Form Data Types
interface FormData {
  // Class
  className: string;
  classLevel: string;
  isActive: boolean;
  
  // Stream
  streamName: string;
  classId: string;
  
  // Subject
  name: string;
  code: string;
  category: string;
  curriculumId: string;
  isCompulsory: boolean;
  maxScore: string;
  
  // Academic Year
  yearName: string;
  yearStart: string;
  yearEnd: string;
  isCurrentYear: boolean;
  
  // Term
  termName: string;
  academicYearId: string;
  termStart: string;
  termEnd: string;
  feeDeadline: string;
  isCurrentTerm: boolean;
  
  // Grade Scale
  grade: string;
  minScore: string;
  maxScore: string;
  points: string;
  comment: string;
  colorCode: string;
  isPassing: boolean;
  cbcLevel: string;
  
  // Grading System
  gradingSystemName: string;
  gradingSystemDescription: string;
  minPassMark: string;
  gradingSystemType: 'subject' | 'overall_points' | 'cbc_strand' | 'cbc_sub_strand';
  curriculumIdForGrading: string;
  subjectIdForGrading: string;
  classIdForGrading: string;
  streamIdForGrading: string;
  studentTypeForGrading: string;
  setIsDefault: boolean;
  
  // Grade Scales Array
  gradeScales: Array<{
    grade: string;
    minScore: string;
    maxScore: string;
    points: string;
    comment: string;
    colorCode: string;
    isPassing: boolean;
    cbcLevel: string;
  }>;
  
  // Curriculum
  curriculumName: string;
  curriculumCode: string;
  curriculumDescription: string;
  
  // CBC Strand
  strandName: string;
  strandCode: string;
  strandDescription: string;
  subjectIdForStrand: string;
  
  // CBC Sub-Strand
  subStrandName: string;
  subStrandCode: string;
  subStrandDescription: string;
  subStrandOrder: string;
  learningOutcomes: string[];
  assessmentCriteria: string[];
  strandIdForSubStrand: string; 

  // Bulk Subjects for Grading
  selectedSubjects: string[];
  bulkMinPassMark: string;
  bulkGradeScales: Array<{
    grade: string;
    minScore: string;
    maxScore: string;
    points: string;
    comment: string;
  }>;
}

const AcademicSetup: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  // Data State
  const [classes, setClasses] = useState<Class[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [gradingSystems, setGradingSystems] = useState<GradingSystem[]>([]);
  const [cbcStrands, setCBCStrands] = useState<CBCStrand[]>([]);
  const [schemeTopics, setSchemeTopics] = useState<SchemeTopic[]>([]);
  
  // Modal & Form State
  const [showModal, setShowModal] = useState<string | null>(null); 
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [selectedCurriculum, setSelectedCurriculum] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedGradingType, setSelectedGradingType] = useState<'subject' | 'overall_points' | 'cbc_strand' | 'cbc_sub_strand'>('subject');
  const [selectedView, setSelectedView] = useState<'list' | 'grid' | 'table'>('table');
  
  // Search and Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    classes: true,
    streams: true,
    subjects: true,
    years: true,
    terms: true,
    curricula: true
  });
  // Form Data
  const [formData, setFormData] = useState<FormData>({
    // Class
    className: "",
    classLevel: "",
    isActive: true,
    
    // Stream
    streamName: "",
    classId: "",
    
    // Subject
    name: "",
    code: "",
    category: "",
    curriculumId: "",
    isCompulsory: true,
    maxScore: "100",
    
    // Academic Year
    yearName: "",
    yearStart: "",
    yearEnd: "",
    isCurrentYear: false,
    
    // Term
    termName: "",
    academicYearId: "",
    termStart: "",
    termEnd: "",
    feeDeadline: "",
    isCurrentTerm: false,
    
    // Grade Scale
    grade: "",
    minScore: "",
    maxScore: "",
    points: "",
    comment: "",
    colorCode: "#3B82F6",
    isPassing: true,
    cbcLevel: "",
    
    // Grading System
    gradingSystemName: "",
    gradingSystemDescription: "",
    minPassMark: "40",
    gradingSystemType: 'subject',
    curriculumIdForGrading: "",
    subjectIdForGrading: "",
    classIdForGrading: "",
    streamIdForGrading: "",
    studentTypeForGrading: "",
    setIsDefault: false,
    
    // Grade Scales
    gradeScales: [
      { grade: "A", minScore: "80", maxScore: "100", points: "12", comment: "Excellent", colorCode: "#10B981", isPassing: true, cbcLevel: "Exceeding Expectation" },
      { grade: "A-", minScore: "75", maxScore: "79", points: "11", comment: "Very Good", colorCode: "#34D399", isPassing: true, cbcLevel: "Exceeding Expectation" },
      { grade: "B+", minScore: "70", maxScore: "74", points: "10", comment: "Good", colorCode: "#60A5FA", isPassing: true, cbcLevel: "Meeting Expectation" },
      { grade: "B", minScore: "65", maxScore: "69", points: "9", comment: "Above Average", colorCode: "#818CF8", isPassing: true, cbcLevel: "Meeting Expectation" },
      { grade: "B-", minScore: "60", maxScore: "64", points: "8", comment: "Average", colorCode: "#A78BFA", isPassing: true, cbcLevel: "Meeting Expectation" },
      { grade: "C+", minScore: "55", maxScore: "59", points: "7", comment: "Below Average", colorCode: "#FBBF24", isPassing: true, cbcLevel: "Approaching Expectation" },
      { grade: "C", minScore: "50", maxScore: "54", points: "6", comment: "Fair", colorCode: "#F59E0B", isPassing: true, cbcLevel: "Approaching Expectation" },
      { grade: "C-", minScore: "45", maxScore: "49", points: "5", comment: "Poor", colorCode: "#F97316", isPassing: false, cbcLevel: "Below Expectation" },
      { grade: "D+", minScore: "40", maxScore: "44", points: "4", comment: "Very Poor", colorCode: "#EF4444", isPassing: false, cbcLevel: "Below Expectation" },
      { grade: "D", minScore: "35", maxScore: "39", points: "3", comment: "Fail", colorCode: "#DC2626", isPassing: false, cbcLevel: "Below Expectation" },
      { grade: "D-", minScore: "30", maxScore: "34", points: "2", comment: "Fail", colorCode: "#B91C1C", isPassing: false, cbcLevel: "Below Expectation" },
      { grade: "E", minScore: "0", maxScore: "29", points: "1", comment: "Fail", colorCode: "#7C3AED", isPassing: false, cbcLevel: "Below Expectation" },
    ],
    
    // Curriculum
    curriculumName: "",
    curriculumCode: "",
    curriculumDescription: "",
    
    // CBC Strand
    strandName: "",
    strandCode: "",
    strandDescription: "",
    subjectIdForStrand: "",
    
    // CBC Sub-Strand
    subStrandName: "",
    subStrandCode: "",
    subStrandDescription: "",
    
    subStrandOrder: "1",
    learningOutcomes: [""],
    assessmentCriteria: [""],
    
    // Bulk
    selectedSubjects: [],
    bulkMinPassMark: "40",
    bulkGradeScales: []
  });

  // Term management state
  const [selectedYearForTerms, setSelectedYearForTerms] = useState<string>("");
  // Grading System Management
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [selectedGradingSystem, setSelectedGradingSystem] = useState<string | null>(null);

  useEffect(() => {
    fetchAcademicData();
  }, [activeTab, selectedCurriculum]);


const fetchAcademicData = async () => {
  try {
    setLoading(true);
    
    const requests = [
      api.get('/classes'),
      api.get('/streams'),
      api.get('/subjects'),
      api.get('/academic/years-with-terms'),
      api.get('/academic'),
      api.get('/grading/systems')
    ];
    
    if (activeTab === 'cbc') {
      requests.push(api.get('/cbc/strands'));
      requests.push(api.get('/cbc/scheme-topics'));
    }

    const responses = await Promise.allSettled(requests);

    const unwrap = <T,>(res: PromiseSettledResult<any>, index: number): T[] => {
      if (res.status === 'rejected') {
        console.error(`Error fetching data for index ${index}:`, res.reason);
        return [];
      }
      
      // Handle different API response structures
      const responseData = res.value.data;
      
      // Check for common response structures
      if (Array.isArray(responseData)) {
        return responseData as T[];
      } else if (responseData && Array.isArray(responseData.data)) {
        return responseData.data as T[];
      } else if (responseData && typeof responseData === 'object') {
        // If it's an object with array properties, try to find an array
        for (const key in responseData) {
          if (Array.isArray(responseData[key])) {
            return responseData[key] as T[];
          }
        }
      }
      
      console.warn(`Unexpected data structure at index ${index}:`, responseData);
      return [];
    };

    setClasses(unwrap<Class>(responses[0], 0));
    setStreams(unwrap<Stream>(responses[1], 1));
    setSubjects(unwrap<Subject>(responses[2], 2));
    
    const yearsData = unwrap<AcademicYear>(responses[3], 3);
    setAcademicYears(yearsData);
    
    // Set default selected year for terms view
    if (yearsData.length > 0 && !selectedYearForTerms) {
      const currentYear = yearsData.find(y => y.is_current);
      setSelectedYearForTerms(currentYear?.id || yearsData[0].id);
    }
    
    const curriculaData = unwrap<Curriculum>(responses[4], 4);
    setCurricula(curriculaData);
    
    // Handle grading systems with specific unwrapping
    const gradingResponse = responses[5];
    let gradingSystemsData: GradingSystem[] = [];

if (gradingResponse.status === 'fulfilled') {
  const responseData = gradingResponse.value.data;
  
  console.log('Grading systems response:', responseData);
  
  // Based on your API response, it should be:
  // responseData.systems.subject contains the array of grading systems
  if (responseData?.systems?.subject && Array.isArray(responseData.systems.subject)) {
    gradingSystemsData = responseData.systems.subject;
    console.log('Found grading systems in systems.subject:', gradingSystemsData.length);
  } 
  else if (responseData?.raw && Array.isArray(responseData.raw)) {
    gradingSystemsData = responseData.raw;
    console.log('Found grading systems in raw:', gradingSystemsData.length);
  }
  else if (Array.isArray(responseData)) {
    gradingSystemsData = responseData;
  }
  
  console.log('Processed grading systems:', gradingSystemsData);
}

setGradingSystems(gradingSystemsData)

    if (activeTab === 'cbc') {
      setCBCStrands(unwrap<CBCStrand>(responses[6], 6));
      setSchemeTopics(unwrap<SchemeTopic>(responses[7], 7));
    }

  } catch (err) {
    console.error("Setup Load Error:", err);
    toast.error("Failed to load academic data");
  } finally {
    setLoading(false);
  }
};
  const handleAction = async () => {
    try {
      setSyncing(true);
      const isEdit = !!editingId;

      if (showModal === 'Class') {
        const payload = { 
          className: formData.className, 
          classLevel: parseInt(formData.classLevel),
          is_active: formData.isActive
        };
        isEdit 
          ? await api.put(`/classes/${editingId}`, payload) 
          : await api.post('/classes', payload);
      } 
      else if (showModal === 'Stream') {
        const payload = { 
          name: formData.streamName, 
          classId: formData.classId 
        };
        isEdit 
          ? await api.put(`/streams/${editingId}`, payload) 
          : await api.post('/streams', payload);
      }
      else if (showModal === 'Subject') {
        const payload = { 
          name: formData.name, 
          code: formData.code,
          category: formData.category || "",
          curriculum_id: formData.curriculumId || null,
          is_compulsory: formData.isCompulsory,
          max_score: parseFloat(formData.maxScore)
        };
        
        if (isEdit) {
          await api.put(`/subjects/${editingId}`, payload);
        } else {
          await api.post('/subjects', payload);
        }
      }
      else if (showModal === 'Academic Year') {
        const payload = { 
          year_name: formData.yearName,
          start_date: formData.yearStart,
          end_date: formData.yearEnd,
          is_current: formData.isCurrentYear
        };
        
        if (isEdit) {
          await api.put(`/academic/years/${editingId}`, payload);
        } else {
          await api.post('/academic/years', payload);
        }
      }
      else if (showModal === 'Term') {
        const payload = {
          academic_year_id: formData.academicYearId,
          term_name: formData.termName,
          start_date: formData.termStart,
          end_date: formData.termEnd,
          fee_deadline: formData.feeDeadline || null,
          is_current: formData.isCurrentTerm
        };
        
        if (isEdit) {
          await api.put(`/academic/terms/${editingId}`, payload);
        } else {
          await api.post('/academic/terms', payload);
        }
      }
      else if (showModal === 'Grade Scale') {
        const payload = { 
          minScore: parseInt(formData.minScore), 
          maxScore: parseInt(formData.maxScore), 
          points: parseInt(formData.points), 
          grade: formData.grade,
          description: formData.comment,
          colorCode: formData.colorCode,
          isPassing: formData.isPassing,
          cbcLevel: formData.cbcLevel
        };
        await api.put(`/grading/scale/${editingId}`, payload);
      }
      else if (showModal === 'Grading System') {
        const payload = {
          name: formData.gradingSystemName,
          description: formData.gradingSystemDescription,
          minPassMark: parseFloat(formData.minPassMark),
          type: formData.gradingSystemType,
          curriculumId: formData.curriculumIdForGrading || null,
          subjectId: formData.subjectIdForGrading || null,
          appliesToClassId: formData.classIdForGrading || null,
          appliesToStreamId: formData.streamIdForGrading || null,
          appliesToStudentType: formData.studentTypeForGrading || null,
          setIsDefault: formData.setIsDefault,
          scales: formData.gradeScales.map(scale => ({
            grade: scale.grade,
            minScore: parseFloat(scale.minScore),
            maxScore: parseFloat(scale.maxScore),
            points: parseFloat(scale.points),
            comment: scale.comment,
            colorCode: scale.colorCode,
            isPassing: scale.isPassing,
            cbcLevel: scale.cbcLevel
          }))
        };
        
        if (isEdit) {
          await api.put(`/grading/systems/${editingId}`, payload);
        } else {
          await api.post('/grading/systems', payload);
        }
      }
      else if (showModal === 'Curriculum') {
        const payload = {
          name: formData.curriculumName,
          code: formData.curriculumCode,
          description: formData.curriculumDescription,
          is_active: true
        };
        
        if (isEdit) {
          await api.put(`/curricula/${editingId}`, payload);
        } else {
          await api.post('/academic', payload);
        }
      }
      else if (showModal === 'CBC Strand') {
        const payload = {
          name: formData.strandName,
          code: formData.strandCode,
          description: formData.strandDescription,
          subject_id: formData.subjectIdForStrand
        };
        
        if (isEdit) {
          await api.put(`/cbc/strands/${editingId}`, payload);
        } else {
          await api.post('/cbc/strands', payload);
        }
      }
      else if (showModal === 'CBC Sub-Strand') {
        const payload = {
          name: formData.subStrandName,
          code: formData.subStrandCode,
          description: formData.subStrandDescription,
          order: parseInt(formData.subStrandOrder),
          learning_outcomes: formData.learningOutcomes.filter(lo => lo.trim()),
          assessment_criteria: formData.assessmentCriteria.filter(ac => ac.trim())
        };
        
        if (isEdit) {
          await api.put(`/cbc/sub-strands/${editingId}`, payload);
        } else {
          await api.post('/cbc/sub-strands', payload);
        }
      }
      else if (showModal === 'Bulk Grading Setup') {
        const payload = {
          curriculumId: selectedCurriculum,
          systems: formData.selectedSubjects.map(subjectId => {
            const subject = subjects.find(s => s.id === subjectId);
            return {
              subjectId,
              name: `${subject?.name} Grading`,
              minPassMark: parseFloat(formData.bulkMinPassMark),
              scales: formData.bulkGradeScales,
              setIsDefault: false
            };
          })
        };
        
        await api.post('/grading/systems/bulk', payload);
      }

      await fetchAcademicData();
      closeModal();
      toast.success(`${showModal} ${isEdit ? 'updated' : 'created'} successfully`);
    } catch (err: any) {
      console.error("Action Error:", err);
      toast.error(err.response?.data?.error || "Operation failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (endpoint: string, id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This may affect related records.`)) return;
    try {
      setSyncing(true);
      await api.delete(`${endpoint}/${id}`);
      await fetchAcademicData();
      toast.success(`${name} deleted successfully`);
    } catch (err: any) {
      console.error("Delete Error:", err);
      toast.error(err.response?.data?.error || "Delete failed.");
    } finally {
      setSyncing(false);
    }
  };

  const openEditModal = (type: string, item: any) => {
    setEditingId(item.id);
    
    if (type === 'Class') {
      setFormData({
        ...formData,
        className: item.class_name,
        classLevel: item.class_level?.toString() || "",
        isActive: item.is_active
      });
    }
    else if (type === 'Stream') {
      setFormData({
        ...formData,
        streamName: item.name,
        classId: item.class_id
      });
    }
    else if (type === 'Subject') {
      setFormData({
        ...formData,
        name: item.name || "",
        code: item.code || item.subject_code || "",
        category: item.category || "",
        curriculumId: item.curriculum_id || "",
        isCompulsory: item.is_compulsory ?? true,
        maxScore: item.max_score?.toString() || "100"
      });
    }
    else if (type === 'Academic Year') {
      setFormData({
        ...formData,
        yearName: item.year_name || "",
        yearStart: item.start_date ? new Date(item.start_date).toISOString().split('T')[0] : "",
        yearEnd: item.end_date ? new Date(item.end_date).toISOString().split('T')[0] : "",
        isCurrentYear: item.is_current || false
      });
    }
    else if (type === 'Term') {
      setFormData({
        ...formData,
        termName: item.term_name || "",
        academicYearId: item.academic_year_id || "",
        termStart: item.start_date ? new Date(item.start_date).toISOString().split('T')[0] : "",
        termEnd: item.end_date ? new Date(item.end_date).toISOString().split('T')[0] : "",
        feeDeadline: item.fee_deadline ? new Date(item.fee_deadline).toISOString().split('T')[0] : "",
        isCurrentTerm: item.is_current || false
      });
    }
    else if (type === 'Grading System') {
      setFormData({
        ...formData,
        gradingSystemName: item.name || "",
        gradingSystemDescription: item.description || "",
        minPassMark: item.min_pass_mark?.toString() || "40",
        gradingSystemType: item.type || 'subject',
        curriculumIdForGrading: item.curriculum_id || "",
        subjectIdForGrading: item.subject_id || "",
        classIdForGrading: item.applies_to_class_id || "",
        streamIdForGrading: item.applies_to_stream_id || "",
        studentTypeForGrading: item.applies_to_student_type || "",
        setIsDefault: item.is_default || false,
        gradeScales: item.grades?.map((g: any) => ({
          grade: g.grade,
          minScore: g.min_score?.toString() || "",
          maxScore: g.max_score?.toString() || "",
          points: g.points?.toString() || "",
          comment: g.description || "",
          colorCode: g.color_code || "#3B82F6",
          isPassing: g.is_passing ?? true,
          cbcLevel: g.cbc_level || ""
        })) || formData.gradeScales
      });
    }
    else if (type === 'Curriculum') {
      setFormData({
        ...formData,
        curriculumName: item.name || "",
        curriculumCode: item.code || "",
        curriculumDescription: item.description || ""
      });
    }
    else if (type === 'CBC Strand') {
      setFormData({
        ...formData,
        strandName: item.name || "",
        strandCode: item.code || "",
        strandDescription: item.description || "",
        subjectIdForStrand: item.subject_id || ""
      });
    }
    else if (type === 'CBC Sub-Strand') {
      setFormData({
        ...formData,
        subStrandName: item.name || "",
        subStrandCode: item.code || "",
        subStrandDescription: item.description || "",
        subStrandOrder: item.order?.toString() || "1",
        learningOutcomes: item.learning_outcomes || [""],
        assessmentCriteria: item.assessment_criteria || [""]
      });
    }
    
    setShowModal(type);
  };

  const closeModal = () => {
    setShowModal(null);
    setEditingId(null);
    setFormData({
      className: "",
      classLevel: "",
      isActive: true,
      streamName: "",
      classId: "",
      name: "",
      code: "",
      category: "",
      curriculumId: "",
      isCompulsory: true,
      maxScore: "100",
      yearName: "",
      yearStart: "",
      yearEnd: "",
      isCurrentYear: false,
      termName: "",
      academicYearId: "",
      termStart: "",
      termEnd: "",
      feeDeadline: "",
      isCurrentTerm: false,
      grade: "",
      minScore: "",
      maxScore: "",
      points: "",
      comment: "",
      colorCode: "#3B82F6",
      isPassing: true,
      cbcLevel: "",
      gradingSystemName: "",
      gradingSystemDescription: "",
      minPassMark: "40",
      gradingSystemType: 'subject',
      curriculumIdForGrading: "",
      subjectIdForGrading: "",
      classIdForGrading: "",
       strandIdForSubStrand: "", 
      streamIdForGrading: "",
      studentTypeForGrading: "",
      setIsDefault: false,
      gradeScales: formData.gradeScales, // Keep grade scales for new systems
      curriculumName: "",
      curriculumCode: "",
      curriculumDescription: "",
      strandName: "",
      strandCode: "",
      strandDescription: "",
      subjectIdForStrand: "",
      subStrandName: "",
      subStrandCode: "",
      subStrandDescription: "",
      subStrandOrder: "1",
      learningOutcomes: [""],
      assessmentCriteria: [""],
      selectedSubjects: [],
      bulkMinPassMark: "40",
      bulkGradeScales: []
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getSelectedYearTerms = (): Term[] => {
    if (!selectedYearForTerms) return [];
    const year = academicYears.find(y => y.id === selectedYearForTerms);
    return year?.terms || [];
  };

  const getGradeColor = (grade: GradeScale) => {
    return grade.color_code || 
      (grade.grade.startsWith('A') ? '#10B981' : 
       grade.grade.startsWith('B') ? '#3B82F6' : 
       grade.grade.startsWith('C') ? '#F59E0B' : '#EF4444');
  };

  const getCurriculumSubjects = () => {
    if (!selectedCurriculum) return subjects;
    return subjects.filter(s => s.curriculum_id === selectedCurriculum);
  };
  const getGradingSystemsByType = (type: GradingSystem['type']): GradingSystem[] => {
  // Debug: Check what gradingSystems actually is
  console.log('gradingSystems in filter:', gradingSystems);
  console.log('Type of gradingSystems:', typeof gradingSystems);
  
  // Ensure gradingSystems is an array
  if (!Array.isArray(gradingSystems)) {
    console.warn('gradingSystems is not an array:', gradingSystems);
    
    // Try to convert to array if it's an object
    if (gradingSystems && typeof gradingSystems === 'object') {
      const systemsArray = Object.values(gradingSystems).filter(item => 
        item && typeof item === 'object' && 'type' in item
      );
      return systemsArray.filter((gs: any) => 
        gs.type === type && (!selectedCurriculum || gs.curriculum_id === selectedCurriculum)
      ) as GradingSystem[];
    }
    
    return [];
  }
  
  // Now we know it's an array, filter safely
  return gradingSystems.filter(gs => {
    if (!gs || typeof gs !== 'object') return false;
    
    // Check if type matches
    const typeMatches = gs.type === type;
    
    // Check curriculum filter
    const curriculumMatches = !selectedCurriculum || gs.curriculum_id === selectedCurriculum;
    
    return typeMatches && curriculumMatches;
  });
};

  const addGradeScaleRow = () => {
    setFormData({
      ...formData,
      gradeScales: [
        ...formData.gradeScales,
        { grade: "", minScore: "", maxScore: "", points: "", comment: "", colorCode: "#3B82F6", isPassing: true, cbcLevel: "" }
      ]
    });
  };

  const removeGradeScaleRow = (index: number) => {
    const newScales = [...formData.gradeScales];
    newScales.splice(index, 1);
    setFormData({ ...formData, gradeScales: newScales });
  };

  const updateGradeScale = (index: number, field: keyof typeof formData.gradeScales[0], value: string | boolean) => {
    const newScales = [...formData.gradeScales];
    newScales[index] = { ...newScales[index], [field]: value };
    setFormData({ ...formData, gradeScales: newScales });
  };

  const addLearningOutcome = () => {
    setFormData({
      ...formData,
      learningOutcomes: [...formData.learningOutcomes, ""]
    });
  };

  const addAssessmentCriterion = () => {
    setFormData({
      ...formData,
      assessmentCriteria: [...formData.assessmentCriteria, ""]
    });
  };

  const updateLearningOutcome = (index: number, value: string) => {
    const newOutcomes = [...formData.learningOutcomes];
    newOutcomes[index] = value;
    setFormData({ ...formData, learningOutcomes: newOutcomes });
  };

  const updateAssessmentCriterion = (index: number, value: string) => {
    const newCriteria = [...formData.assessmentCriteria];
    newCriteria[index] = value;
    setFormData({ ...formData, assessmentCriteria: newCriteria });
  };

  const getCBCStrandColor = (strand: CBCStrand) => {
    const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444'];
    const index = strand.code.charCodeAt(0) % colors.length;
    return colors[index];
  };
const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getFilteredItems = (items: any[], searchFields: string[]) => {
    if (!searchQuery) return items;
    
    return items.filter(item => 
      searchFields.some(field => {
        const value = item[field];
        return value && 
          typeof value === 'string' && 
          value.toLowerCase().includes(searchQuery.toLowerCase());
      })
    );
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="text-center">
        <div className="relative">
          <div className="w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl animate-pulse"></div>
            <div className="absolute inset-2 bg-white rounded-xl flex items-center justify-center">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
          </div>
        </div>
        <p className="text-lg font-semibold text-slate-700 mt-4">Loading Academic Data...</p>
        <p className="text-sm text-slate-500">Please wait while we fetch your setup</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Academic Setup</h1>
              <p className="text-sm text-slate-600 mt-1">Configure the core structural components of your school</p>
            </div>
            
            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              
              <button 
                onClick={() => setShowModal('Bulk Grading Setup')}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 whitespace-nowrap"
              >
                <Copy size={18} /> Bulk Setup
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Mobile Tabs */}
        <div className="lg:hidden mb-6">
          <div className="flex overflow-x-auto pb-2 gap-2 -mx-2 px-2">
            {['basic', 'grading', 'cbc', 'schemes'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab 
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  {tab === 'basic' && <School size={16} />}
                  {tab === 'grading' && <BarChart size={16} />}
                  {tab === 'cbc' && <BookMarked size={16} />}
                  {tab === 'schemes' && <ClipboardCheck size={16} />}
                  <span className="capitalize">{tab}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-900 mb-4">Setup Categories</h3>
                <div className="space-y-1">
                  {['basic', 'grading', 'cbc', 'schemes'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                        activeTab === tab 
                          ? 'bg-indigo-50 text-indigo-700 font-semibold' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${activeTab === tab ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                        {tab === 'basic' && <School size={18} />}
                        {tab === 'grading' && <BarChart size={18} />}
                        {tab === 'cbc' && <BookMarked size={18} />}
                        {tab === 'schemes' && <ClipboardCheck size={18} />}
                      </div>
                      <span className="capitalize">{tab} Setup</span>
                      {tab === 'basic' && (
                        <span className="ml-auto text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                          6
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-6 bg-white rounded-2xl shadow-lg border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-900 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Classes</span>
                    <span className="font-semibold text-slate-900">{classes.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Subjects</span>
                    <span className="font-semibold text-slate-900">{subjects.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Grading Systems</span>
                    <span className="font-semibold text-slate-900">{gradingSystems.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Active Year</span>
                    <span className="font-semibold text-slate-900">
                      {academicYears.find(y => y.is_current)?.year_name || 'None'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Basic Setup Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Basic Academic Setup</h2>
                    <p className="text-sm text-slate-600">Manage core academic structures and organization</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowModal('Class')}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                      <Plus size={18} /> Add New
                    </button>
                  </div>
                </div>

                {/* Collapsible Sections */}
                <div className="space-y-4">
                  {/* Classes Section */}
                  <Card className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                    <div 
                      onClick={() => toggleSection('classes')}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <GraduationCap className="text-indigo-600" size={24} />
                        <div>
                          <h3 className="font-semibold text-slate-900">Classes</h3>
                          <p className="text-sm text-slate-500">{classes.length} classes configured</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ChevronDown className={`transition-transform ${expandedSections.classes ? 'rotate-180' : ''}`} />
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowModal('Class');
                          }}
                          className="p-2 hover:bg-indigo-50 rounded-lg"
                        >
                          <Plus size={18} className="text-indigo-600" />
                        </div>
                      </div>
                    </div>
                    
                    {expandedSections.classes && (
                      <div className="p-4 pt-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {getFilteredItems(classes, ['class_name']).map((c: Class) => (
                            <div key={c.id} className="group relative bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full ${c.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                  <div>
                                    <h4 className="font-semibold text-slate-900">{c.class_name}</h4>
                                    <p className="text-xs text-slate-500">Level {c.class_level}</p>
                                  </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => openEditModal('Class', c)}
                                    className="p-1.5 hover:bg-blue-50 rounded-lg"
                                  >
                                    <Edit3 size={16} className="text-blue-600" />
                                  </button>
                                  <button 
                                    onClick={() => handleDelete('/classes', c.id, c.class_name)}
                                    className="p-1.5 hover:bg-rose-50 rounded-lg"
                                  >
                                    <Trash2 size={16} className="text-rose-600" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>

                  {/* Streams Section */}
                  <Card className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                    <div 
                      onClick={() => toggleSection('streams')}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Layers className="text-emerald-600" size={24} />
                        <div>
                          <h3 className="font-semibold text-slate-900">Streams</h3>
                          <p className="text-sm text-slate-500">{streams.length} streams configured</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ChevronDown className={`transition-transform ${expandedSections.streams ? 'rotate-180' : ''}`} />
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowModal('Stream');
                          }}
                          className="p-2 hover:bg-emerald-50 rounded-lg"
                        >
                          <Plus size={18} className="text-emerald-600" />
                        </div>
                      </div>
                    </div>
                    
                    {expandedSections.streams && (
                      <div className="p-4 pt-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {getFilteredItems(streams, ['name']).map((s: Stream) => (
                            <div key={s.id} className="group relative bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all">
                              <div>
                                <h4 className="font-semibold text-slate-900">{s.name}</h4>
                                <p className="text-xs text-slate-500 mt-1">
                                  Class: {s.class?.class_name || 'Unassigned'}
                                </p>
                              </div>
                              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => openEditModal('Stream', s)}
                                  className="p-1.5 hover:bg-blue-50 rounded-lg"
                                >
                                  <Edit3 size={16} className="text-blue-600" />
                                </button>
                                <button 
                                  onClick={() => handleDelete('/streams', s.id, s.name)}
                                  className="p-1.5 hover:bg-rose-50 rounded-lg"
                                >
                                  <Trash2 size={16} className="text-rose-600" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>

                  {/* Subjects Section */}
                  <Card className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                    <div 
                      onClick={() => toggleSection('subjects')}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="text-amber-600" size={24} />
                        <div>
                          <h3 className="font-semibold text-slate-900">Subjects</h3>
                          <p className="text-sm text-slate-500">{subjects.length} subjects configured</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <select
                          value={selectedCurriculum}
                          onChange={(e) => setSelectedCurriculum(e.target.value)}
                          className="text-sm bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">All Curricula</option>
                          {curricula.map(cur => (
                            <option key={cur.id} value={cur.id}>{cur.name}</option>
                          ))}
                        </select>
                        <div className="flex items-center gap-2">
                          <ChevronDown className={`transition-transform ${expandedSections.subjects ? 'rotate-180' : ''}`} />
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowModal('Subject');
                            }}
                            className="p-2 hover:bg-amber-50 rounded-lg"
                          >
                            <Plus size={18} className="text-amber-600" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {expandedSections.subjects && (
                      <div className="p-4 pt-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {getFilteredItems(getCurriculumSubjects(), ['name', 'code']).map((sub: Subject) => (
                            <div key={sub.id} className="group relative bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 flex items-center justify-center bg-white rounded-lg border border-amber-200">
                                  <span className="font-bold text-amber-600">
                                    {sub.code || sub.name?.charAt(0)}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-slate-900">{sub.name}</h4>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {sub.curriculum && (
                                      <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                                        {sub.curriculum.code}
                                      </span>
                                    )}
                                    {sub.category && (
                                      <span className="text-xs text-slate-500">{sub.category}</span>
                                    )}
                                    {sub.is_compulsory && (
                                      <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                        Compulsory
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => openEditModal('Subject', sub)}
                                  className="p-1.5 hover:bg-blue-50 rounded-lg"
                                >
                                  <Edit3 size={16} className="text-blue-600" />
                                </button>
                                <button 
                                  onClick={() => handleDelete('/subjects', sub.id, sub.name)}
                                  className="p-1.5 hover:bg-rose-50 rounded-lg"
                                >
                                  <Trash2 size={16} className="text-rose-600" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>

                  {/* Academic Years Section */}
                  <Card className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                    <div 
                      onClick={() => toggleSection('years')}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <CalendarIcon className="text-violet-600" size={24} />
                        <div>
                          <h3 className="font-semibold text-slate-900">Academic Years</h3>
                          <p className="text-sm text-slate-500">{academicYears.length} years configured</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ChevronDown className={`transition-transform ${expandedSections.years ? 'rotate-180' : ''}`} />
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowModal('Academic Year');
                          }}
                          className="p-2 hover:bg-violet-50 rounded-lg"
                        >
                          <Plus size={18} className="text-violet-600" />
                        </div>
                      </div>
                    </div>
                    
                    {expandedSections.years && (
                      <div className="p-4 pt-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {getFilteredItems(academicYears, ['year_name']).map((year: AcademicYear) => (
                            <div key={year.id} className="group relative bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-violet-300 hover:shadow-md transition-all">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-slate-900">{year.year_name}</h4>
                                  {year.is_current && (
                                    <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                      Current
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                  {formatDate(year.start_date)} - {formatDate(year.end_date)}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                  {year._count?.terms || year.terms?.length || 0} terms
                                </p>
                              </div>
                              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => openEditModal('Academic Year', year)}
                                  className="p-1.5 hover:bg-blue-50 rounded-lg"
                                >
                                  <Edit3 size={16} className="text-blue-600" />
                                </button>
                                <button 
                                  onClick={() => handleDelete('/academic/years', year.id, year.year_name)}
                                  className="p-1.5 hover:bg-rose-50 rounded-lg"
                                >
                                  <Trash2 size={16} className="text-rose-600" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>

                  {/* Terms Section */}
                  <Card className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                    <div 
                      onClick={() => toggleSection('terms')}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="text-rose-600" size={24} />
                        <div>
                          <h3 className="font-semibold text-slate-900">Terms</h3>
                          <p className="text-sm text-slate-500">
                            {getSelectedYearTerms().length} terms for selected year
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <select
                          value={selectedYearForTerms}
                          onChange={(e) => setSelectedYearForTerms(e.target.value)}
                          className="text-sm bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {academicYears.map((year: AcademicYear) => (
                            <option key={year.id} value={year.id}>
                              {year.year_name} {year.is_current ? "(Current)" : ""}
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-2">
                          <ChevronDown className={`transition-transform ${expandedSections.terms ? 'rotate-180' : ''}`} />
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!selectedYearForTerms) {
                                toast.error("Please select an academic year first");
                                return;
                              }
                              setFormData({...formData, academicYearId: selectedYearForTerms});
                              setShowModal('Term');
                            }}
                            className="p-2 hover:bg-rose-50 rounded-lg"
                          >
                            <Plus size={18} className="text-rose-600" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {expandedSections.terms && (
                      <div className="p-4 pt-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {getSelectedYearTerms().map((term: Term) => (
                            <div key={term.id} className="group relative bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-rose-300 hover:shadow-md transition-all">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-slate-900">{term.term_name}</h4>
                                  {term.is_current && (
                                    <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                      Active
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                  {formatDate(term.start_date)} → {formatDate(term.end_date)}
                                </p>
                                {term.fee_deadline && (
                                  <p className="text-xs text-rose-600 mt-1">
                                    Fees due: {formatDate(term.fee_deadline)}
                                  </p>
                                )}
                              </div>
                              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => openEditModal('Term', term)}
                                  className="p-1.5 hover:bg-blue-50 rounded-lg"
                                >
                                  <Edit3 size={16} className="text-blue-600" />
                                </button>
                                <button 
                                  onClick={() => handleDelete('/academic/terms', term.id, term.term_name)}
                                  className="p-1.5 hover:bg-rose-50 rounded-lg"
                                >
                                  <Trash2 size={16} className="text-rose-600" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>

                  {/* Curricula Section */}
                  <Card className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                    <div 
                      onClick={() => toggleSection('curricula')}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Book className="text-blue-600" size={24} />
                        <div>
                          <h3 className="font-semibold text-slate-900">Curricula</h3>
                          <p className="text-sm text-slate-500">{curricula.length} curricula configured</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ChevronDown className={`transition-transform ${expandedSections.curricula ? 'rotate-180' : ''}`} />
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowModal('Curriculum');
                          }}
                          className="p-2 hover:bg-blue-50 rounded-lg"
                        >
                          <Plus size={18} className="text-blue-600" />
                        </div>
                      </div>
                    </div>
                    
                    {expandedSections.curricula && (
                      <div className="p-4 pt-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {getFilteredItems(curricula, ['name', 'code', 'description']).map((cur: Curriculum) => (
                            <div key={cur.id} className="group relative bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all">
                              <div>
                                <h4 className="font-semibold text-slate-900">{cur.name}</h4>
                                <p className="text-xs text-slate-500 mt-1">Code: {cur.code}</p>
                                <p className="text-sm text-slate-600 mt-2 line-clamp-2">{cur.description}</p>
                              </div>
                              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => openEditModal('Curriculum', cur)}
                                  className="p-1.5 hover:bg-blue-50 rounded-lg"
                                >
                                  <Edit3 size={16} className="text-blue-600" />
                                </button>
                                <button 
                                  onClick={() => handleDelete('/curricula', cur.id, cur.name)}
                                  className="p-1.5 hover:bg-rose-50 rounded-lg"
                                >
                                  <Trash2 size={16} className="text-rose-600" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            )}

            {/* Grading Setup Tab */}
            {activeTab === 'grading' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Grading Systems</h2>
                    <p className="text-sm text-slate-600">Configure and manage grading systems for different assessment types</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => setShowModal('Grading System')}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                      <Plus size={18} /> New System
                    </button>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 flex flex-wrap gap-2">
                    <select
                      value={selectedCurriculum}
                      onChange={(e) => setSelectedCurriculum(e.target.value)}
                      className="flex-1 min-w-[200px] px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">All Curricula</option>
                      {curricula.map(cur => (
                        <option key={cur.id} value={cur.id}>{cur.name}</option>
                      ))}
                    </select>
                    
                    <select
                      value={selectedGradingType}
                      onChange={(e) => setSelectedGradingType(e.target.value as any)}
                      className="flex-1 min-w-[200px] px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="subject">Subject Grading</option>
                      <option value="overall_points">Overall Points</option>
                      <option value="cbc_strand">CBC Strand</option>
                      <option value="cbc_sub_strand">CBC Sub-Strand</option>
                    </select>

                    <div className="flex bg-white rounded-xl border border-slate-200 p-1">
                      <button
                        onClick={() => setSelectedView('list')}
                        className={`p-2 rounded-lg ${selectedView === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-600'}`}
                        title="List View"
                      >
                        <List size={18} />
                      </button>
                      <button
                        onClick={() => setSelectedView('grid')}
                        className={`p-2 rounded-lg ${selectedView === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-600'}`}
                        title="Grid View"
                      >
                        <Grid3x3 size={18} />
                      </button>
                      <button
                        onClick={() => setSelectedView('table')}
                        className={`p-2 rounded-lg ${selectedView === 'table' ? 'bg-slate-100 text-slate-900' : 'text-slate-600'}`}
                        title="Table View"
                      >
                        <Table size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Total Systems</p>
                        <p className="text-2xl font-bold text-slate-900">{gradingSystems.length}</p>
                      </div>
                      <BarChart className="text-indigo-500" size={24} />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Subject Systems</p>
                        <p className="text-2xl font-bold text-slate-900">{getGradingSystemsByType('subject').length}</p>
                      </div>
                      <Book className="text-emerald-500" size={24} />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Overall Points</p>
                        <p className="text-2xl font-bold text-slate-900">{getGradingSystemsByType('overall_points').length}</p>
                      </div>
                      <TrendingUp className="text-amber-500" size={24} />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">CBC Systems</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {getGradingSystemsByType('cbc_strand').length + getGradingSystemsByType('cbc_sub_strand').length}
                        </p>
                      </div>
                      <BookMarked className="text-rose-500" size={24} />
                    </div>
                  </div>
                </div>

                {/* Empty State */}
                {!loading && getGradingSystemsByType(selectedGradingType).length === 0 && (
                  <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <BarChart className="text-slate-400" size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      {searchQuery ? 'No matching systems found' : 'No Grading Systems Found'}
                    </h3>
                    <p className="text-slate-600 max-w-md mb-6">
                      {searchQuery 
                        ? 'Try adjusting your search terms or filters.' 
                        : selectedGradingType === 'subject' 
                          ? 'No subject grading systems found for the selected curriculum.' 
                          : `No ${selectedGradingType.replace('_', ' ')} grading systems found.`}
                    </p>
                    <button 
                      onClick={() => setShowModal('Grading System')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Plus size={18} />
                      Create Grading System
                    </button>
                  </div>
                )}

                {/* Data Display - Only show if we have data */}
                {!loading && getGradingSystemsByType(selectedGradingType).length > 0 && (
                  selectedView === 'table' ? (
                    <Card className="bg-white rounded-2xl shadow-lg border border-slate-200">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700">System</th>
                              <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700">Type</th>
                              <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700">Curriculum</th>
                              <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700">Pass Mark</th>
                              <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700">Grades</th>
                              <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700">Status</th>
                              <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {getGradingSystemsByType(selectedGradingType).map((system: GradingSystem) => (
                              <tr key={system.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-4">
                                  <div>
                                    <p className="font-medium text-slate-900">{system.name}</p>
                                    <p className="text-sm text-slate-500">{system.description || 'No description'}</p>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-1 rounded-full text-xs font-medium capitalize bg-blue-100 text-blue-700">
                                    {system.type?.replace('_', ' ') || 'subject'}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="text-sm text-slate-700">
                                    {system.curriculum_id ? 
                                      curricula.find(c => c.id === system.curriculum_id)?.name || 'N/A' 
                                      : 'All Curricula'}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-slate-900">{system.min_pass_mark || 40}%</span>
                                    <span className="text-xs text-slate-500">Minimum pass</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex flex-wrap gap-1">
                                    {/* Sort grades by min_score descending for better display */}
                                    {[...(system.grades || [])]
                                      .sort((a, b) => parseFloat(b.min_score || '0') - parseFloat(a.min_score || '0'))
                                      .slice(0, 4)
                                      .map((g) => (
                                        <div 
                                          key={g.id}
                                          className="relative group"
                                          title={`${g.min_score || '0'}-${g.max_score || '0'}: ${g.grade} (${g.points || '0'} pts)`}
                                        >
                                          <span 
                                            className="text-xs font-medium px-2 py-1 rounded-full text-white shadow-sm"
                                            style={{ 
                                              backgroundColor: g.color_code || 
                                                (parseFloat(g.min_score || '0') >= 80 ? '#10B981' : // Green for A
                                                 parseFloat(g.min_score || '0') >= 60 ? '#3B82F6' : // Blue for B
                                                 parseFloat(g.min_score || '0') >= 40 ? '#F59E0B' : // Amber for C/D
                                                 '#EF4444') // Red for failing grades
                                            }}
                                          >
                                            {g.grade}
                                          </span>
                                          {/* Tooltip on hover */}
                                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                            <div className="bg-slate-900 text-white text-xs rounded-lg py-1 px-2 whitespace-nowrap">
                                              {g.min_score || '0'}-{g.max_score || '0'}% = {g.grade} ({g.points || '0'} pts)
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    {(system.grades?.length || 0) > 4 && (
                                      <div className="relative group">
                                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                                          +{(system.grades?.length || 0) - 4}
                                        </span>
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                          <div className="bg-slate-900 text-white text-xs rounded-lg py-2 px-3 max-w-xs">
                                            <div className="font-medium mb-1">All Grades:</div>
                                            <div className="grid grid-cols-3 gap-1">
                                              {system.grades?.map(g => (
                                                <div key={g.id} className="text-center">
                                                  <div className="font-semibold">{g.grade}</div>
                                                  <div className="text-slate-300 text-xs">{g.min_score || '0'}-{g.max_score || '0'}%</div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex flex-col gap-1">
                                    {system.is_default && (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                                        <CheckCircle size={10} /> Default
                                      </span>
                                    )}
                                    <span className={`text-xs px-2 py-1 rounded-full ${system.is_active !== false ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                      {system.is_active !== false ? 'Active' : 'Inactive'}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => {
                                        setSelectedGradingSystem(system.id);
                                        // Add a detail view state if needed
                                      }}
                                      className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                                      title="View Details"
                                    >
                                      <Eye size={16} className="text-slate-600" />
                                    </button>
                                    <button 
                                      onClick={() => openEditModal('Grading System', system)}
                                      className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                                      title="Edit System"
                                    >
                                      <Edit3 size={16} className="text-blue-600" />
                                    </button>
                                    {!system.is_default && (
                                      <button 
                                        onClick={() => handleDelete('/grading/systems', system.id, system.name)}
                                        className="p-1.5 hover:bg-rose-50 rounded-lg transition-colors"
                                        title="Delete System"
                                      >
                                        <Trash2 size={16} className="text-rose-600" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  ) : selectedView === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {getGradingSystemsByType(selectedGradingType).map((system: GradingSystem) => (
                        <Card key={system.id} className="bg-white rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-200 hover:border-blue-200">
                          <div className="p-5">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                    {system.type?.toUpperCase() || 'SUBJECT'}
                                  </span>
                                  {system.is_default && (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <h4 className="font-semibold text-slate-900 truncate">{system.name}</h4>
                                <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                                  {system.description || 'No description provided'}
                                </p>
                              </div>
                            </div>

                            {/* Curriculum Info */}
                            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-xs text-slate-500 mb-1">Curriculum</p>
                                  <p className="font-medium text-slate-900 text-sm">
                                    {system.curriculum_id ? 
                                      curricula.find(c => c.id === system.curriculum_id)?.name || 'N/A' 
                                      : 'All'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500 mb-1">Pass Mark</p>
                                  <p className="font-semibold text-lg text-slate-900">{system.min_pass_mark || 40}%</p>
                                </div>
                              </div>
                            </div>

                            {/* Grades Preview */}
                            <div className="mb-4">
                              <p className="text-xs text-slate-500 mb-2">
                                Grade Scale ({(system.grades?.length || 0)} grades)
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {[...(system.grades || [])]
                                  .sort((a, b) => parseFloat(b.min_score || '0') - parseFloat(a.min_score || '0'))
                                  .slice(0, 5)
                                  .map((g) => (
                                    <div key={g.id} className="relative group">
                                      <span 
                                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-white shadow-sm flex flex-col items-center justify-center min-w-[40px]"
                                        style={{ 
                                          backgroundColor: g.color_code || 
                                            (parseFloat(g.min_score || '0') >= 80 ? '#10B981' :
                                             parseFloat(g.min_score || '0') >= 60 ? '#3B82F6' :
                                             parseFloat(g.min_score || '0') >= 40 ? '#F59E0B' :
                                             '#EF4444')
                                        }}
                                      >
                                        <span className="text-sm">{g.grade}</span>
                                        <span className="text-xs opacity-90">{g.points || '0'} pts</span>
                                      </span>
                                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                        <div className="bg-slate-900 text-white text-xs rounded-lg py-1 px-2 whitespace-nowrap">
                                          {g.min_score || '0'}-{g.max_score || '0'}% = {g.grade}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                {(system.grades?.length || 0) > 5 && (
                                  <div className="relative group">
                                    <span className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center h-full">
                                      +{(system.grades?.length || 0) - 5}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Grade Distribution Visualization */}
                            <div className="mb-4">
                              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                                <span>Grade Distribution</span>
                                <span>
                                  Top: {system.grades?.[0]?.grade || 'N/A'} 
                                  ({system.grades?.[0]?.points || '0'} pts)
                                </span>
                              </div>
                              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full flex">
                                  {[...(system.grades || [])]
                                    .sort((a, b) => parseFloat(b.min_score || '0') - parseFloat(a.min_score || '0'))
                                    .slice(0, 5)
                                    .map((g, index) => {
                                      const width = 100 / Math.min((system.grades?.length || 1), 5);
                                      return (
                                        <div 
                                          key={g.id}
                                          className="h-full"
                                          style={{ 
                                            width: `${width}%`,
                                            backgroundColor: g.color_code || 
                                              (parseFloat(g.min_score || '0') >= 80 ? '#10B981' :
                                               parseFloat(g.min_score || '0') >= 60 ? '#3B82F6' :
                                               parseFloat(g.min_score || '0') >= 40 ? '#F59E0B' :
                                               '#EF4444')
                                          }}
                                          title={`${g.grade}: ${g.min_score || '0'}-${g.max_score || '0'}%`}
                                        />
                                      );
                                    })}
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-4 border-t border-slate-100">
                              <button 
                                onClick={() => {
                                  setSelectedGradingSystem(system.id);
                                  // Add a detail view state if needed
                                }}
                                className="flex-1 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                              >
                                <Eye size={14} /> Details
                              </button>
                              <button 
                                onClick={() => openEditModal('Grading System', system)}
                                className="flex-1 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                              >
                                <Edit3 size={14} /> Edit
                              </button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    /* List View */
                    <div className="space-y-4">
                      {getGradingSystemsByType(selectedGradingType).map((system: GradingSystem) => (
                        <Card key={system.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all">
                          <div className="p-4">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center flex-shrink-0">
                                  <BarChart className="text-blue-600" size={22} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <h4 className="font-semibold text-slate-900 truncate">{system.name}</h4>
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                      {system.type?.replace('_', ' ') || 'subject'}
                                    </span>
                                    {system.is_default && (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                                        <CheckCircle size={10} /> Default
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                                    {system.description || 'No description provided'}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                    <span className="flex items-center gap-1">
                                      <BookOpen size={12} />
                                      {system.curriculum_id ? 
                                        curricula.find(c => c.id === system.curriculum_id)?.name || 'N/A' 
                                        : 'All Curricula'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <BarChart3 size={12} />
                                      {(system.grades?.length || 0)} grades
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Target size={12} />
                                      Pass: {system.min_pass_mark || 40}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <div className="flex flex-wrap gap-1">
                                  {[...(system.grades || [])]
                                    .sort((a, b) => parseFloat(b.min_score || '0') - parseFloat(a.min_score || '0'))
                                    .slice(0, 4)
                                    .map((g) => (
                                      <div key={g.id} className="relative group">
                                        <span 
                                          className="text-xs font-semibold px-2 py-1 rounded-lg text-white"
                                          style={{ 
                                            backgroundColor: g.color_code || 
                                              (parseFloat(g.min_score || '0') >= 80 ? '#10B981' :
                                               parseFloat(g.min_score || '0') >= 60 ? '#3B82F6' :
                                               parseFloat(g.min_score || '0') >= 40 ? '#F59E0B' :
                                               '#EF4444')
                                          }}
                                        >
                                          {g.grade}
                                        </span>
                                      </div>
                                    ))}
                                  {(system.grades?.length || 0) > 4 && (
                                    <span className="text-xs text-slate-500">
                                      +{(system.grades?.length || 0) - 4} more
                                    </span>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <button 
                                    onClick={() => setSelectedGradingSystem(system.id)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="View Details"
                                  >
                                    <Eye size={16} className="text-slate-600" />
                                  </button>
                                  <button 
                                    onClick={() => openEditModal('Grading System', system)}
                                    className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit System"
                                  >
                                    <Edit3 size={16} className="text-blue-600" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )
                )}
                {/* Grade Scale Preview Modal */}
                {selectedGradingSystem && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">
                      <div className="p-6 border-b border-slate-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <h2 className="text-xl font-bold text-slate-900">Grade Scale Details</h2>
                            <p className="text-sm text-slate-600">Detailed view of the grading system</p>
                          </div>
                          <button 
                            onClick={() => setSelectedGradingSystem(null)} 
                            className="p-2 hover:bg-slate-100 rounded-lg"
                          >
                            <X size={20} className="text-slate-600" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                        {/* ... (keep your existing modal content) ... */}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CBC Setup Tab */}
            {activeTab === 'cbc' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">CBC Framework</h2>
                    <p className="text-sm text-slate-600">Manage Competency-Based Curriculum strands and sub-strands</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => setShowModal('CBC Strand')}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                      <Plus size={18} /> Add Strand
                    </button>
                    <button 
                      onClick={() => setShowModal('CBC Sub-Strand')}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                      <Plus size={18} /> Add Sub-Strand
                    </button>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Subjects</option>
                    {subjects.filter(s => s.curriculum_id === selectedCurriculum).map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Total Strands</p>
                        <p className="text-2xl font-bold text-slate-900">{cbcStrands.length}</p>
                      </div>
                      <Layers3 className="text-indigo-500" size={24} />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Total Sub-strands</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {cbcStrands.reduce((acc, strand) => acc + (strand.sub_strands?.length || 0), 0)}
                        </p>
                      </div>
                      <FolderTree className="text-emerald-500" size={24} />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Scheme Topics</p>
                        <p className="text-2xl font-bold text-slate-900">{schemeTopics.length}</p>
                      </div>
                      <BookMarked className="text-amber-500" size={24} />
                    </div>
                  </div>
                </div>

                {/* CBC Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Strands List */}
                  <Card className="bg-white rounded-2xl shadow-lg border border-slate-200">
                    <div className="p-4 border-b border-slate-200">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Layers className="text-indigo-600" size={20} />
                          <h3 className="font-semibold text-slate-900">CBC Strands</h3>
                          <span className="text-sm font-medium bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                            {cbcStrands.length}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                      {cbcStrands
                        .filter(strand => !selectedSubject || strand.subject_id === selectedSubject)
                        .map((strand: CBCStrand) => (
                          <div 
                            key={strand.id} 
                            className="group bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-indigo-300 transition-all"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-slate-900">{strand.name}</h4>
                                  <span className="text-xs font-medium bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                                    {strand.code}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 mb-2">{strand.description}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-500">
                                    {strand.sub_strands?.length || 0} sub-strands
                                  </span>
                                  {strand.subject && (
                                    <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                                      {strand.subject.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => openEditModal('CBC Strand', strand)}
                                  className="p-1.5 hover:bg-blue-50 rounded-lg"
                                >
                                  <Edit3 size={16} className="text-blue-600" />
                                </button>
                                <button 
                                  onClick={() => handleDelete('/cbc/strands', strand.id, strand.name)}
                                  className="p-1.5 hover:bg-rose-50 rounded-lg"
                                >
                                  <Trash2 size={16} className="text-rose-600" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Sub-strands preview */}
                            {strand.sub_strands && strand.sub_strands.length > 0 && (
                              <div className="mt-3 pl-4 border-l-2 border-slate-300">
                                {strand.sub_strands.slice(0, 2).map((sub: CBCSubStrand) => (
                                  <div key={sub.id} className="py-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-slate-700">{sub.name}</span>
                                      <span className="text-xs text-slate-500">{sub.code}</span>
                                    </div>
                                  </div>
                                ))}
                                {strand.sub_strands.length > 2 && (
                                  <div className="text-center py-2">
                                    <span className="text-xs text-slate-500">
                                      +{strand.sub_strands.length - 2} more
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </Card>

                  {/* Sub-strands Detail View */}
                  <Card className="bg-white rounded-2xl shadow-lg border border-slate-200">
                    <div className="p-4 border-b border-slate-200">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <FolderTree className="text-emerald-600" size={20} />
                          <h3 className="font-semibold text-slate-900">Sub-strand Details</h3>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                      {cbcStrands
                        .filter(strand => !selectedSubject || strand.subject_id === selectedSubject)
                        .flatMap(strand => strand.sub_strands || [])
                        .sort((a, b) => a.order - b.order)
                        .map((subStrand: CBCSubStrand) => {
                          const parentStrand = cbcStrands.find(s => s.sub_strands?.some(ss => ss.id === subStrand.id));
                          return (
                            <div key={subStrand.id} className="group bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-emerald-300 transition-all">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-slate-900">{subStrand.name}</span>
                                    <span className="text-xs font-medium bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                                      {subStrand.code}
                                    </span>
                                  </div>
                                  <p className="text-sm text-slate-600 mb-2">{subStrand.description}</p>
                                  {parentStrand && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-slate-500">Strand:</span>
                                      <span className="text-xs font-medium text-indigo-700">
                                        {parentStrand.name}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => openEditModal('CBC Sub-Strand', subStrand)}
                                    className="p-1.5 hover:bg-blue-50 rounded-lg"
                                  >
                                    <Edit3 size={16} className="text-blue-600" />
                                  </button>
                                  <button 
                                    onClick={() => handleDelete('/cbc/sub-strands', subStrand.id, subStrand.name)}
                                    className="p-1.5 hover:bg-rose-50 rounded-lg"
                                  >
                                    <Trash2 size={16} className="text-rose-600" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Schemes of Work Tab */}
            {activeTab === 'schemes' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Schemes of Work</h2>
                    <p className="text-sm text-slate-600">Manage teaching plans and scheme topics</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center gap-2">
                      <Plus size={18} /> Add Topic
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Scheme Topics */}
                  <div className="lg:col-span-2">
                    <Card className="bg-white rounded-2xl shadow-lg border border-slate-200 h-full">
                      <div className="p-4 border-b border-slate-200">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <ClipboardCheck className="text-indigo-600" size={20} />
                            <h3 className="font-semibold text-slate-900">Scheme Topics</h3>
                            <span className="text-sm font-medium bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                              {schemeTopics.length}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                        {schemeTopics.map((topic: SchemeTopic) => (
                          <div key={topic.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-indigo-300 transition-all">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-white border border-slate-300 flex items-center justify-center">
                                  <span className="font-bold text-slate-900">W{topic.week_number}</span>
                                </div>
                                <div>
                                  <h4 className="font-medium text-slate-900">{topic.topic_title}</h4>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {topic.cbc_strand && (
                                      <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                                        {topic.cbc_strand.name}
                                      </span>
                                    )}
                                    {topic.cbc_sub_strand && (
                                      <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                        {topic.cbc_sub_strand.name}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button className="p-1.5 hover:bg-blue-50 rounded-lg">
                                  <Edit3 size={16} className="text-blue-600" />
                                </button>
                                <button className="p-1.5 hover:bg-rose-50 rounded-lg">
                                  <Trash2 size={16} className="text-rose-600" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>

                  {/* Quick Stats */}
                  <div className="space-y-6">
                    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-slate-900">Scheme Overview</h4>
                          <BookMarked className="text-indigo-500" size={20} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white/80 rounded-xl p-3">
                            <p className="text-xs font-medium text-slate-600">Weeks Covered</p>
                            <p className="text-xl font-bold text-slate-900">
                              {Math.max(...schemeTopics.map(t => t.week_number), 0)}
                            </p>
                          </div>
                          <div className="bg-white/80 rounded-xl p-3">
                            <p className="text-xs font-medium text-slate-600">Topics</p>
                            <p className="text-xl font-bold text-slate-900">{schemeTopics.length}</p>
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4">
                      <h4 className="font-semibold text-slate-900 mb-4">Recent Activities</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Plus className="text-emerald-600" size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700">New strand added</p>
                            <p className="text-xs text-slate-500">5 minutes ago</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Edit3 className="text-blue-600" size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700">Grade scale updated</p>
                            <p className="text-xs text-slate-500">1 hour ago</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals - Responsive */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {editingId ? `Edit ${showModal}` : `Create New ${showModal}`}
                  </h2>
                  <p className="text-sm text-slate-600">
                    {showModal === 'Class' && 'Configure class details and settings'}
                    {showModal === 'Stream' && 'Add a stream to an existing class'}
                    {showModal === 'Subject' && 'Define subject details and curriculum alignment'}
                    {showModal === 'Academic Year' && 'Define the academic year timeline'}
                    {showModal === 'Term' && 'Define term details within the academic year'}
                    {showModal === 'Curriculum' && 'Define curriculum framework and standards'}
                    {showModal === 'Grading System' && 'Configure comprehensive grading rules and scales'}
                    {showModal === 'CBC Strand' && 'Define a main strand within the CBC framework'}
                    {showModal === 'CBC Sub-Strand' && 'Define a sub-strand within a CBC strand'}
                    {showModal === 'Bulk Grading Setup' && 'Create grading systems for multiple subjects at once'}
                  </p>
                </div>
                <button 
                  onClick={closeModal} 
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X size={20} className="text-slate-600" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
           {/* Modals - Responsive */}
{showModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {editingId ? `Edit ${showModal}` : `Create New ${showModal}`}
            </h2>
            <p className="text-sm text-slate-600">
              {showModal === 'Class' && 'Configure class details and settings'}
              {showModal === 'Stream' && 'Add a stream to an existing class'}
              {showModal === 'Subject' && 'Define subject details and curriculum alignment'}
              {showModal === 'Academic Year' && 'Define the academic year timeline'}
              {showModal === 'Term' && 'Define term details within the academic year'}
              {showModal === 'Curriculum' && 'Define curriculum framework and standards'}
              {showModal === 'Grading System' && 'Configure comprehensive grading rules and scales'}
              {showModal === 'CBC Strand' && 'Define a main strand within the CBC framework'}
              {showModal === 'CBC Sub-Strand' && 'Define a sub-strand within a CBC strand'}
              {showModal === 'Bulk Grading Setup' && 'Create grading systems for multiple subjects at once'}
            </p>
          </div>
          <button 
            onClick={closeModal} 
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <X size={20} className="text-slate-600" />
          </button>
        </div>
      </div>
      
      <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
        {/* Class Modal */}
        {showModal === 'Class' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Class Name</label>
              <input
                type="text"
                value={formData.className}
                onChange={(e) => setFormData({...formData, className: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                placeholder="e.g., Form 1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Class Level</label>
              <input
                type="number"
                value={formData.classLevel}
                onChange={(e) => setFormData({...formData, classLevel: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                placeholder="e.g., 1"
                min="1"
                max="12"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="w-5 h-5 rounded-lg border-2 border-slate-300 checked:bg-indigo-500 checked:border-indigo-500"
              />
              <label htmlFor="isActive" className="text-sm font-semibold text-slate-700">
                Active Class
              </label>
            </div>
          </div>
        )}

        {/* Stream Modal */}
        {showModal === 'Stream' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Stream Name</label>
              <input
                type="text"
                value={formData.streamName}
                onChange={(e) => setFormData({...formData, streamName: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                placeholder="e.g., North, Red, Science"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Parent Class</label>
              <select
                value={formData.classId}
                onChange={(e) => setFormData({...formData, classId: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              >
                <option value="">Select a class</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.class_name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Subject Modal */}
        {showModal === 'Subject' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Subject Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                  placeholder="e.g., Mathematics"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Subject Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                  placeholder="e.g., MAT101"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                  placeholder="e.g., Core, Elective"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Curriculum</label>
                <select
                  value={formData.curriculumId}
                  onChange={(e) => setFormData({...formData, curriculumId: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                >
                  <option value="">Select Curriculum</option>
                  {curricula.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Maximum Score</label>
                <input
                  type="number"
                  value={formData.maxScore}
                  onChange={(e) => setFormData({...formData, maxScore: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                  placeholder="e.g., 100"
                  min="0"
                  max="1000"
                />
              </div>
              
              <div className="flex items-center gap-3 pt-8">
                <input
                  type="checkbox"
                  id="isCompulsory"
                  checked={formData.isCompulsory}
                  onChange={(e) => setFormData({...formData, isCompulsory: e.target.checked})}
                  className="w-5 h-5 rounded-lg border-2 border-slate-300 checked:bg-amber-500 checked:border-amber-500"
                />
                <label htmlFor="isCompulsory" className="text-sm font-semibold text-slate-700">
                  Compulsory Subject
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Academic Year Modal */}
        {showModal === 'Academic Year' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Year Name</label>
              <input
                type="text"
                value={formData.yearName}
                onChange={(e) => setFormData({...formData, yearName: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all"
                placeholder="e.g., 2024/2025"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.yearStart}
                  onChange={(e) => setFormData({...formData, yearStart: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.yearEnd}
                  onChange={(e) => setFormData({...formData, yearEnd: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isCurrentYear"
                checked={formData.isCurrentYear}
                onChange={(e) => setFormData({...formData, isCurrentYear: e.target.checked})}
                className="w-5 h-5 rounded-lg border-2 border-slate-300 checked:bg-violet-500 checked:border-violet-500"
              />
              <label htmlFor="isCurrentYear" className="text-sm font-semibold text-slate-700">
                Set as current academic year
              </label>
              {formData.isCurrentYear && (
                <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                  Active
                </span>
              )}
            </div>
          </div>
        )}

        {/* Term Modal */}
        {showModal === 'Term' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Term Name</label>
              <input
                type="text"
                value={formData.termName}
                onChange={(e) => setFormData({...formData, termName: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all"
                placeholder="e.g., Term 1, First Term"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.termStart}
                  onChange={(e) => setFormData({...formData, termStart: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.termEnd}
                  onChange={(e) => setFormData({...formData, termEnd: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Fee Deadline (Optional)</label>
              <input
                type="date"
                value={formData.feeDeadline}
                onChange={(e) => setFormData({...formData, feeDeadline: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isCurrentTerm"
                checked={formData.isCurrentTerm}
                onChange={(e) => setFormData({...formData, isCurrentTerm: e.target.checked})}
                className="w-5 h-5 rounded-lg border-2 border-slate-300 checked:bg-rose-500 checked:border-rose-500"
              />
              <label htmlFor="isCurrentTerm" className="text-sm font-semibold text-slate-700">
                Set as current term
              </label>
              {formData.isCurrentTerm && (
                <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                  Active
                </span>
              )}
            </div>
          </div>
        )}

        {/* Curriculum Modal */}
        {showModal === 'Curriculum' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Curriculum Name</label>
                <input
                  type="text"
                  value={formData.curriculumName}
                  onChange={(e) => setFormData({...formData, curriculumName: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  placeholder="e.g., CBC, 8-4-4, IGCSE"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Curriculum Code</label>
                <input
                  type="text"
                  value={formData.curriculumCode}
                  onChange={(e) => setFormData({...formData, curriculumCode: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  placeholder="e.g., CBC, KCSE, IG"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
              <textarea
                value={formData.curriculumDescription}
                onChange={(e) => setFormData({...formData, curriculumDescription: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all min-h-[120px]"
                placeholder="Describe the curriculum framework..."
              />
            </div>
          </div>
        )}

        {/* Grading System Modal */}
        {showModal === 'Grading System' && (
          <div className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-700">Basic Information</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">System Name</label>
                  <input
                    type="text"
                    value={formData.gradingSystemName}
                    onChange={(e) => setFormData({...formData, gradingSystemName: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    placeholder="e.g., KCSE Grading, CBC Assessment"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Minimum Pass Mark (%)</label>
                  <input
                    type="number"
                    value={formData.minPassMark}
                    onChange={(e) => setFormData({...formData, minPassMark: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    placeholder="e.g., 40"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <textarea
                  value={formData.gradingSystemDescription}
                  onChange={(e) => setFormData({...formData, gradingSystemDescription: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all min-h-[80px]"
                  placeholder="Describe the purpose and scope of this grading system..."
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Grading Type</label>
                  <select
                    value={formData.gradingSystemType}
                    onChange={(e) => setFormData({...formData, gradingSystemType: e.target.value as any})}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  >
                    <option value="subject">Subject Grading</option>
                    <option value="overall_points">Overall Points</option>
                    <option value="cbc_strand">CBC Strand</option>
                    <option value="cbc_sub_strand">CBC Sub-Strand</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-3 pt-8">
                  <input
                    type="checkbox"
                    id="setIsDefault"
                    checked={formData.setIsDefault}
                    onChange={(e) => setFormData({...formData, setIsDefault: e.target.checked})}
                    className="w-5 h-5 rounded-lg border-2 border-slate-300 checked:bg-indigo-500 checked:border-indigo-500"
                  />
                  <label htmlFor="setIsDefault" className="text-sm font-semibold text-slate-700">
                    Set as default system
                  </label>
                </div>
              </div>
            </div>
            
            {/* Scope Configuration */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-700">Scope Configuration</h3>
                <button
                  type="button"
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
                  <ChevronDown size={16} className={showAdvancedOptions ? 'transform rotate-180' : ''} />
                </button>
              </div>
              
              {showAdvancedOptions && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Curriculum</label>
                    <select
                      value={formData.curriculumIdForGrading}
                      onChange={(e) => setFormData({...formData, curriculumIdForGrading: e.target.value})}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    >
                      <option value="">All Curricula</option>
                      {curricula.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
                    <select
                      value={formData.subjectIdForGrading}
                      onChange={(e) => setFormData({...formData, subjectIdForGrading: e.target.value})}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    >
                      <option value="">All Subjects</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
            
            {/* Grade Scales */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-700">Grade Scales</h3>
                <button
                  type="button"
                  onClick={addGradeScaleRow}
                  className="text-sm font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                >
                  <Plus size={16} /> Add Grade
                </button>
              </div>
              
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {formData.gradeScales.map((scale, index) => (
                  <div key={index} className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-slate-700">Grade #{index + 1}</h4>
                      {formData.gradeScales.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeGradeScaleRow(index)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Grade</label>
                        <input
                          type="text"
                          value={scale.grade}
                          onChange={(e) => updateGradeScale(index, 'grade', e.target.value)}
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all"
                          placeholder="A"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Min Score</label>
                        <input
                          type="number"
                          value={scale.minScore}
                          onChange={(e) => updateGradeScale(index, 'minScore', e.target.value)}
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all"
                          placeholder="0"
                          min="0"
                          max="100"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Max Score</label>
                        <input
                          type="number"
                          value={scale.maxScore}
                          onChange={(e) => updateGradeScale(index, 'maxScore', e.target.value)}
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all"
                          placeholder="100"
                          min="0"
                          max="100"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Points</label>
                        <input
                          type="number"
                          value={scale.points}
                          onChange={(e) => updateGradeScale(index, 'points', e.target.value)}
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all"
                          placeholder="12"
                          step="0.1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CBC Strand Modal */}
        {showModal === 'CBC Strand' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Strand Name</label>
                <input
                  type="text"
                  value={formData.strandName}
                  onChange={(e) => setFormData({...formData, strandName: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  placeholder="e.g., Numbers, Measurement"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Strand Code</label>
                <input
                  type="text"
                  value={formData.strandCode}
                  onChange={(e) => setFormData({...formData, strandCode: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  placeholder="e.g., NUM, MEA"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
              <select
                value={formData.subjectIdForStrand}
                onChange={(e) => setFormData({...formData, subjectIdForStrand: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              >
                <option value="">Select Subject</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
              <textarea
                value={formData.strandDescription}
                onChange={(e) => setFormData({...formData, strandDescription: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all min-h-[100px]"
                placeholder="Describe the strand and its objectives..."
              />
            </div>
          </div>
        )}

        {/* CBC Sub-Strand Modal */}
        {showModal === 'CBC Sub-Strand' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Sub-Strand Name</label>
                <input
                  type="text"
                  value={formData.subStrandName}
                  onChange={(e) => setFormData({...formData, subStrandName: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                  placeholder="e.g., Place Value, Fractions"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Sub-Strand Code</label>
                <input
                  type="text"
                  value={formData.subStrandCode}
                  onChange={(e) => setFormData({...formData, subStrandCode: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                  placeholder="e.g., PV, FRAC"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <div>
  <label className="block text-sm font-semibold text-slate-700 mb-2">Parent Strand</label>
  <select
    value={formData.strandIdForSubStrand || formData.subjectIdForStrand}
    onChange={(e) => setFormData({
      ...formData, 
      strandIdForSubStrand: e.target.value,
      subjectIdForStrand: e.target.value  // Keep for backward compatibility
    })}
    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
  >
    <option value="">Select Strand</option>
    {cbcStrands.map(strand => (
      <option key={strand.id} value={strand.id}>
        {strand.name} ({strand.code})
      </option>
    ))}
  </select>
</div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Order</label>
                <input
                  type="number"
                  value={formData.subStrandOrder}
                  onChange={(e) => setFormData({...formData, subStrandOrder: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                  placeholder="1"
                  min="1"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
              <textarea
                value={formData.subStrandDescription}
                onChange={(e) => setFormData({...formData, subStrandDescription: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all min-h-[100px]"
                placeholder="Describe the sub-strand and its learning objectives..."
              />
            </div>
          </div>
        )}

        {/* Bulk Grading Setup Modal */}
        {showModal === 'Bulk Grading Setup' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Curriculum</label>
                <select
                  value={selectedCurriculum}
                  onChange={(e) => {
                    setSelectedCurriculum(e.target.value);
                    setFormData({...formData, selectedSubjects: []});
                  }}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                >
                  <option value="">Select Curriculum</option>
                  {curricula.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Minimum Pass Mark (%)</label>
                <input
                  type="number"
                  value={formData.bulkMinPassMark}
                  onChange={(e) => setFormData({...formData, bulkMinPassMark: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  placeholder="40"
                  min="0"
                  max="100"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Select Subjects</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto p-3 bg-slate-50 rounded-2xl">
                {subjects
                  .filter(s => !selectedCurriculum || s.curriculum_id === selectedCurriculum)
                  .map(subject => (
                    <div key={subject.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
                      <input
                        type="checkbox"
                        id={`subject-${subject.id}`}
                        checked={formData.selectedSubjects.includes(subject.id)}
                        onChange={(e) => {
                          const newSelected = e.target.checked
                            ? [...formData.selectedSubjects, subject.id]
                            : formData.selectedSubjects.filter(id => id !== subject.id);
                          setFormData({...formData, selectedSubjects: newSelected});
                        }}
                        className="w-5 h-5 rounded-lg border-2 border-slate-300 checked:bg-indigo-500 checked:border-indigo-500"
                      />
                      <label htmlFor={`subject-${subject.id}`} className="flex-1">
                        <span className="font-medium text-slate-700">{subject.name}</span>
                        <span className="text-xs text-slate-400 ml-2">{subject.code || subject.subject_code}</span>
                      </label>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-6 border-t border-slate-200">
        <div className="flex justify-end gap-3">
          <button
            onClick={closeModal}
            className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors"
            disabled={syncing}
          >
            Cancel
          </button>
          <button
            onClick={handleAction}
            disabled={syncing}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
          >
            {syncing ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                {editingId ? 'Updating...' : 'Creating...'}
              </>
            ) : editingId ? (
              'Update'
            ) : showModal === 'Bulk Grading Setup' ? (
              'Create Systems'
            ) : (
              'Create'
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
)}
            </div>
            
            <div className="p-6 border-t border-slate-200">
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                  disabled={syncing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={syncing}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                >
                  {syncing ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      {editingId ? 'Updating...' : 'Creating...'}
                    </>
                  ) : editingId ? (
                    'Update'
                  ) : showModal === 'Bulk Grading Setup' ? (
                    'Create Systems'
                  ) : (
                    'Create'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync Status */}
      {syncing && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <Loader2 className="animate-spin" size={18} />
          <span className="font-medium">Syncing data...</span>
        </div>
      )}
    </div>
  );
};

export default AcademicSetup;
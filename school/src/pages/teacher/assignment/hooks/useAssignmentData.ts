import { useCallback,useState } from "react";
import toast from "react-hot-toast";
import { assignmentAPI, teacherAPI, academicAPI } from "../../../../services/api";
import { useCache } from "./useCache";
import {
type  ClassOption,
  type StreamOption,
  type SubjectOption,
 type  TermOption,
type AcademicYear,
type  Student,
 type StudentAssignment,
 type AssignmentType
} from "../types/assignment.types";

interface UseAssignmentDataProps {
  selectedClass: string;
  selectedStream: string;
  setClasses: (classes: ClassOption[]) => void;
  setStreams: (streams: StreamOption[]) => void;
  setSubjects: (subjects: SubjectOption[]) => void;
  setStudents: (students: StudentAssignment[]) => void;
  setTerms: (terms: TermOption[]) => void;
  setAcademicYears: (years: AcademicYear[]) => void;
  setInitError: (error: string | null) => void;
  setSelectedAcademicYear: (year: string) => void;
  setSelectedTerm: (term: string) => void;
}

export const useAssignmentData = (props: UseAssignmentDataProps) => {
  const {
    selectedClass,
    selectedStream,
    setClasses,
    setStreams,
    setSubjects,
    setStudents,
    setTerms,
    setAcademicYears,
    setInitError,
    setSelectedAcademicYear,
    setSelectedTerm
  } = props;

  const { getCachedData, setCache, setRefreshing } = useCache();
  const [loading, setLoading] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingTerms, setLoadingTerms] = useState(false);

  const extractApiData = useCallback((response: any): any => {
    try {
      if (!response) return null;
      
      if (response.data) {
        if (response.data.success !== undefined) {
          return response.data.data || response.data;
        }
        return response.data;
      }
      
      return response;
    } catch (error) {
      console.error("Error extracting API data:", error);
      return null;
    }
  }, []);

  const extractArrayData = useCallback((response: any): any[] => {
    const data = extractApiData(response);
    
    if (Array.isArray(data)) {
      return data;
    } else if (data && typeof data === 'object') {
      const arrayKeys = Object.keys(data).filter(key => Array.isArray(data[key]));
      if (arrayKeys.length > 0) {
        return data[arrayKeys[0]];
      }
    }
    
    return [];
  }, [extractApiData]);

  const fetchAcademicYears = useCallback(async () => {
    try {
      setLoadingYears(true);
      
      const response = await academicAPI.getYears();
      let yearsData: AcademicYear[] = [];
      
      if (response.data) {
        if (response.data.success && response.data.data) {
          if (Array.isArray(response.data.data)) {
            yearsData = response.data.data;
          } else if (response.data.data.years && Array.isArray(response.data.data.years)) {
            yearsData = response.data.data.years;
          }
        } else if (Array.isArray(response.data)) {
          yearsData = response.data;
        } else if (response.data.years && Array.isArray(response.data.years)) {
          yearsData = response.data.years;
        }
      }
      
      setAcademicYears(yearsData);
      
      if (yearsData.length > 0) {
        const currentYear = yearsData.find(year => year.is_current) || yearsData[0];
        setSelectedAcademicYear(currentYear.id);
        await fetchTermsForYear(currentYear.id);
      } else {
        const currentYear = new Date().getFullYear();
        const defaultYear: AcademicYear = {
          id: 'current',
          year_name: `${currentYear}`,
          start_date: `${currentYear}-01-01`,
          end_date: `${currentYear}-12-31`,
          is_current: true
        };
        setAcademicYears([defaultYear]);
        setSelectedAcademicYear('current');
      }
      
    } catch (error: any) {
      console.error("Error fetching academic years:", error);
      const currentYear = new Date().getFullYear();
      const defaultYear: AcademicYear = {
        id: 'current',
        year_name: `${currentYear}`,
        start_date: `${currentYear}-01-01`,
        end_date: `${currentYear}-12-31`,
        is_current: true
      };
      setAcademicYears([defaultYear]);
      setSelectedAcademicYear('current');
      toast.error("Using current year as default");
    } finally {
      setLoadingYears(false);
    }
  }, [setAcademicYears, setSelectedAcademicYear]);

  const fetchTermsForYear = useCallback(async (yearId: string) => {
    try {
      setLoadingTerms(true);
      
      let termsData: TermOption[] = [];
      
      if (yearId === 'current') {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        let termName = '';
        
        if (currentMonth >= 0 && currentMonth <= 3) termName = 'Term 1';
        else if (currentMonth >= 4 && currentMonth <= 7) termName = 'Term 2';
        else termName = 'Term 3';
        
        termsData = [{
          id: 'current-term',
          term_name: termName,
          is_current: true,
          academic_year_id: yearId
        }];
      } else {
        try {
          const response = await academicAPI.getTerms(yearId);
          
          if (response.data) {
            if (response.data.success && response.data.data) {
              if (Array.isArray(response.data.data)) {
                termsData = response.data.data;
              } else if (response.data.data.terms && Array.isArray(response.data.data.terms)) {
                termsData = response.data.data.terms;
              }
            } else if (Array.isArray(response.data)) {
              termsData = response.data;
            } else if (response.data.terms && Array.isArray(response.data.terms)) {
              termsData = response.data.terms;
            }
          }
          
          if (termsData.length === 0) {
            termsData = [
              { id: 'term1', term_name: 'Term 1', is_current: true, academic_year_id: yearId },
              { id: 'term2', term_name: 'Term 2', is_current: false, academic_year_id: yearId },
              { id: 'term3', term_name: 'Term 3', is_current: false, academic_year_id: yearId }
            ];
          }
        } catch (apiError) {
          console.error("API error fetching terms:", apiError);
          termsData = [
            { id: 'term1', term_name: 'Term 1', is_current: true, academic_year_id: yearId },
            { id: 'term2', term_name: 'Term 2', is_current: false, academic_year_id: yearId },
            { id: 'term3', term_name: 'Term 3', is_current: false, academic_year_id: yearId }
          ];
        }
      }
      
      setTerms(termsData);
      
      if (termsData.length > 0) {
        const currentTerm = termsData.find(term => term.is_current);
        if (currentTerm) {
          setSelectedTerm(currentTerm.id);
        } else {
          setSelectedTerm(termsData[0].id);
        }
      } else {
        setSelectedTerm("");
      }
      
    } catch (error: any) {
      console.error("Error fetching terms:", error);
      toast.error("Failed to load terms");
      setTerms([]);
      setSelectedTerm("");
    } finally {
      setLoadingTerms(false);
    }
  }, [setTerms, setSelectedTerm]);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setInitError(null);
      
      await fetchAcademicYears();
      
      const assignmentsResponse = await teacherAPI.getMyAssignments({
        status: 'active',
        include_subjects: 'true'
      });
      
      let classesData: ClassOption[] = [];
      
      if (assignmentsResponse.data?.success) {
        const assignments = assignmentsResponse.data.data?.assignments || assignmentsResponse.data.data || [];
        const classSet = new Map<string, ClassOption>();
        
        const processAssignments = (assignmentsArray: any[]) => {
          assignmentsArray.forEach((yearData: any) => {
            if (yearData.terms && Array.isArray(yearData.terms)) {
              yearData.terms.forEach((termData: any) => {
                if (termData.assignments && Array.isArray(termData.assignments)) {
                  termData.assignments.forEach((assignment: any) => {
                    if (assignment.stream?.class && !classSet.has(assignment.stream.class.id)) {
                      classSet.set(assignment.stream.class.id, {
                        id: assignment.stream.class.id,
                        class_name: assignment.stream.class.class_name || assignment.stream.class.name,
                        name: assignment.stream.class.class_name || assignment.stream.class.name,
                        level: assignment.stream.class.class_level || assignment.stream.class.level || 0
                      });
                    }
                  });
                }
              });
            }
          });
        };
        
        if (Array.isArray(assignments)) {
          processAssignments(assignments);
        } else if (assignments && typeof assignments === 'object') {
          Object.values(assignments).forEach((yearData: any) => {
            if (yearData && yearData.terms && Array.isArray(yearData.terms)) {
              processAssignments([yearData]);
            }
          });
        }
        
        classesData = Array.from(classSet.values());
      }
      
      if (classesData.length === 0) {
        try {
          const fallbackResponse = await teacherAPI.getCbcClasses();
          
          if (fallbackResponse.data?.data && Array.isArray(fallbackResponse.data.data)) {
            classesData = fallbackResponse.data.data.map((cls: any) => ({
              id: cls.id,
              class_name: cls.name || cls.class_name,
              name: cls.name || cls.class_name,
              level: cls.level || 0
            }));
          }
        } catch (fallbackError) {
          console.error("Fallback also failed:", fallbackError);
        }
      }
      
      setClasses(classesData);
      setCache('classes', null, classesData);
      
      if (classesData.length === 0) {
        setInitError("No classes found. Please check your teaching assignments.");
      }
      
    } catch (error: any) {
      console.error("Error fetching initial data:", error);
      setInitError("Failed to load initial data. Please try refreshing.");
      toast.error("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  }, [fetchAcademicYears, setClasses, setInitError, setCache]);

  const fetchStreams = useCallback(async (classId: string, forceRefresh: boolean = false) => {
    try {
      const cacheKey = classId;
      
      if (!forceRefresh) {
        const cachedStreams = getCachedData<StreamOption[]>('streams', cacheKey);
        if (cachedStreams) {
          setStreams(cachedStreams);
          return;
        }
      }

      const response = await teacherAPI.getClassStreams(classId);
      
      let streamsData: StreamOption[] = [];
      
      const extractedData = extractApiData(response);
      if (extractedData?.streams && Array.isArray(extractedData.streams)) {
        streamsData = extractedData.streams.map((stream: any) => ({
          id: stream.id,
          name: stream.name,
          class_id: stream.class_id
        }));
      } else if (Array.isArray(extractedData)) {
        streamsData = extractedData.map((stream: any) => ({
          id: stream.id,
          name: stream.name,
          class_id: stream.class_id
        }));
      }
      
      setStreams(streamsData);
      setCache('streams', cacheKey, streamsData);
      
    } catch (error) {
      console.error("Error fetching streams:", error);
      toast.error("Failed to load streams");
      setStreams([]);
    }
  }, [extractApiData, getCachedData, setCache, setStreams]);

  const fetchSubjects = useCallback(async (classId: string, streamId: string, forceRefresh: boolean = false) => {
    try {
      const cacheKey = `${classId}_${streamId}`;
      
      if (!forceRefresh) {
        const cachedSubjects = getCachedData<SubjectOption[]>('subjects', cacheKey);
        if (cachedSubjects) {
          setSubjects(cachedSubjects);
          return;
        }
      }

      const response = await teacherAPI.getTeacherSubjects(streamId);
      const subjectsArray = extractArrayData(response);
      
      const subjectsData = subjectsArray.map((subject: any) => ({
        id: subject.id,
        name: subject.name,
        subject_code: subject.subject_code || subject.code || subject.name.substring(0, 3).toUpperCase(),
        code: subject.subject_code || subject.code || subject.name.substring(0, 3).toUpperCase(),
        category: subject.category || "General"
      }));
      
      setSubjects(subjectsData);
      setCache('subjects', cacheKey, subjectsData);
      
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast.error("Failed to load subjects");
      setSubjects([]);
    }
  }, [extractArrayData, getCachedData, setCache, setSubjects]);

  const fetchStudents = useCallback(async (classId: string, streamId: string, forceRefresh: boolean = false) => {
    try {
      const cacheKey = `${classId}_${streamId}`;
      
      if (!forceRefresh) {
        const cachedStudents = getCachedData<Student[]>('students', cacheKey);
        if (cachedStudents) {
          const studentAssignments = cachedStudents.map((student: Student) => ({
            student,
            assignment: "",
            dueDate: "",
            subjectId: "",
            assignmentType: "homework" as AssignmentType,
            maxScore: 100,
            weight: 10,
            files: []
          }));
          setStudents(studentAssignments);
          return;
        }
      }

      const response = await teacherAPI.getClassStudents(classId, streamId);
      
      let studentsData: Student[] = [];
      
      const extractedData = extractApiData(response);
      if (extractedData?.students && Array.isArray(extractedData.students)) {
        studentsData = extractedData.students;
      } else if (Array.isArray(extractedData)) {
        studentsData = extractedData;
      }
      
      const studentAssignments = studentsData.map((student: Student) => ({
        student,
        assignment: "",
        dueDate: "",
        subjectId: "",
        assignmentType: "homework" as AssignmentType,
        maxScore: 100,
        weight: 10,
        files: []
      }));
      
      setStudents(studentAssignments);
      setCache('students', cacheKey, studentsData);
      
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
      setStudents([]);
    }
  }, [extractApiData, getCachedData, setCache, setStudents]);

  const refreshData = useCallback(async (selectedClass: string, selectedStream: string) => {
    setRefreshing(true);
    
    try {
      await fetchInitialData();
      
      if (selectedClass) {
        await fetchStreams(selectedClass, true);
      }
      
      if (selectedClass && selectedStream) {
        await fetchSubjects(selectedClass, selectedStream, true);
        await fetchStudents(selectedClass, selectedStream, true);
      }
      
      toast.success("Data refreshed from server");
    } catch (error) {
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  }, [fetchInitialData, fetchStreams, fetchSubjects, fetchStudents, setRefreshing]);

  return {
    loading,
    loadingYears,
    loadingTerms,
    fetchInitialData,
    fetchStreams,
    fetchSubjects,
    fetchStudents,
    fetchAcademicYears,
    fetchTermsForYear,
    refreshData
  };
};
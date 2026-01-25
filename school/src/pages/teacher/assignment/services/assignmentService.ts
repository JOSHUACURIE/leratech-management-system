import axios from 'axios';
import { type  ApiResponse, type  AssignmentDetail, type AssignmentSubmission } from "../types/assignment.types"

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export const assignmentService = {
  // Get all assignments for teacher
  getTeacherAssignments: async (): Promise<ApiResponse<AssignmentDetail[]>> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/assignments/teacher`);
      return response.data;
    } catch (error) {
      console.error('Error fetching assignments:', error);
      throw error;
    }
  },

  // Get submissions for an assignment
  getAssignmentSubmissions: async (assignmentId: string): Promise<ApiResponse<AssignmentSubmission[]>> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/assignments/${assignmentId}/submissions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching submissions:', error);
      throw error;
    }
  },

  // Grade a submission
  gradeSubmission: async (submissionId: string, data: { grade: number; feedback: string; graded_at: string }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/submissions/${submissionId}/grade`, data);
      return response.data;
    } catch (error) {
      console.error('Error grading submission:', error);
      throw error;
    }
  },

  // Download all submissions for an assignment
  downloadSubmissions: async (assignmentId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/assignments/${assignmentId}/download`, {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      console.error('Error downloading submissions:', error);
      throw error;
    }
  },

  // Send reminders for missing submissions
  sendReminders: async (assignmentId: string, data: { student_ids: string[]; message: string }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/assignments/${assignmentId}/reminders`, data);
      return response.data;
    } catch (error) {
      console.error('Error sending reminders:', error);
      throw error;
    }
  },

  // Create new assignment
  createAssignment: async (data: any) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/assignments`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
  }
};


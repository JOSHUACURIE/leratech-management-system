import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import AuthEntry from "./pages/auth/AuthEntry";
import CreateUserForm from "./pages/admin/createUser";
// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import Users from "./pages/admin/Users";
import AcademicSetup from "./pages/admin/AcademicSetup";
import FeeManagement from "./pages/admin/FeeManagement";
import ResultsPerformance from "./pages/admin/ResultsPerformance";
import ReportsAnalytics from "./pages/admin/ReportsAnalytics";
import StudentManagement from "./pages/admin/StudentManagement";
import SchoolSettings from "./pages/admin/SchoolSettings";
import AuditLogs from "./pages/admin/AuditLogs";
import ToolsUtilities from "./pages/admin/ToolsUtilities";
import Teachers from "./pages/admin/Teacher";

// Teacher Pages
import TeacherDashboard from "./pages/teacher/Dashboard";
import SubjectsAssigned from "./pages/teacher/SubjectsAssigned";
import MyClasses from "./pages/teacher/MyClasses";
import ScoreSubmission from "./pages/teacher/ScoreSubmission";
import CBCAssessment from "./pages/teacher/CBCSubmission";
import Attendance from "./pages/teacher/Attendance";
import PerformanceAnalysis from "./pages/teacher/ClassPerformance";
import Assignments from "./pages/teacher/Assignment";
import Notices from "./pages/teacher/Notices";
import LessonPlan from "./pages/teacher/LessonPlan";

// Parent Pages
import ParentDashboard from "./pages/parent/Dashboard";
import Results from "./pages/parent/Results";
import StudentAttendance from "./pages/parent/Attendance";
import FeeBalance from "./pages/parent/FeeBalance";
import Settings from "./pages/parent/Settings";
import SchoolCalendar from "./pages/parent/SchoolCalendar";
import Notifications from "./pages/parent/Notifications";
import PaymentsHistory from "./pages/parent/PaymentHistory";
import Homework from "./pages/parent/HomeWork";
import TeacherCommunication from "./pages/parent/TeacherCommunication";

// Bursar Pages
import BursarDashboard from "./pages/bursar/Dashboard";

// Protected Route
import ProtectedRoute from "./components/common/ProtectedRoute";
import SchoolLayout from "./components/layout/SchoolLayout";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<AuthEntry />} />
      <Route path="/:schoolSlug/login" element={<AuthEntry />} />
      
      {/* School-specific routes - All protected routes are nested under school slug */}
      <Route path="/:schoolSlug" element={<SchoolLayout />}>
        {/* Redirect root to dashboard based on role */}
        <Route index element={
          <ProtectedRoute>
            <Navigate to="dashboard" replace />
          </ProtectedRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="admin">
          <Route path="dashboard" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DashboardLayout role="admin">
                <AdminDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="users" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DashboardLayout role="admin">
                <Users />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="users/teachers" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DashboardLayout role="admin">
                <Teachers />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="academic-setup" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DashboardLayout role="admin">
                <AcademicSetup />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="fees" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DashboardLayout role="admin">
                <FeeManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="results" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DashboardLayout role="admin">
                <ResultsPerformance />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="reports" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DashboardLayout role="admin">
                <ReportsAnalytics />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="students" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DashboardLayout role="admin">
                <StudentManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="settings" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DashboardLayout role="admin">
                <SchoolSettings />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="logs" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DashboardLayout role="admin">
                <AuditLogs />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="tools" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DashboardLayout role="admin">
                <ToolsUtilities />
              </DashboardLayout>
            </ProtectedRoute>
          } />
        </Route>

        {/* Teacher Routes */}
        <Route path="teacher">
          <Route path="dashboard" element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <DashboardLayout role="teacher">
                <TeacherDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="lesson-plans" element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <DashboardLayout role="teacher">
                <LessonPlan />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="scores" element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <DashboardLayout role="teacher">
                <ScoreSubmission />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="notices" element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <DashboardLayout role="teacher">
                <Notices />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="assignments" element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <DashboardLayout role="teacher">
                <Assignments />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="performance" element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <DashboardLayout role="teacher">
                <PerformanceAnalysis />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="attendance" element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <DashboardLayout role="teacher">
                <Attendance />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="cbc" element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <DashboardLayout role="teacher">
                <CBCAssessment />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="classes" element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <DashboardLayout role="teacher">
                <MyClasses />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="subjects" element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <DashboardLayout role="teacher">
                <SubjectsAssigned />
              </DashboardLayout>
            </ProtectedRoute>
          } />
        </Route>

        {/* Parent Routes */}
        <Route path="parent">
          <Route path="dashboard" element={
            <ProtectedRoute allowedRoles={["parent"]}>
              <DashboardLayout role="parent">
                <ParentDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="payments" element={
            <ProtectedRoute allowedRoles={["parent"]}>
              <DashboardLayout role="parent">
                <PaymentsHistory />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="performance" element={
            <ProtectedRoute allowedRoles={["parent"]}>
              <DashboardLayout role="parent">
                <PerformanceAnalysis />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="messages" element={
            <ProtectedRoute allowedRoles={["parent"]}>
              <DashboardLayout role="parent">
                <TeacherCommunication />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="attendance" element={
            <ProtectedRoute allowedRoles={["parent"]}>
              <DashboardLayout role="parent">
                <StudentAttendance />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="homework" element={
            <ProtectedRoute allowedRoles={["parent"]}>
              <DashboardLayout role="parent">
                <Homework />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="fees" element={
            <ProtectedRoute allowedRoles={["parent"]}>
              <DashboardLayout role="parent">
                <FeeBalance />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="results" element={
            <ProtectedRoute allowedRoles={["parent"]}>
              <DashboardLayout role="parent">
                <Results />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="calendar" element={
            <ProtectedRoute allowedRoles={["parent"]}>
              <DashboardLayout role="parent">
                <SchoolCalendar />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="notifications" element={
            <ProtectedRoute allowedRoles={["parent"]}>
              <DashboardLayout role="parent">
                <Notifications />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="profile" element={
            <ProtectedRoute allowedRoles={["parent"]}>
              <DashboardLayout role="parent">
                <Settings />
              </DashboardLayout>
            </ProtectedRoute>
          } />
        </Route>

        {/* Bursar Routes */}
        <Route path="bursar">
          <Route path="dashboard" element={
            <ProtectedRoute allowedRoles={["bursar"]}>
              <DashboardLayout role="bursar">
                <BursarDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="setup" element={
            <ProtectedRoute allowedRoles={["bursar"]}>
              <DashboardLayout role="bursar">
                <div className="p-6">Fee Setup</div>
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="payments" element={
            <ProtectedRoute allowedRoles={["bursar"]}>
              <DashboardLayout role="bursar">
                <div className="p-6">Record Payments</div>
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="reports" element={
            <ProtectedRoute allowedRoles={["bursar"]}>
              <DashboardLayout role="bursar">
                <div className="p-6">Fee Reports</div>
              </DashboardLayout>
            </ProtectedRoute>
          } />
        </Route>

        {/* Dashboard (dynamic based on role) */}
        <Route path="dashboard" element={
          <ProtectedRoute>
            <DashboardLayout>
              {/* This will render based on user role */}
              <AdminDashboard /> {/* Will be replaced based on actual role */}
            </DashboardLayout>
          </ProtectedRoute>
        } />
      </Route>

      {/* Legacy routes without school slug - redirect to appropriate school */}
      <Route path="/:schoolSlug/admin/dashboard" element={<Navigate to="/:schoolSlug/admin/dashboard" replace />} />
      <Route path="/teacher/dashboard" element={<Navigate to="/:schoolSlug/teacher/dashboard" replace />} />
      <Route path="/parent/dashboard" element={<Navigate to="/:schoolSlug/parent/dashboard" replace />} />
      <Route path="/bursar/dashboard" element={<Navigate to="/:schoolSlug/bursar/dashboard" replace />} />

      {/* 404 Catch-all */}
      <Route path="*" element={<div className="p-6 text-center">404 - Page Not Found</div>} />
    </Routes>
  );
}

export default App;
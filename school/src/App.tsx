import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import Login from "./pages/auth/Login";

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

// Teacher Pages
const TeacherDashboard = () => <div className="p-6">Teacher Dashboard</div>;
const TeacherScores = () => <div className="p-6">Score Submission</div>;
const TeacherCBC = () => <div className="p-6">CBC Submission</div>;
const TeacherPerformance = () => <div className="p-6">Class Performance</div>;

// Parent Pages
const ParentDashboard = () => <div className="p-6">Parent Dashboard</div>;
const ParentResults = () => <div className="p-6">Results</div>;
const ParentFees = () => <div className="p-6">Fee Balance</div>;
const ParentNotifications = () => <div className="p-6">Notifications</div>;

// Bursar Pages
const BursarDashboard = () => <div className="p-6">Bursar Dashboard</div>;
const BursarSetup = () => <div className="p-6">Fee Setup</div>;
const BursarPayments = () => <div className="p-6">Record Payments</div>;
const BursarReports = () => <div className="p-6">Fee Reports</div>;

// Protected Route
import ProtectedRoute from "./components/common/ProtectedRoute";

function App() {
  const [user, setUser] = useState({
    name: "Alice Admin",
    role: "ADMIN",
    avatar: ""
  });

  const handleLogout = () => {
    alert("Logging out...");
    setUser(null);
  };

  const handleNotificationClick = () => alert("Showing notifications...");
  const handleProfileClick = () => alert("Opening profile settings...");

  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<Login />} />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <DashboardLayout
              role="ADMIN"
              user={user}
              notificationsCount={3}
              onLogout={handleLogout}
              onNotificationClick={handleNotificationClick}
              onProfileClick={handleProfileClick}
            >
              <AdminDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <DashboardLayout role="ADMIN" user={user} onLogout={handleLogout}>
              <Users />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/academic-setup"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <DashboardLayout role="ADMIN" user={user} onLogout={handleLogout}>
              <AcademicSetup />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/fees"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <DashboardLayout role="ADMIN" user={user} onLogout={handleLogout}>
              <FeeManagement />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/results"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <DashboardLayout role="ADMIN" user={user} onLogout={handleLogout}>
              <ResultsPerformance />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <DashboardLayout role="ADMIN" user={user} onLogout={handleLogout}>
              <ReportsAnalytics />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <DashboardLayout role="ADMIN" user={user} onLogout={handleLogout}>
              <StudentManagement />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <DashboardLayout role="ADMIN" user={user} onLogout={handleLogout}>
              <SchoolSettings />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/logs"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <DashboardLayout role="ADMIN" user={user} onLogout={handleLogout}>
              <AuditLogs />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tools"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <DashboardLayout role="ADMIN" user={user} onLogout={handleLogout}>
              <ToolsUtilities />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Teacher Routes */}
      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute allowedRoles={["TEACHER"]}>
            <DashboardLayout role="TEACHER" user={{ name: "John Teacher", role: "TEACHER" }} onLogout={handleLogout}>
              <TeacherDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/scores"
        element={
          <ProtectedRoute allowedRoles={["TEACHER"]}>
            <DashboardLayout role="TEACHER" user={{ name: "John Teacher", role: "TEACHER" }} onLogout={handleLogout}>
              <TeacherScores />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/cbc"
        element={
          <ProtectedRoute allowedRoles={["TEACHER"]}>
            <DashboardLayout role="TEACHER" user={{ name: "John Teacher", role: "TEACHER" }} onLogout={handleLogout}>
              <TeacherCBC />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/performance"
        element={
          <ProtectedRoute allowedRoles={["TEACHER"]}>
            <DashboardLayout role="TEACHER" user={{ name: "John Teacher", role: "TEACHER" }} onLogout={handleLogout}>
              <TeacherPerformance />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Parent Routes */}
      <Route
        path="/parent/dashboard"
        element={
          <ProtectedRoute allowedRoles={["PARENT"]}>
            <DashboardLayout role="PARENT" user={{ name: "Jane Parent", role: "PARENT" }} onLogout={handleLogout}>
              <ParentDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/parent/results"
        element={
          <ProtectedRoute allowedRoles={["PARENT"]}>
            <DashboardLayout role="PARENT" user={{ name: "Jane Parent", role: "PARENT" }} onLogout={handleLogout}>
              <ParentResults />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/parent/fees"
        element={
          <ProtectedRoute allowedRoles={["PARENT"]}>
            <DashboardLayout role="PARENT" user={{ name: "Jane Parent", role: "PARENT" }} onLogout={handleLogout}>
              <ParentFees />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/parent/notifications"
        element={
          <ProtectedRoute allowedRoles={["PARENT"]}>
            <DashboardLayout role="PARENT" user={{ name: "Jane Parent", role: "PARENT" }} onLogout={handleLogout}>
              <ParentNotifications />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Bursar Routes */}
      <Route
        path="/bursar/dashboard"
        element={
          <ProtectedRoute allowedRoles={["BURSAR"]}>
            <DashboardLayout role="BURSAR" user={{ name: "Bob Bursar", role: "BURSAR" }} onLogout={handleLogout}>
              <BursarDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bursar/setup"
        element={
          <ProtectedRoute allowedRoles={["BURSAR"]}>
            <DashboardLayout role="BURSAR" user={{ name: "Bob Bursar", role: "BURSAR" }} onLogout={handleLogout}>
              <BursarSetup />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bursar/payments"
        element={
          <ProtectedRoute allowedRoles={["BURSAR"]}>
            <DashboardLayout role="BURSAR" user={{ name: "Bob Bursar", role: "BURSAR" }} onLogout={handleLogout}>
              <BursarPayments />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bursar/reports"
        element={
          <ProtectedRoute allowedRoles={["BURSAR"]}>
            <DashboardLayout role="BURSAR" user={{ name: "Bob Bursar", role: "BURSAR" }} onLogout={handleLogout}>
              <BursarReports />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Default Route */}
      <Route path="/" element={<Login />} />

      {/* 404 Catch-all */}
      <Route path="*" element={<div className="p-6 text-center">404 - Page Not Found</div>} />
    </Routes>
  );
}

export default App;

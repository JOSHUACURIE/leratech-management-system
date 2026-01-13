import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
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
const TeacherDashboard = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Teacher Dashboard</h1>
    <p className="text-gray-600">Teacher dashboard content will go here.</p>
  </div>
);

const ParentDashboard = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Parent Dashboard</h1>
    <p className="text-gray-600">Parent dashboard content will go here.</p>
  </div>
);

const BursarDashboard = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Bursar Dashboard</h1>
    <p className="text-gray-600">Bursar dashboard content will go here.</p>
  </div>
);


const AdminClasses = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Classes Management</h1>
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-gray-600">Classes management interface will be implemented here.</p>
    </div>
  </div>
);

const AdminSubjects = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Subjects Management</h1>
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-gray-600">Subjects management interface will be implemented here.</p>
    </div>
  </div>
);


// Placeholder for teacher pages
const TeacherScores = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Score Submission</h1>
    <p className="text-gray-600">Score submission interface will go here.</p>
  </div>
);

const TeacherCBC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">CBC Submission</h1>
    <p className="text-gray-600">CBC submission interface will go here.</p>
  </div>
);

const TeacherPerformance = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Class Performance</h1>
    <p className="text-gray-600">Class performance analytics will go here.</p>
  </div>
);

// Placeholder for parent pages
const ParentResults = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Results</h1>
    <p className="text-gray-600">Student results will be displayed here.</p>
  </div>
);

const ParentFees = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Fee Balance</h1>
    <p className="text-gray-600">Fee balance information will be displayed here.</p>
  </div>
);

const ParentNotifications = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Notifications</h1>
    <p className="text-gray-600">Parent notifications will be displayed here.</p>
  </div>
);

// Placeholder for bursar pages
const BursarSetup = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Fee Setup</h1>
    <p className="text-gray-600">Fee setup interface will go here.</p>
  </div>
);

const BursarPayments = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Record Payments</h1>
    <p className="text-gray-600">Payment recording interface will go here.</p>
  </div>
);

const BursarReports = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Fee Reports</h1>
    <p className="text-gray-600">Fee reports will be generated here.</p>
  </div>
);

function App() {
  const [user, setUser] = useState({
    name: "Alice Admin",
    role: "ADMIN",
    avatar: ""
  });

  const handleLogout = () => {
    alert("Logging out...");
    // In real app: clear tokens, redirect to login
  };

  const handleNotificationClick = () => {
    alert("Showing notifications...");
  };

  const handleProfileClick = () => {
    alert("Opening profile settings...");
  };

  return (
    <Routes>
      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={
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
      } />
      
      <Route path="/admin/users" element={
        <DashboardLayout
          role="ADMIN"
          user={user}
          notificationsCount={3}
          onLogout={handleLogout}
        >
         <Users/>
        </DashboardLayout>
      } />
      
      <Route path="/admin/classes" element={
        <DashboardLayout
          role="ADMIN"
          user={user}
          onLogout={handleLogout}
        >
          <AdminClasses />
        </DashboardLayout>
      } />

      <Route path="/admin/subjects" element={
        <DashboardLayout
          role="ADMIN"
          user={user}
          onLogout={handleLogout}
        >
          <AdminSubjects />
        </DashboardLayout>
      } />

      <Route path="/admin/academic-setup" element={
        <DashboardLayout
          role="ADMIN"
          user={user}
          onLogout={handleLogout}
        >
          <AcademicSetup />
        </DashboardLayout>
      } />

       <Route path="/admin/fees" element={
        <DashboardLayout
          role="ADMIN"
          user={user}
          onLogout={handleLogout}
        >
          <FeeManagement />
        </DashboardLayout>
      } />

        <Route path="/admin/results" element={
        <DashboardLayout
          role="ADMIN"
          user={user}
          onLogout={handleLogout}
        >
          <ResultsPerformance/>
        </DashboardLayout>
      } />
      <Route path="/admin/reports" element={
        <DashboardLayout
          role="ADMIN"
          user={user}
          onLogout={handleLogout}
        >
          <ReportsAnalytics/>
        </DashboardLayout>
      } />

      <Route path="/admin/students" element={
        <DashboardLayout
          role="ADMIN"
          user={user}
          onLogout={handleLogout}
        >
          <StudentManagement/>
        </DashboardLayout>
      } />
      
      <Route path="/admin/settings" element={
        <DashboardLayout
          role="ADMIN"
          user={user}
          onLogout={handleLogout}
        >
          <SchoolSettings/>
        </DashboardLayout>
      } />
         <Route path="/admin/tools" element={
        <DashboardLayout
          role="ADMIN"
          user={user}
          onLogout={handleLogout}
        >
          <ToolsUtilities/>
        </DashboardLayout>
      } />
       
      <Route path="/admin/logs" element={
        <DashboardLayout
          role="ADMIN"
          user={user}
          onLogout={handleLogout}
        >
          <AuditLogs/>
        </DashboardLayout>
      } />
      
     
     
      <Route path="/teacher/dashboard" element={
        <DashboardLayout
          role="TEACHER"
          user={{ name: "John Teacher", role: "TEACHER" }}
          onLogout={handleLogout}
        >
          <TeacherDashboard />
        </DashboardLayout>
      } />

      <Route path="/teacher/scores" element={
        <DashboardLayout
          role="TEACHER"
          user={{ name: "John Teacher", role: "TEACHER" }}
          onLogout={handleLogout}
        >
          <TeacherScores />
        </DashboardLayout>
      } />

      <Route path="/teacher/cbc" element={
        <DashboardLayout
          role="TEACHER"
          user={{ name: "John Teacher", role: "TEACHER" }}
          onLogout={handleLogout}
        >
          <TeacherCBC />
        </DashboardLayout>
      } />

      <Route path="/teacher/performance" element={
        <DashboardLayout
          role="TEACHER"
          user={{ name: "John Teacher", role: "TEACHER" }}
          onLogout={handleLogout}
        >
          <TeacherPerformance />
        </DashboardLayout>
      } />
      
      {/* Parent Routes */}
      <Route path="/parent/dashboard" element={
        <DashboardLayout
          role="PARENT"
          user={{ name: "Jane Parent", role: "PARENT" }}
          onLogout={handleLogout}
        >
          <ParentDashboard />
        </DashboardLayout>
      } />

      <Route path="/parent/results" element={
        <DashboardLayout
          role="PARENT"
          user={{ name: "Jane Parent", role: "PARENT" }}
          onLogout={handleLogout}
        >
          <ParentResults />
        </DashboardLayout>
      } />

      <Route path="/parent/fees" element={
        <DashboardLayout
          role="PARENT"
          user={{ name: "Jane Parent", role: "PARENT" }}
          onLogout={handleLogout}
        >
          <ParentFees />
        </DashboardLayout>
      } />

      <Route path="/parent/notifications" element={
        <DashboardLayout
          role="PARENT"
          user={{ name: "Jane Parent", role: "PARENT" }}
          onLogout={handleLogout}
        >
          <ParentNotifications />
        </DashboardLayout>
      } />
      
      {/* Bursar Routes */}
      <Route path="/bursar/dashboard" element={
        <DashboardLayout
          role="BURSAR"
          user={{ name: "Bob Bursar", role: "BURSAR" }}
          onLogout={handleLogout}
        >
          <BursarDashboard />
        </DashboardLayout>
      } />

      <Route path="/bursar/setup" element={
        <DashboardLayout
          role="BURSAR"
          user={{ name: "Bob Bursar", role: "BURSAR" }}
          onLogout={handleLogout}
        >
          <BursarSetup />
        </DashboardLayout>
      } />

      <Route path="/bursar/payments" element={
        <DashboardLayout
          role="BURSAR"
          user={{ name: "Bob Bursar", role: "BURSAR" }}
          onLogout={handleLogout}
        >
          <BursarPayments />
        </DashboardLayout>
      } />

      <Route path="/bursar/reports" element={
        <DashboardLayout
          role="BURSAR"
          user={{ name: "Bob Bursar", role: "BURSAR" }}
          onLogout={handleLogout}
        >
          <BursarReports />
        </DashboardLayout>
      } />
      
      {/* Default Route */}
      <Route path="/" element={
        <DashboardLayout
          role="ADMIN"
          user={user}
          onLogout={handleLogout}
        >
          <AdminDashboard />
        </DashboardLayout>
      } />

      {/* 404 Route - Catch all */}
      <Route path="*" element={
        <DashboardLayout
          role="ADMIN"
          user={user}
          onLogout={handleLogout}
        >
          <div className="p-6 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">404 - Page Not Found</h1>
            <p className="text-gray-600">The page you are looking for does not exist.</p>
          </div>
        </DashboardLayout>
      } />
    </Routes>
  );
}

export default App;
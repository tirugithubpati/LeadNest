import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { AuthProvider } from "./context/AuthContext";

import Login from "./components/Login";
import Signup from "./components/Signup";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from "./components/ResetPassword";
import Projects from './components/Projects';
import Profile from './components/Profile';
import CreatePersonalProject from './components/CreatePersonalProject';
import CreateCollaborativeProject from './components/CreateCollaborativeProject';
import ProjectOverview from './components/ProjectOverview';
import KanbanBoard from './components/KanbanBoard';
import TaskList from './components/TaskList';
import TaskOverview from './components/TaskOverview';
import Contact from './components/Contact';
import OTPVerification from './components/OTPVerification';
import ProtectedRoute from './components/ProtectedRoute';
import Todos from './components/Todos';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-otp" element={<OTPVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/create-personal-project" element={<ProtectedRoute><CreatePersonalProject /></ProtectedRoute>} />
          <Route path="/create-collaborative-project" element={<ProtectedRoute><CreateCollaborativeProject /></ProtectedRoute>} />
          <Route path="/project/:id/overview" element={<ProtectedRoute><ProjectOverview /></ProtectedRoute>} />
          <Route path="/project/:id/kanban" element={<ProtectedRoute><KanbanBoard /></ProtectedRoute>} />
          <Route path="/project/:id/tasks" element={<ProtectedRoute><TaskList /></ProtectedRoute>} />
          <Route path="/task/:id" element={<ProtectedRoute><TaskOverview /></ProtectedRoute>} />
          <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
          <Route path="/todos" element={<ProtectedRoute><Todos /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

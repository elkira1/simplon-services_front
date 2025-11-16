import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/common/PrivateRoute";
import Layout from "./components/layout/Layout";
import Login from "./components/auth/Login";
import Dashboard from "./components/dashboard/Dashboard";
import RequestsList from "./components/requests/RequestsList";
import RequestDetail from "./components/requests/RequestDetail";
import CreateRequest from "./components/requests/CreateRequest";
import Validations from "./components/requests/Validations";
import Statistics from "./components/statistics/Statistics";
import Profile from "./components/profile/Profile";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

import "./App.css";
import UsersManagement from "./components/pages/UsersManagement";
import ProvisionRequests from "./components/pages/ProvisionRequests";
import CommunitySignals from "./components/pages/CommunitySignals";
import BudgetProjects from "./components/pages/BudgetProjects";
import BudgetStatistics from "./components/pages/BudgetStatistics";
import PageTitleManager from "./components/common/PageTitleManager";
import ForgotPassword from "./components/auth/ForgotPassword";
import VerifyResetCode from "./components/auth/VerifyResetCode";
import ResetPassword from "./components/auth/ResetPassword";

function App() {
  return (
    <AuthProvider>
      <Router>
        <PageTitleManager />

        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-reset-code" element={<VerifyResetCode />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Dashboard />} />

              <Route path="requests" element={<RequestsList />} />
              <Route
                path="requests/create"
                element={
                  <PrivateRoute allowedRoles={["employee", "mg"]}>
                    <CreateRequest />
                  </PrivateRoute>
                }
              />
              <Route path="requests/:id" element={<RequestDetail />} />

              <Route
                path="validations"
                element={
                  <PrivateRoute allowedRoles={["mg", "accounting", "director"]}>
                    <Validations />
                  </PrivateRoute>
                }
              />

              <Route
                path="users"
                element={
                  <PrivateRoute allowedRoles={["mg", "accounting", "director"]}>
                    <UsersManagement />
                  </PrivateRoute>
                }
              />

              <Route path="provisions" element={<ProvisionRequests />} />
              <Route path="reports" element={<CommunitySignals />} />
              <Route
                path="budgets"
                element={
                  <PrivateRoute allowedRoles={["accounting"]}>
                    <BudgetProjects />
                  </PrivateRoute>
                }
              />
              <Route
                path="budgets/statistics"
                element={
                  <PrivateRoute allowedRoles={["accounting", "director"]}>
                    <BudgetStatistics />
                  </PrivateRoute>
                }
              />

              <Route
                path="statistics"
                element={
                  <PrivateRoute allowedRoles={["mg", "director"]}>
                    <Statistics />
                  </PrivateRoute>
                }
              />

              <Route path="profile" element={<Profile />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ToastContainer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

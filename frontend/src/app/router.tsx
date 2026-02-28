// src/app/router.tsx

import { createBrowserRouter } from "react-router-dom";
import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import ChallengeListPage from "@/features/challenges/pages/ChallengeListPage";

{
  path: "/challenges",
    element: <ChallengeListPage />,
}
export const router = createBrowserRouter([
  {
    path: "/",
    element: <div className="p-6">Home</div>,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute role="engineer">
        <div className="p-6">Engineer Dashboard</div>
      </ProtectedRoute>
    ),
  },
  {
    path: "/company/dashboard",
    element: (
      <ProtectedRoute role="company">
        <div className="p-6">Company Dashboard</div>
      </ProtectedRoute>
    ),
  },
  {
    path: "/challenges",
    element: <ChallengeListPage />,
  }
]);
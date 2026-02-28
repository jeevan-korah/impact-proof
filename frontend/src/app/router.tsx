// src/app/router.tsx

import { createBrowserRouter } from "react-router-dom";
import DashboardPage from "@/pages/DashboardPage";
import IDEChallengePage from "@/pages/IDEChallengePage";
import MLChallengePage from "@/pages/MLChallengePage";
import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <DashboardPage />,
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
    element: <DashboardPage />,
  },
  {
    path: "/challenge/ide/:id",
    element: <IDEChallengePage />,
  },
  {
    path: "/challenge/ml/:id",
    element: <MLChallengePage />,
  },
]);

// src/app/router.tsx

import { createBrowserRouter } from "react-router-dom";
import DashboardPage from "@/pages/DashboardPage";
import IDEChallengePage from "@/pages/IDEChallengePage";
import MLChallengePage from "@/pages/MLChallengePage";
import MyProposalsPage from "@/pages/MyProposalsPage";
import MySubmissionsPage from "@/pages/MySubmissionsPage";
import CreateChallengePage from "@/pages/CreateChallengePage";
import MyChallengesPage from "@/pages/MyChallengesPage";
import CompanyChallengeDetailPage from "@/pages/CompanyChallengeDetailPage";
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
    path: "/proposals",
    element: <MyProposalsPage />,
  },
  {
    path: "/submissions",
    element: <MySubmissionsPage />,
  },
  {
    path: "/create-challenge",
    element: <CreateChallengePage />,
  },
  {
    path: "/my-challenges",
    element: <MyChallengesPage />,
  },
  {
    path: "/company/challenge/:id",
    element: <CompanyChallengeDetailPage />,
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

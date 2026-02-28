// src/app/router.tsx

import { createBrowserRouter } from "react-router-dom";
import DashboardPage from "@/pages/DashboardPage";
import IDEChallengePage from "@/pages/IDEChallengePage";
import MLChallengePage from "@/pages/MLChallengePage";

export const router = createBrowserRouter([
  {
    path: "/",
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

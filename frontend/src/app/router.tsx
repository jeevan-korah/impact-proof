// src/app/router.tsx
import { createBrowserRouter } from "react-router-dom";
import DashboardPage from "@/pages/DashboardPage";
import IDEChallengePage from "@/pages/IDEChallengePage";
import MLChallengePage from "@/pages/MLChallengePage";
import ApisixchallengePage from "@/pages/Apisixchallenge"; // 👈 add this

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
  {                                           // 👈 add this
    path: "/challenge/apisix",
    element: <ApisixchallengePage />,
  },
]);
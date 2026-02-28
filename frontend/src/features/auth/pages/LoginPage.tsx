// src/features/auth/pages/LoginPage.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (data: any) => {
    try {
      setLoading(true);
      setError(null);

      await loginUser(data);

      navigate("/dashboard");
    } catch (err: any) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <AuthForm
        mode="login"
        onSubmit={handleLogin}
        loading={loading}
        error={error}
      />
    </div>
  );
}
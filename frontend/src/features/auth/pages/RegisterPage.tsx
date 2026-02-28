// src/features/auth/pages/RegisterPage.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
  const { registerUser } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (data: any) => {
    try {
      setLoading(true);
      setError(null);

      await registerUser(data);

      navigate("/dashboard");
    } catch (err: any) {
      setError("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <AuthForm
        mode="register"
        onSubmit={handleRegister}
        loading={loading}
        error={error}
      />
    </div>
  );
}
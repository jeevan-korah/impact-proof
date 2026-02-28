import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type Mode = "login" | "register";

interface Props {
  mode: Mode;
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export default function AuthForm({
  mode,
  onSubmit,
  loading = false,
  error,
}: Props) {
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    role: "engineer",
    githubUrl: "",
  });

  const isRegister = mode === "register";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isRegister) {
      await onSubmit({
        email: form.email,
        password: form.password,
        name: form.name,
        role: form.role,
        githubUrl: form.githubUrl || undefined,
      });
    } else {
      await onSubmit({
        email: form.email,
        password: form.password,
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-900 p-8 rounded-xl w-full max-w-md space-y-4"
    >
      <h1 className="text-xl font-semibold">
        {isRegister ? "Create Account" : "Login"}
      </h1>

      {error && (
        <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {isRegister && (
        <Input
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          required
        />
      )}

      <Input
        type="email"
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        required
      />

      <Input
        type="password"
        name="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
        required
        minLength={8}
      />

      {isRegister && (
        <>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
          >
            <option value="engineer">Engineer</option>
            <option value="company">Company</option>
          </select>

          <Input
            name="githubUrl"
            placeholder="GitHub URL (optional)"
            value={form.githubUrl}
            onChange={handleChange}
          />
        </>
      )}

      <Button type="submit" loading={loading} className="w-full">
        {isRegister ? "Register" : "Login"}
      </Button>
    </form>
  );
}
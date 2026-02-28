import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const engineerLinks = [
    { to: "/", label: "Dashboard" },
    { to: "/proposals", label: "My Proposals" },
    { to: "/submissions", label: "My Submissions" },
  ];

  const companyLinks = [
    { to: "/", label: "Dashboard" },
    { to: "/my-challenges", label: "My Challenges" },
    { to: "/create-challenge", label: "Create Challenge" },
  ];

  const navLinks = user?.role === "company" ? companyLinks : engineerLinks;

  const isActive = (path: string) => {
    if (path === "/")
      return location.pathname === "/" || location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  return (
    <header className="border-b border-surface-border px-6 py-3 flex items-center justify-between">
      {/* Left — Logo + Nav */}
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded flex items-center justify-center">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-white tracking-tight">
            ImpactProof
          </span>
        </Link>

        {user && (
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  isActive(link.to)
                    ? "bg-accent/10 text-accent font-medium"
                    : "text-gray-400 hover:text-white hover:bg-surface-hover"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>

      {/* Right — User */}
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm text-gray-400">{user.name}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-white transition-colors"
            >
              Logout
            </button>
            <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-sm text-accent font-medium">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-3 py-1.5 text-sm bg-accent hover:bg-accent-dim text-white rounded-md font-medium transition-colors"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LogOut, UserRound, Leaf } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="w-full border-b-2 border-[#E5E7EB] bg-white sticky top-0 z-30" data-testid="navbar">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3" data-testid="navbar-logo">
          <div className="w-10 h-10 rounded-2xl bg-[#2D6A4F] flex items-center justify-center text-white">
            <Leaf className="w-5 h-5" />
          </div>
          <div className="leading-tight">
            <div className="font-heading font-bold text-xl text-[#1C1917]">APA Connect</div>
            <div className="text-xs text-[#4B5563]">Trouvez votre intervenant APA</div>
          </div>
        </Link>

        <nav className="flex items-center gap-3">
          <Link to="/msp" className="hidden xl:inline text-base font-semibold text-[#2D6A4F] hover:text-[#1B4332]" data-testid="nav-msp">
            Pour les MSP
          </Link>
          <Link to="/cours" className="hidden md:inline text-base font-medium text-[#1C1917] hover:text-[#2D6A4F]" data-testid="nav-cours">
            Cours sur chaise
          </Link>
          <Link to="/videos" className="hidden md:inline text-base font-medium text-[#1C1917] hover:text-[#2D6A4F]" data-testid="nav-videos">
            Vidéos
          </Link>
          <Link to="/structures" className="hidden lg:inline text-base font-medium text-[#1C1917] hover:text-[#2D6A4F]" data-testid="nav-structures">
            Structures
          </Link>
          <Link to="/kit-documents" className="hidden sm:inline text-base font-medium text-[#1C1917] hover:text-[#2D6A4F]" data-testid="nav-kit-docs">
            Kit documents
          </Link>
          {user && user.role === "admin" && (
            <Link to="/admin" className="text-base font-medium text-[#1C1917] hover:text-[#2D6A4F]" data-testid="nav-admin">
              Admin
            </Link>
          )}
          {user && user.role === "intervenant" && (
            <Link to="/intervenant/dashboard" className="text-base font-medium text-[#1C1917] hover:text-[#2D6A4F]" data-testid="nav-dashboard">
              Mon espace
            </Link>
          )}
          {user ? (
            <button
              onClick={async () => { await logout(); navigate("/"); }}
              data-testid="nav-logout"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-[#E5E7EB] text-[#1C1917] hover:border-[#2D6A4F]"
            >
              <LogOut className="w-4 h-4" /> Déconnexion
            </button>
          ) : (
            <Link
              to="/intervenant/login"
              data-testid="nav-login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-[#E5E7EB] text-[#1C1917] hover:border-[#2D6A4F]"
            >
              <UserRound className="w-4 h-4" /> Connexion
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

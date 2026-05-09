import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu, X, LogOut, LogIn, Home, Scissors,
  GraduationCap, Image, Phone, LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Check both context user and localStorage — admins stay admins across refreshes
  const localSession = (() => {
    try { return JSON.parse(localStorage.getItem("bloom_admin_session")); } catch { return null; }
  })();
  const isAdmin    = user?.role === "admin" || localSession?.role === "admin";
  const isLoggedIn = isAdmin; // only admins have accounts on this site

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = () => setOpen(false);

  const handleLogout = () => {
    logout();
    close();
    navigate("/");
  };

  const handleLogin = () => {
    close();
    navigate("/login");
  };

  const navLinks = [
    { label: "Home",        to: "/",            icon: Home },
    { label: "Services",    to: "/services",    icon: Scissors },
    { label: "Nail Course", to: "/nail-course", icon: GraduationCap },
    { label: "Gallery",     to: "/gallery",     icon: Image },
    { label: "Contact",     to: "/contact",     icon: Phone },
  ];

  return (
    <>
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-lg border-b transition-all duration-300 ${
        scrolled ? "bg-background/95 border-border/60 shadow-sm" : "bg-background/80 border-border/30"
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" onClick={close}>
              <span className="font-heading text-xl font-bold text-foreground tracking-tight">
                <span className="text-primary font-black">Bloom</span>
                <span
                  className="text-muted-foreground font-light ml-1 uppercase tracking-widest"
                  style={{ fontSize: "9px", letterSpacing: "0.2em" }}
                >
                  Skills &amp; Beauty
                </span>
              </span>
            </Link>

            {/* Right: Book Now + hamburger */}
            <div className="flex items-center gap-3">
              <Link to="/book" onClick={close}>
                <Button
                  size="sm"
                  className="rounded-full px-5 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Book Now
                </Button>
              </Link>
              <button
                onClick={() => setOpen((v) => !v)}
                className="p-2 rounded-xl hover:bg-secondary transition-colors"
                aria-label={open ? "Close menu" : "Open menu"}
              >
                {open
                  ? <X className="w-6 h-6 text-foreground" />
                  : <Menu className="w-6 h-6 text-foreground" />
                }
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* ── Slide-down drawer ────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20"
              onClick={close}
            />

            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="fixed top-16 left-0 right-0 z-50 bg-background border-b border-border/40 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto"
            >
              <div className="max-w-6xl mx-auto px-6 py-4 space-y-0.5">

                {/* ── Nav links — everyone sees these ── */}
                {navLinks.map(({ label, to, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={close}
                    className="flex items-center gap-4 px-3 py-3.5 rounded-2xl hover:bg-secondary/60 transition-colors"
                  >
                    <Icon className="w-5 h-5 text-primary shrink-0" />
                    <span className="font-medium text-foreground text-base">{label}</span>
                  </Link>
                ))}

                {/* ── Divider ── */}
                <div className="h-px bg-border/60 mx-3 my-2" />

                {isLoggedIn ? (
                  /* ── Admin: Dashboard + Logout ── */
                  <>
                    <Link
                      to="/admin"
                      onClick={close}
                      className="flex items-center gap-4 px-3 py-3.5 rounded-2xl hover:bg-primary/5 transition-colors"
                    >
                      <LayoutDashboard className="w-5 h-5 text-primary shrink-0" />
                      <span className="font-medium text-primary text-base">Dashboard</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-4 px-3 py-3.5 rounded-2xl hover:bg-secondary/60 transition-colors w-full text-left"
                    >
                      <LogOut className="w-5 h-5 text-muted-foreground shrink-0" />
                      <span className="font-medium text-muted-foreground text-base">Logout</span>
                    </button>
                  </>
                ) : (
                  /* ── Guest: Login ── */
                  <button
                    onClick={handleLogin}
                    className="flex items-center gap-4 px-3 py-3.5 rounded-2xl hover:bg-secondary/60 transition-colors w-full text-left"
                  >
                    <LogIn className="w-5 h-5 text-primary shrink-0" />
                    <span className="font-medium text-primary text-base">Login</span>
                  </button>
                )}

                <div className="pb-2" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

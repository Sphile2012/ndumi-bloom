import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { ndumie } from "@/api/ndumieClient";
import { motion } from "framer-motion";

// Known admin emails — used as fallback in local dev
const ADMIN_EMAILS = [
  "phunyezwamjoli3@gmail.com",
  "bloomskillsandbeauty@icloud.com",
  "thobsin.e@gmail.com",
];

export default function Login() {
  const [email, setEmail]   = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const { checkUserAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from     = location.state?.from || "/admin";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const emailLower = email.trim().toLowerCase();

    try {
      let user;

      // Try backend (works on Netlify)
      try {
        user = await ndumie.auth.login(emailLower);
      } catch (_) {
        // Local dev fallback — check against known admin list
        if (ADMIN_EMAILS.includes(emailLower)) {
          user = {
            role:  "admin",
            email: emailLower,
            name:  emailLower.split("@")[0],
          };
        } else {
          throw new Error("This email is not registered as an admin.");
        }
      }

      // Save session
      localStorage.setItem(
        "bloom_admin_session",
        JSON.stringify({
          role:  user.role,
          email: user.email,
          name:  user.name || "",
          token: import.meta.env.VITE_ADMIN_PASSWORD || "",
        })
      );

      await checkUserAuth();
      navigate(from, { replace: true });

    } catch (err) {
      setError(err.message || "This email is not authorised.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-pink-50/40 to-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="bg-card border border-border/50 rounded-3xl p-10 shadow-xl shadow-primary/5">

          {/* Header */}
          <div className="text-center mb-8">
            <p className="text-5xl mb-4">💅</p>
            <h1 className="font-heading text-2xl font-bold text-foreground mb-1">
              Admin Login
            </h1>
            <p className="text-muted-foreground text-sm">
              Bloom Skills &amp; Beauty
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  className="rounded-xl h-11 pl-9"
                  autoFocus
                  autoComplete="email"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                ⚠️ {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full rounded-xl h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking...</>
                : "Continue"
              }
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Only registered admin emails can access the dashboard.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

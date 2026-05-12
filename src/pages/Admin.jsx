import { useState, useEffect } from "react";
import { ndumie } from "@/api/ndumieClient";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Clock, Search, RefreshCw, Phone, Mail, Calendar, Loader2, RotateCcw } from "lucide-react";
import { subDays, parseISO, isAfter } from "date-fns";
import AdminAnalytics from "../components/AdminAnalytics";
import { motion } from "framer-motion";

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_ICONS = {
  pending: Clock,
  confirmed: CheckCircle,
  completed: CheckCircle,
  cancelled: XCircle,
};

function LoginScreen() {
  const [email, setEmail]     = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const ADMIN_EMAILS = [
    "phunyezwamjoli3@gmail.com",
    "bloomskillsandbeauty@icloud.com",
    "thobsin.e@gmail.com",
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const emailLower = email.trim().toLowerCase();
    try {
      let user;
      try {
        user = await ndumie.auth.login(emailLower);
      } catch (_) {
        // Local dev fallback
        if (ADMIN_EMAILS.includes(emailLower)) {
          user = {
            role: "admin",
            email: emailLower,
            name: emailLower.split("@")[0],
            token: import.meta.env.VITE_ADMIN_PASSWORD ?? "",
          };
        } else {
          throw new Error("This email is not registered as an admin.");
        }
      }
      localStorage.setItem("bloom_admin_session", JSON.stringify({
        role:  user.role,
        email: user.email,
        name:  user.name || "",
        token: user.token ?? import.meta.env.VITE_ADMIN_PASSWORD ?? "",
      }));
      window.location.reload();
    } catch (err) {
      setError(err.message || "This email is not authorised.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-card border border-border/50 rounded-3xl p-6 sm:p-10 max-w-sm w-full shadow-xl">
        <div className="text-center mb-8">
          <p className="text-5xl mb-4">💅</p>
          <h2 className="font-heading text-2xl font-bold text-foreground mb-1">Admin Login</h2>
          <p className="text-muted-foreground text-sm">Bloom Skills & Beauty</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
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
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking...</> : "Continue"}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground text-center mt-6">
          Only registered admin emails can access the dashboard.
        </p>
      </div>
    </div>
  );
}

function NotAuthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-4">🚫</p>
        <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Not Authorized</h2>
        <p className="text-muted-foreground">This page is only accessible to the salon owner.</p>
      </div>
    </div>
  );
}

function Dashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [updating, setUpdating] = useState(null);
  const [toast, setToast] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [activeTab, setActiveTab] = useState("services");
  const [announcements, setAnnouncements] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [newType, setNewType] = useState("info");
  const [savingAnn, setSavingAnn] = useState(false);
  const [editingAnn, setEditingAnn] = useState(null); // { id, message, type }
  const [savingEdit, setSavingEdit] = useState(false);
  const [migrateJson, setMigrateJson] = useState("");
  const [migrating, setMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [addingUser, setAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "user" });
  const [savingUser, setSavingUser] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchBookings = async (isRefresh = false) => {
    // Don't set loading on refresh to avoid UI flicker
    if (!isRefresh) {
      setLoading(true);
      setIsInitialLoad(true);
    }
    setFetchError(null);
    try {
      const result = await ndumie.entities.Booking.filter({});
      // Enhanced validation: ensure result is a valid array before using .sort()
      if (!Array.isArray(result)) {
        console.warn('Bookings API returned non-array data:', result);
        throw new Error('Invalid data format received from server');
      }
      // Filter out any null/undefined entries and validate each booking
      const validBookings = result.filter(booking => {
        if (!booking || typeof booking !== 'object') {
          console.warn('Invalid booking entry found:', booking);
          return false;
        }
        // Ensure required fields exist
        return booking.id && booking.client_name;
      });
      // Sort newest date first with safe date handling
      validBookings.sort((a, b) => {
        try {
          const dateA = new Date(a.preferred_date || '1970-01-01');
          const dateB = new Date(b.preferred_date || '1970-01-01');
          if (dateB.getTime() !== dateA.getTime()) return dateB.getTime() - dateA.getTime();
          
          const createdA = new Date(a.created_date || '1970-01-01');
          const createdB = new Date(b.created_date || '1970-01-01');
          return createdB.getTime() - createdA.getTime();
        } catch (err) {
          console.warn('Error sorting bookings:', err);
          return 0;
        }
      });
      setBookings(validBookings);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
      const msg = err?.message || "Failed to load bookings";
      setFetchError(
        msg.includes("env vars")
          ? "⚠️ Server configuration error: Supabase environment variables are not set. Please add SUPABASE_URL and SUPABASE_ANON_KEY to your Netlify site settings → Environment Variables."
          : `⚠️ ${msg}. Please check your Netlify function logs and ensure environment variables (SUPABASE_URL, SUPABASE_ANON_KEY, ADMIN_TOKEN) are set in Netlify → Site Settings → Environment Variables.`
      );
      // Keep existing bookings if this is a refresh/retry
      if (!isRefresh) {
        setBookings([]);
      }
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const data = await ndumie.entities.Announcement.list();
      setAnnouncements(data);
    } catch (_) {}
  };

  useEffect(() => {
    // Initial data load
    fetchBookings();
    fetchAnnouncements();
    fetchUsers();
    
    // Set up polling interval for bookings (every 30 seconds)
    const interval = setInterval(() => fetchBookings(true), 30000);
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []); // Empty dependency array - only run once on mount

  const addAnnouncement = async () => {
    if (!newMsg.trim()) return;
    setSavingAnn(true);
    try {
      const created = await ndumie.entities.Announcement.create({
        message: newMsg.trim(),
        type: newType,
      });
      setAnnouncements(prev => [created, ...prev]);
      setNewMsg("");
      showToast("Announcement posted ✓");
    } catch (_) {
      showToast("Failed to post announcement", "error");
    } finally {
      setSavingAnn(false);
    }
  };

  const deleteAnnouncement = async (id) => {
    try {
      await ndumie.entities.Announcement.delete(id);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      showToast("Announcement deleted ✓");
    } catch (_) {
      showToast("Failed to delete", "error");
    }
  };

  const saveEditAnnouncement = async () => {
    if (!editingAnn?.message?.trim()) return;
    setSavingEdit(true);
    try {
      await ndumie.entities.Announcement.update(editingAnn.id, {
        message: editingAnn.message.trim(),
        type: editingAnn.type,
      });
      setAnnouncements(prev =>
        prev.map(a => a.id === editingAnn.id
          ? { ...a, message: editingAnn.message, type: editingAnn.type }
          : a
        )
      );
      setEditingAnn(null);
      showToast("Announcement updated ✓");
    } catch (_) {
      showToast("Failed to update", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  const updateStatus = async (booking, newStatus) => {
    if (!booking || !booking.id) {
      showToast('Invalid booking data', 'error');
      return;
    }
    setUpdating(booking.id);
    try {
      const updatedBooking = await ndumie.entities.Booking.update(booking.id, { status: newStatus });
      // Update local state with the response from server
      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: newStatus, ...updatedBooking } : b));

      if (newStatus === "confirmed" || newStatus === "cancelled") {
        // Send email notification if client has email
        if (booking.client_email) {
          // Email notification can be added via a Netlify Function in future
        }
        // Open WhatsApp to send message to client with safe phone handling
        try {
          const rawPhone = booking.client_phone?.replace(/\D/g, '') || '';
          const phone = rawPhone.startsWith('27') ? rawPhone : rawPhone.startsWith('0') ? '27' + rawPhone.slice(1) : rawPhone ? '27' + rawPhone : '';
          if (phone) {
            const msg = newStatus === "confirmed"
              ? `Hi ${booking.client_name || 'Client'}! 🌸 Your booking for *${booking.service_detail || 'your service'}* on *${booking.preferred_date || 'your date'}* at *${booking.preferred_time || 'your time'}* has been *confirmed*. We can't wait to see you! 💅\n\n📍 Sangro House, Durban\n📞 079 806 0310\n\n⏰ *Please arrive at least 15 minutes early.*\n\n⚠️ *Late Arrival Policy:* If you arrive 15 minutes or more late, your booking will be automatically cancelled. Please WhatsApp us if you are running behind.\n\n❌ *Cancellation Policy:* Please notify us at least 24 hours in advance if you need to cancel or reschedule.\n\n— Bloom Skills & Beauty`
              : `Hi ${booking.client_name || 'Client'}, we're sorry but your booking for *${booking.service_detail || 'your service'}* on *${booking.preferred_date || 'your date'}* has been *cancelled*. Please WhatsApp us to rebook. 💬\n\n— Bloom Skills & Beauty`;
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
          }
        } catch (whatsappErr) {
          console.warn('Failed to open WhatsApp:', whatsappErr);
          showToast('Booking updated but WhatsApp failed', 'warning');
        }
      }
      showToast(`Booking ${newStatus} ✓`);
    } catch (err) {
      console.error('Failed to update booking status:', err);
      showToast(`Failed to update booking: ${err.message || 'Unknown error'}`, "error");
    } finally {
      setUpdating(null);
    }
  };

  const deleteBooking = async (bookingId) => {
    if (!bookingId) {
      showToast('Invalid booking ID', 'error');
      return;
    }
    if (window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      setUpdating(bookingId);
      try {
        await ndumie.entities.Booking.delete(bookingId);
        setBookings(prev => prev.filter(b => b.id !== bookingId));
        showToast('Booking deleted successfully ✓');
      } catch (err) {
        console.error('Failed to delete booking:', err);
        showToast(`Failed to delete booking: ${err.message || 'Unknown error'}`, 'error');
      } finally {
        setUpdating(null);
      }
    }
  };

  const clearAllBookings = async () => {
    if (window.confirm('Are you sure you want to delete ALL bookings? This cannot be undone.')) {
      setLoading(true);
      try {
        for (const booking of bookings) {
          await ndumie.entities.Booking.delete(booking.id);
        }
        setBookings([]);
        showToast('All bookings cleared ✓', 'success');
      } catch (err) {
        showToast('Failed to clear bookings', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const restoreAllBookings = async () => {
    try {
      const cancelledBookings = bookings.filter(b => b.status === "cancelled");
      for (const booking of cancelledBookings) {
        await updateStatus(booking, "pending");
      }
      showToast("All cancelled bookings restored successfully!");
    } catch (error) {
      showToast("Failed to restore bookings", "error");
    }
  };

  const runMigration = async () => {
    setMigrating(true);
    setMigrateResult(null);
    try {
      let parsed;
      try {
        parsed = JSON.parse(migrateJson);
      } catch {
        setMigrateResult({ error: "Invalid JSON — please paste valid JSON data." });
        return;
      }
      // Accept either an array directly, or { bookings: [...] }
      const bookingsArr = Array.isArray(parsed) ? parsed : (parsed.bookings || []);
      const token = (() => {
        try { return JSON.parse(localStorage.getItem("bloom_admin_session"))?.token || ""; } catch { return ""; }
      })();
      const res = await fetch("/.netlify/functions/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Token": token },
        body: JSON.stringify({ bookings: bookingsArr }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Migration failed");
      setMigrateResult(data);
      if (data.importedBookings > 0) fetchBookings();
    } catch (err) {
      setMigrateResult({ error: err.message });
    } finally {
      setMigrating(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const data = await ndumie.entities.User.list();
      setUsers(data);
    } catch (_) {}
    finally { setUsersLoading(false); }
  };

  const seedUsers = async () => {
    setSeeding(true);
    try {
      await ndumie.entities.User.seed();
      await fetchUsers();
      showToast("Users seeded from old system ✓");
    } catch (_) {
      showToast("Seed failed", "error");
    } finally { setSeeding(false); }
  };

  const saveNewUser = async () => {
    if (!newUser.email.trim()) return;
    setSavingUser(true);
    try {
      const created = await ndumie.entities.User.create(newUser);
      setUsers(prev => [created, ...prev]);
      setNewUser({ name: "", email: "", role: "user" });
      setAddingUser(false);
      showToast("User added ✓");
    } catch (_) {
      showToast("Failed to add user", "error");
    } finally { setSavingUser(false); }
  };

  const toggleRole = async (user) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    try {
      await ndumie.entities.User.update(user.id, { role: newRole });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
      showToast(`${user.name || user.email} is now ${newRole} ✓`);
    } catch (_) {
      showToast("Failed to update role", "error");
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Remove this user?")) return;
    try {
      await ndumie.entities.User.delete(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      showToast("User removed ✓");
    } catch (_) {
      showToast("Failed to remove user", "error");
    }
  };

  // Safe filtering - ensure bookings is always an array and validate entries
  const safeBookings = Array.isArray(bookings) ? bookings.filter(b => b && typeof b === 'object' && b.id) : [];
  const filtered = safeBookings.filter(b => {
    if (!b) return false; // Skip null/undefined entries
    if (b.service_category === "announcement") return false;
    const matchSearch =
      (b.client_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (b.client_phone || "").includes(search) ||
      (b.service_detail || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    const isCourse = b.service_category === "Beginner Nail Course";
    if (activeTab === "services") return matchSearch && matchStatus && !isCourse;
    if (activeTab === "enrolled") return matchSearch && matchStatus && isCourse;
    return matchSearch && matchStatus;
  });

  const counts = {
    all: safeBookings.length,
    pending: safeBookings.filter(b => b?.status === "pending").length,
    confirmed: safeBookings.filter(b => b?.status === "confirmed").length,
    completed: safeBookings.filter(b => b?.status === "completed").length,
    cancelled: safeBookings.filter(b => b?.status === "cancelled").length,
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium text-white transition-all ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
                Dashboard
                {counts.pending > 0 && (
                  <span className="inline-flex items-center gap-1.5 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                    🔔 {counts.pending} new
                  </span>
                )}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 italic flex items-center gap-2">
                Bloom Skills & Beauty
                <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                  Live
                </span>
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={fetchBookings} className="rounded-xl gap-2 w-full sm:w-auto justify-center">
                <RefreshCw className="w-4 h-4" /> Refresh
              </Button>
              {bookings.length > 0 && (
                <Button variant="destructive" onClick={clearAllBookings} className="rounded-xl gap-2 w-full sm:w-auto justify-center">
                  🗑️ Clear All
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mb-6 border-b border-border overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-0 min-w-max sm:min-w-0 sm:flex-wrap">
            {[
              { id: "services",      label: "Services",         emoji: "💅" },
              { id: "enrolled",      label: "Courses",          emoji: "🎓" },
              { id: "analytics",     label: "Analytics",        emoji: "📊" },
              { id: "announcements", label: "News",             emoji: "📢" },
              { id: "users",         label: "Users",            emoji: "👥" },
              { id: "recalled",      label: "Deleted",          emoji: "🗑️" },
              { id: "webservices",   label: "Web",              emoji: "🌐" },
              { id: "whatsapp",      label: "Chat",             emoji: "💬" },
              { id: "migrate",       label: "Import",           emoji: "📥" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="text-sm sm:text-base leading-none">{tab.emoji}</span>
                <span className="hidden xs:inline sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <AdminAnalytics bookings={bookings} />
        )}

        {/* Announcements Tab */}
        {activeTab === "announcements" && (
          <div className="space-y-6">
            {/* Compose */}
            <div className="bg-card border border-border/50 rounded-2xl p-5">
              <h3 className="font-heading text-base font-semibold text-foreground mb-4">📢 Post New Announcement</h3>
              <div className="space-y-3">
                <textarea
                  rows={3}
                  placeholder="Write your announcement here... e.g. We are closed on public holidays. Book early to avoid disappointment! 🌸"
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: "info", label: "ℹ️ Info", color: "bg-blue-50 border-blue-200 text-blue-800" },
                    { value: "warning", label: "⚠️ Warning", color: "bg-amber-50 border-amber-200 text-amber-800" },
                    { value: "success", label: "✅ Good News", color: "bg-green-50 border-green-200 text-green-800" },
                    { value: "promo", label: "🎉 Promo", color: "bg-pink-50 border-pink-200 text-pink-800" },
                  ].map(t => (
                    <button key={t.value} type="button"
                      onClick={() => setNewType(t.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${newType === t.value ? t.color + " ring-2 ring-offset-1 ring-primary/30" : "border-border text-muted-foreground hover:text-foreground"}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
                <Button onClick={addAnnouncement} disabled={savingAnn || !newMsg.trim()}
                  className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                  {savingAnn ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting...</> : "📢 Post Announcement"}
                </Button>
              </div>
            </div>

            {/* List */}
            {announcements.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-4xl mb-3">📭</p>
                <p className="font-medium">No announcements yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((a, i) => {
                  const styles = {
                    info: "bg-blue-50 border-blue-200 text-blue-900",
                    warning: "bg-amber-50 border-amber-200 text-amber-900",
                    success: "bg-green-50 border-green-200 text-green-900",
                    promo: "bg-pink-50 border-pink-200 text-pink-900",
                  };
                  const icons = { info: "ℹ️", warning: "⚠️", success: "✅", promo: "🎉" };
                  const isEditing = editingAnn?.id === a.id;
                  const annType = isEditing ? editingAnn.type : (a.type || "info");
                  const annMsg  = isEditing ? editingAnn.message : (a.message || "");
                  return (
                    <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className={`border rounded-2xl p-4 ${styles[annType] || styles.info}`}>
                      {isEditing ? (
                        <div className="space-y-3">
                          <textarea rows={3} value={editingAnn.message}
                            onChange={(e) => setEditingAnn(prev => ({ ...prev, message: e.target.value }))}
                            className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground" />
                          <div className="flex gap-2 flex-wrap">
                            {[
                              { value: "info", label: "ℹ️ Info" },
                              { value: "warning", label: "⚠️ Warning" },
                              { value: "success", label: "✅ Good News" },
                              { value: "promo", label: "🎉 Promo" },
                            ].map(t => (
                              <button key={t.value} type="button"
                                onClick={() => setEditingAnn(prev => ({ ...prev, type: t.value }))}
                                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${editingAnn.type === t.value ? "bg-primary text-white border-primary" : "border-border text-muted-foreground bg-white"}`}>
                                {t.label}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={saveEditAnnouncement} disabled={savingEdit}
                              className="rounded-xl text-xs h-8 bg-primary text-white">
                              {savingEdit ? <Loader2 className="w-3 h-3 animate-spin" /> : "💾 Save"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingAnn(null)}
                              className="rounded-xl text-xs h-8">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-3 items-start">
                            <span className="text-lg shrink-0">{icons[annType] || "ℹ️"}</span>
                            <p className="text-sm leading-relaxed">{annMsg}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button size="sm" variant="ghost"
                              className="text-blue-600 hover:bg-blue-50 rounded-xl h-8 px-2"
                              onClick={() => setEditingAnn({ id: a.id, message: annMsg, type: annType })}>
                              ✏️
                            </Button>
                            <Button size="sm" variant="ghost"
                              className="text-red-500 hover:bg-red-50 rounded-xl h-8 px-2"
                              onClick={() => deleteAnnouncement(a.id)}>
                              🗑️
                            </Button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-5">
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="pl-9 rounded-xl h-9 w-64"
                  />
                </div>
                <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                  <SelectTrigger className="w-32 rounded-xl h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                {users.length === 0 && (
                  <Button size="sm" onClick={seedUsers} disabled={seeding}
                    className="rounded-xl h-9 bg-amber-500 hover:bg-amber-600 text-white gap-1.5 text-xs">
                    {seeding ? <Loader2 className="w-3 h-3 animate-spin" /> : "⬇️ Import from old system"}
                  </Button>
                )}
                <Button size="sm" onClick={() => setAddingUser(v => !v)}
                  className="rounded-xl h-9 bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 text-xs">
                  {addingUser ? "Cancel" : "+ Add User"}
                </Button>
              </div>
            </div>

            {/* Add user form */}
            {addingUser && (
              <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-3">
                <h3 className="font-semibold text-sm text-foreground">Add New User</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input placeholder="Full name" value={newUser.name}
                    onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))}
                    className="rounded-xl h-9 text-sm" />
                  <Input placeholder="Email address *" value={newUser.email}
                    onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))}
                    className="rounded-xl h-9 text-sm" />
                  <Select value={newUser.role} onValueChange={v => setNewUser(p => ({ ...p, role: v }))}>
                    <SelectTrigger className="rounded-xl h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button size="sm" onClick={saveNewUser} disabled={savingUser || !newUser.email.trim()}
                  className="rounded-xl h-9 bg-primary text-white text-xs">
                  {savingUser ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save User"}
                </Button>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4">
                <p className="font-heading text-2xl font-black text-primary">{users.filter(u => u.role === "admin").length}</p>
                <p className="text-xs text-muted-foreground mt-1">Admins</p>
              </div>
              <div className="bg-secondary border border-border/50 rounded-2xl p-4">
                <p className="font-heading text-2xl font-black text-foreground">{users.filter(u => u.role === "user").length}</p>
                <p className="text-xs text-muted-foreground mt-1">Users</p>
              </div>
            </div>

            {/* Users list */}
            {usersLoading ? (
              <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading users...
              </div>
            ) : (
              <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
                {/* Table header - hidden on mobile */}
                <div className="hidden sm:grid grid-cols-12 gap-2 px-5 py-3 bg-secondary/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <div className="col-span-4">Name</div>
                  <div className="col-span-2">Role</div>
                  <div className="col-span-4">Email</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>
                {users
                  .filter(u => {
                    const q = userSearch.toLowerCase();
                    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
                    const matchRole = userRoleFilter === "all" || u.role === userRoleFilter;
                    return matchSearch && matchRole;
                  })
                  .map((u, i) => (
                    <div key={u.id}
                      className={`px-4 sm:px-5 py-4 border-b border-border/40 last:border-0 ${i % 2 === 0 ? "" : "bg-secondary/20"}`}>
                      {/* Mobile layout */}
                      <div className="flex items-start justify-between gap-3 sm:hidden">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">{u.name || "—"}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{u.email}</p>
                          <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${u.role === "admin" ? "bg-primary/10 text-primary border-primary/20" : "bg-secondary text-muted-foreground border-border"}`}>{u.role}</span>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button size="sm" variant="outline" className="rounded-lg h-7 px-2 text-xs" onClick={() => toggleRole(u)}>{u.role === "admin" ? "→ User" : "→ Admin"}</Button>
                          <Button size="sm" variant="ghost" className="rounded-lg h-7 px-2 text-red-500 hover:bg-red-50" onClick={() => deleteUser(u.id)}>🗑️</Button>
                        </div>
                      </div>
                      {/* Desktop layout */}
                      <div className="hidden sm:grid grid-cols-12 gap-2 items-center text-sm">
                        <div className="col-span-4">
                          <p className="font-medium text-foreground truncate">{u.name || "—"}</p>
                          {u.role === "admin" && <p className="text-xs text-primary font-medium">Owner</p>}
                        </div>
                        <div className="col-span-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${u.role === "admin" ? "bg-primary/10 text-primary border-primary/20" : "bg-secondary text-muted-foreground border-border"}`}>{u.role}</span>
                        </div>
                        <div className="col-span-4">
                          <p className="text-muted-foreground text-xs truncate">{u.email}</p>
                        </div>
                        <div className="col-span-2 flex justify-end gap-1">
                          <Button size="sm" variant="outline" className="rounded-lg h-7 px-2 text-xs" onClick={() => toggleRole(u)} title={u.role === "admin" ? "Demote to user" : "Promote to admin"}>{u.role === "admin" ? "→ User" : "→ Admin"}</Button>
                          <Button size="sm" variant="ghost" className="rounded-lg h-7 px-2 text-red-500 hover:bg-red-50" onClick={() => deleteUser(u.id)}>🗑️</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                {users.length === 0 && !usersLoading && (
                  <div className="text-center py-16 text-muted-foreground">
                    <p className="text-3xl mb-2">👥</p>
                    <p className="text-sm font-medium">No users yet</p>
                    <p className="text-xs mt-1">Click "Import from old system" to load your existing users</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Recently Deleted Tab */}
        {activeTab === "recalled" && (() => {
          const thirtyDaysAgo = subDays(new Date(), 30);
          const recentlyCancelled = bookings.filter(b => {
            if (b.status !== "cancelled") return false;
            try {
              return isAfter(parseISO(b.updated_date || b.created_date), thirtyDaysAgo);
            } catch { return false; }
          });

          const restoreAll = async () => {
            for (const b of recentlyCancelled) {
              await updateStatus(b, "pending");
            }
          };

          return recentlyCancelled.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-4xl mb-3">✅</p>
              <p className="font-medium">No cancelled bookings in the last 30 days</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">Cancelled bookings from the last 30 days</p>
                <Button
                  size="sm"
                  className="rounded-xl text-xs h-8 bg-amber-500 hover:bg-amber-600 text-white gap-1.5"
                  onClick={restoreAll}
                >
                  <RotateCcw className="w-3 h-3" /> Restore All ({recentlyCancelled.length})
                </Button>
              </div>
              {recentlyCancelled.map((b, i) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-card border border-red-200 rounded-2xl p-4 sm:p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground text-sm">{b.client_name}</h3>
                        <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">cancelled</span>
                        {b.price > 0 && <span className="font-heading text-sm font-black text-primary ml-auto">R{b.price}</span>}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{b.client_phone}</span>
                        <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />{b.preferred_date} {b.preferred_time ? `@ ${b.preferred_time}` : ""}</span>
                        <span className="flex items-center gap-1.5">💅 {b.service_detail}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="rounded-xl text-xs h-8 bg-amber-500 hover:bg-amber-600 text-white shrink-0"
                      onClick={() => updateStatus(b, "pending")}
                      disabled={updating === b.id}
                    >
                      {updating === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><RotateCcw className="w-3 h-3 mr-1" /> Restore</>}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          );
        })()}

        {/* Web Services Tab */}
        {activeTab === "webservices" && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-5xl mb-4">🌐</p>
            <p className="text-lg font-medium">Web Services & Support</p>
            <p className="text-sm mt-2">Payment processing, booking integrations, and technical support details coming soon.</p>
          </div>
        )}

        {/* WhatsApp Tab */}
        {activeTab === "whatsapp" && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">💬</p>
            <p className="text-lg font-medium text-foreground">WhatsApp Messaging Hub</p>
            <p className="text-sm mt-4 text-muted-foreground mb-6">Quick access to send WhatsApp messages to clients about their bookings.</p>
            <a
              href="https://wa.me/27798060310"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <Button className="rounded-xl bg-green-600 hover:bg-green-700 text-white">
                Open WhatsApp
              </Button>
            </a>
          </div>
        )}

        {/* Import / Migrate Tab */}
        {activeTab === "migrate" && (
          <div className="space-y-6 max-w-2xl">
            <div className="bg-card border border-border/50 rounded-2xl p-6">
              <h3 className="font-heading text-base font-semibold text-foreground mb-1">📥 Import Existing Bookings</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Paste your exported bookings JSON below (array of booking objects). This will import them into the new backend without overwriting existing ones.
              </p>
              <textarea
                rows={10}
                placeholder={'[\n  {\n    "id": "...",\n    "client_name": "Naledi",\n    "client_phone": "0791234567",\n    "service_detail": "Acrylic Nails",\n    "preferred_date": "2026-05-01",\n    "preferred_time": "10:00",\n    "status": "confirmed"\n  }\n]'}
                value={migrateJson}
                onChange={e => { setMigrateJson(e.target.value); setMigrateResult(null); }}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="flex gap-3 mt-4 flex-wrap">
                <Button
                  onClick={runMigration}
                  disabled={migrating || !migrateJson.trim()}
                  className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                >
                  {migrating ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</> : "📥 Import Bookings"}
                </Button>
                {migrateJson && (
                  <Button variant="outline" onClick={() => { setMigrateJson(""); setMigrateResult(null); }} className="rounded-xl">
                    Clear
                  </Button>
                )}
              </div>
              {migrateResult && (
                <div className={`mt-4 rounded-xl p-4 text-sm ${migrateResult.error ? "bg-red-50 border border-red-200 text-red-800" : "bg-green-50 border border-green-200 text-green-800"}`}>
                  {migrateResult.error ? (
                    <p>❌ {migrateResult.error}</p>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-semibold">✅ Import complete!</p>
                      <p>Bookings imported: <strong>{migrateResult.importedBookings}</strong></p>
                      <p>Announcements imported: <strong>{migrateResult.importedAnnouncements}</strong></p>
                      {migrateResult.errors?.length > 0 && (
                        <p className="text-amber-700">⚠️ {migrateResult.errors.length} item(s) failed — check console.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
              <p className="font-semibold mb-1">💡 How to get your old bookings</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Go to your old admin dashboard</li>
                <li>Export or copy all bookings as JSON</li>
                <li>Paste the JSON array above and click Import</li>
                <li>Once imported successfully, you can delete this tab</li>
              </ol>
            </div>
          </div>
        )}

        {/* Stats - Only show for Services/Enrolled tabs */}
        {(activeTab === "services" || activeTab === "enrolled") && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Pending", count: counts.pending, color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" },                
                { label: "Confirmed", count: counts.confirmed, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
                { label: "Completed", count: counts.completed, color: "text-green-600", bg: "bg-green-50 border-green-200" },
                { label: "Cancelled", count: counts.cancelled, color: "text-red-600", bg: "bg-red-50 border-red-200" },
              ].map((stat) => (
                <div key={stat.label} className={`rounded-2xl border p-3 sm:p-4 ${stat.bg}`}>
                  <p className={`font-heading text-lg sm:text-2xl font-black ${stat.color}`}>{stat.count}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone or service..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 rounded-xl h-11"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full rounded-xl h-11">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ({counts.all})</SelectItem>
                  <SelectItem value="pending">Pending ({counts.pending})</SelectItem>
                  <SelectItem value="confirmed">Confirmed ({counts.confirmed})</SelectItem>
                  <SelectItem value="completed">Completed ({counts.completed})</SelectItem>
                  <SelectItem value="cancelled">Cancelled ({counts.cancelled})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bookings List */}
            {fetchError && (
              <div className="mb-6 bg-red-50 border border-red-300 rounded-2xl p-5 text-sm text-red-800">
                <p className="font-semibold mb-1">Failed to load bookings</p>
                <p>{fetchError}</p>
                <Button variant="outline" size="sm" onClick={fetchBookings} className="mt-3 rounded-xl gap-2 border-red-300 text-red-700 hover:bg-red-100">
                  <RefreshCw className="w-3 h-3" /> Retry
                </Button>
              </div>
            )}
            {loading && isInitialLoad ? (
              <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading bookings...
              </div>
            ) : filtered.length === 0 && !fetchError ? (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-4xl mb-3">📋</p>
                <p className="font-medium">No bookings found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Safe map with enhanced validation */}
                {Array.isArray(filtered) && filtered.map((b, i) => {
                  // Skip invalid entries
                  if (!b || typeof b !== 'object' || !b.id) {
                    console.warn('Skipping invalid booking entry:', b);
                    return null;
                  }
                  const StatusIcon = STATUS_ICONS[b.status] || Clock;
                  return (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="bg-card border border-border/50 rounded-2xl p-4 sm:p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        {/* Client info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-semibold text-foreground text-sm">{b.client_name}</h3>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[b.status]}`}>
                              <StatusIcon className="w-3 h-3" />
                              {b.status}
                            </span>
                            {b.price > 0 && (
                              <span className="font-heading text-sm font-black text-primary ml-auto">R{b.price}</span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3 shrink-0" />
                              <a href={`tel:${b.client_phone}`} className="hover:text-primary">{b.client_phone}</a>
                            </span>
                            {b.client_email && (
                              <span className="flex items-center gap-1.5">
                                <Mail className="w-3 h-3 shrink-0" />
                                <span className="truncate">{b.client_email}</span>
                              </span>
                            )}
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 shrink-0" />
                              {b.preferred_date} @ {b.preferred_time}
                            </span>
                            <span className="flex items-center gap-1.5">
                              💅 <span className="truncate">{b.service_detail}</span>
                            </span>
                          </div>

                          {b.notes && (
                            <p className="mt-2 text-xs italic text-muted-foreground bg-secondary/40 rounded-lg px-3 py-1.5">
                              "{b.notes}"
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row flex-wrap gap-2 shrink-0">
                          {b.status === "pending" && (
                            <Button
                              size="sm"
                              className="rounded-xl text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto justify-center"
                              onClick={() => updateStatus(b, "confirmed")}
                              disabled={updating === b.id}
                            >
                              {updating === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "✓ Confirm"}
                            </Button>
                          )}
                          {(b.status === "pending" || b.status === "confirmed") && (
                            <Button
                              size="sm"
                              className="rounded-xl text-xs h-8 bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto justify-center"
                              onClick={() => updateStatus(b, "completed")}
                              disabled={updating === b.id}
                            >
                              {updating === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Complete"}
                            </Button>
                          )}
                          {b.status !== "cancelled" && b.status !== "completed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl text-xs h-8 border-red-200 text-red-600 hover:bg-red-50 w-full sm:w-auto justify-center"
                              onClick={() => updateStatus(b, "cancelled")}
                              disabled={updating === b.id}
                            >
                              Cancel
                            </Button>
                          )}
                          {(b.status === "cancelled" || b.status === "completed") && (
                            <Button
                              size="sm"
                              className="rounded-xl text-xs h-8 bg-amber-500 hover:bg-amber-600 text-white w-full sm:w-auto justify-center"
                              onClick={() => updateStatus(b, "pending")}
                              disabled={updating === b.id}
                            >
                              {updating === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><RotateCcw className="w-3 h-3 mr-1" /> Restore</>}
                            </Button>
                          )}
                          <a
                            href={`https://wa.me/${(() => { const r = b.client_phone?.replace(/\D/g,'') || ''; return r.startsWith('27') ? r : r.startsWith('0') ? '27'+r.slice(1) : '27'+r; })()}?text=${encodeURIComponent(`Hi ${b.client_name}! 🌸 Your booking for ${b.service_detail} on ${b.preferred_date} at ${b.preferred_time} is confirmed. See you at Bloom Skills & Beauty! 💅`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto"
                          >
                            <Button size="sm" variant="outline" className="rounded-xl text-xs h-8 border-green-300 text-green-700 hover:bg-green-50 w-full sm:w-auto justify-center">
                              💬 WhatsApp
                            </Button>
                          </a>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl text-xs h-8 border-red-300 text-red-600 hover:bg-red-50 w-full sm:w-auto justify-center"
                            onClick={() => deleteBooking(b.id)}
                            disabled={updating === b.id}
                          >
                            🗑️ Delete
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function Admin() {
  const { user, isLoadingAuth } = useAuth();

  // Also check localStorage session
  const localSession = (() => {
    try { return JSON.parse(localStorage.getItem("bloom_admin_session")); } catch { return null; }
  })();

  const effectiveUser = user || localSession;

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!effectiveUser) return <LoginScreen />;
  if (effectiveUser.role !== "admin") return <NotAuthorized />;

  return <Dashboard />;
}
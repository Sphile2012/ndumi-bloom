import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, ChevronRight, ChevronLeft, CheckCircle2, User, Clock, ClipboardCheck, CalendarDays, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ndumie } from "@/api/ndumieClient";
import { timeSlots, saturdayTimeSlots } from "../lib/serviceData";

export default function Book() {
  const urlParams = new URLSearchParams(window.location.search);
  const isCourseBooking = urlParams.get("service") === "course";

  const STEPS = isCourseBooking
    ? [
        { id: 1, label: "Your Details", icon: User },
        { id: 2, label: "Course Dates", icon: CalendarDays },
        { id: 3, label: "Confirm", icon: ClipboardCheck },
        { id: 4, label: "Payment", icon: CreditCard },
      ]
    : [
        { id: 1, label: "Your Details", icon: User },
        { id: 2, label: "Date & Time", icon: Clock },
        { id: 3, label: "Confirm", icon: ClipboardCheck },
        { id: 4, label: "Payment", icon: CreditCard },
      ];

  const LAST_STEP = STEPS[STEPS.length - 1].id;
  const CONFIRM_STEP = 3;

  const initialForm = {
    client_name: "",
    client_phone: "",
    client_email: "",
    service_category: isCourseBooking ? "Beginner Nail Course" : "General",
    service_detail: isCourseBooking ? "2-Week Beginner Course" : "Appointment",
    price: isCourseBooking ? 3500 : 0,
    preferred_time: "",
    notes: "",
  };

  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(null);
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
  const [form, setForm] = useState(initialForm);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState("");
  const [slotsCache, setSlotsCache] = useState({});
  const [bookingCreated, setBookingCreated] = useState(null);

  const fetchBookedSlots = async (selectedDate) => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    if (slotsCache[dateStr]) { setBookedSlots(slotsCache[dateStr]); return; }
    setLoadingSlots(true);
    try {
      const result = await ndumie.entities.Booking.filter({ preferred_date: dateStr });
      // Ensure result is a valid array before using .map()
      const bookings = Array.isArray(result) ? result : [];
      const slots = bookings
        .filter(b => b && b.status !== "cancelled")
        .map(b => b.preferred_time);
      setSlotsCache(prev => ({ ...prev, [dateStr]: slots }));
      setBookedSlots(slots);
    } catch (err) {
      console.error("Failed to fetch booked slots:", err);
      setBookedSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateSelect = (d) => {
    setDate(d);
    setForm(prev => ({ ...prev, preferred_time: "" }));
    fetchBookedSlots(d);
  };

  const isValidPhone = (phone) => /^[0-9\s\-+()]{7,}$/.test(phone.trim());
  const step1Valid = form.client_name.trim().length >= 2 && isValidPhone(form.client_phone);
  const step2Valid = isCourseBooking ? (dateRange.from && dateRange.to) : (date && form.preferred_time);

  const phoneError = form.client_phone && !isValidPhone(form.client_phone) ? "Please enter a valid phone number" : "";
  const nameError = form.client_name && form.client_name.trim().length < 2 ? "Please enter your full name" : "";

  const canProceed = () => {
    if (step === 1) return step1Valid;
    if (step === 2) return step2Valid;
    return true;
  };

  const handleNext = async () => {
    // Save booking when moving from Confirm (step 3) to Payment (step 4)
    if (step === CONFIRM_STEP) {
      setLoading(true);
      setError("");
      try {
        const bookingData = {
          ...form,
          preferred_date: isCourseBooking ? format(dateRange.from, "yyyy-MM-dd") : format(date, "yyyy-MM-dd"),
          preferred_time: isCourseBooking ? "All Day" : form.preferred_time,
          notes: isCourseBooking && dateRange.to
            ? `Course end date: ${format(dateRange.to, "yyyy-MM-dd")}`
            : form.notes,
          status: "pending",
        };
        const created = await ndumie.entities.Booking.create(bookingData);
        // Merge local bookingData with API response so all fields are always present
        setBookingCreated({ ...bookingData, ...(created || {}) });
        setStep(step + 1);
        setError("");
      } catch (err) {
        console.error("Booking error:", err);
        setError("Could not save your booking. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    } else {
      setStep(step + 1);
      setError("");
    }
  };

  const slideVariants = {
    enter: { x: 60, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -60, opacity: 0 },
  };

  const isLastStep = step === LAST_STEP;

  return (
    <div className="min-h-screen py-8 sm:py-12 md:py-20 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <p className="text-primary text-sm font-medium uppercase tracking-widest mb-2">Reserve Your Spot</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
            {isCourseBooking ? "Enrol in the Nail Course" : "Book an Appointment"}
          </h1>
          <p className="text-muted-foreground text-sm mt-2">At <span className="italic font-semibold text-foreground">Bloom</span> Skills &amp; Beauty · Sangro House, Durban</p>
          <div className="mt-3 inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-2 rounded-full">
            {isCourseBooking ? '💳 R1500 non-refundable registration deposit to enrol' : '💳 R100 non-refundable deposit required to secure your slot'}
          </div>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-6 sm:mb-10">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-2 sm:left-5 right-2 sm:right-5 h-0.5 bg-border z-0" />
            <div
              className="absolute top-5 left-2 sm:left-5 h-0.5 bg-primary z-0 transition-all duration-500"
              style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%`, maxWidth: "calc(100% - 32px)" }}
            />
            {STEPS.map((s) => {
              const Icon = s.icon;
              const done = step > s.id;
              const active = step === s.id;
              return (
                <div key={s.id} className="flex flex-col items-center gap-2 z-10">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${done ? "bg-primary border-primary text-primary-foreground" : active ? "bg-background border-primary text-primary shadow-lg shadow-primary/20" : "bg-background border-border text-muted-foreground"}`}>
                    {done ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Icon className="w-3 h-3 sm:w-4 sm:h-4" />}
                  </div>
                  <span className={`text-xs font-medium transition-colors ${active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-800">⚠️ {error}</div>
        )}

        <div ref={cardRef} className="bg-card rounded-2xl sm:rounded-3xl border border-border/50 shadow-xl shadow-primary/5 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="p-4 sm:p-6 md:p-8 lg:p-10"
            >

              {/* STEP 1: Personal Details */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-heading text-xl font-bold text-foreground mb-1 flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" /> Your Details
                    </h2>
                    <p className="text-sm text-muted-foreground">Tell us a little about yourself.</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
                      <Input id="name" placeholder="e.g. Naledi Dlamini" value={form.client_name}
                        onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                        className={`mt-1.5 rounded-xl h-11 ${nameError ? "border-red-500" : ""}`} />
                      {nameError && <p className="text-xs text-red-600 mt-1">{nameError}</p>}
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium">WhatsApp / Phone Number *</Label>
                      <Input id="phone" placeholder="e.g. 079 806 0310" value={form.client_phone}
                        onChange={(e) => setForm({ ...form, client_phone: e.target.value })}
                        className={`mt-1.5 rounded-xl h-11 ${phoneError ? "border-red-500" : ""}`} />
                      {phoneError && <p className="text-xs text-red-600 mt-1">{phoneError}</p>}
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium">Email <span className="text-muted-foreground font-normal">(optional)</span></Label>
                      <Input id="email" type="email" placeholder="your@email.com" value={form.client_email}
                        onChange={(e) => setForm({ ...form, client_email: e.target.value })}
                        className="mt-1.5 rounded-xl h-11" />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2 (course): Date Range */}
              {isCourseBooking && step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-heading text-xl font-bold text-foreground mb-1 flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-primary" /> Choose Course Dates
                    </h2>
                    <p className="text-sm text-muted-foreground">Select your start date, then your end date (2-week course).</p>
                  </div>
                  <div className="flex justify-center overflow-x-auto">
                    <Calendar mode="range" selected={dateRange}
                      onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
                      disabled={(d) => { const today = new Date(); today.setHours(0,0,0,0); return d < today || d.getDay() === 0; }}
                      className="rounded-xl border border-border text-sm sm:text-base" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-secondary/50 rounded-xl p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                      <p className="text-sm font-semibold text-foreground">{dateRange.from ? format(dateRange.from, "d MMM yyyy") : "Not selected"}</p>
                    </div>
                    <div className="bg-secondary/50 rounded-xl p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">End Date</p>
                      <p className="text-sm font-semibold text-foreground">{dateRange.to ? format(dateRange.to, "d MMM yyyy") : "Not selected"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2 (non-course): Date & Time */}
              {!isCourseBooking && step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-heading text-xl font-bold text-foreground mb-1 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" /> Pick a Date &amp; Time
                    </h2>
                    <p className="text-sm text-muted-foreground">Choose your preferred appointment slot.</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Date *</Label>
                    <div className="flex justify-center overflow-x-auto">
                      <Calendar mode="single" selected={date} onSelect={handleDateSelect}
                        disabled={(d) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return d < today || d.getDay() === 0;
                        }}
                        className="rounded-xl border border-border"
                      />
                    </div>
                    {date && <p className="text-center text-sm font-medium text-primary mt-2">📅 {format(date, "EEEE, d MMMM yyyy")}</p>}
                    <p className="text-center text-xs text-muted-foreground mt-2">🚫 Closed on Sundays &nbsp;·&nbsp; Saturday last slot 14:00</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Time *</Label>
                    {!date ? (
                      <p className="text-sm text-muted-foreground py-3">👆 Please select a date first</p>
                    ) : loadingSlots ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                        <Loader2 className="w-4 h-4 animate-spin" /> Checking availability...
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {(date && date.getDay() === 6 ? saturdayTimeSlots : timeSlots).map((t) => {
                          const isBooked = bookedSlots.includes(t);
                          return (
                            <button key={t} type="button" onClick={() => !isBooked && setForm({ ...form, preferred_time: t })}
                              disabled={isBooked}
                              className={`py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                                isBooked
                                  ? "border-border bg-muted text-muted-foreground line-through cursor-not-allowed opacity-40"
                                  : form.preferred_time === t
                                  ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                  : "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                              }`}>
                              {t}
                              {isBooked && <span className="block text-xs mt-0.5 not-italic opacity-70">Booked</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3: Confirm */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-heading text-xl font-bold text-foreground mb-1 flex items-center gap-2">
                      <ClipboardCheck className="w-5 h-5 text-primary" /> Review &amp; Confirm
                    </h2>
                    <p className="text-sm text-muted-foreground">Please confirm your details below.</p>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "Name", value: form.client_name, emoji: "👤" },
                      { label: "Phone", value: form.client_phone, emoji: "📱" },
                      { label: "Email", value: form.client_email || "Not provided", emoji: "📧" },
                      ...(isCourseBooking
                        ? [
                            { label: "Course", value: form.service_detail, emoji: "🎓" },
                            { label: "Start Date", value: dateRange.from ? format(dateRange.from, "EEEE, d MMMM yyyy") : "—", emoji: "📅" },
                            { label: "End Date", value: dateRange.to ? format(dateRange.to, "EEEE, d MMMM yyyy") : "—", emoji: "📅" },
                          ]
                        : [
                            { label: "Date", value: date ? format(date, "EEEE, d MMMM yyyy") : "—", emoji: "📅" },
                            { label: "Time", value: form.preferred_time, emoji: "⏰" },
                          ]
                      ),
                    ].map((row) => (
                      <div key={row.label} className="flex items-start gap-3 py-3 border-b border-border/40 last:border-0">
                        <span className="text-xl shrink-0">{row.emoji}</span>
                        <div className="flex-1 flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{row.label}</span>
                          <span className="text-sm font-semibold text-foreground text-right">{row.value}</span>
                        </div>
                      </div>
                    ))}
                    {form.price > 0 && (
                      <div className="mt-2 bg-primary/5 border border-primary/15 rounded-2xl p-5 flex items-center justify-between">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest">Total Price</p>
                        <p className="font-heading text-3xl font-black text-primary">R{form.price}</p>
                      </div>
                    )}
                  </div>
                  {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">⚠️ {error}</div>}
                </div>
              )}

              {/* STEP 4: Payment */}
              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-heading text-xl font-bold text-foreground mb-1 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" /> Pay Your Deposit
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {isCourseBooking ? "Pay the R1500 non-refundable registration deposit to secure your spot." : "Pay the R100 non-refundable deposit to confirm your booking."}
                    </p>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-1">FNB Account</p>
                    <p className="font-heading text-3xl font-black text-primary tracking-widest">63193553469</p>
                    <p className="text-sm text-muted-foreground mt-1">Branch: 250355</p>
                    <p className="text-sm text-muted-foreground mt-1">Reference: <span className="font-semibold text-foreground">{form.client_name || "Your Name"}</span></p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
                    <p className="font-semibold mb-1">💳 Deposit Required</p>
                    <p>Pay <strong>{isCourseBooking ? "R1500" : "R100"}</strong> via FNB direct transfer, then send proof via WhatsApp below.</p>
                  </div>
                  <a href={`https://wa.me/27798060310?text=${encodeURIComponent(`Hi Bloom Skills & Beauty! I've just made my ${isCourseBooking ? 'R1500 registration' : 'R100'} deposit for ${form.client_name}.\nDate: ${isCourseBooking ? (dateRange.from ? format(dateRange.from, 'd MMM yyyy') : '') : (date ? format(date, 'd MMM yyyy') : '')}\n\nPlease find my proof of payment attached. Thank you!`)}`}
                    target="_blank" rel="noopener noreferrer" className="block">
                    <button className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium text-sm transition-colors">
                      💬 Send Proof of Payment via WhatsApp
                    </button>
                  </a>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="px-4 sm:px-6 md:px-8 pb-6 sm:pb-8 flex items-center justify-between gap-4">
            {step > 1 ? (
              <Button variant="outline" onClick={() => { setStep(step - 1); setError(""); }} className="rounded-xl px-5">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            ) : <div />}
            {!isLastStep ? (
              <Button onClick={handleNext} disabled={!canProceed() || loading}
                className="rounded-xl px-6 bg-primary hover:bg-primary/90 text-primary-foreground ml-auto disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <>Continue <ChevronRight className="w-4 h-4 ml-1" /></>}
              </Button>
            ) : (
              <Button onClick={() => navigate("/booking-confirmed", { state: { booking: bookingCreated } })}
                size="lg"
                className="rounded-xl px-8 bg-primary hover:bg-primary/90 text-primary-foreground ml-auto shadow-lg shadow-primary/20">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {isCourseBooking ? "I've Paid — Enrol Me" : "I've Paid — Confirm Booking"}
              </Button>
            )}
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-6">
          We'll confirm your {isCourseBooking ? "enrolment" : "appointment"} via WhatsApp shortly 💬
        </p>
      </div>
    </div>
  );
}

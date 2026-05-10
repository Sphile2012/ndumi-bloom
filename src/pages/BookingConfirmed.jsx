import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageCircle, Mail, ArrowLeft, CheckCircle2, CalendarDays, Clock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function BookingConfirmed() {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state?.booking;
  const firstName = booking?.client_name?.split(" ")[0] || "there";
  const isCourse = booking?.service_category === "Beginner Nail Course";

  if (!booking) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-4xl">💅</p>
        <h2 className="font-heading text-xl font-bold text-foreground">Session expired</h2>
        <p className="text-sm text-muted-foreground">We couldn't find your booking details. Please book again.</p>
        <Button onClick={() => navigate("/book")} className="rounded-xl bg-primary text-primary-foreground">
          Book Again
        </Button>
      </div>
    );
  }

  const whatsappMsg = isCourse
    ? `Hi Bloom Skills & Beauty! 🌸\n\nI've just enrolled in the *Beginner Nail Course* online!\n\n👤 *Name:* ${booking.client_name}\n📞 *Phone:* ${booking.client_phone}\n🎓 *Course:* ${booking.service_detail}\n📅 *Start Date:* ${booking.preferred_date}\n💰 *Course Fee:* R${booking.price}\n\nPlease find my *R500 registration deposit* proof of payment attached. Thank you! 💅✨`
    : `Hi Bloom Skills & Beauty! 🌸\n\nI've just completed my booking online!\n\n👤 *Name:* ${booking.client_name}\n📞 *Phone:* ${booking.client_phone}\n💅 *Service:* ${booking.service_detail}\n📅 *Date:* ${booking.preferred_date}\n⏰ *Time:* ${booking.preferred_time}\n\nPlease find my *R100 deposit* proof of payment attached. See you soon! 💅`;

  const emailSubject = isCourse
    ? `Course Enrolment - ${booking.client_name}`
    : `Booking Confirmation - ${booking.client_name}`;

  const emailBody = isCourse
    ? `Hi Bloom Skills & Beauty,\n\nI have just enrolled in the Beginner Nail Course online.\n\nName: ${booking.client_name}\nPhone: ${booking.client_phone}\nEmail: ${booking.client_email || "Not provided"}\nCourse: ${booking.service_detail}\nStart Date: ${booking.preferred_date}\nCourse Fee: R${booking.price}\n\nI have attached my R500 registration deposit proof of payment.\n\nThank you!\n${booking.client_name}`
    : `Hi Bloom Skills & Beauty,\n\nI have just completed my booking online.\n\nName: ${booking.client_name}\nPhone: ${booking.client_phone}\nEmail: ${booking.client_email || "Not provided"}\nService: ${booking.service_detail}\nDate: ${booking.preferred_date}\nTime: ${booking.preferred_time}\n\nI have attached my R100 deposit proof of payment.\n\nSee you soon!\n${booking.client_name}`;

  const whatsappUrl = `https://wa.me/27798060310?text=${encodeURIComponent(whatsappMsg)}`;
  const emailUrl = `mailto:bloomskillsandbeauty@icloud.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  const sendBoth = () => {
    window.open(whatsappUrl, "_blank");
    setTimeout(() => { window.location.href = emailUrl; }, 800);
  };

  return (
    <div className="py-16 px-4 sm:px-6 min-h-[80vh] flex items-center justify-center bg-gradient-to-b from-pink-50/40 to-background">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full"
      >
        <div className="bg-white rounded-3xl shadow-xl border border-pink-100 overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-[#c06070] to-[#e8a0a8] px-5 sm:px-8 py-8 sm:py-10 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 180 }}
              className="text-5xl mb-3"
            >
              {isCourse ? "🎓" : "💅"}
            </motion.div>
            <h1 className="font-heading text-3xl font-bold text-white mb-1">
              {isCourse ? "You're enrolled!" : "You're all booked!"}
            </h1>
            <p className="text-white/85 text-sm">
              Hey {firstName}, we can't wait to {isCourse ? "teach you" : "see you"} 🌸
            </p>
          </div>

          <div className="px-5 sm:px-7 py-5 sm:py-7 space-y-5">

            {/* Status */}
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
              <Clock className="w-4 h-4 shrink-0" />
              <span>
                Your {isCourse ? "enrolment" : "booking"} is <strong>pending confirmation</strong> — we'll WhatsApp you shortly to confirm.
              </span>
            </div>

            {/* Summary */}
            <div className="bg-pink-50/60 border border-pink-100 rounded-2xl p-5 space-y-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#c06070] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> {isCourse ? "Enrolment Summary" : "Booking Summary"}
              </p>
              <div className="space-y-2 text-foreground">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isCourse ? "Course" : "Service"}</span>
                  <span className="font-semibold text-right max-w-[55%]">{booking.service_detail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" /> {isCourse ? "Start Date" : "Date"}
                  </span>
                  <span className="font-semibold">{booking.preferred_date}</span>
                </div>
                {!isCourse && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Time
                    </span>
                    <span className="font-semibold">{booking.preferred_time}</span>
                  </div>
                )}
                {booking.price > 0 && (
                  <div className="flex justify-between pt-2 border-t border-pink-200">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-bold text-[#c06070] text-base">R{booking.price}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Banking */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-sm">
              <p className="font-bold text-blue-900 mb-3">🏦 Payment Details</p>
              <div className="space-y-1.5 text-blue-800 text-xs">
                <div className="flex justify-between"><span>Bank</span><span className="font-semibold">FNB</span></div>
                <div className="flex justify-between"><span>Account Name</span><span className="font-semibold">Bloom Skills & Beauty</span></div>
                <div className="flex justify-between"><span>Account Number</span><span className="font-semibold">63193553469</span></div>
                <div className="flex justify-between"><span>Branch Code</span><span className="font-semibold">250355</span></div>
                <div className="flex justify-between"><span>Reference</span><span className="font-semibold">{booking.client_name}</span></div>
              </div>
              <p className="text-xs text-blue-700 mt-3 font-medium">
                💳 Deposit: <strong>{isCourse ? "R500 registration fee" : "R100 to secure your slot"}</strong>
              </p>
            </div>

            {/* Next step */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-800 flex gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-green-600" />
              <div>
                <p className="font-semibold mb-1">Thank you for choosing Bloom Skills & Beauty!</p>
                <p className="text-xs leading-relaxed">
                  Please arrive at least <strong>15 minutes early</strong>. If you arrive 15 minutes or more late, your booking will be automatically cancelled. To cancel or reschedule, notify us at least <strong>24 hours in advance</strong>. 🌸
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-1">
              {/* Send both at once */}
              <Button
                size="lg"
                className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-md gap-2"
                onClick={sendBoth}
              >
                <MessageCircle className="w-5 h-5" />
                <Mail className="w-4 h-4" />
                Send Proof via WhatsApp & Email
              </Button>

              {/* Individual options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full rounded-xl gap-1.5 border-green-300 text-green-700 hover:bg-green-50">
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </Button>
                </a>
                <a href={emailUrl}>
                  <Button variant="outline" className="w-full rounded-xl gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50">
                    <Mail className="w-4 h-4" /> Email
                  </Button>
                </a>
              </div>

              <Button
                variant="outline"
                className="w-full rounded-xl gap-2"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </div>

          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-5">
          Questions? WhatsApp us at{" "}
          <a href="https://wa.me/27798060310" className="text-[#c06070] font-medium">
            079 806 0310
          </a>
        </p>
      </motion.div>
    </div>
  );
}

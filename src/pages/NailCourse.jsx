import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const curriculum = [
  { text: "Nail shaping & prepping", emoji: "✂️" },
  { text: "Acrylic application", emoji: "💅" },
  { text: "Nail prepping and fitting", emoji: "🔧" },
  { text: "Health and safety precautions", emoji: "🛡️" },
  { text: "Various nail art incl. ombre", emoji: "🎨" },
  { text: "Marbling techniques", emoji: "🌊" },
  { text: "Classic French cut out", emoji: "🤍" },
  { text: "3D Art", emoji: "⭐" },
];

const benefits = [
  { text: "Attendance Certificate", emoji: "🎓" },
  { text: "2 Months Mentorship", emoji: "🤝" },
  { text: "Training Kit", emoji: "🧰" },
  { text: "Practical Hands-On Experience", emoji: "💅" },
  { text: "Business Guidance Tips", emoji: "💼" },
];

const stats = [
  { label: "Duration", value: "2 Weeks", emoji: "⏰" },
  { label: "Course Fee", value: "R3,500", emoji: "💰" },
  { label: "Certificate", value: "Included", emoji: "🎓" },
  { label: "Mentorship", value: "2 Months", emoji: "🤝" },
];

export default function NailCourse() {
  return (
    <div className="py-12 sm:py-20">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center mb-12">
        <p className="text-primary text-sm font-medium uppercase tracking-widest mb-3">Start Your Journey</p>
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground mb-2">
          💅 Beginner Nail Course 🎓
        </h1>
        <p className="font-heading italic text-primary text-lg mb-4">Bloom Skills & Beauty</p>
        <p className="text-muted-foreground max-w-lg mx-auto text-sm">
          Learn essential nail techniques from scratch and bloom into your beauty career. From zero to professional in just 2 weeks!
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Course Details Message */}
        <div className="rounded-3xl border border-border/50 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 p-6 sm:p-10 md:p-14 mb-12 text-center">
          <span className="text-5xl block mb-6">🎓💅</span>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-4">Transform Your Passion Into a Career</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed mb-6">
            Our comprehensive 2-week beginner nail course includes everything you need to master professional nail artistry:
          </p>
          <div className="max-w-2xl mx-auto space-y-3 text-left mb-8">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✂️</span>
              <span className="text-sm text-foreground"><strong>Full Curriculum:</strong> Nail shaping, acrylic application, French techniques, 3D art, health & safety, and more</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎁</span>
              <span className="text-sm text-foreground"><strong>Complete Package:</strong> Attendance certificate, 2-month mentorship, professional training kit, and hands-on experience</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">💰</span>
              <span className="text-sm text-foreground"><strong>Investment:</strong> R3,500 total (R1500 non-refundable registration)</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-8">Limited spots available. Enroll today and start your beauty career journey! 🌸</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book?service=course">
              <Button size="lg" className="rounded-full px-12 py-6 text-base font-bold shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground">
                Book a Course 🌸
              </Button>
            </Link>
            <div className="flex items-center gap-2 px-6 py-3 rounded-full border-2 border-primary bg-primary/5">
              <span className="text-lg">💳</span>
              <div className="text-left">
                <p className="text-xs text-muted-foreground">Enroll with Registration Deposit</p>
                <p className="font-heading text-lg font-bold text-primary">R1500 Non-Refundable</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

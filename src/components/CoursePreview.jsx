import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

const learnItems = [
  "Nail shaping",
  "Acrylic application",
  "Nail prepping and fitting",
  "Health and safety precautions",
  "Various nail art incl ombre",
  "Marbling",
  "Classic French cut out",
  "3D Art",
];

const getItems = [
  "Attendance Certificate",
  "2 Months Mentorship",
  "Training Kit",
  "Practical Hands-On Experience",
  "Business Guidance Tips",
];

export default function CoursePreview({ courseImage }) {
  return (
    <section className="py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-primary text-sm font-medium uppercase tracking-widest mb-3">Learn With Us</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
              <span>💅</span> Beginner Nail Course <span>🎓</span>
            </h2>
            <div className="flex items-baseline gap-3 mb-6">
              <span className="font-heading text-4xl font-bold text-primary">R3,500</span>
              <span className="text-muted-foreground">• 2 Weeks</span>
            </div>

            <p className="text-muted-foreground leading-relaxed mb-8">
              Start your journey in the beauty industry! Learn essential nail techniques from scratch with our comprehensive beginner course.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div>
                <p className="font-medium text-foreground text-sm mb-3">What you'll learn:</p>
                <ul className="space-y-2">
                  {learnItems.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground text-sm mb-3">What you'll get:</p>
                <ul className="space-y-2">
                  {getItems.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-6">
              Registration fee: R1500 (non-refundable)
            </p>

            <Link to="/book?service=course">
              <Button size="lg" className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground">
                Enrol Now
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="rounded-3xl overflow-hidden shadow-2xl shadow-primary/10">
              <img
                src={courseImage}
                alt="Bloom Skills & Beauty Nail Course"
                loading="lazy"
                decoding="async"
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-card rounded-2xl p-6 shadow-xl border border-border/50">
              <p className="font-heading text-3xl font-bold text-primary">2</p>
              <p className="text-sm text-muted-foreground">Weeks Duration</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const stats = [
  { value: "8am–4pm", label: "Daily Hours" },
  { value: "R150+", label: "Starting Price" },
  { value: "R3,500", label: "Nail Course" },
];

export default function HeroSection({ heroImage }) {
  return (
    <section className="relative min-h-[95vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Beautiful nail art by Bloom Skills & Beauty"
          fetchPriority="high"
          decoding="async"
          className="w-full h-full object-cover scale-105"
          style={{ transformOrigin: "center center" }}
        />
        {/* Multi-layer gradient — creamy nude overlay */}
        <div className="absolute inset-0" style={{background: 'linear-gradient(to right, rgba(20,12,8,0.88) 0%, rgba(20,12,8,0.55) 55%, rgba(20,12,8,0.05) 100%)'}} />
        <div className="absolute inset-0" style={{background: 'linear-gradient(to top, rgba(20,12,8,0.45) 0%, transparent 60%)'}} />
      </div>

      {/* Decorative gold line */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-amber-400/60 to-transparent" />

      <div className="relative max-w-6xl mx-auto px-6 sm:px-8 py-24 w-full">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-400/40 bg-amber-400/10 text-amber-300 text-xs font-medium tracking-widest uppercase mb-8">
              <Sparkles className="w-3 h-3" />
              Sangro House · Durban
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-heading leading-none mb-6"
          >
            <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white tracking-tight drop-shadow-sm">
              Bloom
            </span>
            <span
              className="block text-amber-300 font-light tracking-[0.4em] uppercase mt-3"
              style={{ fontSize: "clamp(10px, 1.2vw, 15px)" }}
            >
              Skills &amp; Beauty
            </span>
            <span className="block text-white/80 font-heading italic font-light text-xl sm:text-2xl md:text-3xl mt-4">
              Where nails meet artistry.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-white/70 text-lg leading-relaxed mb-10 max-w-md"
          >
            Professional nails &amp; beginner nail courses — crafted with care in the heart of Durban.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-col sm:flex-row gap-4 mb-16"
          >
            <Link to="/book">
              <Button
                size="lg"
                className="rounded-full px-8 text-base bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/30 gap-2 group"
              >
                Book Appointment
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/services" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto rounded-full px-8 text-base bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/30"
              >
                View Services
              </Button>
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-wrap items-center gap-6 sm:gap-8 pt-8 border-t border-white/10"
          >
            {stats.map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-6 sm:gap-8">
                <div>
                  <p className="font-heading text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/50 uppercase tracking-widest mt-0.5">{stat.label}</p>
                </div>
                {i < stats.length - 1 && (
                  <div className="w-px h-10 bg-white/15 hidden sm:block" />
                )}
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
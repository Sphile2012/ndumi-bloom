import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { aboutImage } from "@/lib/images";

const services = [
  {
    title: "Nail Services",
    description: "Acrylic extensions, gel services, pedicures & stunning designs — from classic to bold.",
    icon: "💅",
    from: "R150",
    image: aboutImage,
    link: "/services#nails",
  },
  {
    title: "Nail Course",
    description: "2-week beginner course with certificate, mentorship & training kit included.",
    icon: "💅🎓",
    from: "R3500",
    image: aboutImage,
    link: "/nail-course",
  },
];

export default function ServicesPreview() {
  return (
    <section className="py-24 px-4 sm:px-6 bg-secondary/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-primary text-sm font-medium uppercase tracking-widest mb-3">What We Offer</p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">Our Services</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
          {services.map((service) => (
            <div
              key={service.title}
              className="bg-card rounded-3xl border border-border/50 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 group overflow-hidden will-change-transform"
            >
              <div className="w-full h-56 overflow-hidden relative">
                <img
                  src={service.image}
                  alt={service.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-4 left-4">
                  <span className="text-2xl">{service.icon}</span>
                </div>
              </div>
              <div className="p-7">
                <h3 className="font-heading text-xl font-semibold text-foreground mb-3">{service.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">{service.description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-heading text-lg font-bold text-primary">From {service.from}</span>
                  <Link to={service.link} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors group/link">
                    View Details
                    <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/book">
            <Button size="lg" className="rounded-full px-10 bg-primary hover:bg-primary/90 text-primary-foreground">
              Book Your Appointment
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
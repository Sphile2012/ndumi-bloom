import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Clock, Heart } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function Footer() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  return (
    <footer className="bg-foreground text-background/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="font-heading text-2xl font-bold text-background mb-4">
              <span className="text-primary font-black">Bloom</span>
              <span className="block text-xs font-body font-light tracking-widest text-background/60 uppercase mt-1">Skills &amp; Beauty</span>
            </h3>
            <p className="text-sm leading-relaxed opacity-70">
              Step into a top-notch salon experience where beauty meets skill. Bloom into your beauty potential with us.
            </p>
          </div>

          <div>
            <h4 className="font-heading text-lg font-medium text-background mb-4">Quick Links</h4>
            <div className="space-y-3">
              {[
                { label: "Services & Prices", to: "/services" },
                { label: "Nail Course", to: "/nail-course" },
                { label: "Book Appointment", to: "/book" },
                { label: "Gallery", to: "/gallery" },
                { label: "Contact Us", to: "/contact" },
               ...(isAdmin ? [{ label: "Admin Dashboard", to: "/admin" }] : []),
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="block text-sm opacity-70 hover:opacity-100 transition-opacity"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-heading text-lg font-medium text-background mb-4">Contact</h4>
            <div className="space-y-3 text-sm">
              <a href="https://maps.google.com/?q=Sangro+House+Durban" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 opacity-70 hover:opacity-100 transition-opacity">
                <MapPin className="w-4 h-4 shrink-0" />
                Sangro House, Durban
              </a>
              <a href="tel:+27798060310" className="flex items-center gap-3 opacity-70 hover:opacity-100 transition-opacity">
                <Phone className="w-4 h-4 shrink-0" />
                079 806 0310
              </a>
              <a href="mailto:bloomskillsandbeauty@icloud.com" className="flex items-center gap-3 opacity-70 hover:opacity-100 transition-opacity">
                <Mail className="w-4 h-4 shrink-0" />
                bloomskillsandbeauty@icloud.com
              </a>
              <div className="flex items-center gap-3 opacity-70">
                <Clock className="w-4 h-4 shrink-0" />
                Mon–Sat: 8am – 4pm (Closed Sundays)
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-background/10 mt-12 pt-8 text-center text-xs opacity-50">
          <p className="flex items-center justify-center gap-1">
            Made with <Heart className="w-3 h-3 text-primary fill-primary" /> Bloom Skills & Beauty © {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* Floating WhatsApp Button — opens WhatsApp app directly */}
      <a
        href="https://wa.me/27798060310?text=Hi%20Bloom%20Skills%20%26%20Beauty!%20I'd%20like%20to%20make%20an%20enquiry."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-2xl transition-all hover:scale-110"
        aria-label="WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </footer>
  );
}
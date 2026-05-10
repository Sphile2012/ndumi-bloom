import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { galleryImages } from "@/lib/images";

const images = galleryImages;

export default function Gallery() {
  return (
    <div className="py-12 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <p className="text-primary text-sm font-medium uppercase tracking-widest mb-3">Our Work</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground mb-2">
            <span className="text-primary font-black">Bloom</span>
            <span className="block text-2xl font-light text-muted-foreground mt-1">Skills &amp; Beauty Gallery</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            A glimpse into the beauty we create at Bloom Skills &amp; Beauty.
          </p>
        </motion.div>

        {/* Clean Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl overflow-hidden aspect-square"
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-full object-cover"
              />
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16 p-6 sm:p-10 rounded-3xl"
          style={{ background: "linear-gradient(135deg, #fdf6f7, #fef9f0)", border: "1px solid rgba(192,96,112,0.12)" }}
        >
          <span className="text-4xl block mb-4">💅🪭🌸</span>
          <h3 className="font-heading text-2xl font-bold text-foreground mb-3 italic">
            Love what you see?
          </h3>
          <p className="text-muted-foreground text-sm mb-6">Book your appointment and let us create something beautiful for you.</p>
          <Link to="/book">
            <Button size="lg" className="rounded-full px-12 py-6 text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
              Book Your Service ✨
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
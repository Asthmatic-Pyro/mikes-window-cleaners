import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPublishedTestimonials } from "@/lib/follow/api";
import type { Testimonial } from "@/lib/follow/types";

export default function TestimonialsStrip() {
  const [rows, setRows] = useState<Testimonial[]>([]);

  useEffect(() => {
    void getPublishedTestimonials()
      .then((list) => setRows(list.slice(0, 3)))
      .catch(() => setRows([]));
  }, []);

  return (
    <section className="section-pad mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Reviews</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight">What people say</h2>
        </div>
        <Link to="/reviews" className="btn-secondary text-sm">
          Review me
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No published reviews yet. Be the first.</p>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {rows.map((row) => (
            <li key={row.id} className="rounded-md border border-white/60 bg-white/55 p-4">
              <p className="text-sm leading-relaxed">&ldquo;{row.final_text}&rdquo;</p>
              <p className="mt-3 text-xs font-semibold text-muted-foreground">
                {row.display_name}
                {row.city ? ` · ${row.city}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

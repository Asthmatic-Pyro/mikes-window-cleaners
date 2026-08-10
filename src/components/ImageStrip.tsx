const images = [
  {
    src: "/images/storefront-2.jpg",
    alt: "Storefront glass along a commercial street",
  },
  {
    src: "/images/pexels-dirty1.jpg",
    alt: "Cloudy, streaked window glass before a professional clean",
  },
  {
    src: "/images/storefront-3.jpg",
    alt: "Bright commercial storefront after clearer glass",
  },
  {
    src: "/images/pexels-storefront.jpg",
    alt: "Shop windows facing the sidewalk",
  },
];

export default function ImageStrip() {
  return (
    <section aria-label="Storefront and glass work" className="relative overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-4">
        {images.map((image, i) => (
          <div key={image.src} className="relative aspect-[4/5] overflow-hidden md:aspect-[3/4]">
            <img
              src={image.src}
              alt={image.alt}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-[1.04]"
              style={{ animationDelay: `${i * 60}ms` }}
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, transparent 55%, hsl(210 40% 8% / 0.35) 100%)",
              }}
            />
          </div>
        ))}
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-center px-4 pb-8 pt-24 md:pb-10"
        style={{
          background: "linear-gradient(180deg, transparent 0%, hsl(210 40% 8% / 0.55) 100%)",
        }}
      >
        <p className="max-w-xl text-center font-display text-lg font-semibold tracking-tight text-white sm:text-xl md:text-2xl">
          Clear glass changes how a place feels — from the curb in.
        </p>
      </div>
    </section>
  );
}

interface PageHeroProps {
  imageUrl: string;
  title: string;
  subtitle?: string;
  overlay?: string;
  height?: string;
}

export function PageHero({
  imageUrl,
  title,
  subtitle,
  overlay = "bg-green-950/65",
  height = "h-40",
}: PageHeroProps) {
  return (
    <div className={`relative w-full ${height} flex items-end overflow-hidden`}>
      <img
        src={imageUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-center"
        loading="lazy"
      />
      <div className={`absolute inset-0 ${overlay}`} />
      <div className="relative z-10 px-8 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow">{title}</h1>
        {subtitle && (
          <p className="text-white/75 text-sm mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

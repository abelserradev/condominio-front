import Link from "next/link";

type AccionColor = "blue" | "purple" | "orange";

const colorClasses: Record<
  AccionColor,
  { border: string; iconBg: string; iconText: string }
> = {
  blue: {
    border: "border-l-primary",
    iconBg: "bg-primary/20",
    iconText: "text-secondary",
  },
  purple: {
    border: "border-l-secondary",
    iconBg: "bg-secondary/20",
    iconText: "text-secondary",
  },
  orange: {
    border: "border-l-accent",
    iconBg: "bg-accent/20",
    iconText: "text-accent-foreground",
  },
};

type IconCardProps = {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: AccionColor;
};

export function IconCard({
  href,
  label,
  description,
  icon,
  color,
}: Readonly<IconCardProps>) {
  const { border, iconBg, iconText } = colorClasses[color];
  return (
    <Link
      href={href}
      className={`group flex items-start gap-4 rounded-2xl border border-l-4 border-border bg-card p-5 shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${border}`}
    >
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconText} transition-colors group-hover:opacity-90`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <span className="block text-base font-semibold text-foreground">
          {label}
        </span>
        <span className="mt-0.5 block text-sm text-muted-foreground">{description}</span>
      </div>
    </Link>
  );
}
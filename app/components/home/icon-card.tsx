import Link from "next/link";

type AccionColor = "blue" | "purple" | "orange";

const colorClasses: Record<
  AccionColor,
  { border: string; iconBg: string; iconText: string }
> = {
  blue: {
    border: "border-l-blue-500",
    iconBg: "bg-blue-100",
    iconText: "text-blue-600",
  },
  purple: {
    border: "border-l-purple-500",
    iconBg: "bg-purple-100",
    iconText: "text-purple-600",
  },
  orange: {
    border: "border-l-orange-500",
    iconBg: "bg-orange-100",
    iconText: "text-orange-600",
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
}: IconCardProps) {
  const { border, iconBg, iconText } = colorClasses[color];
  return (
    <Link
      href={href}
      className={`group flex items-start gap-4 rounded-2xl border border-l-4 border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 ${border}`}
    >
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconText} transition-colors group-hover:opacity-90`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <span className="block text-base font-semibold text-slate-800">
          {label}
        </span>
        <span className="mt-0.5 block text-sm text-slate-500">{description}</span>
      </div>
    </Link>
  );
}
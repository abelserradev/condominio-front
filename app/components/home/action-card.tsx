import Link from "next/link";

type ActionCardProps = {
  href: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  /** Variante de color: borde izquierdo y fondo del icono */
  accent: "blue" | "purple" | "orange";
};

const accentStyles = {
  blue: {
    border: "border-l-blue-400",
    bg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  purple: {
    border: "border-l-purple-400",
    bg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  orange: {
    border: "border-l-orange-400",
    bg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
};

export function ActionCard({ href, title, subtitle, icon, accent }: ActionCardProps) {
  const styles = accentStyles[accent];
  return (
    <Link
      href={href}
      className={`flex w-full items-center gap-4 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-md transition-shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 ${styles.border}`}
    >
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${styles.bg} ${styles.iconColor}`}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-800">{title}</p>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
    </Link>
  );
}
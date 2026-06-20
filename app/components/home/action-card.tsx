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
    border: "border-l-primary",
    bg: "bg-primary/20",
    iconColor: "text-secondary",
  },
  purple: {
    border: "border-l-secondary",
    bg: "bg-secondary/20",
    iconColor: "text-secondary",
  },
  orange: {
    border: "border-l-accent",
    bg: "bg-accent/20",
    iconColor: "text-accent-foreground",
  },
};

export function ActionCard({ href, title, subtitle, icon, accent }: Readonly<ActionCardProps>) {
  const styles = accentStyles[accent];
  return (
    <Link
      href={href}
      className={`flex w-full items-center gap-4 overflow-hidden rounded-xl border border-border bg-card p-4 shadow-md transition-shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${styles.border}`}
    >
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${styles.bg} ${styles.iconColor}`}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </Link>
  );
}
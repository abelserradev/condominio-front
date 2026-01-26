import Link from "next/link";

type IconCardProps = {
    href: string;
    label: string;
    icon: React.ReactNode;
  };

export function IconCard({ href, label, icon}: IconCardProps) {
    return (
        <Link
          href={href}
          className="group flex flex-col items-center gap-4 rounded-2xl border border-green-200 bg-white p-8 shadow-sm transition-all hover:border-green-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-green-50 text-green-600 transition-colors group-hover:bg-green-100">
            {icon}
          </span>
          <span className="text-center text-sm font-medium text-slate-700">
            {label}
          </span>
        </Link>
      );
}
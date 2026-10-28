import Link from "next/link";

export default function BackLink({
  href,
  label,
  className = "",
  iconOnly = false,
}: {
  href: string;
  label: string;
  className?: string;
  iconOnly?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-block mb-6 text-sm ${className}`}
      style={iconOnly ? undefined : { color: "#2C3E2D" }}
      aria-label={iconOnly ? label : undefined}
      title={iconOnly ? label : undefined}
    >
      {iconOnly ? "←" : `← ${label}`}
    </Link>
  );
}

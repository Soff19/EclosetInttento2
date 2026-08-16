import Link from "next/link";

export default function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-block mb-6 text-sm" style={{ color: "#2C3E2D" }}>
      ← {label}
    </Link>
  );
}

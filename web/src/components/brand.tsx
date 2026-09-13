import Link from "next/link";
import { ScanEye } from "lucide-react";
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand ${light ? "brand-light" : ""}`}
      aria-label="Loupe home"
    >
      <span className="brand-mark">
        <ScanEye size={23} strokeWidth={2} />
      </span>
      <span>
        loupe<span className="brand-period">.</span>
      </span>
    </Link>
  );
}

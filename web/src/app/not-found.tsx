import Link from "next/link";
import { Brand } from "@/components/brand";
import { ArrowLeft } from "lucide-react";
export default function NotFound() {
  return (
    <main id="main" className="not-found">
      <Brand />
      <h1>This one slipped out of view.</h1>
      <p>That page doesn’t exist. Let’s get you back to a clearer picture.</p>
      <Link href="/" className="button button-primary">
        <ArrowLeft size={16} /> Back to Loupe
      </Link>
    </main>
  );
}

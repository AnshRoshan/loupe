"use client";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Brand } from "@/components/brand";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main" className="not-found">
      <Brand />
      <h1>Let’s take another look.</h1>
      <p>
        Something interrupted this request. Your saved reviews are still in your
        workspace.
        <br />
        Try again, or check your database and authentication configuration.
      </p>
      <div className="heading-actions">
        <button className="button button-primary" onClick={reset}>
          <RefreshCw size={15} /> Try again
        </button>
        <Link href="/" className="button button-white">
          <ArrowLeft size={15} /> Back home
        </Link>
      </div>
    </main>
  );
}

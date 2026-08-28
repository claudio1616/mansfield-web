import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Info",
  description: "Mansfield is an early-stage investment firm.",
  openGraph: {
    title: "Info — Mansfield",
    description: "Mansfield is an early-stage investment firm.",
    images: [],
  },
  twitter: {
    title: "Info — Mansfield",
    description: "Mansfield is an early-stage investment firm.",
    images: [],
  },
};

export default function Info() {
  return (
    <div className="page-info">
      <main className="stage">
        <div className="column">
          <div className="prose">
            <p>Mansfield is an early-stage investment firm.</p>
            <p>
              We partner with founders building advanced technology to address
              difficult, consequential problems, and we share their ambition to
              reshape the world.
            </p>
            <p>
              We work with a small number of founders each year, forming close
              relationships from the beginning grounded in trust and long-term
              commitment.
            </p>
          </div>
        </div>
      </main>

      <footer className="bar">
        <nav aria-label="Primary navigation">
          <Link href="/">Home</Link>
        </nav>
      </footer>
    </div>
  );
}

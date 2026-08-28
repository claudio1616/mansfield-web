import Link from "next/link";
import Script from "next/script";

export default function Home() {
  return (
    <>
      <div className="field" aria-hidden="true">
        <div className="rings" data-rings />
      </div>

      <main className="stage">
        <h1 className="wordmark wordmark--home">Mansfield</h1>
      </main>

      <footer className="bar">
        <nav aria-label="Primary navigation">
          <Link href="/info">Info</Link>
        </nav>
      </footer>

      <Script src="/rings.js" strategy="afterInteractive" />
    </>
  );
}

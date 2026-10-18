import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <p className="text-6xl font-extrabold" style={{ color: "var(--accent)" }}>0x404</p>
      <h1 className="mt-3 text-2xl font-bold">That address bricked.</h1>
      <p className="mt-2 text-sm muted">
        The page, device or guide you asked for doesn&rsquo;t exist — or it was moderated away. Unlike your bootloader,
        this is recoverable.
      </p>
      <div className="mt-6 flex gap-2">
        <Link href="/" className="btn btn-primary">Search a phone</Link>
        <Link href="/search" className="btn">Browse the index</Link>
      </div>
    </div>
  );
}

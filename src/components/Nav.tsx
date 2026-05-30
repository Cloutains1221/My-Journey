import Link from "next/link";

export default function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-4 bg-canvas/95 backdrop-blur-xl border-b border-hairline">
      <Link href="/" className="flex items-center gap-2.5 group">
        <span className="text-lg">🏔️</span>
        <span className="text-lg font-semibold tracking-tight text-ink group-hover:text-primary transition-colors font-sans">
          Cloutains的旅程
        </span>
      </Link>
      <div className="flex gap-7">
        <Link href="/" className="text-sm font-medium text-ink/80 hover:text-ink transition-colors">
          首页
        </Link>
        <Link href="/map" className="text-sm text-muted hover:text-ink transition-colors">
          地图
        </Link>
      </div>
    </nav>
  );
}

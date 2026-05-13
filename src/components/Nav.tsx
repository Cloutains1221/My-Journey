import Link from "next/link";

export default function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-4 bg-bg/95 backdrop-blur-xl border-b border-border">
      <Link href="/" className="flex items-center gap-2.5 group">
        <span className="text-xl">🏔️</span>
        <span className="text-lg font-bold tracking-tight text-white group-hover:text-white/80 transition-colors">
          Cloutains的旅程
        </span>
      </Link>
      <div className="flex gap-7">
        <Link href="/" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
          首页
        </Link>
        <Link href="/map" className="text-sm text-white/40 hover:text-white transition-colors">
          地图
        </Link>
      </div>
    </nav>
  );
}

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative mt-24 border-t border-hairline">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="max-w-5xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          <div>
            <span className="font-display text-lg text-ink tracking-[-0.5px]">Cloutains的旅程</span>
            <p className="text-xs text-muted-soft mt-2 leading-relaxed">
              用脚步丈量世界，记录每一段旅程
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/" className="text-sm text-muted hover:text-ink transition-colors">
              首页
            </Link>
            <Link href="/map" className="text-sm text-muted hover:text-ink transition-colors">
              地图
            </Link>
          </div>
          <div className="text-right md:text-right">
            <p className="font-display italic text-muted-soft text-sm">
              &ldquo;读万卷书，行万里路&rdquo;
            </p>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-hairline-soft">
          <p className="text-xs text-muted-soft text-center">
            &copy; {new Date().getFullYear()} Cloutains
          </p>
        </div>
      </div>
    </footer>
  );
}

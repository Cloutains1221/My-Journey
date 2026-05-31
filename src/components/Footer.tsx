export default function Footer() {
  return (
    <footer className="relative mt-24 border-t border-hairline">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="max-w-5xl mx-auto px-8 py-12">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
          <div className="text-center sm:text-left">
            <span className="font-display text-lg text-ink tracking-[-0.5px]">Cloutains的旅程</span>
            <p className="text-xs text-muted-soft mt-2 leading-relaxed">
              用脚步丈量世界，记录每一段旅程
            </p>
          </div>
          <p className="font-display italic text-muted-soft text-sm text-center sm:text-right">
            &ldquo;读万卷书，行万里路&rdquo;
          </p>
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

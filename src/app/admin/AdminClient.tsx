"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RATING_LABELS, AGREEMENT_LABELS, DESIRE_LABELS } from "@/lib/types";
import type { Trip, Photo, AgreementVote, DesireVote } from "@/lib/types";

export default function AdminClient() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [editing, setEditing] = useState<Partial<Trip> | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const [commentsMode, setCommentsMode] = useState(false);
  const [comments, setComments] = useState<{ agreements: (AgreementVote & { trips?: { title: string } | null })[], desires: (DesireVote & { trips?: { title: string } | null })[] }>({ agreements: [], desires: [] });
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) { setAuthenticated(true); setError(""); }
    else setError("密码错误");
  }

  const fetchTrips = useCallback(async () => {
    const res = await fetch("/api/admin/trips");
    if (res.ok) setTrips(await res.json());
    else setAuthenticated(false);
  }, []);

  useEffect(() => { if (authenticated) fetchTrips(); }, [authenticated, fetchTrips]);

  const fetchPhotos = useCallback(async (tripId: string) => {
    const { supabase } = await import("@/lib/supabase");
    const { data } = await supabase.from("photos").select("*").eq("trip_id", tripId).order("sort_order");
    if (data) setPhotos(data as Photo[]);
  }, []);

  useEffect(() => {
    if (editing?.id) fetchPhotos(editing.id);
    else setPhotos([]);
  }, [editing, fetchPhotos]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const tripData = { ...editing };
    const isNew = !tripData.id;
    const url = isNew ? "/api/admin/trips" : `/api/admin/trips/${tripData.id}`;
    const method = isNew ? "POST" : "PUT";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tripData),
    });
    if (res.ok) {
      const saved = await res.json();
      setMessage(isNew ? "旅程已创建，现在可以上传照片" : "保存成功");
      fetchTrips();
      if (isNew && saved?.id) {
        setEditing({ ...editing, id: saved.id });
        setManageMode(true);
      } else {
        setEditing(null);
      }
    } else {
      const data = await res.json();
      setError(data.error || "保存失败");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("确认删除？此操作不可撤销。")) return;
    const res = await fetch(`/api/admin/trips/${id}`, { method: "DELETE" });
    if (res.ok) { setMessage("已删除"); fetchTrips(); }
    else setError("删除失败");
  }

  async function compressImage(file: File): Promise<File> {
    // Only compress if over 2MB or not a JPEG
    if (file.size < 2 * 1024 * 1024 && file.type === "image/jpeg") return file;

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const maxSide = 1920;
        let w = img.width;
        let h = img.height;
        if (w > maxSide || h > maxSide) {
          if (w > h) { h = Math.round(h * maxSide / w); w = maxSide; }
          else { w = Math.round(w * maxSide / h); h = maxSide; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => {
          resolve(new File([blob!], file.name, { type: "image/jpeg" }));
        }, "image/jpeg", 0.85);
      };
      img.src = URL.createObjectURL(file);
    });
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !editing?.id) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("tripId", editing.id);

    for (const f of Array.from(files)) {
      const compressed = await compressImage(f);
      formData.append("files", compressed);
    }

    const res = await fetch("/api/admin/photos", { method: "POST", body: formData });
    if (res.ok) {
      setMessage("照片上传成功");
      fetchPhotos(editing.id);
    } else {
      const data = await res.json();
      setError(data.error || "上传失败");
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handlePhotoDelete(photoId: string) {
    if (!confirm("删除这张照片？")) return;
    const res = await fetch(`/api/admin/photos/${photoId}`, { method: "DELETE" });
    if (res.ok) {
      setMessage("照片已删除");
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } else {
      const data = await res.json();
      setError(data.error || "删除失败");
    }
  }

  const fetchComments = useCallback(async () => {
    const res = await fetch("/api/admin/votes");
    if (res.ok) setComments(await res.json());
    else setAuthenticated(false);
  }, []);

  useEffect(() => { if (authenticated && commentsMode) fetchComments(); }, [authenticated, commentsMode, fetchComments]);

  async function handleCommentDelete(type: "agreement" | "desire", id: string) {
    if (!confirm("删除这条评论？")) return;
    const res = await fetch(`/api/admin/votes/${type}/${id}`, { method: "DELETE" });
    if (res.ok) { setMessage("评论已删除"); fetchComments(); }
    else { const data = await res.json(); setError(data.error || "删除失败"); }
  }

  function mergeComments() {
    const all: { id: string; type: "agreement" | "desire"; nickname: string; label: string; comment: string | null; time: string; tripTitle: string }[] = [];
    comments.agreements.forEach((v) =>
      all.push({ id: v.id, type: "agreement", nickname: v.nickname, label: AGREEMENT_LABELS[v.agreement], comment: v.comment, time: v.created_at, tripTitle: (v as any).trips?.title || "—" })
    );
    comments.desires.forEach((v) =>
      all.push({ id: v.id, type: "desire", nickname: v.nickname, label: DESIRE_LABELS[v.desire_level], comment: v.comment, time: v.created_at, tripTitle: (v as any).trips?.title || "—" })
    );
    all.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    return all;
  }

  const emptyTrip: Partial<Trip> = {
    title: "", slug: "", date: "", location: "", latitude: 35, longitude: 115,
    content: "", rating: 3, cover_image: "",
  };

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <form onSubmit={handleLogin} className="flex flex-col items-center gap-4">
          <h2 className="text-2xl font-bold text-white">🔐 身份验证</h2>
          <p className="text-sm text-text-muted mb-4">请输入管理密码以继续</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码"
            className="w-72 bg-white/5 border border-border rounded-xl px-5 py-3 text-sm text-white text-center placeholder:text-white/20 outline-none focus:border-white/20"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" className="px-10 py-3 bg-white text-bg rounded-xl text-sm font-semibold hover:bg-gray-200">
            进入后台
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <aside className="w-52 p-6 border-r border-border flex-shrink-0">
        <p className="text-sm font-bold text-white mb-6">📋 管理面板</p>
        <nav className="flex flex-col gap-4 text-sm">
          <button onClick={() => { setEditing(null); setMessage(""); setManageMode(false); setCommentsMode(false); }} className={`text-left transition-colors ${!commentsMode ? "text-white font-semibold" : "text-text-muted hover:text-white"}`}>
            旅程列表
          </button>
          <button onClick={() => { setEditing(null); setManageMode(false); setCommentsMode(true); setMessage(""); }} className={`text-left transition-colors ${commentsMode ? "text-white font-semibold" : "text-text-muted hover:text-white"}`}>
            评论管理
          </button>
          <button onClick={() => { setEditing(emptyTrip); setManageMode(false); setCommentsMode(false); }} className="text-left text-text-muted hover:text-white transition-colors">
            + 新建旅程
          </button>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        {message && <p className="text-sm text-green-400 mb-4">{message}</p>}
        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

        {commentsMode ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">评论管理</h2>
                <p className="text-sm text-text-muted">共 {mergeComments().length} 条评论</p>
              </div>
            </div>
            {mergeComments().length === 0 ? (
              <p className="text-sm text-text-muted py-10 text-center">暂无访客评论</p>
            ) : (
              <div className="flex flex-col gap-2">
                {mergeComments().map((item) => (
                  <div key={`${item.type}-${item.id}`} className="flex items-center gap-4 p-4 bg-surface rounded-xl border border-border">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      item.type === "agreement" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                    }`}>
                      {item.type === "agreement" ? "✓" : "🔥"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-white">{item.nickname}</span>
                        <span className="text-xs text-text-muted">· {item.label}</span>
                        <span className="text-xs text-text-muted/50">· {item.tripTitle}</span>
                      </div>
                      {item.comment && <p className="text-xs text-text-secondary truncate">{item.comment}</p>}
                      <p className="text-[10px] text-text-muted/40 mt-0.5">{new Date(item.time).toLocaleString("zh-CN")}</p>
                    </div>
                    <button
                      onClick={() => handleCommentDelete(item.type, item.id)}
                      className="text-xs text-red-400/60 hover:text-red-400 flex-shrink-0"
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : !editing ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">我的旅程</h2>
                <p className="text-sm text-text-muted">共 {trips.length} 段旅程</p>
              </div>
              <button onClick={() => { setEditing(emptyTrip); setManageMode(false); setCommentsMode(false); }} className="px-6 py-2.5 bg-white text-bg rounded-lg text-sm font-semibold hover:bg-gray-200">
                + 新建旅程
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {trips.map((trip) => (
                <div key={trip.id} className="flex items-center gap-4 p-4 bg-surface rounded-xl border border-border">
                  <div className="w-12 h-12 rounded-lg bg-white/5 flex-shrink-0 overflow-hidden">
                    {trip.cover_image && <img src={trip.cover_image} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{trip.title}</p>
                    <p className="text-xs text-text-muted">{trip.date} · {RATING_LABELS[trip.rating]}</p>
                  </div>
                  <button onClick={() => setEditing(trip)} className="text-xs text-text-muted hover:text-white">编辑</button>
                  <button onClick={() => { setEditing(trip); setManageMode(true); }} className="text-xs text-blue-400/60 hover:text-blue-400">照片</button>
                  <button onClick={() => handleDelete(trip.id)} className="text-xs text-red-400/60 hover:text-red-400">删除</button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="max-w-2xl">
            <form onSubmit={handleSave} className="flex flex-col gap-5">
              <h3 className="text-lg font-bold text-white">{editing.id ? "编辑旅程" : "新建旅程"}</h3>

              <div>
                <label className="text-xs text-text-muted mb-1.5 block">标题</label>
                <input value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="w-full bg-white/5 border border-border rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-white/20" />
              </div>

              <div>
                <label className="text-xs text-text-muted mb-1.5 block">URL 标识（留空则自动生成）</label>
                <input value={editing.slug || ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                  placeholder="例如：my-trip-to-beijing"
                  className="w-full bg-white/5 border border-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/20" />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs text-text-muted mb-1.5 block">日期</label>
                  <input value={editing.date || ""} onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                    type="date" className="w-full bg-white/5 border border-border rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-white/20" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-text-muted mb-1.5 block">地点</label>
                  <input value={editing.location || ""} onChange={(e) => setEditing({ ...editing, location: e.target.value })}
                    placeholder="城市, 国家" className="w-full bg-white/5 border border-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/20" />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs text-text-muted mb-1.5 block">纬度</label>
                  <input type="number" step="0.01" value={editing.latitude || ""} onChange={(e) => setEditing({ ...editing, latitude: parseFloat(e.target.value) })}
                    className="w-full bg-white/5 border border-border rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-white/20" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-text-muted mb-1.5 block">经度</label>
                  <input type="number" step="0.01" value={editing.longitude || ""} onChange={(e) => setEditing({ ...editing, longitude: parseFloat(e.target.value) })}
                    className="w-full bg-white/5 border border-border rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-white/20" />
                </div>
              </div>

              <div>
                <label className="text-xs text-text-muted mb-1.5 block">封面图片 URL</label>
                <input value={editing.cover_image || ""} onChange={(e) => setEditing({ ...editing, cover_image: e.target.value })}
                  placeholder="https://... 或从下方照片中点击「设为封面」"
                  className="w-full bg-white/5 border border-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/20" />
                {editing.cover_image && (
                  <img src={editing.cover_image} className="mt-2 w-32 h-20 object-cover rounded-lg border border-border" />
                )}
              </div>

              <div>
                <label className="text-xs text-text-muted mb-1.5 block">评级</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button key={v} type="button" onClick={() => setEditing({ ...editing, rating: v })}
                      className={`px-4 py-2 rounded-full text-sm border transition-all ${
                        editing.rating === v
                          ? "bg-red-900/30 border-red-500/50 text-red-300 font-semibold"
                          : "bg-white/5 border-border text-white/40"
                      }`}
                    >{RATING_LABELS[v]}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-text-muted mb-1.5 block">文字内容</label>
                <textarea value={editing.content || ""} onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                  rows={8} className="w-full bg-white/5 border border-border rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-white/20 resize-none" />
              </div>

              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => { setEditing(null); setManageMode(false); }}
                  className="px-7 py-2.5 bg-white/5 border border-border rounded-lg text-sm text-white/50 hover:text-white">取消</button>
                <button type="submit"
                  className="px-7 py-2.5 bg-white text-bg rounded-lg text-sm font-semibold hover:bg-gray-200">保存旅程</button>
              </div>
            </form>

            {/* Photo Management Section */}
            {editing.id && (
              <div className="mt-10 pt-8 border-t border-border">
                <h3 className="text-lg font-bold text-white mb-4">📷 旅程照片 · {photos.length} 张</h3>

                {/* Existing photos grid */}
                {photos.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    {photos.map((photo) => (
                      <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden bg-white/5">
                        <img src={photo.url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <button type="button"
                            onClick={() => setEditing({ ...editing, cover_image: photo.url })}
                            className="px-2 py-1 rounded bg-white/90 text-black text-xs font-semibold hover:bg-white"
                          >
                            设为封面
                          </button>
                          <button
                            onClick={() => handlePhotoDelete(photo.id)}
                            className="w-6 h-6 rounded-full bg-red-500/80 text-white text-xs flex items-center justify-center hover:bg-red-500"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload area */}
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-white/20 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const files = e.dataTransfer.files;
                    if (files.length > 0 && fileInputRef.current) {
                      const dt = new DataTransfer();
                      Array.from(files).forEach((f) => dt.items.add(f));
                      fileInputRef.current.files = dt.files;
                      fileInputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
                    }
                  }}
                >
                  <div className="text-3xl mb-2">📷</div>
                  <p className="text-sm text-text-muted">
                    {uploading ? "压缩并上传中..." : "拖拽图片到此处或点击上传"}
                  </p>
                  <p className="text-xs text-text-muted/50 mt-1">支持 JPG, PNG, WebP · 大图自动压缩至 1920px · 可批量选择</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

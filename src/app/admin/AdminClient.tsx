"use client";

import { useState, useEffect, useCallback } from "react";
import { RATING_LABELS } from "@/lib/types";
import type { Trip } from "@/lib/types";

export default function AdminClient() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [editing, setEditing] = useState<Partial<Trip> | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const tripData = { ...editing };
    const isNew = !tripData.id;
    const url = isNew ? "/api/admin/trips" : `/api/admin/trips/${tripData.id}`;
    const method = isNew ? "POST" : "PUT";
    if (isNew) {
      tripData.slug = (tripData.title || "new-trip").replace(/\s+/g, "-").toLowerCase();
    }
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tripData),
    });
    if (res.ok) {
      setMessage("保存成功");
      setEditing(null);
      fetchTrips();
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

  const emptyTrip: Partial<Trip> = {
    title: "", date: "", location: "", latitude: 35, longitude: 115,
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
          <button onClick={() => { setEditing(null); setMessage(""); }} className="text-left text-white font-semibold">
            旅程列表
          </button>
          <button onClick={() => setEditing(emptyTrip)} className="text-left text-text-muted hover:text-white transition-colors">
            + 新建旅程
          </button>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        {message && <p className="text-sm text-green-400 mb-4">{message}</p>}
        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

        {!editing ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">我的旅程</h2>
                <p className="text-sm text-text-muted">共 {trips.length} 段旅程</p>
              </div>
              <button onClick={() => setEditing(emptyTrip)} className="px-6 py-2.5 bg-white text-bg rounded-lg text-sm font-semibold hover:bg-gray-200">
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
                  <button onClick={() => handleDelete(trip.id)} className="text-xs text-red-400/60 hover:text-red-400">删除</button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <form onSubmit={handleSave} className="max-w-xl flex flex-col gap-5">
            <h3 className="text-lg font-bold text-white">{editing.id ? "编辑旅程" : "新建旅程"}</h3>

            <div>
              <label className="text-xs text-text-muted mb-1.5 block">标题</label>
              <input value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="w-full bg-white/5 border border-border rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-white/20" />
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
                placeholder="https://..." className="w-full bg-white/5 border border-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/20" />
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
              <button type="button" onClick={() => setEditing(null)}
                className="px-7 py-2.5 bg-white/5 border border-border rounded-lg text-sm text-white/50 hover:text-white">取消</button>
              <button type="submit"
                className="px-7 py-2.5 bg-white text-bg rounded-lg text-sm font-semibold hover:bg-gray-200">保存旅程</button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

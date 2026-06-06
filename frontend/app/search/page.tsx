"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ThemeToggle } from "../components/ThemeProvider";

type Shelter = {
  id: number; name: string; description: string; location: string;
  imageUrl: string; rating: number; beds: number; price: string;
};
type Session = { token: string; userId: number; login: string; email: string; role: string };

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

function readSession(): Session | null {
  try { return JSON.parse(localStorage.getItem("bnabd_session") ?? "null"); } catch { return null; }
}

const LOCATIONS = ["Wszystkie", "Tatry", "Beskidy", "Karkonosze", "Bieszczady", "Pieniny", "Góry Sowie"];

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading]   = useState(true);
  const [query, setQuery]       = useState(searchParams.get("location") ?? "");
  const [input, setInput]       = useState(searchParams.get("location") ?? "");
  const [session, setSession]   = useState<Session | null>(null);
  const [activeLocation, setActiveLocation] = useState(searchParams.get("location") || "Wszystkie");

  useEffect(() => { setSession(readSession()); }, []);

  useEffect(() => {
    setLoading(true);
    const loc = query && query !== "Wszystkie" ? `?location=${encodeURIComponent(query)}` : "";
    fetch(`${API}/api/shelters${loc}`)
      .then((r) => r.json())
      .then((data) => setShelters(Array.isArray(data) ? data : []))
      .catch(() => setShelters([]))
      .finally(() => setLoading(false));
  }, [query]);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const val = input.trim();
    setQuery(val);
    setActiveLocation(val || "Wszystkie");
    router.replace(`/search${val ? `?location=${encodeURIComponent(val)}` : ""}`, { scroll: false });
  }

  function pickLocation(loc: string) {
    const val = loc === "Wszystkie" ? "" : loc;
    setInput(val); setQuery(val); setActiveLocation(loc);
    router.replace(`/search${val ? `?location=${encodeURIComponent(val)}` : ""}`, { scroll: false });
  }

  const count = shelters.length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-30 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3">
          {/* Logo */}
          <button className="flex items-center gap-2 flex-shrink-0" onClick={() => router.push("/")}>
            <div className="h-7 w-7 rounded-md bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
              <svg className="h-4 w-4 text-white dark:text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l7 7 7-7M5 14l7 7 7-7" />
              </svg>
            </div>
            <span className="text-sm font-bold tracking-tight hidden sm:block">Schroniskowo</span>
          </button>

          {/* Search bar */}
          <form className="flex flex-1 gap-2 max-w-lg" onSubmit={handleSearch}>
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                className="h-9 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-9 pr-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/5 transition"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Szukaj schronisk — Tatry, Beskidy..."
              />
            </div>
            <button className="h-9 rounded-lg px-4 text-sm font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-white transition" type="submit">
              Szukaj
            </button>
          </form>

          <div className="flex items-center gap-1 flex-shrink-0">
            <ThemeToggle />
            {session ? (
              <button className="rounded-lg px-3 py-1.5 text-xs font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition" onClick={() => router.push("/dashboard")}>
                Panel →
              </button>
            ) : (
              <button className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-white transition" onClick={() => router.push("/")}>
                Zaloguj się
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── LOCATION CHIPS ── */}
      <div className="mx-auto max-w-6xl px-5 pt-5 pb-2">
        <div className="flex flex-wrap gap-2">
          {LOCATIONS.map((loc) => (
            <button
              key={loc}
              onClick={() => pickLocation(loc)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                activeLocation === loc
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                  : "border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      {/* ── RESULTS COUNT ── */}
      <div className="mx-auto max-w-6xl px-5 py-3">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          {loading ? "Wyszukiwanie..." : `${count} ${count === 1 ? "schronisko" : count < 5 ? "schroniska" : "schronisk"}${query && query !== "Wszystkie" ? ` · ${query}` : ""}`}
        </p>
      </div>

      {/* ── LISTINGS ── */}
      <main className="mx-auto max-w-6xl px-5 pb-16">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-400 dark:border-zinc-600 border-t-transparent" />
          </div>
        ) : shelters.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-4xl mb-4">🏔</p>
            <p className="text-zinc-400 dark:text-zinc-500 text-sm">Brak schronisk dla wybranych kryteriów.</p>
            <button className="mt-4 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 underline" onClick={() => pickLocation("Wszystkie")}>
              Pokaż wszystkie
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {shelters.map((s) => (
              <ShelterCard key={s.id} shelter={s} onClick={() => router.push(`/shelter/${s.id}`)} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ShelterCard({ shelter: s, onClick }: { shelter: Shelter; onClick: () => void }) {
  return (
    <div
      className="group flex cursor-pointer gap-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 transition-all hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md dark:hover:shadow-zinc-900/50"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative h-24 w-36 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800 sm:h-28 sm:w-44">
        {s.imageUrl
          ? <img className="h-full w-full object-cover transition duration-500 group-hover:scale-105" src={s.imageUrl} alt={s.name} />
          : <div className="flex h-full w-full items-center justify-center text-zinc-300 dark:text-zinc-600 text-3xl">⛰</div>}
        <div className="absolute right-1.5 top-1.5 rounded-md bg-white/90 dark:bg-zinc-900/90 px-1.5 py-0.5 text-[11px] font-bold text-zinc-800 dark:text-zinc-200 backdrop-blur shadow-sm">
          ★ {s.rating.toFixed(1)}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div>
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base leading-snug group-hover:text-zinc-700 dark:group-hover:text-white transition-colors truncate">
            {s.name}
          </h3>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span>{s.location}</span>
          </div>
          {s.description && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-400 dark:text-zinc-500 hidden sm:block">
              {s.description}
            </p>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <span className="rounded-md px-2 py-1 text-[11px] border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
              {s.beds} miejsc
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
              od <span className="text-zinc-900 dark:text-zinc-100">{s.price}</span>
            </span>
            <span className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 transition group-hover:bg-zinc-700 dark:group-hover:bg-white">
              Zobacz →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}

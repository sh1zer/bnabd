"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./components/ThemeProvider";

type Shelter = {
  id: number; ownerId: number; name: string; description: string;
  location: string; phone: string; email: string; imageUrl: string;
  rating: number; beds: number; price: string;
};
type Session = { token: string; userId: number; login: string; email: string; role: string };

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

function saveSession(s: Session) { localStorage.setItem("bnabd_session", JSON.stringify(s)); }
function readSession(): Session | null {
  try { return JSON.parse(localStorage.getItem("bnabd_session") ?? "null"); } catch { return null; }
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...opts, headers: { "Content-Type": "application/json", ...opts?.headers },
  });
  if (!res.ok) { const e = await res.json().catch(() => ({ message: "Błąd" })); throw new Error(e.message); }
  return res.json();
}

export default function LandingPage() {
  const router = useRouter();
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [filter, setFilter] = useState("");
  const [query, setQuery] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [modal, setModal] = useState<"login" | "register" | null>(null);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const sheltersRef = useRef<HTMLElement>(null);

  const [loginLogin, setLoginLogin] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regLogin, setRegLogin] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  useEffect(() => {
    setSession(readSession());
    apiFetch<Shelter[]>("/api/shelters")
      .then(setShelters)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  async function handleLogin(e: FormEvent) {
    e.preventDefault(); setError("");
    try {
      const data = await apiFetch<Session>("/api/auth/login", {
        method: "POST", body: JSON.stringify({ login: loginLogin, password: loginPassword }),
      });
      saveSession(data); router.push("/dashboard");
    } catch (err) { setError(err instanceof Error ? err.message : "Błąd logowania."); }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault(); setError("");
    try {
      await apiFetch("/api/auth/register", {
        method: "POST", body: JSON.stringify({ login: regLogin, email: regEmail, password: regPassword }),
      });
      setAuthTab("login"); setLoginLogin(regLogin);
      setError("✓ Konto utworzone — możesz się zalogować.");
    } catch (err) { setError(err instanceof Error ? err.message : "Błąd rejestracji."); }
  }

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("location", query.trim());
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests > 1) params.set("guests", String(guests));
    const qs = params.toString();
    router.push(`/search${qs ? `?${qs}` : ""}`);
  }

  function openModal(tab: "login" | "register") {
    setError(""); setAuthTab(tab); setModal(tab);
  }

  function logout() {
    localStorage.removeItem("bnabd_session");
    setSession(null);
  }

  const today = new Date().toISOString().split("T")[0];
  const ranked = [...shelters].sort((a, b) => b.rating - a.rating);
  const displayed = filter.trim()
    ? ranked.filter((s) =>
        `${s.name} ${s.location}`.toLowerCase().includes(filter.trim().toLowerCase()))
    : ranked.slice(0, 6);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">

      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur"
          : "bg-transparent"
      }`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <button className="flex items-center gap-2.5" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="h-7 w-7 rounded bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
              <svg className="h-4 w-4 text-white dark:text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l7 7 7-7M5 14l7 7 7-7" />
              </svg>
            </div>
            <span className={`text-sm font-bold tracking-tight ${scrolled ? "text-zinc-900 dark:text-zinc-100" : "text-white"}`}>
              Schroniskowo
            </span>
          </button>

          <div className="flex items-center gap-1">
            <ThemeToggle className={scrolled ? "" : "text-white/70 hover:text-white hover:bg-white/10 dark:text-white/70"} />

            {session ? (
              <>
                <button
                  className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-md ${
                    scrolled ? "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100" : "text-white/80 hover:text-white"
                  }`}
                  onClick={logout}
                >Wyloguj</button>
                <button
                  className="ml-1 rounded-md bg-zinc-900 dark:bg-zinc-100 px-4 py-1.5 text-sm font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-white transition-colors"
                  onClick={() => router.push("/dashboard")}
                >Panel →</button>
              </>
            ) : (
              <>
                <button
                  className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-md ${
                    scrolled ? "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100" : "text-white/80 hover:text-white"
                  }`}
                  onClick={() => openModal("login")}
                >Zaloguj</button>
                <button
                  className="ml-1 rounded-md bg-zinc-900 dark:bg-zinc-100 px-4 py-1.5 text-sm font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-white transition-colors"
                  onClick={() => openModal("register")}
                >Zarejestruj się</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center bg-zinc-950">
        <div className="pointer-events-none absolute inset-0">
          <img src="/wallpaper.png" alt="" className="h-full w-full object-cover object-center" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.55) 100%)" }} />
        </div>

        <div className="relative z-10 max-w-3xl">
          <p className="mb-5 text-xs font-semibold tracking-[0.25em] uppercase text-white/50 drop-shadow">
            Schroniska turystyczne · Polska
          </p>
          <h1 className="mb-6 text-5xl font-black leading-[1.05] tracking-tight text-white drop-shadow-xl sm:text-6xl lg:text-7xl">
            Rezerwuj noclegi<br />
            <span className="text-amber-300">w górach</span>
          </h1>
          <p className="mb-10 text-base leading-relaxed max-w-lg mx-auto text-white/70 drop-shadow">
            Przeglądaj schroniska, sprawdzaj dostępność i rezerwuj online — szybko i bez pośredników.
          </p>

          <form onSubmit={handleSearch} className="mx-auto max-w-3xl text-left">
            <div className="flex flex-col gap-2 rounded-2xl bg-white/95 dark:bg-zinc-900/95 p-2 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:gap-0">
              <div className="flex-[2] px-3 py-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Lokalizacja</label>
                <input
                  className="w-full bg-transparent text-sm text-zinc-900 dark:text-zinc-100 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tatry, Beskidy, Karkonosze..."
                />
              </div>
              <div className="hidden w-px self-stretch bg-zinc-200 dark:bg-zinc-700 sm:block" />
              <div className="flex-1 px-3 py-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Przyjazd</label>
                <input
                  type="date" min={today}
                  className="w-full bg-transparent text-sm text-zinc-900 dark:text-zinc-100 outline-none"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </div>
              <div className="hidden w-px self-stretch bg-zinc-200 dark:bg-zinc-700 sm:block" />
              <div className="flex-1 px-3 py-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Wyjazd</label>
                <input
                  type="date" min={checkIn || today}
                  className="w-full bg-transparent text-sm text-zinc-900 dark:text-zinc-100 outline-none"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>
              <div className="hidden w-px self-stretch bg-zinc-200 dark:bg-zinc-700 sm:block" />
              <div className="px-3 py-1.5 sm:w-20">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Osoby</label>
                <input
                  type="number" min={1}
                  className="w-full bg-transparent text-sm text-zinc-900 dark:text-zinc-100 outline-none"
                  value={guests}
                  onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>
              <button
                type="submit"
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-300 px-6 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200 sm:ml-1"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                </svg>
                Szukaj
              </button>
            </div>
          </form>

          <div className="mt-10 flex justify-center gap-6 text-xs text-white/40">
            <span>{shelters.length} schronisk</span>
            <span>·</span>
            <span>Rezerwacja online</span>
            <span>·</span>
            <span>Bez prowizji</span>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-white/30">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <p className="mb-12 text-center text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Jak to działa</p>
          <div className="grid gap-px bg-zinc-200 dark:bg-zinc-700 sm:grid-cols-3 rounded-xl overflow-hidden">
            {[
              { n: "01", title: "Wyszukaj", desc: "Wpisz lokalizację i przeglądaj dostępne schroniska." },
              { n: "02", title: "Zarezerwuj", desc: "Wybierz termin, pokój i opcję wyżywienia." },
              { n: "03", title: "Jedź", desc: "Otrzymaj potwierdzenie i wyrusz w góry." },
            ].map(({ n, title, desc }) => (
              <div key={n} className="bg-white dark:bg-zinc-900 p-8">
                <p className="mb-4 text-xs font-bold text-zinc-300 dark:text-zinc-600">{n}</p>
                <h3 className="mb-2 text-base font-bold">{title}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REGIONS ── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Odkrywaj</p>
          <h2 className="mb-12 text-center text-2xl font-bold tracking-tight">Popularne regiony</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {["Tatry", "Beskidy", "Karkonosze", "Bieszczady", "Sudety", "Gorce"].map((r) => (
              <button
                key={r}
                onClick={() => router.push(`/search?location=${encodeURIComponent(r)}`)}
                className="group flex flex-col items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 transition hover:border-amber-300 dark:hover:border-amber-400/50 hover:shadow-md dark:hover:shadow-zinc-900/50"
              >
                <span className="text-2xl transition group-hover:scale-110">⛰</span>
                <span className="text-sm font-semibold">{r}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── SHELTERS ── */}
      <section ref={sheltersRef} className="px-6 py-20" id="schroniska">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Polecane schroniska</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {filter.trim() ? `${displayed.length} wyników` : "Najwyżej oceniane obiekty"}
              </p>
            </div>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                className="h-9 w-52 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm outline-none transition placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-400 dark:focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/5 dark:text-zinc-100"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filtruj lokalizację..."
              />
              <button className="h-9 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition" type="submit">
                Filtruj
              </button>
            </form>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {displayed.map((s) => (
              <div
                key={s.id}
                className="group overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md dark:hover:shadow-zinc-900/50 cursor-pointer"
                onClick={() => router.push(`/shelter/${s.id}`)}
              >
                <div className="relative h-48 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  {s.imageUrl
                    ? <img className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" src={s.imageUrl} alt={s.name} />
                    : <div className="flex h-full items-center justify-center text-zinc-300 dark:text-zinc-600 text-4xl">⛰</div>}
                  <div className="absolute right-3 top-3 rounded-md bg-white/90 dark:bg-zinc-900/90 px-2 py-0.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 backdrop-blur shadow-sm">
                    ★ {s.rating.toFixed(1)}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold leading-snug">{s.name}</h3>
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{s.location}</p>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{s.description}</p>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <div className="flex gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="rounded border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 px-2 py-1">{s.beds} miejsc</span>
                      <span className="rounded border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 px-2 py-1 font-medium text-zinc-700 dark:text-zinc-300">od {s.price}</span>
                    </div>
                    <button
                      className="rounded-md bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 transition hover:bg-zinc-700 dark:hover:bg-white"
                      onClick={(e) => { e.stopPropagation(); router.push(`/shelter/${s.id}`); }}
                    >Zobacz →</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <p className="text-zinc-400 dark:text-zinc-500">Ładowanie schronisk…</p>
            </div>
          ) : loadError ? (
            <div className="py-20 text-center">
              <p className="text-zinc-400 dark:text-zinc-500">Nie udało się załadować schronisk. Spróbuj ponownie później.</p>
            </div>
          ) : displayed.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-zinc-400 dark:text-zinc-500">
                {shelters.length === 0 ? "Brak schronisk w systemie." : "Brak schronisk dla podanej lokalizacji."}
              </p>
            </div>
          ) : null}

          <div className="mt-10 text-center">
            <button
              className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-6 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600"
              onClick={() => router.push("/search")}
            >Przeglądaj wszystkie schroniska →</button>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      {!session && (
        <section className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-950 dark:bg-zinc-900 px-6 py-20 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">Dołącz już dziś</p>
          <h2 className="mb-6 text-3xl font-bold text-white">Zarezerwuj swój nocleg online</h2>
          <button
            className="rounded-lg bg-white px-8 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100"
            onClick={() => openModal("register")}
          >Utwórz konto — bezpłatnie →</button>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer className="border-t border-zinc-100 dark:border-zinc-800 px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 text-xs text-zinc-400 dark:text-zinc-500">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">Schroniskowo</span>
          <span>© {new Date().getFullYear()} · Projekt akademicki</span>
        </div>
      </footer>

      {/* ── MODAL ── */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setModal(null)}
        >
          <div className="w-full max-w-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl">
            <div className="mb-5 flex gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-1">
              {(["login", "register"] as const).map((tab) => (
                <button
                  key={tab}
                  className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
                    authTab === tab
                      ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  }`}
                  onClick={() => { setAuthTab(tab); setError(""); }}
                >{tab === "login" ? "Logowanie" : "Rejestracja"}</button>
              ))}
            </div>

            {error && (
              <div className={`mb-4 rounded-lg px-3 py-2.5 text-sm ${
                error.startsWith("✓")
                  ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
                  : "bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400"
              }`}>
                {error}
              </div>
            )}

            {authTab === "login" ? (
              <>
                <form className="space-y-3" onSubmit={handleLogin}>
                  <input className="field" value={loginLogin} onChange={(e) => setLoginLogin(e.target.value)} placeholder="Login" required />
                  <input className="field" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Hasło" required />
                  <button className="btn-primary w-full h-10" type="submit">Zaloguj się</button>
                </form>
                <div className="mt-5">
                  <p className="mb-2 text-xs font-medium text-zinc-400 dark:text-zinc-500">Konta demo</p>
                  <div className="space-y-1.5">
                    {[["admin","admin123","ADMIN"],["host","host123","HOST"],["user","user123","USER"]].map(([l,p,r]) => (
                      <button key={l}
                        className="w-full rounded-md border border-zinc-100 dark:border-zinc-800 px-3 py-2 text-left text-xs text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition flex items-center gap-2"
                        onClick={() => { setLoginLogin(l); setLoginPassword(p); }}>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${r==="ADMIN"?"bg-red-50 dark:bg-red-950 text-red-500":r==="HOST"?"bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400":"bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"}`}>{r}</span>
                        {l} · {p}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <form className="space-y-3" onSubmit={handleRegister}>
                <input className="field" value={regLogin} onChange={(e) => setRegLogin(e.target.value)} placeholder="Login" required />
                <input className="field" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="Email" required />
                <input className="field" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Hasło (min. 6 znaków)" minLength={6} required />
                <button className="btn-primary w-full h-10" type="submit">Utwórz konto</button>
              </form>
            )}
            <button className="mt-4 w-full text-center text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition" onClick={() => setModal(null)}>
              Zamknij
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

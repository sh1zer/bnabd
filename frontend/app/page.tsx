"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
  const [session, setSession] = useState<Session | null>(null);
  const [filter, setFilter] = useState("");
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
    apiFetch<Shelter[]>("/api/shelters").then(setShelters).catch(() => {});
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

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    const data = await apiFetch<Shelter[]>(`/api/shelters${filter ? `?location=${encodeURIComponent(filter)}` : ""}`);
    setShelters(data);
    sheltersRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function openModal(tab: "login" | "register") {
    setError(""); setAuthTab(tab); setModal(tab);
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900">

      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 z-50 w-full transition-all duration-300 ${scrolled ? "border-b border-zinc-200 bg-white/95 backdrop-blur" : "bg-transparent"}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <button className="flex items-center gap-2.5" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="h-7 w-7 rounded bg-zinc-900 flex items-center justify-center">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l7 7 7-7M5 14l7 7 7-7" />
              </svg>
            </div>
            <span className={`text-sm font-bold tracking-tight ${scrolled ? "text-zinc-900" : "text-white"}`}>
              SchroniskoHub
            </span>
          </button>

          <div className="flex items-center gap-1">
            <button
              className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-md ${scrolled ? "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50" : "text-white/80 hover:text-white"}`}
              onClick={() => sheltersRef.current?.scrollIntoView({ behavior: "smooth" })}
            >Schroniska</button>

            {session ? (
              <button
                className="ml-2 rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors"
                onClick={() => router.push("/dashboard")}
              >Panel →</button>
            ) : (
              <>
                <button
                  className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-md ${scrolled ? "text-zinc-600 hover:text-zinc-900" : "text-white/80 hover:text-white"}`}
                  onClick={() => openModal("login")}
                >Zaloguj</button>
                <button
                  className="ml-1 rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors"
                  onClick={() => openModal("register")}
                >Zarejestruj się</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center bg-zinc-950">

        {/* Wallpaper */}
        <div className="pointer-events-none absolute inset-0">
          <img
            src="/wallpaper.png"
            alt=""
            className="h-full w-full object-cover object-center"
          />
          {/* Dark overlay so text stays readable */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.55) 100%)" }} />
        </div>

        <div className="relative z-10 max-w-2xl">
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

          <form className="mx-auto flex max-w-md gap-2" onSubmit={handleSearch}>
            <input
              className="h-12 flex-1 rounded-lg px-4 text-sm text-white outline-none transition backdrop-blur placeholder:text-white/40"
              style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}
              onFocus={(e) => e.target.style.border = "1px solid rgba(255,255,255,0.5)"}
              onBlur={(e) => e.target.style.border = "1px solid rgba(255,255,255,0.2)"}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Tatry, Beskidy, Karkonosze..."
            />
            <button
              className="h-12 rounded-lg px-6 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200 bg-amber-300"
              type="submit"
            >Szukaj</button>
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
      <section className="border-b border-zinc-100 bg-zinc-50 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <p className="mb-12 text-center text-xs font-semibold uppercase tracking-widest text-zinc-400">Jak to działa</p>
          <div className="grid gap-px bg-zinc-200 sm:grid-cols-3 rounded-xl overflow-hidden">
            {[
              { n: "01", title: "Wyszukaj", desc: "Wpisz lokalizację i przeglądaj dostępne schroniska." },
              { n: "02", title: "Zarezerwuj", desc: "Wybierz termin, pokój i opcję wyżywienia." },
              { n: "03", title: "Jedź", desc: "Otrzymaj potwierdzenie i wyrusz w góry." },
            ].map(({ n, title, desc }) => (
              <div key={n} className="bg-white p-8">
                <p className="mb-4 text-xs font-bold text-zinc-300">{n}</p>
                <h3 className="mb-2 text-base font-bold">{title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SHELTERS ── */}
      <section ref={sheltersRef} className="px-6 py-20" id="schroniska">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Schroniska</h2>
              <p className="mt-1 text-sm text-zinc-500">{shelters.length} obiektów w systemie</p>
            </div>
            <form className="flex gap-2" onSubmit={handleSearch}>
              <input
                className="h-9 w-52 rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filtruj lokalizację..."
              />
              <button className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition" type="submit">
                Filtruj
              </button>
            </form>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shelters.map((s) => (
              <div key={s.id} className="group overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:border-zinc-300 hover:shadow-md">
                <div className="relative h-48 overflow-hidden bg-zinc-100">
                  {s.imageUrl
                    ? <img className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" src={s.imageUrl} alt={s.name} />
                    : <div className="flex h-full items-center justify-center text-zinc-300 text-4xl">⛰</div>}
                  <div className="absolute right-3 top-3 rounded-md bg-white/90 px-2 py-0.5 text-xs font-semibold text-zinc-800 backdrop-blur shadow-sm">
                    ★ {s.rating.toFixed(1)}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold leading-snug">{s.name}</h3>
                      <p className="mt-0.5 text-xs text-zinc-500">{s.location}</p>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-zinc-500">{s.description}</p>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <div className="flex gap-2 text-xs text-zinc-500">
                      <span className="rounded border border-zinc-100 bg-zinc-50 px-2 py-1">{s.beds} miejsc</span>
                      <span className="rounded border border-zinc-100 bg-zinc-50 px-2 py-1 font-medium text-zinc-700">od {s.price}</span>
                    </div>
                    <button
                      className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-700"
                      onClick={() => session ? router.push("/dashboard") : openModal("login")}
                    >Rezerwuj</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {shelters.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-zinc-400">Brak schronisk dla podanej lokalizacji.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      {!session && (
        <section className="border-t border-zinc-100 bg-zinc-950 px-6 py-20 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">Dołącz już dziś</p>
          <h2 className="mb-6 text-3xl font-bold text-white">Zarezerwuj swój nocleg online</h2>
          <button
            className="rounded-lg bg-white px-8 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100"
            onClick={() => openModal("register")}
          >Utwórz konto — bezpłatnie →</button>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer className="border-t border-zinc-100 px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 text-xs text-zinc-400">
          <span className="font-semibold text-zinc-900">SchroniskoHub</span>
          <span>© 2024 · Projekt akademicki</span>
        </div>
      </footer>

      {/* ── MODAL ── */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setModal(null)}
        >
          <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl">
            <div className="mb-5 flex gap-1 rounded-lg bg-zinc-100 p-1">
              {(["login", "register"] as const).map((tab) => (
                <button
                  key={tab}
                  className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${authTab === tab ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
                  onClick={() => { setAuthTab(tab); setError(""); }}
                >{tab === "login" ? "Logowanie" : "Rejestracja"}</button>
              ))}
            </div>

            {error && (
              <div className={`mb-4 rounded-lg px-3 py-2.5 text-sm ${error.startsWith("✓") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
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
                  <p className="mb-2 text-xs font-medium text-zinc-400">Konta demo</p>
                  <div className="space-y-1.5">
                    {[["admin","admin123","ADMIN"],["host","host123","HOST"],["user","user123","USER"]].map(([l,p,r]) => (
                      <button key={l}
                        className="w-full rounded-md border border-zinc-100 px-3 py-2 text-left text-xs text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 transition flex items-center gap-2"
                        onClick={() => { setLoginLogin(l); setLoginPassword(p); }}>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${r==="ADMIN"?"bg-red-50 text-red-500":r==="HOST"?"bg-amber-50 text-amber-600":"bg-emerald-50 text-emerald-600"}`}>{r}</span>
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
            <button className="mt-4 w-full text-center text-xs text-zinc-400 hover:text-zinc-600 transition" onClick={() => setModal(null)}>
              Zamknij
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

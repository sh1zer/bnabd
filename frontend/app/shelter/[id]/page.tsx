"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "../../components/ThemeProvider";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

type Session    = { token: string; userId: number; login: string; email: string; role: string };
type Shelter    = { id: number; ownerId: number; name: string; description: string; location: string; phone: string; email: string; imageUrl: string; rating: number; beds: number; price: string };
type RoomAvail  = { id: number; name: string; capacity: number; roomType: "WHOLE" | "SHARED"; pricePerNight: number; available: boolean; availableCapacity: number };
type Reservation = { id: number; shelterName: string; totalPrice: number };
type Review     = { id: number; userId: number; userLogin: string; rating: number; comment: string; createdAt: string };

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

function readSession(): Session | null {
  try { return JSON.parse(localStorage.getItem("bnabd_session") ?? "null"); } catch { return null; }
}
function saveSession(s: Session) { localStorage.setItem("bnabd_session", JSON.stringify(s)); }

async function apiFetch<T>(path: string, opts?: RequestInit, token?: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts?.headers,
    },
  });
  if (!res.ok) { const e = await res.json().catch(() => ({ message: "Błąd" })); throw new Error(e.message); }
  return res.json();
}

export default function ShelterPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const shelterId = params.id;

  const [shelter, setShelter]         = useState<Shelter | null>(null);
  const [session, setSession]         = useState<Session | null>(null);
  const [roomAvail, setRoomAvail]     = useState<RoomAvail[]>([]);
  const [availLoaded, setAvailLoaded] = useState(false);
  const [reviews, setReviews]         = useState<Review[]>([]);
  const [loading, setLoading]         = useState(true);

  const [form, setForm] = useState({ startDate: "", endDate: "", roomId: "", guestCount: "2", boardType: "Bez wyżywienia" });
  const [bookMsg, setBookMsg]     = useState("");
  const [bookError, setBookError] = useState(false);

  const [showLogin, setShowLogin]         = useState(false);
  const [loginLogin, setLoginLogin]       = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError]       = useState("");

  useEffect(() => {
    setSession(readSession());
    Promise.all([
      apiFetch<Shelter>(`/api/shelters/${shelterId}`).then(setShelter).catch(() => {}),
      apiFetch<Review[]>(`/api/reviews/shelter/${shelterId}`).then(setReviews).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [shelterId]);

  async function checkAvail(start: string, end: string) {
    if (!start || !end || end <= start) { setRoomAvail([]); setAvailLoaded(false); return; }
    try {
      const data = await apiFetch<RoomAvail[]>(
        `/api/shelters/${shelterId}/rooms/availability?startDate=${start}&endDate=${end}`,
        undefined,
        readSession()?.token
      );
      setRoomAvail(data); setAvailLoaded(true);
      const first = data.find((r) => r.available);
      if (first) setForm((c) => ({ ...c, roomId: String(first.id) }));
    } catch { setRoomAvail([]); setAvailLoaded(false); }
  }

  function notify(text: string, error = false) {
    setBookMsg(text); setBookError(error);
    setTimeout(() => { setBookMsg(""); setBookError(false); }, 5000);
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault(); setLoginError("");
    try {
      const data = await apiFetch<Session>("/api/auth/login", {
        method: "POST", body: JSON.stringify({ login: loginLogin, password: loginPassword }),
      });
      saveSession(data); setSession(data); setShowLogin(false);
    } catch (err) { setLoginError(err instanceof Error ? err.message : "Błąd logowania."); }
  }

  async function handleReserve(e: FormEvent) {
    e.preventDefault();
    const s = readSession();
    if (!s) { setShowLogin(true); return; }
    try {
      const reservation = await apiFetch<Reservation & { id: number }>(
        "/api/reservations",
        { method: "POST", body: JSON.stringify({ roomId: Number(form.roomId), startDate: form.startDate, endDate: form.endDate, guestCount: Number(form.guestCount), boardType: form.boardType }) },
        s.token
      );
      const result = await openRazorpay(reservation, s);
      if (result === "confirmed") {
        notify("Płatność zakończona sukcesem! Rezerwacja potwierdzona.");
        setForm({ startDate: "", endDate: "", roomId: "", guestCount: "2", boardType: "Bez wyżywienia" });
        setRoomAvail([]); setAvailLoaded(false);
      } else {
        notify("Płatność anulowana. Rezerwacja cofnięta.", true);
      }
    } catch (err) { notify(err instanceof Error ? err.message : "Błąd rezerwacji.", true); }
  }

  async function openRazorpay(reservation: Reservation & { id: number }, s: Session): Promise<"confirmed" | "cancelled"> {
    const order = await apiFetch<{ orderId: string; amountPaise: number; currency: string; keyId: string }>(
      "/api/payments/create-order",
      { method: "POST", body: JSON.stringify({ reservationId: reservation.id }) },
      s.token
    );
    return new Promise((resolve, reject) => {
      const rzp = new window.Razorpay({
        key: order.keyId, amount: order.amountPaise, currency: order.currency,
        name: "SchroniskoHub",
        description: `Rezerwacja #${reservation.id} — ${reservation.shelterName}`,
        order_id: order.orderId,
        prefill: { email: s.email, name: s.login },
        theme: { color: "#18181b" },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await apiFetch("/api/payments/verify", {
              method: "POST",
              body: JSON.stringify({ reservationId: reservation.id, razorpayOrderId: response.razorpay_order_id, razorpayPaymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature }),
            }, s.token);
            resolve("confirmed");
          } catch (err) { reject(err); }
        },
        modal: {
          ondismiss: async () => {
            try { await apiFetch(`/api/reservations/${reservation.id}/cancel`, { method: "PATCH" }, s.token); } catch { /* ok */ }
            resolve("cancelled");
          },
        },
      });
      rzp.open();
    });
  }

  const selectedAvail = roomAvail.find((r) => String(r.id) === form.roomId);
  const maxGuests = selectedAvail
    ? (selectedAvail.roomType === "SHARED" ? selectedAvail.availableCapacity : selectedAvail.capacity)
    : undefined;

  const nights = (() => {
    if (!form.startDate || !form.endDate) return 0;
    const d = (new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86400000;
    return d > 0 ? d : 0;
  })();

  const boardExtra: Record<string, number> = { "Śniadanie": 20, "Śniadanie i kolacja": 45, "Pełne wyżywienie": 65 };
  const estimatedPrice = (() => {
    if (!selectedAvail || nights === 0) return null;
    const g = Number(form.guestCount) || 1;
    const base = selectedAvail.roomType === "SHARED" ? selectedAvail.pricePerNight * g * nights : selectedAvail.pricePerNight * nights;
    return base + (boardExtra[form.boardType] ?? 0) * g * nights;
  })();

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-400 dark:border-zinc-600 border-t-transparent" />
    </div>
  );

  if (!shelter) return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-zinc-950 gap-4">
      <p className="text-zinc-500">Nie znaleziono schroniska.</p>
      <button className="text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:underline" onClick={() => router.push("/search")}>← Wróć</button>
    </div>
  );

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : null;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-40 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <button className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" onClick={() => router.push("/search")}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            <span className="text-sm">Wszystkie schroniska</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
              <svg className="h-3 w-3 text-white dark:text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l7 7 7-7M5 14l7 7 7-7" />
              </svg>
            </div>
            <span className="text-sm font-bold tracking-tight">SchroniskoHub</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {session ? (
              <button className="rounded-md bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-white transition-colors" onClick={() => router.push("/dashboard")}>
                Panel →
              </button>
            ) : (
              <button className="rounded-md bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-white transition-colors" onClick={() => setShowLogin(true)}>
                Zaloguj się
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO IMAGE ── */}
      <div className="relative h-72 overflow-hidden bg-zinc-100 dark:bg-zinc-900 sm:h-96">
        {shelter.imageUrl
          ? <img className="h-full w-full object-cover" src={shelter.imageUrl} alt={shelter.name} />
          : <div className="flex h-full items-center justify-center text-zinc-300 dark:text-zinc-700 text-8xl">⛰</div>}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)" }} />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-3xl font-black text-white drop-shadow sm:text-4xl">{shelter.name}</h1>
            <p className="mt-1 text-sm text-white/70">{shelter.location}</p>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">

          {/* ── LEFT ── */}
          <div className="space-y-8">
            <div>
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {shelter.beds} miejsc
                </span>
                <span className="rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  od {shelter.price}
                </span>
                {avgRating !== null && (
                  <span className="rounded-full bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 px-3 py-1 text-sm font-semibold text-amber-700 dark:text-amber-400">
                    ★ {avgRating.toFixed(1)} <span className="font-normal text-amber-500 dark:text-amber-600">({reviews.length} opinii)</span>
                  </span>
                )}
              </div>
              {shelter.description && (
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{shelter.description}</p>
              )}
              {(shelter.phone || shelter.email) && (
                <div className="mt-5 flex flex-wrap gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                  {shelter.phone && <span>☎ {shelter.phone}</span>}
                  {shelter.email && <span>✉ {shelter.email}</span>}
                </div>
              )}
            </div>

            {/* Reviews */}
            <div>
              <h2 className="mb-4 text-base font-bold">Opinie gości</h2>
              {reviews.length === 0 ? (
                <p className="text-sm text-zinc-400 dark:text-zinc-500">Brak opinii dla tego schroniska.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold">{r.userLogin}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-500">{"★".repeat(r.rating)}<span className="text-zinc-200 dark:text-zinc-700">{"★".repeat(5 - r.rating)}</span></span>
                          <span className="text-xs text-zinc-400 dark:text-zinc-500">{r.createdAt?.slice(0, 10)}</span>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Reservation form ── */}
          <div className="lg:sticky lg:top-24 self-start">
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm dark:shadow-zinc-900/50">
              <h2 className="mb-5 text-base font-bold">Zarezerwuj nocleg</h2>

              {bookMsg && (
                <div className={`mb-4 rounded-lg px-3 py-2.5 text-sm border ${
                  bookError
                    ? "bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900"
                    : "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900"
                }`}>
                  {bookMsg}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleReserve}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Przyjazd</label>
                    <input className="field" type="date" value={form.startDate} min={new Date().toISOString().slice(0,10)}
                      onChange={(e) => { const v = {...form, startDate: e.target.value}; setForm(v); checkAvail(v.startDate, v.endDate); }} required />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Wyjazd</label>
                    <input className="field" type="date" value={form.endDate} min={form.startDate || new Date().toISOString().slice(0,10)}
                      onChange={(e) => { const v = {...form, endDate: e.target.value}; setForm(v); checkAvail(v.startDate, v.endDate); }} required />
                  </div>
                </div>

                {availLoaded && (
                  <div>
                    <label className="mb-2 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Wybierz pokój</label>
                    <div className="space-y-2">
                      {roomAvail.map((room) => (
                        <button key={room.id} type="button" disabled={!room.available}
                          onClick={() => room.available && setForm((c) => ({...c, roomId: String(room.id)}))}
                          className={`w-full rounded-lg border p-3 text-left transition ${
                            !room.available
                              ? "cursor-not-allowed border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 opacity-50"
                              : form.roomId === String(room.id)
                              ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                              : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-500"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold">{room.name}</span>
                            <span className={`text-[10px] font-semibold uppercase ${
                              !room.available ? "text-red-400"
                              : form.roomId === String(room.id) ? "text-zinc-300 dark:text-zinc-500"
                              : "text-emerald-600 dark:text-emerald-400"
                            }`}>
                              {room.roomType === "SHARED"
                                ? (room.available ? `${room.availableCapacity} wolnych` : "Brak")
                                : (room.available ? "Wolny" : "Zajęty")}
                            </span>
                          </div>
                          <p className={`mt-0.5 text-xs ${form.roomId === String(room.id) ? "text-zinc-300 dark:text-zinc-500" : "text-zinc-400 dark:text-zinc-500"}`}>
                            {room.roomType === "SHARED"
                              ? `${room.pricePerNight} zł/miejsce/noc · maks. ${room.capacity} os.`
                              : `${room.pricePerNight} zł/noc · ${room.capacity} miejsc`}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {availLoaded && roomAvail.length === 0 && (
                  <p className="rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-sm text-zinc-500 dark:text-zinc-400">
                    Brak dostępnych pokojów w tym terminie.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Goście</label>
                    <input className="field" type="number" min="1" max={maxGuests} value={form.guestCount}
                      onChange={(e) => setForm((c) => ({...c, guestCount: e.target.value}))} required />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Wyżywienie</label>
                    <select className="field" value={form.boardType} onChange={(e) => setForm((c) => ({...c, boardType: e.target.value}))}>
                      <option value="Bez wyżywienia">Bez wyżywienia</option>
                      <option value="Śniadanie">Śniadanie (+20 zł)</option>
                      <option value="Śniadanie i kolacja">Śniadanie i kolacja (+45 zł)</option>
                      <option value="Pełne wyżywienie">Pełne wyżywienie (+65 zł)</option>
                    </select>
                  </div>
                </div>

                {estimatedPrice !== null && (
                  <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 px-4 py-3 flex items-center justify-between">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {nights} {nights === 1 ? "noc" : nights < 5 ? "noce" : "nocy"} · {form.guestCount} {Number(form.guestCount) === 1 ? "gość" : "gości"}
                    </span>
                    <span className="text-base font-bold">{estimatedPrice} zł</span>
                  </div>
                )}

                <button className="btn-primary w-full h-11 text-sm" type="submit" disabled={availLoaded && !form.roomId}>
                  {session ? "Zarezerwuj i zapłać" : "Zaloguj się i zarezerwuj"}
                </button>

                {!session && (
                  <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">Wymagane konto — logowanie jest bezpłatne</p>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ── LOGIN MODAL ── */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowLogin(false)}>
          <div className="w-full max-w-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl">
            <h3 className="mb-4 text-base font-bold">Zaloguj się, aby zarezerwować</h3>
            {loginError && (
              <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900">{loginError}</div>
            )}
            <form className="space-y-3" onSubmit={handleLogin}>
              <input className="field" value={loginLogin} onChange={(e) => setLoginLogin(e.target.value)} placeholder="Login" required />
              <input className="field" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Hasło" required />
              <button className="btn-primary w-full h-10" type="submit">Zaloguj się</button>
            </form>
            <div className="mt-4">
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
            <button className="mt-4 w-full text-center text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition" onClick={() => setShowLogin(false)}>
              Zamknij
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

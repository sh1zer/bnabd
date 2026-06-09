"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "../components/ThemeProvider";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatDate } from "../lib/date";

// ── Types ────────────────────────────────────────────────────────────────────

type Session     = { token: string; userId: number; login: string; email: string; role: "USER"|"HOST"|"ADMIN" };
type Shelter     = { id: number; ownerId: number; name: string; description: string; location: string; phone: string; email: string; imageUrl: string; rating: number; beds: number; price: string; boardBreakfastPrice: number | null; boardHalfBoardPrice: number | null; boardFullBoardPrice: number | null };
type RoomType    = "WHOLE" | "SHARED";
type Room        = { id: number; shelterId: number; shelterName: string; name: string; capacity: number; roomType: RoomType; pricePerNight: number };
type Reservation = { id: number; userId: number; userLogin: string; roomId: number; roomName: string; shelterId: number; shelterName: string; startDate: string; endDate: string; guestCount: number; totalPrice: number; status: "PENDING"|"CONFIRMED"|"CANCELLED"; boardType: string; guestName: string | null };
type Review      = { id: number; userId: number; userLogin: string; shelterId: number; shelterName: string; rating: number; comment: string; createdAt: string };
type UserRecord  = { id: number; login: string; email: string; role: "USER"|"HOST"|"ADMIN"; createdAt: string };
type Stats       = { users: number; shelters: number; rooms: number; reservations: number; pendingReservations: number; revenue: number; monthlyReservations: { month: number; count: number }[]; monthlyRevenue: { month: number; revenue: number }[] };
type ShelterStats = { shelterId: number; shelterName: string; reservations: number; pendingReservations: number; revenue: number; monthlyReservations: { month: number; count: number }[]; monthlyRevenue: { month: number; revenue: number }[] };

// ── Helpers ──────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
const MONTHS = ["Sty","Lut","Mar","Kwi","Maj","Cze","Lip","Sie","Wrz","Paź","Lis","Gru"];

function readSession(): Session | null {
  try { return JSON.parse(localStorage.getItem("bnabd_session") ?? "null"); } catch { return null; }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [session, setSession] = useState<Session | null>(null);
  const [nav, setNav] = useState<"reservations"|"reviews"|"host"|"admin"|"profile">("reservations");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data
  const [shelters, setShelters]         = useState<Shelter[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reviews, setReviews]           = useState<Review[]>([]);
  const [rooms, setRooms]               = useState<Room[]>([]);
  const [users, setUsers]               = useState<UserRecord[]>([]);
  const [stats, setStats]               = useState<Stats | null>(null);

  // UI state
  const [reviewShelterId, setReviewShelterId]             = useState<number | null>(null);
  const [selectedHostShelterId, setSelectedHostShelterId] = useState<number | null>(null);
  const [hostSubTab, setHostSubTab]                       = useState<"rooms"|"stats">("rooms");
  const [hostStats, setHostStats]                         = useState<ShelterStats | null>(null);
  const [msg, setMsg]                                     = useState("");
  const [msgError, setMsgError]                           = useState(false);
  const [resSearch, setResSearch]                         = useState("");
  const [expandedShelters, setExpandedShelters]           = useState<Set<number>>(new Set());
  const [walkInOpen, setWalkInOpen]                       = useState(false);
  const [walkInRooms, setWalkInRooms]                     = useState<Room[]>([]);
  const [walkInF, setWalkInF]                             = useState({ shelterId: "", roomId: "", startDate: "", endDate: "", guestCount: "1", boardType: "Bez wyżywienia", guestName: "" });

  // Forms
  const [reviewRating, setReviewRating]   = useState("5");
  const [reviewComment, setReviewComment] = useState("");
  const [hostShelterF, setHostShelterF]   = useState({ name: "", description: "", location: "", phone: "", email: "", imageUrl: "", boardBreakfastPrice: "20", boardHalfBoardPrice: "45", boardFullBoardPrice: "65" });
  const [hostRoomF, setHostRoomF]         = useState({ name: "", capacity: "2", roomType: "WHOLE", pricePerNight: "50" });
  const [profileF, setProfileF]           = useState({ email: "", currentPassword: "", newPassword: "" });

  const hostShelters  = useMemo(() => session?.role === "ADMIN" ? shelters : shelters.filter((s) => s.ownerId === session?.userId), [shelters, session]);
  const visitedShelters = useMemo(() => {
    const seen = new Set<number>();
    return reservations
      .filter((r) => r.status !== "CANCELLED" && !seen.has(r.shelterId) && seen.add(r.shelterId))
      .map((r) => ({ id: r.shelterId, name: r.shelterName, location: shelters.find((s) => s.id === r.shelterId)?.location ?? "" }));
  }, [reservations, shelters]);
  const reservationsByShelter = useMemo(() => {
    const groups = new Map<number, { shelterId: number; shelterName: string; items: Reservation[] }>();
    for (const r of reservations) {
      const g = groups.get(r.shelterId) ?? { shelterId: r.shelterId, shelterName: r.shelterName, items: [] };
      g.items.push(r);
      groups.set(r.shelterId, g);
    }
    return Array.from(groups.values()).sort((a, b) => a.shelterName.localeCompare(b.shelterName));
  }, [reservations]);
  const filteredReservationGroups = useMemo(() => {
    const q = resSearch.trim().toLowerCase();
    return q ? reservationsByShelter.filter((g) => g.shelterName.toLowerCase().includes(q)) : reservationsByShelter;
  }, [reservationsByShelter, resSearch]);
  const chartData     = (stats?.monthlyReservations ?? []).map((d) => ({ name: MONTHS[(d.month - 1) % 12], Rez: d.count }));
  const revenueData   = (stats?.monthlyRevenue ?? []).map((d) => ({ name: MONTHS[(d.month - 1) % 12], Przychód: Math.round(d.revenue) }));
  const hostChartData = (hostStats?.monthlyReservations ?? []).map((d) => ({ name: MONTHS[(d.month - 1) % 12], Rez: d.count }));
  const hostRevData   = (hostStats?.monthlyRevenue ?? []).map((d) => ({ name: MONTHS[(d.month - 1) % 12], Przychód: Math.round(d.revenue) }));

  // chart tooltip style adapts to current theme
  const tooltipStyle = theme === "dark"
    ? { fontSize: 12, borderRadius: 8, backgroundColor: "#18181b", border: "1px solid #3f3f46", color: "#fafafa", boxShadow: "0 1px 6px rgba(0,0,0,0.4)" }
    : { fontSize: 12, borderRadius: 8, backgroundColor: "#ffffff", border: "1px solid #e4e4e7", color: "#18181b", boxShadow: "0 1px 6px rgba(0,0,0,0.08)" };
  const gridColor  = theme === "dark" ? "#27272a" : "#f4f4f5";
  const tickColor  = theme === "dark" ? "#a1a1aa" : "#71717a";
  const cursorFill = theme === "dark" ? "#27272a" : "#f4f4f5";

  useEffect(() => {
    const s = readSession();
    if (!s) { router.push("/"); return; }
    setSession(s);
    setProfileF((c) => ({ ...c, email: s.email }));
    init(s);
  }, []);

  useEffect(() => {
    if (selectedHostShelterId) {
      load<Room[]>(`/api/shelters/${selectedHostShelterId}/rooms`, setRooms);
      call<ShelterStats>(`/api/shelters/${selectedHostShelterId}/stats`).then(setHostStats).catch(() => setHostStats(null));
    }
  }, [selectedHostShelterId]);

  // ── API ──────────────────────────────────────────────────────────────────

  function tok(): string { return readSession()?.token ?? ""; }

  async function call<T>(path: string, opts?: RequestInit): Promise<T> {
    const res = await fetch(`${API}${path}`, {
      ...opts,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok()}`, ...opts?.headers },
    });
    if (!res.ok) { const e = await res.json().catch(() => ({ message: "Błąd" })); throw new Error(e.message); }
    return res.json();
  }

  async function load<T>(path: string, setter: (v: T) => void) {
    try { setter(await call<T>(path)); } catch { setter([] as unknown as T); }
  }

  async function init(s: Session) {
    await load<Shelter[]>("/api/shelters", setShelters);
    await load<Reservation[]>("/api/reservations", setReservations);
    if (s.role === "ADMIN") {
      await load<Stats>("/api/admin/stats", setStats);
      await load<UserRecord[]>("/api/admin/users", setUsers);
    }
  }

  function notify(text: string, error = false) { setMsg(text); setMsgError(error); setTimeout(() => { setMsg(""); setMsgError(false); }, 4000); }

  // ── Actions ──────────────────────────────────────────────────────────────

  function logout() { localStorage.removeItem("bnabd_session"); router.push("/"); }

  function toggleShelter(id: number) {
    setExpandedShelters((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  async function act(fn: () => Promise<void>) {
    try { await fn(); } catch (e) { notify(e instanceof Error ? e.message : "Błąd.", true); }
  }

  async function updateProfile(e: FormEvent) {
    e.preventDefault();
    await act(async () => {
      const updated = await call<UserRecord>("/api/users/me", {
        method: "PUT",
        body: JSON.stringify({ email: profileF.email, currentPassword: profileF.currentPassword || undefined, newPassword: profileF.newPassword || undefined }),
      });
      const s = readSession();
      if (s) { const next = { ...s, email: updated.email }; localStorage.setItem("bnabd_session", JSON.stringify(next)); setSession(next); }
      setProfileF({ email: updated.email, currentPassword: "", newPassword: "" });
      notify("Profil zaktualizowany.");
    });
  }

  async function cancelReservation(id: number) {
    await act(async () => {
      await call(`/api/reservations/${id}/cancel`, { method: "PATCH" });
      await load<Reservation[]>("/api/reservations", setReservations);
      if (session?.role === "ADMIN") await load<Stats>("/api/admin/stats", setStats);
    });
  }

  function selectWalkInShelter(shelterId: string) {
    setWalkInF((c) => ({ ...c, shelterId, roomId: "" }));
    setWalkInRooms([]);
    if (shelterId) load<Room[]>(`/api/shelters/${shelterId}/rooms`, setWalkInRooms);
  }

  async function createWalkIn(e: FormEvent) {
    e.preventDefault();
    await act(async () => {
      await call("/api/reservations", { method: "POST", body: JSON.stringify({
        roomId: Number(walkInF.roomId), startDate: walkInF.startDate, endDate: walkInF.endDate,
        guestCount: Number(walkInF.guestCount), boardType: walkInF.boardType, guestName: walkInF.guestName,
      }) });
      notify("Rezerwacja dodana.");
      setWalkInF({ shelterId: "", roomId: "", startDate: "", endDate: "", guestCount: "1", boardType: "Bez wyżywienia", guestName: "" });
      setWalkInRooms([]);
      setWalkInOpen(false);
      await load<Reservation[]>("/api/reservations", setReservations);
    });
  }

  async function submitReview(e: FormEvent) {
    e.preventDefault();
    if (!reviewShelterId) return;
    await act(async () => {
      await call("/api/reviews", { method: "POST", body: JSON.stringify({ shelterId: reviewShelterId, rating: Number(reviewRating), comment: reviewComment }) });
      notify("Opinia dodana.");
      setReviewComment("");
      await load<Review[]>(`/api/reviews/shelter/${reviewShelterId}`, setReviews);
    });
  }

  async function createHostShelter(e: FormEvent) {
    e.preventDefault();
    const num = (v: string) => (v.trim() === "" ? null : Number(v));
    await act(async () => {
      await call("/api/shelters", { method: "POST", body: JSON.stringify({
        name: hostShelterF.name, description: hostShelterF.description, location: hostShelterF.location,
        phone: hostShelterF.phone, email: hostShelterF.email, imageUrl: hostShelterF.imageUrl,
        boardBreakfastPrice: num(hostShelterF.boardBreakfastPrice),
        boardHalfBoardPrice: num(hostShelterF.boardHalfBoardPrice),
        boardFullBoardPrice: num(hostShelterF.boardFullBoardPrice),
      }) });
      notify("Schronisko dodane.");
      setHostShelterF({ name: "", description: "", location: "", phone: "", email: "", imageUrl: "", boardBreakfastPrice: "20", boardHalfBoardPrice: "45", boardFullBoardPrice: "65" });
      await load<Shelter[]>("/api/shelters", setShelters);
    });
  }

  async function addRoom(e: FormEvent) {
    e.preventDefault();
    if (!selectedHostShelterId) return;
    await act(async () => {
      await call(`/api/shelters/${selectedHostShelterId}/rooms`, { method: "POST", body: JSON.stringify({ name: hostRoomF.name, capacity: Number(hostRoomF.capacity), roomType: hostRoomF.roomType, pricePerNight: Number(hostRoomF.pricePerNight) }) });
      notify("Pokój dodany."); setHostRoomF({ name: "", capacity: "2", roomType: "WHOLE", pricePerNight: "50" });
      await load<Room[]>(`/api/shelters/${selectedHostShelterId}/rooms`, setRooms);
    });
  }

  async function deleteRoom(shelterId: number, roomId: number) {
    await act(async () => { await call(`/api/shelters/${shelterId}/rooms/${roomId}`, { method: "DELETE" }); await load<Room[]>(`/api/shelters/${shelterId}/rooms`, setRooms); });
  }

  async function changeRole(userId: number, role: string) {
    await act(async () => { await call(`/api/admin/users/${userId}/role`, { method: "PATCH", body: JSON.stringify({ role }) }); await load<UserRecord[]>("/api/admin/users", setUsers); });
  }

  async function deleteUser(userId: number, login: string) {
    if (!confirm(`Usunąć ${login}?`)) return;
    await act(async () => { await call(`/api/admin/users/${userId}`, { method: "DELETE" }); await load<UserRecord[]>("/api/admin/users", setUsers); });
  }

  async function deleteShelterAdmin(id: number, name: string) {
    if (!confirm(`Usunąć "${name}"?`)) return;
    await act(async () => { await call(`/api/admin/shelters/${id}`, { method: "DELETE" }); await load<Shelter[]>("/api/shelters", setShelters); await load<Stats>("/api/admin/stats", setStats); });
  }

  async function resetDatabase() {
    if (!confirm("Zresetować bazę danych?")) return;
    await act(async () => {
      await call("/api/admin/db/reset", { method: "POST" });
      notify("Baza zresetowana.");
      await init(session!);
    });
  }

  if (!session) return null;

  const navItems = [
    { key: "reservations", label: "Rezerwacje",    icon: CalendarIcon },
    { key: "reviews",      label: "Opinie",        icon: StarIcon },
    ...(session.role === "HOST" || session.role === "ADMIN" ? [{ key: "host",  label: "Zarządzanie",  icon: BuildingIcon }] : []),
    ...(session.role === "ADMIN" ? [{ key: "admin", label: "Administracja", icon: CogIcon }] : []),
  ] as const;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {sidebarOpen && <div className="fixed inset-0 z-20 bg-zinc-900/40 dark:bg-zinc-950/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── SIDEBAR ── */}
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-56 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-transform duration-200 lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <button onClick={() => router.push("/")} className="flex w-full items-center gap-2.5 border-b border-zinc-100 dark:border-zinc-800 px-4 py-4 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
          <div className="h-6 w-6 rounded bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center flex-shrink-0">
            <svg className="h-3.5 w-3.5 text-white dark:text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l7 7 7-7M5 14l7 7 7-7" />
            </svg>
          </div>
          <span className="text-sm font-bold tracking-tight">Schroniskowo</span>
        </button>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => { setNav(key as typeof nav); setSidebarOpen(false); }}
              className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                nav === key
                  ? "bg-zinc-100 dark:bg-zinc-800 font-semibold text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}>
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        <div className="border-t border-zinc-100 dark:border-zinc-800 p-3 space-y-1">
          <button
            onClick={() => { setNav("profile"); setSidebarOpen(false); }}
            className={`block w-full rounded-md px-3 py-2 text-left transition-colors ${nav === "profile" ? "bg-zinc-100 dark:bg-zinc-800" : "hover:bg-zinc-50 dark:hover:bg-zinc-900"}`}
          >
            <p className="text-xs font-semibold truncate">{session.login}</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{session.email}</p>
            <span className={`mt-1 inline-block text-[10px] font-semibold uppercase tracking-wide ${session.role==="ADMIN"?"text-red-500":session.role==="HOST"?"text-amber-600 dark:text-amber-500":"text-emerald-600 dark:text-emerald-500"}`}>{session.role}</span>
          </button>
          <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors" onClick={toggle}>
            {theme === "dark" ? (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="4"/>
                <path strokeLinecap="round" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )} Motyw
          </button>
          <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors" onClick={logout}>
            <LogoutIcon className="h-3.5 w-3.5" /> Wyloguj
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6">
          <div className="flex items-center gap-3">
            <button className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 lg:hidden" onClick={() => setSidebarOpen(true)}>
              <MenuIcon className="h-5 w-5" />
            </button>
            <h1 className="text-sm font-semibold">{nav === "profile" ? "Profil" : navItems.find((n) => n.key === nav)?.label ?? "Panel"}</h1>
          </div>
          {msg && <p className={`text-xs font-medium rounded-md px-3 py-1.5 ${msgError ? "bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900" : "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900"}`}>{msg}</p>}
        </header>

        <main className="flex-1 overflow-y-auto p-6">

          {/* ══════ RESERVATIONS ══════ */}
          {nav === "reservations" && (
            <div className="max-w-5xl space-y-4">
              {(reservations.length > 0 || session.role !== "USER") && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {reservations.length > 0 ? (
                    <input
                      className="field max-w-xs"
                      value={resSearch}
                      onChange={(e) => setResSearch(e.target.value)}
                      placeholder="Szukaj schroniska..."
                    />
                  ) : <span />}
                  {session.role !== "USER" && (
                    <button className="btn-secondary h-9 px-3 text-xs" onClick={() => setWalkInOpen((o) => !o)}>
                      {walkInOpen ? "Anuluj" : "+ Rezerwacja walk-in"}
                    </button>
                  )}
                </div>
              )}

              {walkInOpen && session.role !== "USER" && (() => {
                const sh = shelters.find((s) => String(s.id) === walkInF.shelterId);
                return (
                  <form className="grid gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:grid-cols-2" onSubmit={createWalkIn}>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Imię i nazwisko gościa</label>
                      <input className="field" value={walkInF.guestName} onChange={(e) => setWalkInF((c) => ({ ...c, guestName: e.target.value }))} placeholder="np. Jan Kowalski" required />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Schronisko</label>
                      <select className="field" value={walkInF.shelterId} onChange={(e) => selectWalkInShelter(e.target.value)} required>
                        <option value="">Wybierz...</option>
                        {hostShelters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Pokój</label>
                      <select className="field" value={walkInF.roomId} onChange={(e) => setWalkInF((c) => ({ ...c, roomId: e.target.value }))} required disabled={!walkInF.shelterId}>
                        <option value="">{walkInF.shelterId ? "Wybierz..." : "Najpierw schronisko"}</option>
                        {walkInRooms.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.capacity} miejsc, {r.pricePerNight} zł)</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Od</label>
                      <input className="field" type="date" value={walkInF.startDate} onChange={(e) => setWalkInF((c) => ({ ...c, startDate: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Do</label>
                      <input className="field" type="date" value={walkInF.endDate} onChange={(e) => setWalkInF((c) => ({ ...c, endDate: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Liczba gości</label>
                      <input className="field" type="number" min="1" value={walkInF.guestCount} onChange={(e) => setWalkInF((c) => ({ ...c, guestCount: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Wyżywienie</label>
                      <select className="field" value={walkInF.boardType} onChange={(e) => setWalkInF((c) => ({ ...c, boardType: e.target.value }))}>
                        <option value="Bez wyżywienia">Bez wyżywienia</option>
                        <option value="Śniadanie">Śniadanie (+{sh?.boardBreakfastPrice ?? 0} zł)</option>
                        <option value="Śniadanie i kolacja">Śniadanie i kolacja (+{sh?.boardHalfBoardPrice ?? 0} zł)</option>
                        <option value="Pełne wyżywienie">Pełne wyżywienie (+{sh?.boardFullBoardPrice ?? 0} zł)</option>
                      </select>
                    </div>
                    <button className="btn-primary sm:col-span-2" type="submit">Dodaj rezerwację</button>
                  </form>
                );
              })()}

              {reservations.length === 0 ? (
                <div className="py-16 text-center text-sm text-zinc-400">Brak rezerwacji.</div>
              ) : filteredReservationGroups.length === 0 ? (
                <div className="py-16 text-center text-sm text-zinc-400">Brak schronisk pasujących do „{resSearch}”.</div>
              ) : (
                <div className="space-y-3">
                  {filteredReservationGroups.map((group) => {
                        const total = group.items.filter((r) => r.status !== "CANCELLED").reduce((sum, r) => sum + r.totalPrice, 0);
                        const open = expandedShelters.has(group.shelterId);
                        return (
                          <section key={group.shelterId} className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                            <button
                              onClick={() => toggleShelter(group.shelterId)}
                              className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                            >
                              <span className="flex items-center gap-2.5">
                                <ChevronIcon className={`h-4 w-4 flex-shrink-0 text-zinc-400 transition-transform ${open ? "rotate-90" : ""}`} />
                                <span className="text-sm font-semibold">{group.shelterName}</span>
                              </span>
                              <span className="text-xs text-zinc-400">{group.items.length} rez. · {total} zł</span>
                            </button>
                            {open && (
                              <div className="overflow-x-auto border-t border-zinc-100 dark:border-zinc-800">
                                <table className="w-full min-w-[640px]">
                                  <thead>
                                    <tr>
                                      <th className="table-head">Gość</th>
                                      <th className="table-head">Pokój</th>
                                      <th className="table-head">Termin</th>
                                      <th className="table-head">Wyżywienie</th>
                                      <th className="table-head">Kwota</th>
                                      <th className="table-head">Status</th>
                                      <th className="table-head"></th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {group.items.map((r) => (
                                      <tr key={r.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                                        <td className="table-cell font-medium">
                                          {r.guestName ?? r.userLogin}
                                          {r.guestName && <span className="ml-1.5 text-[10px] font-normal uppercase tracking-wide text-zinc-400">walk-in</span>}
                                        </td>
                                        <td className="table-cell">{r.roomName}</td>
                                        <td className="table-cell text-xs text-zinc-500">{formatDate(r.startDate)} → {formatDate(r.endDate)}</td>
                                        <td className="table-cell text-xs text-zinc-500">{r.boardType ?? "Bez wyżywienia"}</td>
                                        <td className="table-cell font-semibold">{r.totalPrice} zł</td>
                                        <td className="table-cell"><RStatus status={r.status} /></td>
                                        <td className="table-cell">
                                          {r.status !== "CANCELLED" && <button className="btn-sm-danger" onClick={() => cancelReservation(r.id)}>Anuluj</button>}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </section>
                        );
                      })}
                </div>
              )}
            </div>
          )}

          {/* ══════ REVIEWS ══════ */}
          {nav === "reviews" && (session.role === "USER" ? (
            <div className="max-w-3xl space-y-3">
              {visitedShelters.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-16 text-center text-sm text-zinc-400">
                  Nie masz jeszcze odwiedzonych schronisk. Zarezerwuj nocleg, aby dodać opinię.
                </div>
              ) : visitedShelters.map((s) => (
                <div key={s.id} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold">{s.name}</h3>
                      {s.location && <p className="mt-0.5 text-xs text-zinc-400">{s.location}</p>}
                    </div>
                    <button className="btn-secondary h-8 px-3 text-xs"
                      onClick={() => { setReviewShelterId(reviewShelterId === s.id ? null : s.id); setReviewComment(""); setReviewRating("5"); }}>
                      {reviewShelterId === s.id ? "Anuluj" : "Dodaj opinię"}
                    </button>
                  </div>
                  {reviewShelterId === s.id && (
                    <form className="mt-4 space-y-3 border-t border-zinc-100 dark:border-zinc-800 pt-4" onSubmit={submitReview}>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Ocena</label>
                        <select className="field" value={reviewRating} onChange={(e) => setReviewRating(e.target.value)}>
                          {[5,4,3,2,1].map((n) => <option key={n} value={n}>{n} {"★".repeat(n)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Komentarz</label>
                        <textarea className="field h-24 resize-none py-2" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Twoja opinia..." required />
                      </div>
                      <button className="btn-primary w-full" type="submit">Dodaj opinię</button>
                      <p className="text-[11px] text-zinc-400">Wymaga ukończonego pobytu.</p>
                    </form>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="max-w-3xl space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {hostShelters.map((s) => (
                  <button key={s.id} onClick={() => { setReviewShelterId(s.id); load<Review[]>(`/api/reviews/shelter/${s.id}`, setReviews); }}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${reviewShelterId === s.id ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900" : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500"}`}>
                    {s.name}
                  </button>
                ))}
              </div>
              {!reviewShelterId ? (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-16 text-center text-sm text-zinc-400">Wybierz schronisko.</div>
              ) : reviews.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-16 text-center text-sm text-zinc-400">Brak opinii dla tego schroniska.</div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  {reviews.map((r) => (
                    <div key={r.id} className="px-6 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-sm font-semibold">{r.userLogin}</span>
                          <span className="ml-2 text-xs text-zinc-400">{formatDate(r.createdAt)}</span>
                        </div>
                        <div className="text-xs text-amber-500 font-semibold">{"★".repeat(r.rating)}<span className="text-zinc-200 dark:text-zinc-700">{"★".repeat(5-r.rating)}</span></div>
                      </div>
                      <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* ══════ HOST ══════ */}
          {nav === "host" && (session.role === "HOST" || session.role === "ADMIN") && (
            <div className="max-w-4xl space-y-6">
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
                <h2 className="mb-4 text-sm font-semibold">Nowe schronisko</h2>
                <form className="grid gap-3 sm:grid-cols-2" onSubmit={createHostShelter}>
                  <input className="field" value={hostShelterF.name} onChange={(e) => setHostShelterF((c) => ({...c,name:e.target.value}))} placeholder="Nazwa" required />
                  <input className="field" value={hostShelterF.location} onChange={(e) => setHostShelterF((c) => ({...c,location:e.target.value}))} placeholder="Lokalizacja" required />
                  <input className="field" value={hostShelterF.phone} onChange={(e) => setHostShelterF((c) => ({...c,phone:e.target.value}))} placeholder="Telefon" />
                  <input className="field" type="email" value={hostShelterF.email} onChange={(e) => setHostShelterF((c) => ({...c,email:e.target.value}))} placeholder="Email" />
                  <input className="field sm:col-span-2" value={hostShelterF.imageUrl} onChange={(e) => setHostShelterF((c) => ({...c,imageUrl:e.target.value}))} placeholder="URL zdjęcia" />
                  <textarea className="field resize-none sm:col-span-2" rows={2} value={hostShelterF.description} onChange={(e) => setHostShelterF((c) => ({...c,description:e.target.value}))} placeholder="Opis" />
                  <div className="sm:col-span-2">
                    <p className="mb-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">Dopłaty za wyżywienie <span className="text-zinc-400 dark:text-zinc-500">(zł / osoba / noc)</span></p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="mb-1 block text-[11px] text-zinc-400 dark:text-zinc-500">Śniadanie</label>
                        <input className="field" type="number" min="0" step="0.01" value={hostShelterF.boardBreakfastPrice} onChange={(e) => setHostShelterF((c) => ({...c,boardBreakfastPrice:e.target.value}))} placeholder="0" />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] text-zinc-400 dark:text-zinc-500">Śniadanie i kolacja</label>
                        <input className="field" type="number" min="0" step="0.01" value={hostShelterF.boardHalfBoardPrice} onChange={(e) => setHostShelterF((c) => ({...c,boardHalfBoardPrice:e.target.value}))} placeholder="0" />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] text-zinc-400 dark:text-zinc-500">Pełne wyżywienie</label>
                        <input className="field" type="number" min="0" step="0.01" value={hostShelterF.boardFullBoardPrice} onChange={(e) => setHostShelterF((c) => ({...c,boardFullBoardPrice:e.target.value}))} placeholder="0" />
                      </div>
                    </div>
                  </div>
                  <button className="btn-primary sm:col-span-2" type="submit">Dodaj schronisko</button>
                </form>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                <div className="border-b border-zinc-100 dark:border-zinc-800 px-6 py-4">
                  <h2 className="mb-3 text-sm font-semibold">Moje schroniska</h2>
                  <div className="flex flex-wrap gap-1.5">
                    {hostShelters.map((s) => (
                      <button key={s.id} onClick={() => setSelectedHostShelterId(s.id)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${selectedHostShelterId===s.id ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900" : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500"}`}>
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>

                {!selectedHostShelterId ? (
                  <div className="py-12 text-center text-sm text-zinc-400">Wybierz schronisko powyżej.</div>
                ) : (
                  <div className="p-6">
                    <div className="mb-5 flex gap-1 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                      {(["rooms","stats"] as const).map((t) => (
                        <button key={t} onClick={() => setHostSubTab(t)}
                          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${hostSubTab===t ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}>
                          {t === "rooms" ? "Pokoje" : "Statystyki"}
                        </button>
                      ))}
                    </div>

                    {hostSubTab === "rooms" && (
                      <>
                        <div className="mb-4 divide-y divide-zinc-100 dark:divide-zinc-800 rounded-lg border border-zinc-100 dark:border-zinc-800">
                          {rooms.length === 0 ? <p className="p-4 text-xs text-zinc-400">Brak pokojów.</p> : rooms.map((r) => (
                            <div key={r.id} className="flex items-center justify-between p-4">
                              <div>
                                <span className="text-sm font-medium">{r.name}</span>
                                <span className="ml-3 text-xs text-zinc-400">{r.roomType === "SHARED" ? "wspólny" : "cały pokój"} · {r.capacity} miejsc · {r.pricePerNight} zł/{r.roomType === "SHARED" ? "miejsce/" : ""}noc</span>
                              </div>
                              <button className="btn-sm-danger" onClick={() => deleteRoom(selectedHostShelterId, r.id)}>Usuń</button>
                            </div>
                          ))}
                        </div>
                        <form className="grid gap-3 sm:grid-cols-3" onSubmit={addRoom}>
                          <div>
                            <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Nazwa pokoju</label>
                            <input className="field" value={hostRoomF.name} onChange={(e) => setHostRoomF((c) => ({...c,name:e.target.value}))} placeholder="np. Pokój nr 1" required />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Miejsca</label>
                            <input className="field" type="number" min="1" value={hostRoomF.capacity} onChange={(e) => setHostRoomF((c) => ({...c,capacity:e.target.value}))} />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Typ</label>
                            <select className="field" value={hostRoomF.roomType} onChange={(e) => setHostRoomF((c) => ({...c,roomType:e.target.value}))}>
                              <option value="WHOLE">Cały pokój</option>
                              <option value="SHARED">Pokój wspólny</option>
                            </select>
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{hostRoomF.roomType === "SHARED" ? "Cena/miejsce/noc (zł)" : "Cena/noc (zł)"}</label>
                            <input className="field" type="number" min="1" value={hostRoomF.pricePerNight} onChange={(e) => setHostRoomF((c) => ({...c,pricePerNight:e.target.value}))} />
                          </div>
                          <button className="btn-primary self-end sm:col-span-3" type="submit">Dodaj pokój</button>
                        </form>
                      </>
                    )}

                    {hostSubTab === "stats" && (
                      !hostStats ? (
                        <p className="p-4 text-xs text-zinc-400">Brak danych statystycznych.</p>
                      ) : (
                        <>
                          <div className="mb-5 grid gap-4 sm:grid-cols-3">
                            {[
                              { label: "Rezerwacje", value: hostStats.reservations },
                              { label: "Oczekujące", value: hostStats.pendingReservations },
                              { label: "Przychód",   value: `${Math.round(hostStats.revenue).toLocaleString()} zł` },
                            ].map(({ label, value }) => (
                              <div key={label} className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 p-4">
                                <p className="text-xs font-medium text-zinc-400">{label}</p>
                                <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
                              </div>
                            ))}
                          </div>
                          <h3 className="mb-4 text-sm font-semibold">Rezerwacje / miesiąc</h3>
                          <ResponsiveContainer width="100%" height={160}>
                            <BarChart data={hostChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                              <XAxis dataKey="name" tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} allowDecimals={false} />
                              <Tooltip cursor={{ fill: cursorFill }} contentStyle={tooltipStyle} />
                              <Bar dataKey="Rez" name="Rezerwacje" fill={theme === "dark" ? "#e4e4e7" : "#18181b"} radius={[3,3,0,0]} />
                            </BarChart>
                          </ResponsiveContainer>
                          <h3 className="mb-4 mt-6 text-sm font-semibold">Przychód / miesiąc</h3>
                          <ResponsiveContainer width="100%" height={160}>
                            <BarChart data={hostRevData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                              <XAxis dataKey="name" tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} allowDecimals={false} />
                              <Tooltip cursor={{ fill: cursorFill }} formatter={(v) => [`${Number(v).toLocaleString()} zł`, "Przychód"]} contentStyle={tooltipStyle} />
                              <Bar dataKey="Przychód" fill="#f59e0b" radius={[3,3,0,0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════ ADMIN ══════ */}
          {nav === "admin" && session.role === "ADMIN" && (
            <div className="max-w-5xl space-y-6">
              {stats && (
                <div className="grid gap-4 sm:grid-cols-4">
                  {[
                    { label: "Użytkownicy", value: stats.users },
                    { label: "Schroniska",  value: stats.shelters },
                    { label: "Rezerwacje",  value: stats.reservations },
                    { label: "Przychód",    value: `${Math.round(stats.revenue).toLocaleString()} zł` },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
                      <p className="text-xs font-medium text-zinc-400">{label}</p>
                      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              {chartData.length > 0 && (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Rezerwacje / miesiąc</h2>
                    <button className="btn-danger h-8 px-3 text-xs" onClick={resetDatabase}>Reset bazy</button>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip cursor={{ fill: cursorFill }} contentStyle={tooltipStyle} />
                      <Bar dataKey="Rez" name="Rezerwacje" fill={theme === "dark" ? "#e4e4e7" : "#18181b"} radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {revenueData.length > 0 && (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
                  <h2 className="mb-5 text-sm font-semibold">Przychód / miesiąc</h2>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip cursor={{ fill: cursorFill }} formatter={(v) => [`${Number(v).toLocaleString()} zł`, "Przychód"]} contentStyle={tooltipStyle} />
                      <Bar dataKey="Przychód" fill="#f59e0b" radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-6 py-4">
                  <h2 className="text-sm font-semibold">Użytkownicy</h2>
                  <span className="text-xs text-zinc-400">{users.length}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px]">
                    <thead><tr>
                      <th className="table-head">Login</th>
                      <th className="table-head">Email</th>
                      <th className="table-head">Rola</th>
                      <th className="table-head"></th>
                    </tr></thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                          <td className="table-cell font-medium">{u.login}</td>
                          <td className="table-cell text-zinc-500 text-xs">{u.email}</td>
                          <td className="table-cell">
                            <select className="rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-200 focus:outline-none" value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}>
                              <option value="USER">USER</option>
                              <option value="HOST">HOST</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          </td>
                          <td className="table-cell">
                            {u.login !== session.login && <button className="btn-sm-danger" onClick={() => deleteUser(u.id, u.login)}>Usuń</button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-6 py-4">
                  <h2 className="text-sm font-semibold">Schroniska</h2>
                  <span className="text-xs text-zinc-400">{shelters.length}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[400px]">
                    <thead><tr>
                      <th className="table-head">Nazwa</th>
                      <th className="table-head">Lokalizacja</th>
                      <th className="table-head">Łóżka</th>
                      <th className="table-head"></th>
                    </tr></thead>
                    <tbody>
                      {shelters.map((s) => (
                        <tr key={s.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                          <td className="table-cell font-medium">{s.name}</td>
                          <td className="table-cell text-zinc-500 text-xs">{s.location}</td>
                          <td className="table-cell text-zinc-500">{s.beds}</td>
                          <td className="table-cell"><button className="btn-sm-danger" onClick={() => deleteShelterAdmin(s.id, s.name)}>Usuń</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════ PROFILE ══════ */}
          {nav === "profile" && (
            <div className="max-w-lg space-y-5">
              <p className="text-xs text-zinc-400">Login <strong className="text-zinc-700 dark:text-zinc-200">{session.login}</strong> · rola <strong className="text-zinc-700 dark:text-zinc-200">{session.role}</strong></p>
              <form className="space-y-4" onSubmit={updateProfile}>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Email</label>
                  <input className="field" type="email" value={profileF.email} onChange={(e) => setProfileF((c) => ({ ...c, email: e.target.value }))} required />
                </div>
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
                  <p className="mb-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">Zmiana hasła <span className="text-zinc-400 dark:text-zinc-500">(opcjonalnie)</span></p>
                  <div className="space-y-3">
                    <input className="field" type="password" value={profileF.currentPassword} onChange={(e) => setProfileF((c) => ({ ...c, currentPassword: e.target.value }))} placeholder="Aktualne hasło" autoComplete="current-password" />
                    <input className="field" type="password" minLength={6} value={profileF.newPassword} onChange={(e) => setProfileF((c) => ({ ...c, newPassword: e.target.value }))} placeholder="Nowe hasło (min. 6 znaków)" autoComplete="new-password" />
                  </div>
                </div>
                <button className="btn-primary w-full" type="submit">Zapisz zmiany</button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function CalendarIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
}
function StarIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
}
function BuildingIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M9 21v-4h6v4"/></svg>;
}
function CogIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>;
}
function LogoutIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>;
}
function MenuIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>;
}
function ChevronIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6"/></svg>;
}

function RStatus({ status }: { status: Reservation["status"] }) {
  const cfg = { CONFIRMED: "badge-green", CANCELLED: "badge-red", PENDING: "badge-amber" } as const;
  return <span className={cfg[status] + " badge"}>{status}</span>;
}

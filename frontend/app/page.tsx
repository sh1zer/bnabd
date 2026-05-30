"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Shelter = {
  id: number;
  name: string;
  description: string;
  location: string;
  phone: string;
  email: string;
  imageUrl: string;
  rating: number;
  beds: number;
  price: string;
};

type Room = {
  id: number;
  shelterId: number;
  shelterName: string;
  name: string;
  capacity: number;
  pricePerNight: number;
};

type Reservation = {
  id: number;
  userId: number;
  userLogin: string;
  roomId: number;
  roomName: string;
  shelterId: number;
  shelterName: string;
  startDate: string;
  endDate: string;
  guestCount: number;
  totalPrice: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
};

type Session = {
  token: string;
  userId: number;
  login: string;
  email: string;
  role: "USER" | "HOST" | "ADMIN";
};

type Stats = {
  users: number;
  shelters: number;
  rooms: number;
  reservations: number;
  pendingReservations: number;
  revenue: number;
  monthlyReservations: { month: number; count: number }[];
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const demoCredentials = [
  ["admin", "admin123", "ADMIN"],
  ["host", "host123", "HOST"],
  ["user", "user123", "USER"]
];

export default function Home() {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [selectedShelterId, setSelectedShelterId] = useState<number | null>(null);
  const [message, setMessage] = useState("Backend: laczenie...");
  const [filter, setFilter] = useState("");
  const [login, setLogin] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [reservationForm, setReservationForm] = useState({
    roomId: "",
    startDate: "",
    endDate: "",
    guestCount: "2"
  });

  const selectedShelter = useMemo(
    () => shelters.find((shelter) => shelter.id === selectedShelterId) ?? shelters[0],
    [selectedShelterId, shelters]
  );

  useEffect(() => {
    loadShelters();
    loadReservations();
    loadStats();
  }, []);

  useEffect(() => {
    if (selectedShelter?.id) {
      loadRooms(selectedShelter.id);
    }
  }, [selectedShelter?.id]);

  async function api<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
        ...options?.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Blad API" }));
      throw new Error(error.message ?? "Blad API");
    }
    return response.json();
  }

  async function loadShelters(location = "") {
    try {
      const data = await api<Shelter[]>(`/api/shelters${location ? `?location=${encodeURIComponent(location)}` : ""}`);
      setShelters(data);
      setSelectedShelterId((current) => current ?? data[0]?.id ?? null);
      setMessage("Backend: polaczono");
    } catch {
      setMessage("Backend niedostepny. Uruchom Spring Boot na porcie 8080.");
    }
  }

  async function loadRooms(shelterId: number) {
    setRooms(await api<Room[]>(`/api/shelters/${shelterId}/rooms`));
  }

  async function loadReservations(userId = session?.role === "USER" ? session.userId : undefined, token = session?.token) {
    try {
      const data = await api<Reservation[]>(`/api/reservations${userId ? `?userId=${userId}` : ""}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setReservations(data);
    } catch {
      setReservations([]);
    }
  }

  async function loadStats(token = session?.token) {
    try {
      setStats(await api<Stats>("/api/admin/stats", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }));
    } catch {
      setStats(null);
    }
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    try {
      const data = await api<Session>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ login, password })
      });
      setSession(data);
      setMessage(`Zalogowano jako ${data.login} (${data.role})`);
      await loadReservations(data.role === "USER" ? data.userId : undefined, data.token);
      await loadStats(data.token);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nie udalo sie zalogowac.");
    }
  }

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    await loadShelters(filter);
  }

  async function createReservation(event: FormEvent) {
    event.preventDefault();
    if (!session) {
      setMessage("Zaloguj sie, aby utworzyc rezerwacje.");
      return;
    }
    try {
      await api<Reservation>("/api/reservations", {
        method: "POST",
        body: JSON.stringify({
          userId: session.userId,
          roomId: Number(reservationForm.roomId || rooms[0]?.id),
          startDate: reservationForm.startDate,
          endDate: reservationForm.endDate,
          guestCount: Number(reservationForm.guestCount)
        })
      });
      setMessage("Rezerwacja zapisana ze statusem PENDING.");
      await loadReservations(session.role === "USER" ? session.userId : undefined);
      await loadStats();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nie udalo sie zapisac rezerwacji.");
    }
  }

  async function updateReservation(id: number, action: "confirm" | "cancel") {
    await api<Reservation>(`/api/reservations/${id}/${action}`, { method: "PATCH" });
    await loadReservations(session?.role === "USER" ? session.userId : undefined);
    await loadStats();
  }

  async function resetDatabase() {
    await api("/api/admin/db/reset", { method: "POST" });
    setMessage("Baza zresetowana i wypelniona danymi testowymi.");
    await loadShelters();
    await loadReservations();
    await loadStats();
  }

  const maxMonth = Math.max(1, ...(stats?.monthlyReservations.map((item) => item.count) ?? [1]));

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-700">SchroniskoHub</p>
            <h1 className="text-xl font-black sm:text-2xl">Panel rezerwacji schronisk</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-2 font-semibold text-slate-700">{message}</span>
            {session && <span className="rounded-full bg-slate-950 px-3 py-2 font-bold text-white">{session.login} / {session.role}</span>}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Logowanie</h2>
            <form className="mt-4 space-y-3" onSubmit={handleLogin}>
              <input className="field" value={login} onChange={(event) => setLogin(event.target.value)} placeholder="login" />
              <input className="field" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="haslo" type="password" />
              <button className="primary-btn w-full" type="submit">Zaloguj</button>
            </form>
            <div className="mt-4 grid gap-2">
              {demoCredentials.map(([userLogin, userPassword, role]) => (
                <button
                  className="rounded-md border border-slate-200 px-3 py-2 text-left text-sm font-semibold transition hover:border-teal-600 hover:bg-teal-50"
                  key={userLogin}
                  onClick={() => {
                    setLogin(userLogin);
                    setPassword(userPassword);
                  }}
                >
                  {role}: {userLogin} / {userPassword}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Szukaj</h2>
            <form className="mt-4 space-y-3" onSubmit={handleSearch}>
              <input className="field" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Tatry, Beskid, Karkonosze" />
              <button className="secondary-btn w-full" type="submit">Filtruj schroniska</button>
            </form>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Statystyki</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Metric label="Uzytkownicy" value={stats?.users ?? 0} />
              <Metric label="Schroniska" value={stats?.shelters ?? 0} />
              <Metric label="Pokoje" value={stats?.rooms ?? 0} />
              <Metric label="Rezerwacje" value={stats?.reservations ?? 0} />
            </div>
            <div className="mt-4 h-28 rounded-md bg-slate-100 p-3">
              <div className="flex h-full items-end gap-1">
                {(stats?.monthlyReservations ?? []).map((item) => (
                  <div className="flex flex-1 flex-col items-center gap-1" key={item.month}>
                    <div className="w-full rounded-t bg-teal-600" style={{ height: `${(item.count / maxMonth) * 100}%` }} />
                    <span className="text-[10px] font-bold text-slate-400">{item.month}</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="danger-btn mt-4 w-full" onClick={resetDatabase} type="button">Reset bazy</button>
          </section>
        </aside>

        <section className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-black">Katalog schronisk</h2>
                <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-bold text-teal-800">{shelters.length} obiekty</span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {shelters.map((shelter) => (
                  <button
                    className={`overflow-hidden rounded-lg border text-left transition hover:-translate-y-0.5 hover:shadow-md ${selectedShelter?.id === shelter.id ? "border-teal-600 bg-teal-50" : "border-slate-200 bg-white"}`}
                    key={shelter.id}
                    onClick={() => setSelectedShelterId(shelter.id)}
                    type="button"
                  >
                    <img className="h-36 w-full object-cover" src={shelter.imageUrl} alt={shelter.name} />
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-black">{shelter.name}</h3>
                          <p className="mt-1 text-sm font-semibold text-slate-500">{shelter.location}</p>
                        </div>
                        <span className="rounded-md bg-slate-950 px-2 py-1 text-sm font-bold text-white">{shelter.rating}</span>
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{shelter.description}</p>
                      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                        <span className="rounded-md bg-slate-100 px-3 py-2 font-bold">{shelter.beds} miejsc</span>
                        <span className="rounded-md bg-amber-50 px-3 py-2 font-bold text-amber-900">od {shelter.price}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-black">Rezerwacja</h2>
              {selectedShelter && (
                <div className="mt-4 rounded-md bg-slate-100 p-4">
                  <h3 className="font-black">{selectedShelter.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{selectedShelter.phone} | {selectedShelter.email}</p>
                </div>
              )}
              <div className="mt-4 grid gap-3">
                {rooms.map((room) => (
                  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-slate-200 p-3 hover:border-teal-600" key={room.id}>
                    <span>
                      <span className="block font-bold">{room.name}</span>
                      <span className="text-sm text-slate-500">{room.capacity} miejsc</span>
                    </span>
                    <span className="font-black">{room.pricePerNight} zl</span>
                    <input
                      checked={reservationForm.roomId === String(room.id) || (!reservationForm.roomId && room.id === rooms[0]?.id)}
                      name="room"
                      onChange={() => setReservationForm((current) => ({ ...current, roomId: String(room.id) }))}
                      type="radio"
                    />
                  </label>
                ))}
              </div>
              <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={createReservation}>
                <input className="field" type="date" value={reservationForm.startDate} onChange={(event) => setReservationForm((current) => ({ ...current, startDate: event.target.value }))} />
                <input className="field" type="date" value={reservationForm.endDate} onChange={(event) => setReservationForm((current) => ({ ...current, endDate: event.target.value }))} />
                <input className="field" min="1" type="number" value={reservationForm.guestCount} onChange={(event) => setReservationForm((current) => ({ ...current, guestCount: event.target.value }))} />
                <button className="primary-btn" type="submit">Zarezerwuj</button>
              </form>
            </section>
          </div>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black">Rezerwacje</h2>
              <button className="secondary-btn" onClick={() => loadReservations(session?.role === "USER" ? session.userId : undefined)} type="button">Odswiez</button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="table-head">Gosc</th>
                    <th className="table-head">Schronisko</th>
                    <th className="table-head">Pokoj</th>
                    <th className="table-head">Termin</th>
                    <th className="table-head">Cena</th>
                    <th className="table-head">Status</th>
                    <th className="table-head">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((reservation) => (
                    <tr key={reservation.id}>
                      <td className="table-cell font-bold">{reservation.userLogin}</td>
                      <td className="table-cell">{reservation.shelterName}</td>
                      <td className="table-cell">{reservation.roomName}</td>
                      <td className="table-cell">{reservation.startDate} - {reservation.endDate}</td>
                      <td className="table-cell font-bold">{reservation.totalPrice} zl</td>
                      <td className="table-cell"><Status status={reservation.status} /></td>
                      <td className="table-cell">
                        <div className="flex gap-2">
                          <button className="mini-btn" onClick={() => updateReservation(reservation.id, "confirm")} type="button">OK</button>
                          <button className="mini-danger" onClick={() => updateReservation(reservation.id, "cancel")} type="button">Anuluj</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-slate-100 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <strong className="mt-1 block text-2xl">{value}</strong>
    </div>
  );
}

function Status({ status }: { status: Reservation["status"] }) {
  const className =
    status === "CONFIRMED"
      ? "bg-emerald-50 text-emerald-700"
      : status === "CANCELLED"
        ? "bg-rose-50 text-rose-700"
        : "bg-amber-50 text-amber-800";

  return <span className={`rounded-full px-3 py-1 text-xs font-black ${className}`}>{status}</span>;
}

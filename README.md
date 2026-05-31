# bnabd

Webowy system zarządzania schroniskami turystycznymi i rezerwacją noclegów.

- **Frontend** (`frontend/`) — Next.js, port **3000**.
- **Backend** (`backend/`) — Spring Boot REST API + JWT, port **8080**.
- **Baza danych** — PostgreSQL.

Pełny opis projektu znajduje się w katalogu [`docs/`](docs/).

## 1. Wymagania

- JDK 21
- Maven 3.9+ (backend nie ma wrappera — wymagany globalny `mvn`)
- Node.js 20+ (z npm)
- PostgreSQL 15+

## 2. Baza danych (jednorazowo)

Utwórz użytkownika i bazę (hasło superużytkownika `postgres` ustawione przy instalacji):

```powershell
$env:PGPASSWORD = "postgres"
psql -U postgres -h localhost -c "CREATE USER bnabd WITH PASSWORD 'bnabd';" -c "CREATE DATABASE bnabd OWNER bnabd;"
```

Tabele i dane testowe tworzą się automatycznie przy pierwszym starcie backendu.

## 3. Backend

```powershell
cd backend
$env:DB_USER = "bnabd"; $env:DB_PASS = "bnabd"
mvn spring-boot:run
```

Backend startuje na `http://localhost:8080`.

## 4. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend startuje na `http://localhost:3000`.

## 5. Konta testowe

| Login | Hasło | Rola |
|---|---|---|
| `admin` | `admin123` | ADMIN |
| `host` | `host123` | HOST |
| `user` | `user123` | USER |

# bnabd

Webowy system zarządzania schroniskami turystycznymi i rezerwacją noclegów.
Architektura klient–serwer w trzech warstwach:

- **Frontend** (`frontend/`) — Next.js + React + TypeScript + TailwindCSS, port **3000**.
- **Backend** (`backend/`) — Spring Boot REST API + Spring Security/JWT + Hibernate/JPA, port **8080**.
- **Baza danych** — PostgreSQL (JDBC + HikariCP).

Pełny opis projektu znajduje się w katalogu [`docs/`](docs/) (po polsku).

---

## 1. Wymagania

| Narzędzie | Wersja | Instalacja (Windows / winget) |
|---|---|---|
| JDK | 21 (LTS) | `winget install EclipseAdoptium.Temurin.21.JDK` |
| Maven | 3.9+ | `winget install Apache.Maven` |
| Node.js (z npm) | 20+ | `winget install OpenJS.NodeJS.LTS` |
| PostgreSQL | 15+ | `winget install PostgreSQL.PostgreSQL.16` |

> Po instalacji otwórz **nowy terminal**, aby zaktualizować zmienną PATH.
> Backend nie ma wrappera Mavena (`mvnw`) — wymagany jest globalnie zainstalowany `mvn`.

---

## 2. Baza danych (jednorazowo)

Instalator PostgreSQL z winget ustawia hasło superużytkownika `postgres` na **`postgres`**.
Utwórz dedykowanego użytkownika i bazę aplikacji (`psql` znajduje się w `C:\Program Files\PostgreSQL\16\bin`):

```powershell
$env:PGPASSWORD = "postgres"
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -c "CREATE USER bnabd WITH PASSWORD 'bnabd';" -c "CREATE DATABASE bnabd OWNER bnabd;"
```

Powstaje baza `bnabd` należąca do użytkownika `bnabd` / `bnabd`.
Tabele tworzy Hibernate przy pierwszym starcie backendu (`ddl-auto=update`), a dane testowe
dodaje `DatabaseSeedService` automatycznie, gdy tabela `users` jest pusta.

---

## 3. Backend

Backend czyta dane dostępowe ze zmiennych środowiskowych (z fallbackami w
`backend/src/main/resources/application.properties`). Domyślnie celuje w bazę
`jdbc:postgresql://localhost:5432/bnabd`, więc wystarczy podać użytkownika i hasło:

**Windows (PowerShell):**
```powershell
cd backend
$env:DB_USER = "bnabd"; $env:DB_PASS = "bnabd"
mvn spring-boot:run
```

**macOS / Linux (bash):**
```bash
cd backend
DB_USER=bnabd DB_PASS=bnabd mvn spring-boot:run
```

Backend startuje na `http://localhost:8080`.

Zmienne środowiskowe (wszystkie mają lokalne fallbacki):

| Zmienna | Domyślnie | Opis |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/bnabd` | adres JDBC bazy |
| `DB_USER` | `postgres` | użytkownik bazy (ustaw `bnabd`) |
| `DB_PASS` | `admin` | hasło bazy (ustaw `bnabd`) |
| `JWT_SECRET` | lokalny sekret deweloperski | klucz do podpisu tokenów JWT |

Budowa pliku JAR (opcjonalnie):
```powershell
mvn clean package          # -> backend/target/bnabd-backend.jar
java -jar target/bnabd-backend.jar
```

---

## 4. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend startuje na `http://localhost:3000` i łączy się z backendem pod
adresem z `NEXT_PUBLIC_API_BASE_URL` (domyślnie `http://localhost:8080`).

Inne polecenia:
```powershell
npm run build && npm start   # build produkcyjny + serwer
npm run lint                 # ESLint (next lint)
```

---

## 5. Konta testowe

Tworzone automatycznie przy inicjalizacji bazy (hasła hashowane BCrypt):

| Login | Hasło | Rola |
|---|---|---|
| `admin` | `admin123` | ADMIN |
| `host` | `host123` | HOST |
| `user` | `user123` | USER |

> Projekt uczelniany — brak rzeczywistych danych; powyższe dane logowania są jawne celowo.

---

## 6. Endpointy API

| Metoda | Ścieżka | Dostęp |
|---|---|---|
| `GET` | `/api/health` | publiczny |
| `POST` | `/api/auth/login` | publiczny |
| `POST` | `/api/auth/register` | publiczny |
| `GET` | `/api/shelters` (`?location=Tatry`) | publiczny |
| `GET` | `/api/shelters/{id}` | publiczny |
| `GET` | `/api/shelters/{id}/rooms` | publiczny |
| `GET` | `/api/reviews/shelter/{shelterId}` | publiczny |
| `POST` | `/api/reviews` | zalogowany |
| `GET` | `/api/reservations` (`?userId=1`) | zalogowany |
| `POST` | `/api/reservations` | zalogowany |
| `PATCH` | `/api/reservations/{id}/confirm` | zalogowany |
| `PATCH` | `/api/reservations/{id}/cancel` | zalogowany |
| `GET` | `/api/admin/stats` | ADMIN |
| `POST` | `/api/admin/db/reset` | ADMIN |

Żądania chronione wymagają nagłówka `Authorization: Bearer <token>` (token z `/api/auth/login`).

---

## 7. Szybki test (po uruchomieniu backendu)

```powershell
# logowanie i odczyt statystyk admina
$login = Invoke-RestMethod http://localhost:8080/api/auth/login -Method Post `
  -ContentType "application/json" -Body '{"login":"admin","password":"admin123"}'
Invoke-RestMethod http://localhost:8080/api/admin/stats `
  -Headers @{ Authorization = "Bearer $($login.token)" }
```

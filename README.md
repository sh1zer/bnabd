# bnabd

Webowy system zarządzania schroniskami turystycznymi i rezerwacją noclegów.

- **Frontend** (`frontend/`) — Next.js, port **3000**.
- **Backend** (`backend/`) — Spring Boot REST API + JWT, port **8080**.
- **Baza danych** — PostgreSQL.

Pełny opis projektu znajduje się w katalogu [`docs/`](docs/).

## Szybki start (Docker — zalecane)

Uruchamia całość jedną komendą.
Nie trzeba instalować Javy, Mavena, Node ani PostgreSQL. Wystarczy Docker.

### Wymagania

- **Docker** (na Windows/Mac: [Docker Desktop](https://www.docker.com/products/docker-desktop/), uruchomiony)
- Wolne porty **3000** i **8080** na hoście
- Internet przy pierwszym budowaniu (pobranie obrazów)

### Uruchomienie

W katalogu projektu (tam gdzie `docker-compose.yml`):

```
docker compose up --build
```

Następnie otwórz:

- **Aplikacja:** <http://localhost:3000>
- **API / Swagger:** <http://localhost:8080/swagger-ui.html>

Schemat bazy i dane testowe tworzą się automatycznie przy pierwszym starcie.

### Zatrzymanie

```
docker compose down       # zatrzymuje (dane bazy zostają w wolumenie db_data)
docker compose down -v    # zatrzymuje i czyści bazę (świeży start)
```

## Konta testowe

| Login | Hasło | Rola |
|---|---|---|
| `admin` | `admin123` | ADMIN |
| `host` | `host123` | HOST |
| `user` | `user123` | USER |

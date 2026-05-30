# Backend

Spring Boot REST API dla systemu rezerwacji schronisk.

## Lokalna baza

Domyslna konfiguracja laczy sie z:

- `jdbc:postgresql://localhost:5432/bnabd`
- user: `postgres`
- password: `admin`

Najpierw utworz baze:

```sql
CREATE DATABASE bnabd;
```

Po pierwszym starcie aplikacja tworzy tabele przez Hibernate i dodaje dane testowe.

## Uruchomienie

```bash
mvn spring-boot:run
```

Backend startuje na `http://localhost:8080`.

## Testowanie API (Swagger)

Interaktywna dokumentacja i testowanie endpointow:

```
http://localhost:8080/swagger-ui.html
```

Aby wywolywac zabezpieczone endpointy: zaloguj sie przez `POST /api/auth/login`,
skopiuj `token` z odpowiedzi, kliknij **Authorize** i wklej token.

## Konta testowe

- `admin / admin123`
- `host / host123`
- `user / user123`

## Endpointy

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/shelters`
- `GET /api/shelters?location=Tatry`
- `GET /api/shelters/{id}`
- `GET /api/shelters/{id}/rooms`
- `GET /api/reservations`
- `GET /api/reservations?userId=1`
- `POST /api/reservations`
- `PATCH /api/reservations/{id}/confirm`
- `PATCH /api/reservations/{id}/cancel`
- `GET /api/reviews/shelter/{shelterId}`
- `POST /api/reviews`
- `GET /api/admin/stats`
- `POST /api/admin/db/reset`

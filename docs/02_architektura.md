# Architektura systemu

## 1. Architektura aplikacji

System jest zbudowany w trzech warstwach:

1. Warstwa prezentacji (Frontend)
2. Warstwa logiki biznesowej (Backend)
3. Warstwa danych (Baza danych)


# 2. Frontend

Frontend jest zbudowany w technologii Next.js (stack: zob. `01_zalozenia.md`).

## Odpowiedzialność frontendu
- prezentacja danych,
- formularze użytkownika,
- komunikacja z backendem,
- obsługa sesji użytkownika,
- wyświetlanie statystyk.


# 3. Backend

Backend jest zbudowany w Spring Boot jako REST API (stack: zob. `01_zalozenia.md`).

## Odpowiedzialność backendu
- logika biznesowa,
- autoryzacja użytkowników,
- komunikacja z bazą danych,
- walidacja danych,
- obsługa bezpieczeństwa.


# 4. Baza danych

System korzysta z relacyjnej bazy danych PostgreSQL.

## Zadania bazy danych
- przechowywanie danych użytkowników,
- przechowywanie rezerwacji,
- przechowywanie danych schronisk,
- obsługa relacji między encjami.


# 5. Komunikacja frontend-backend

Komunikacja odbywa się poprzez REST API wykorzystujące format JSON.


# 6. Tryb połączenia z bazą danych

Aplikacja łączy się z PostgreSQL przez JDBC (sterownik `org.postgresql.Driver`) z poolem połączeń HikariCP.

Parametry konfigurowane w `application.properties`:
- `spring.datasource.url=jdbc:postgresql://<host>:5432/bnabd`
- `spring.datasource.username`
- `spring.datasource.password`
- `spring.jpa.hibernate.ddl-auto=update` (Hibernate tworzy i aktualizuje schemat na podstawie encji)

Hasła do bazy trzymane są w zmiennych środowiskowych (`DB_USER`, `DB_PASS`), nie w repo.


# 7. Bezpieczeństwo haseł użytkowników

Hasła użytkowników są hashowane algorytmem **BCrypt** (`BCryptPasswordEncoder` ze Spring Security, koszt 10) przed zapisem do tabeli `users`. W bazie nigdy nie jest przechowywane hasło jawne. Weryfikacja przy logowaniu odbywa się przez `matches(raw, hash)`.

JWT służy wyłącznie do autoryzacji sesji po zalogowaniu.


# 8. Statystyki graficzne

Moduł admina prezentuje wykresy czasowe (biblioteka Recharts po stronie frontu):
- liczba rezerwacji w podziale na miesiące,
- obłożenie schronisk w skali roku,
- przychód miesięczny.

Dane agregowane są zapytaniami SQL po stronie backendu i zwracane jako JSON.
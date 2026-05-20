# Architektura systemu

## 1. Architektura aplikacji

System zostanie wykonany w trzech warstwach:

1. Warstwa prezentacji (Frontend)
2. Warstwa logiki biznesowej (Backend)
3. Warstwa danych (Baza danych)

---

# 2. Frontend

Frontend zostanie wykonany w technologii Next.js.

## Odpowiedzialność frontendu
- prezentacja danych,
- formularze użytkownika,
- komunikacja z backendem,
- obsługa sesji użytkownika,
- wyświetlanie statystyk.

---

## Technologie frontendowe
- Next.js
- React
- TypeScript
- TailwindCSS

---

# 3. Backend

Backend zostanie wykonany w Spring Boot jako REST API.

## Odpowiedzialność backendu
- logika biznesowa,
- autoryzacja użytkowników,
- komunikacja z bazą danych,
- walidacja danych,
- obsługa bezpieczeństwa.

---

## Technologie backendowe
- Spring Boot
- Spring Security
- JWT Authentication
- Hibernate / JPA
- Maven

---

# 4. Baza danych

System będzie korzystał z relacyjnej bazy danych PostgreSQL.

## Zadania bazy danych
- przechowywanie danych użytkowników,
- przechowywanie rezerwacji,
- przechowywanie danych schronisk,
- obsługa relacji między encjami.

---

# 5. Komunikacja frontend-backend

Komunikacja odbywa się poprzez REST API wykorzystujące format JSON.
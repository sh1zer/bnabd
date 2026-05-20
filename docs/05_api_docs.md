# REST API

## 1. Autoryzacja

### Rejestracja
POST /api/auth/register

Request:
{
  "username": "jan",
  "email": "jan@test.pl",
  "password": "password123"
}

---

### Logowanie
POST /api/auth/login

Request:
{
  "username": "jan",
  "password": "password123"
}

Response:
{
  "token": "jwt_token"
}

---

# 2. Schroniska

## Pobranie listy schronisk
GET /api/shelters

---

## Pobranie szczegółów schroniska
GET /api/shelters/{id}

---

## Dodanie schroniska
POST /api/shelters

---

## Edycja schroniska
PUT /api/shelters/{id}

---

## Usunięcie schroniska
DELETE /api/shelters/{id}

---

# 3. Rezerwacje

## Pobranie rezerwacji użytkownika
GET /api/reservations

---

## Utworzenie rezerwacji
POST /api/reservations

Request:
{
  "roomId": 1,
  "startDate": "2026-06-01",
  "endDate": "2026-06-05"
}

---

## Anulowanie rezerwacji
DELETE /api/reservations/{id}

---

# 4. Opinie

## Dodanie opinii
POST /api/reviews

---

## Pobranie opinii schroniska
GET /api/reviews/shelter/{id}

---

# 5. Panel administratora

## Pobranie użytkowników
GET /api/admin/users

---

## Reset bazy danych
POST /api/admin/init-db
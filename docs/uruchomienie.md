# Instrukcja uruchomienia

## 1. Wymagania

- Java 21
- Node.js 22
- PostgreSQL 16
- Maven

---

# 2. Konfiguracja bazy danych

Utworzyć bazę danych PostgreSQL:

CREATE DATABASE shelter_app;

---

# 3. Backend

Przejść do katalogu backend:

cd backend

Uruchomić aplikację:

mvn spring-boot:run

Backend uruchomi się na:
http://localhost:8080

---

# 4. Frontend

Przejść do katalogu frontend:

cd frontend

Instalacja zależności:

npm install

Uruchomienie aplikacji:

npm run dev

Frontend uruchomi się na:
http://localhost:3000

---

# 5. Dane logowania

Administrator:
login: admin
hasło: admin123

Użytkownik:
login: user
hasło: user123
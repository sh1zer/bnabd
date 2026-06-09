# Procedura instalacji i uruchomienia

## 1. Wymagania

- JDK 17+
- Maven 3.9+
- Node.js 20+
- PostgreSQL 15+


# 2. Baza danych

1. Uruchom PostgreSQL.
2. Utwórz bazę:
   ```sql
   CREATE DATABASE bnabd;
   CREATE USER bnabd WITH PASSWORD 'bnabd';
   GRANT ALL PRIVILEGES ON DATABASE bnabd TO bnabd;
   ```
3. Schemat i dane testowe tworzą się automatycznie przy pierwszym starcie backendu.
   Opcjonalnie ręczne utworzenie schematu:
   ```
   psql -U bnabd -d bnabd -f docs/bnabd_init.sql
   ```
   (DROP + CREATE tabel z ograniczeniami; samą bazę i użytkownika tworzy
   `docs/setup-local-postgres.sql`).


# 3. Backend (Spring Boot)

1. Przejdź do katalogu `backend/`.
2. Ustaw zmienne środowiskowe:
   - `DB_URL=jdbc:postgresql://localhost:5432/bnabd`
   - `DB_USER=bnabd`
   - `DB_PASS=bnabd`
   - `JWT_SECRET=<dowolny-długi-sekret>`
3. Zbuduj i uruchom:
   ```
   mvn clean package
   java -jar target/bnabd-backend.jar
   ```
4. Backend startuje na `http://localhost:8080`.


# 4. Frontend (Next.js)

1. Przejdź do katalogu `frontend/`.
2. Zainstaluj zależności i uruchom:
   ```
   npm install
   npm run build
   npm start
   ```
3. Frontend dostępny na `http://localhost:3000`.


# 5. Konta testowe

Po inicjalizacji bazy dostępne są konta przykładowe:
- `admin / admin123` (ADMIN)
- `host / host123` (HOST)
- `user / user123` (USER)


# 6. Reset bazy z poziomu aplikacji

Przycisk "Reset bazy" w panelu admina wywołuje `POST /api/admin/db/reset` i odtwarza schemat oraz dane testowe.


# 7. Wdrożenie na serwer aplikacyjny

Aplikacja może być uruchomiona:
- jako standalone JAR (wbudowany Tomcat - domyślnie),
- jako WAR na zewnętrznym Tomcat 10+ (po przepakowaniu `pom.xml` na `packaging: war`).

Frontend można zbudować statycznie (`next build && next export`) i serwować z dowolnego serwera HTTP (nginx, Apache).

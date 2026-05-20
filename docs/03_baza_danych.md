# Projekt bazy danych

## 1. Opis bazy danych

Baza danych została zaprojektowana jako relacyjna baza PostgreSQL.

Główne encje:
- users,
- shelters,
- rooms,
- reservations,
- reviews.

---

# 2. Tabela users

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

---

# 3. Tabela shelters

CREATE TABLE shelters (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    location VARCHAR(120) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(120),
    image_url TEXT
);

---

# 4. Tabela rooms

CREATE TABLE rooms (
    id BIGSERIAL PRIMARY KEY,
    shelter_id BIGINT NOT NULL,
    name VARCHAR(50),
    capacity INT NOT NULL,
    price_per_night DECIMAL(10,2),

    CONSTRAINT fk_room_shelter
        FOREIGN KEY (shelter_id)
        REFERENCES shelters(id)
        ON DELETE CASCADE
);

---

# 5. Tabela reservations

CREATE TABLE reservations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    room_id BIGINT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reservation_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_reservation_room
        FOREIGN KEY (room_id)
        REFERENCES rooms(id)
);

---

# 6. Tabela reviews

CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    shelter_id BIGINT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_review_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_review_shelter
        FOREIGN KEY (shelter_id)
        REFERENCES shelters(id)
);

---

# 7. Relacje pomiędzy tabelami

| Relacja | Typ |
|---|---|
| users → reservations | 1:N |
| shelters → rooms | 1:N |
| rooms → reservations | 1:N |
| users → reviews | 1:N |
| shelters → reviews | 1:N |

---

# 8. Przykładowi użytkownicy

## Administrator
login: admin
hasło: admin123

---

## Użytkownik
login: jan_kowalski
hasło: user123

---

# 9. Przykładowe schroniska

| Nazwa | Lokalizacja |
|---|---|
| Schronisko Tatry | Zakopane |
| Schronisko Karkonosze | Karpacz |
| Schronisko Bieszczady | Ustrzyki Górne |
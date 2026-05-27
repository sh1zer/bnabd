# Role i przypadki użycia

## 1. Role systemowe

System posiada trzy główne role:
- USER
- HOST
- ADMIN


# 2. Rola USER

Użytkownik standardowy może:
- przeglądać schroniska,
- tworzyć rezerwacje,
- anulować rezerwacje,
- dodawać opinie,
- zarządzać profilem.


# 3. Rola ADMIN

Administrator może:
- zarządzać użytkownikami,
- zarządzać schroniskami,
- zarządzać pokojami,
- zarządzać rezerwacjami,
- generować statystyki,
- resetować bazę danych.


# 4. Przypadki użycia użytkownika

## Rejestracja
1. Użytkownik otwiera formularz.
2. Wprowadza dane.
3. System zapisuje konto.


## Logowanie
1. Użytkownik podaje login i hasło.
2. Backend weryfikuje dane.
3. System zwraca token JWT.


## Rezerwacja pokoju
1. Użytkownik wybiera schronisko.
2. Wybiera pokój.
3. Wybiera termin.
4. System zapisuje rezerwację.


# 5. Przypadki użycia administratora

## Dodanie schroniska
1. Administrator otwiera panel admina.
2. Wprowadza dane schroniska.
3. System zapisuje rekord.


## Zarządzanie użytkownikami
1. Administrator przegląda listę użytkowników.
2. Edytuje lub usuwa konto.


# 6. Diagramy UML

## 6.1. Diagram przypadków użycia — USER

```mermaid
graph LR
    U((USER))
    U --> UC1[Rejestracja]
    U --> UC2[Logowanie]
    U --> UC3[Przeglądanie schronisk]
    U --> UC4[Wyszukiwanie i filtrowanie]
    U --> UC5[Tworzenie rezerwacji]
    U --> UC6[Anulowanie rezerwacji]
    U --> UC7[Dodawanie opinii]
    U --> UC8[Zarządzanie profilem]
```


## 6.2. Diagram przypadków użycia — HOST

```mermaid
graph LR
    H((HOST))
    H --> HC1[Logowanie]
    H --> HC2[Dodawanie schroniska]
    H --> HC3[Edycja własnych schronisk]
    H --> HC4[Zarządzanie pokojami]
    H --> HC5[Podgląd rezerwacji w swoich schroniskach]
```


## 6.3. Diagram przypadków użycia — ADMIN

```mermaid
graph LR
    A((ADMIN))
    A --> AC1[Logowanie]
    A --> AC2[Zarządzanie użytkownikami]
    A --> AC3[Zarządzanie schroniskami]
    A --> AC4[Zarządzanie pokojami]
    A --> AC5[Przegląd wszystkich rezerwacji]
    A --> AC6[Statystyki graficzne]
    A --> AC7[Reset bazy danych]
```


## 6.4. Diagram sekwencji — logowanie

```mermaid
sequenceDiagram
    actor U as Użytkownik
    participant F as Frontend
    participant B as Backend
    participant DB as PostgreSQL
    U->>F: login + hasło
    F->>B: POST /api/auth/login
    B->>DB: SELECT user WHERE login=?
    DB-->>B: rekord (password_hash)
    B->>B: BCrypt.matches(raw, hash)
    B-->>F: token JWT
    F-->>U: zalogowano
```


## 6.5. Diagram sekwencji — tworzenie rezerwacji

```mermaid
sequenceDiagram
    actor U as USER
    participant F as Frontend
    participant B as Backend
    participant DB as PostgreSQL
    U->>F: wybór pokoju i terminu
    F->>B: POST /api/reservations (JWT)
    B->>B: walidacja JWT i danych
    B->>DB: sprawdzenie dostępności terminu
    DB-->>B: brak kolizji
    B->>DB: INSERT reservation
    DB-->>B: id rezerwacji
    B-->>F: 201 Created
    F-->>U: potwierdzenie
```


## 6.6. Diagram encji (ERD)

Diagram encji wraz z relacjami znajduje się w pliku `docs/obraz-1.png`.
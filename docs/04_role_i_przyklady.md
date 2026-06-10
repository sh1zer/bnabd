# Role i przypadki użycia

## 1. Role systemowe

System posiada trzy główne role:
- USER
- HOST
- ADMIN


# 2. Rola USER

Użytkownik standardowy może:
- przeglądać schroniska,
- sprawdzać dostępność pokoi w wybranym terminie,
- tworzyć rezerwacje,
- potwierdzać rezerwacje (płatność),
- anulować rezerwacje,
- dodawać opinie,
- zarządzać profilem.


# 3. Rola HOST

Właściciel schroniska (gospodarz) może:
- dodawać własne schroniska,
- edytować dane własnych schronisk (opis, kontakt, zdjęcie, cennik wyżywienia),
- zarządzać pokojami w swoich schroniskach (dodawanie, edycja, usuwanie),
- przeglądać rezerwacje złożone w swoich schroniskach,
- anulować rezerwacje złożone w swoich schroniskach,
- tworzyć rezerwacje w imieniu gościa (z podaniem nazwiska gościa),
- przeglądać statystyki własnych schronisk (liczba rezerwacji, oczekujące, przychód, wykresy miesięczne),
- zarządzać profilem.


# 4. Rola ADMIN

Administrator może:
- zarządzać użytkownikami,
- zmieniać role użytkowników,
- zarządzać schroniskami,
- przypisywać schronisko do innego właściciela (HOST lub ADMIN),
- zarządzać pokojami,
- zarządzać rezerwacjami,
- generować statystyki,
- resetować bazę danych.


# 5. Przypadki użycia użytkownika

## Rejestracja
1. Użytkownik otwiera formularz.
2. Wprowadza dane.
3. System zapisuje konto.


## Logowanie
1. Użytkownik podaje login i hasło.
2. Backend weryfikuje dane.
3. System zwraca token JWT.


## Przeglądanie i sortowanie schronisk
1. Użytkownik otwiera listę schronisk.
2. Opcjonalnie filtruje wyniki po lokalizacji lub frazie wyszukiwania.
3. Wybiera kryterium sortowania (ocena, cena rosnąco/malejąco, nazwa A-Z).
4. System prezentuje posortowaną listę.


## Sprawdzanie dostępności pokoi
1. Użytkownik wybiera schronisko i termin (data początku i końca).
2. System dla każdego pokoju oblicza liczbę wolnych miejsc w tym terminie
   (pokój WHOLE: zajęty lub wolny; pokój SHARED: pojemność minus zajęte miejsca).
3. System prezentuje pokoje z informacją o dostępności.


## Rezerwacja pokoju
1. Użytkownik wybiera schronisko.
2. Wybiera pokój.
3. Wybiera termin, liczbę gości i opcję wyżywienia.
4. System zapisuje rezerwację ze statusem PENDING i ceną wyliczoną w chwili rezerwacji.


## Potwierdzenie rezerwacji (płatność)
1. Użytkownik wybiera rezerwację oczekującą (PENDING).
2. Przechodzi przez krok płatności (placeholder - brak realnego obciążenia).
3. System zmienia status rezerwacji na CONFIRMED.


## Cykl życia rezerwacji
- **PENDING** - rezerwacja utworzona, oczekuje na potwierdzenie (płatność).
- **CONFIRMED** - rezerwacja potwierdzona po kroku płatności.
- **CANCELLED** - rezerwacja anulowana przez użytkownika, gospodarza (we własnym schronisku) lub administratora.


# 6. Przypadki użycia gospodarza (HOST)

## Dodanie schroniska
1. Gospodarz loguje się i otwiera swój panel.
2. Wprowadza dane schroniska (nazwa, opis, lokalizacja, kontakt, zdjęcie, cennik wyżywienia).
3. System zapisuje schronisko przypisane do gospodarza jako właściciela.


## Zarządzanie pokojami
1. Gospodarz wybiera jedno ze swoich schronisk.
2. Dodaje nowy pokój (nazwa, pojemność, typ WHOLE/SHARED, cena za noc) lub edytuje/usuwa istniejący.
3. System zapisuje zmiany.


## Podgląd rezerwacji we własnych schroniskach
1. Gospodarz otwiera listę rezerwacji.
2. System wyświetla rezerwacje dotyczące pokoi w schroniskach należących do gospodarza
   (terminy, liczba gości, status, cena).


# 7. Przypadki użycia administratora

## Dodanie schroniska
1. Administrator otwiera panel admina.
2. Wprowadza dane schroniska.
3. System zapisuje rekord.


## Zarządzanie użytkownikami
1. Administrator przegląda listę użytkowników.
2. Edytuje lub usuwa konto.


# 8. Diagramy UML

## 8.1. Diagram przypadków użycia - USER

```mermaid
graph LR
    U((USER))
    U --> UC1[Rejestracja]
    U --> UC2[Logowanie]
    U --> UC3[Przeglądanie schronisk]
    U --> UC4[Wyszukiwanie, filtrowanie i sortowanie]
    U --> UC5[Sprawdzanie dostępności pokoi]
    U --> UC6[Tworzenie rezerwacji]
    U --> UC7[Potwierdzenie rezerwacji - płatność]
    U --> UC8[Anulowanie rezerwacji]
    U --> UC9[Dodawanie opinii]
    U --> UC10[Zarządzanie profilem]
```


## 8.2. Diagram przypadków użycia - HOST

```mermaid
graph LR
    H((HOST))
    H --> HC1[Logowanie]
    H --> HC2[Dodawanie schroniska]
    H --> HC3[Edycja własnych schronisk]
    H --> HC4[Zarządzanie pokojami]
    H --> HC5[Podgląd rezerwacji w swoich schroniskach]
    H --> HC6[Anulowanie rezerwacji w swoich schroniskach]
    H --> HC7[Rezerwacja w imieniu gościa]
    H --> HC8[Statystyki własnych schronisk]
```


## 8.3. Diagram przypadków użycia - ADMIN

```mermaid
graph LR
    A((ADMIN))
    A --> AC1[Logowanie]
    A --> AC2[Zarządzanie użytkownikami]
    A --> AC3[Zmiana ról użytkowników]
    A --> AC4[Zarządzanie schroniskami]
    A --> AC5[Przypisanie schroniska do właściciela]
    A --> AC6[Zarządzanie pokojami]
    A --> AC7[Przegląd wszystkich rezerwacji]
    A --> AC8[Statystyki graficzne]
    A --> AC9[Reset bazy danych]
```


## 8.4. Diagram sekwencji - logowanie

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


## 8.5. Diagram sekwencji - tworzenie rezerwacji

```mermaid
sequenceDiagram
    actor U as USER
    participant F as Frontend
    participant B as Backend
    participant DB as PostgreSQL
    U->>F: wybór pokoju i terminu
    F->>B: POST /api/reservations (JWT)
    B->>B: walidacja JWT i danych
    alt pokój WHOLE
        B->>DB: sprawdzenie kolizji terminów
        DB-->>B: brak kolizji
    else pokój SHARED
        B->>DB: suma zajętych miejsc w terminie
        DB-->>B: zajęte miejsca < pojemność
    end
    B->>DB: INSERT reservation
    DB-->>B: id rezerwacji
    B-->>F: 201 Created
    F-->>U: potwierdzenie
```


## 8.6. Diagram sekwencji - potwierdzenie rezerwacji (płatność)

```mermaid
sequenceDiagram
    actor U as USER
    participant F as Frontend
    participant B as Backend
    participant DB as PostgreSQL
    U->>F: potwierdzenie rezerwacji (płatność)
    F->>B: POST /api/payments/confirm (JWT)
    B->>B: weryfikacja JWT i właściciela rezerwacji
    B->>DB: UPDATE reservation SET status = CONFIRMED
    DB-->>B: OK
    B-->>F: 200 OK
    F-->>U: rezerwacja potwierdzona
```


## 8.7. Diagram encji (ERD)

Aktualny diagram encji wraz z relacjami i ograniczeniami znajduje się
w `docs/03_baza_danych.md` (diagram Mermaid); wersja graficzna w `docs/obraz-1.png`.
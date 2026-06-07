# Projekt bazy danych

## Opis bazy danych

System wykorzystuje relacyjną bazę danych PostgreSQL.

Baza danych odpowiada za przechowywanie:
- użytkowników,
- schronisk,
- pokoi,
- rezerwacji,
- opinii.


# Główne tabele

## users
Tabela przechowuje dane użytkowników systemu.

### Zawiera:
- login,
- email,
- hasło,
- rolę użytkownika,
- datę utworzenia konta.

### Role:
- USER,
- HOST,
- ADMIN.


## shelters
Tabela przechowuje informacje o schroniskach.

### Zawiera:
- właściciela schroniska,
- nazwę,
- opis,
- lokalizację,
- dane kontaktowe,
- zdjęcie,
- cennik wyżywienia (dopłaty za poszczególne opcje posiłków, ustalane przez właściciela).


## rooms
Tabela przechowuje dane pokoi dostępnych w schroniskach.

### Zawiera:
- schronisko,
- nazwę pokoju,
- liczbę miejsc (pojemność),
- typ pokoju (`WHOLE` / `SHARED`),
- cenę za noc.

### Typy pokoi:
- **WHOLE** (cały pokój) — wynajmowany w całości; jedna rezerwacja blokuje pokój w danym terminie. Cena stała za noc.
- **SHARED** (dormitorium) — miejsca sprzedawane pojedynczo; goście dzielą pokój do wyczerpania pojemności. Cena za noc za każde zajęte miejsce.


## reservations
Tabela przechowuje rezerwacje użytkowników.

### Zawiera:
- użytkownika,
- pokój,
- datę rozpoczęcia i zakończenia pobytu,
- liczbę gości,
- wybraną opcję wyżywienia,
- status rezerwacji,
- datę utworzenia,
- cenę (w momencie stworzenia rezerwacji).

### Statusy:
- PENDING,
- CONFIRMED,
- CANCELLED.

### Opcje wyżywienia:
Gość przy rezerwacji wybiera jedną z opcji posiłków. Dopłata doliczana jest do ceny
za każdego gościa i każdą noc pobytu. Wysokość dopłat **ustala właściciel (HOST)
osobno dla każdego schroniska** przy jego tworzeniu (pola cennika w tabeli `shelters`) —
nie są to wartości stałe w systemie:

- **Bez wyżywienia** — zawsze bez dopłaty,
- **Śniadanie** — dopłata wg cennika schroniska,
- **Śniadanie i kolacja** — dopłata wg cennika schroniska,
- **Pełne wyżywienie** — dopłata wg cennika schroniska.


## reviews
Tabela przechowuje opinie użytkowników.

### Zawiera:
- użytkownika,
- schronisko,
- ocenę,
- komentarz,
- datę dodania opinii.


# Relacje między tabelami

- jeden HOST może posiadać wiele schronisk,
- jedno schronisko może posiadać wiele pokoi,
- jeden użytkownik może posiadać wiele rezerwacji,
- jeden pokój może występować w wielu rezerwacjach,
- jedno schronisko może posiadać wiele opinii.


# Bezpieczeństwo danych

W systemie zastosujemy:
- hashowanie haseł BCrypt (kolumna `users.password_hash`),
- autoryzację JWT,
- role użytkowników,
- zabezpieczenie endpointów backendowych.

![diagram](obraz-1.png)


# Skrypt inicjalizacyjny bazy

Do projektu zostanie przygotowany skrypt SQL zawierający:
- `DROP` istniejących tabel,
- `CREATE` całej struktury wraz z ograniczeniami i kluczami obcymi,
- `INSERT` z danymi przykładowymi (użytkownicy testowi z hasłami zahashowanymi BCrypt, schroniska, pokoje, przykładowe rezerwacje i opinie).

Administrator z panelu aplikacji będzie mógł uruchomić akcję resetu bazy, która wykona ten skrypt — skasuje starą strukturę i utworzy nową z danymi przykładowymi.
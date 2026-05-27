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
- zdjęcie.


## rooms
Tabela przechowuje dane pokoi dostępnych w schroniskach.

### Zawiera:
- schronisko,
- nazwę pokoju,
- liczbę miejsc,
- cenę za noc.


## reservations
Tabela przechowuje rezerwacje użytkowników.

### Zawiera:
- użytkownika,
- pokój,
- datę rozpoczęcia i zakończenia pobytu,
- status rezerwacji,
- datę utworzenia,
- cenę (w momenciu stworzenia rezerwacji),

### Statusy:
- PENDING,
- CONFIRMED,
- CANCELLED.


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
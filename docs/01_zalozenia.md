# Założenia projektowe

## 1. Temat projektu

Projekt zakłada stworzenie webowego systemu zarządzania schroniskami turystycznymi oraz rezerwacją miejsc noclegowych.

System umożliwia:
- przeglądanie schronisk,
- wyszukiwanie dostępnych miejsc,
- składanie rezerwacji,
- zarządzanie pokojami,
- zarządzanie użytkownikami,
- generowanie statystyk obłożenia.

Projekt realizowany jest jako aplikacja webowa w architekturze klient-serwer.

---

# 2. Cel projektu

Celem projektu jest stworzenie nowoczesnej aplikacji bazodanowej umożliwiającej:
- bezpieczne logowanie użytkowników,
- zarządzanie danymi schronisk,
- wykonywanie operacji CRUD,
- zarządzanie rezerwacjami,
- prezentację danych statystycznych.

Projekt ma odwzorowywać rzeczywisty system rezerwacji schronisk turystycznych.

---

# 3. Zakres funkcjonalny

## Funkcjonalności użytkownika niezalogowanego
- przeglądanie schronisk,
- wyszukiwanie schronisk,
- filtrowanie po lokalizacji,
- podgląd szczegółów schroniska,
- rejestracja,
- logowanie.

---

## Funkcjonalności użytkownika zalogowanego
- tworzenie rezerwacji,
- anulowanie rezerwacji,
- podgląd własnych rezerwacji,
- edycja profilu,
- dodawanie opinii.

---

## Funkcjonalności administratora
- zarządzanie użytkownikami,
- zarządzanie schroniskami,
- zarządzanie pokojami,
- przegląd wszystkich rezerwacji,
- generowanie statystyk,
- reset i inicjalizacja bazy danych.

---

# 4. Technologie wykorzystane w projekcie

## Frontend
- Next.js
- TypeScript
- TailwindCSS
- Axios
- Chart.js

---

## Backend
- Spring Boot
- Spring Security
- JWT
- Hibernate / JPA
- Maven

---

## Baza danych
- PostgreSQL

---

# 5. Role aplikacyjne

## USER
Standardowy użytkownik systemu.

Uprawnienia:
- rezerwacja miejsc,
- przeglądanie schronisk,
- zarządzanie własnymi rezerwacjami.

---

## ADMIN
Administrator systemu.

Uprawnienia:
- pełne zarządzanie aplikacją,
- CRUD schronisk,
- CRUD użytkowników,
- zarządzanie rezerwacjami,
- inicjalizacja danych.

---

# 6. Wymagania funkcjonalne

System powinien umożliwiać:
- rejestrację i logowanie użytkowników,
- filtrowanie schronisk,
- sprawdzanie dostępności pokoi,
- tworzenie i anulowanie rezerwacji,
- zarządzanie danymi przez administratora,
- generowanie statystyk.

---

# 7. Wymagania niefunkcjonalne

System powinien:
- działać w przeglądarce internetowej,
- posiadać responsywny interfejs,
- zapewniać bezpieczeństwo danych,
- obsługiwać wielu użytkowników,
- działać stabilnie przy dużej liczbie rekordów.
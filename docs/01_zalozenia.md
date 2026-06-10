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


# 2. Cel projektu

Celem projektu jest implementacja aplikacji bazodanowej realizującej:
- uwierzytelnianie użytkowników (BCrypt + JWT),
- zarządzanie danymi schronisk,
- operacje CRUD na encjach domenowych,
- zarządzanie rezerwacjami,
- agregację i prezentację danych statystycznych.


# 3. Zakres funkcjonalny

## Funkcjonalności użytkownika niezalogowanego
- przeglądanie schronisk,
- wyszukiwanie schronisk,
- filtrowanie (lokalizacja, fraza),
- sortowanie wyników (ocena, cena rosnąco/malejąco, nazwa A-Z),
- podgląd szczegółów schroniska,
- rejestracja,
- logowanie.


## Funkcjonalności użytkownika zalogowanego
- tworzenie rezerwacji,
- anulowanie rezerwacji,
- podgląd własnych rezerwacji,
- dodawanie opinii.


## Funkcjonalności administratora
- zarządzanie użytkownikami,
- zarządzanie schroniskami,
- zarządzanie pokojami,
- przegląd wszystkich rezerwacji,
- generowanie statystyk graficznych (wykresy czasowe - rezerwacje/miesiąc, obłożenie/rok),
- reset i inicjalizacja bazy danych (drop + create + dane przykładowe).


# 4. Technologie wykorzystane w projekcie

## Frontend
- Next.js
- TypeScript
- TailwindCSS


## Backend
- Spring Boot
- Spring Security
- JWT
- Hibernate / JPA
- Maven


## Baza danych
- PostgreSQL

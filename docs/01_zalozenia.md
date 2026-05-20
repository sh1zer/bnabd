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
- filtrowanie,
- podgląd szczegółów schroniska,
- rejestracja,
- logowanie.

---

## Funkcjonalności użytkownika zalogowanego
- tworzenie rezerwacji,
- anulowanie rezerwacji,
- podgląd własnych rezerwacji,
- (maybe) dodawanie opinii.

---

## Funkcjonalności administratora
- zarządzanie użytkownikami,
- zarządzanie schroniskami,
- zarządzanie pokojami,
- przegląd wszystkich rezerwacji,
- (maybe) generowanie statystyk,
- reset i inicjalizacja bazy danych.

---

# 4. Technologie wykorzystane w projekcie

## Frontend
- Next.js
- TypeScript
- TailwindCSS

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

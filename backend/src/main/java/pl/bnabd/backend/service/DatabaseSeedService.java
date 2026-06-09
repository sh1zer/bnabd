package pl.bnabd.backend.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.bnabd.backend.model.AppUser;
import pl.bnabd.backend.model.Reservation;
import pl.bnabd.backend.model.ReservationStatus;
import pl.bnabd.backend.model.Review;
import pl.bnabd.backend.model.Room;
import pl.bnabd.backend.model.RoomType;
import pl.bnabd.backend.model.Shelter;
import pl.bnabd.backend.model.UserRole;
import pl.bnabd.backend.repository.ReservationRepository;
import pl.bnabd.backend.repository.ReviewRepository;
import pl.bnabd.backend.repository.RoomRepository;
import pl.bnabd.backend.repository.ShelterRepository;
import pl.bnabd.backend.repository.UserRepository;

@Service
public class DatabaseSeedService implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ShelterRepository shelterRepository;
    private final RoomRepository roomRepository;
    private final ReservationRepository reservationRepository;
    private final ReviewRepository reviewRepository;
    private final PasswordEncoder passwordEncoder;

    // Deterministic spread so the demo data is reproducible across resets.
    private static final long SEED = 20240606L;

    private static final String[] BOARD_TYPES = {
        null, "Śniadanie", "Śniadanie i kolacja", "Pełne wyżywienie"
    };

    private static final String[] REVIEW_COMMENTS = {
        "Świetna baza wypadowa, blisko szlaków. Na pewno wrócimy!",
        "Czysto, ciepło i pyszne domowe jedzenie. Gorąco polecam.",
        "Klimatyczne wnętrza i bardzo miła obsługa.",
        "Rezerwacja przebiegła bez problemu, pokój zgodny z opisem.",
        "Piękne widoki z okna, idealne miejsce na weekend w górach.",
        "Trochę głośno wieczorem, ale ogólnie było w porządku.",
        "Spartańskie warunki, ale tego się spodziewaliśmy w schronisku.",
        "Smaczna herbata po długim podejściu i super atmosfera.",
        "Łazienki mogłyby być nowocześniejsze, reszta bez zarzutu.",
        "Cudowne miejsce na nocleg przed wejściem na szczyt.",
        "Obsługa pomocna, doradzili nam najlepszą trasę na następny dzień.",
        "Wygodne łóżka i ciepłe koce, spaliśmy jak susły.",
        "Dobra cena za taką lokalizację, polecam każdemu.",
        "Bardzo rodzinna atmosfera, dzieciom bardzo się podobało.",
        "Jedzenie pyszne, ale na śniadanie trzeba było chwilę poczekać."
    };

    private static final int[] RATING_POOL = {5, 5, 5, 5, 4, 4, 4, 4, 3, 3};

    public DatabaseSeedService(
            UserRepository userRepository,
            ShelterRepository shelterRepository,
            RoomRepository roomRepository,
            ReservationRepository reservationRepository,
            ReviewRepository reviewRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.shelterRepository = shelterRepository;
        this.roomRepository = roomRepository;
        this.reservationRepository = reservationRepository;
        this.reviewRepository = reviewRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedIfEmpty();
    }

    @Transactional
    public void reset() {
        // Bulk-delete in FK-safe order. deleteAllInBatch() issues the DELETEs immediately,
        // so Hibernate cannot reorder seed()'s fresh INSERTs ahead of them within this
        // transaction (which otherwise caused a duplicate-key violation on users.email/login).
        reviewRepository.deleteAllInBatch();
        reservationRepository.deleteAllInBatch();
        roomRepository.deleteAllInBatch();
        shelterRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
        seed();
    }

    @Transactional
    public void seedIfEmpty() {
        if (userRepository.count() == 0) {
            seed();
        }
    }

    private void seed() {
        Random rnd = new Random(SEED);

        // --- Accounts -------------------------------------------------------
        // Original demo accounts keep their documented credentials.
        AppUser admin = user("admin", "admin@schroniskohub.pl", "admin123", UserRole.ADMIN, 540);
        AppUser host = user("host", "host@schroniskohub.pl", "host123", UserRole.HOST, 520);
        AppUser user = user("user", "user@schroniskohub.pl", "user123", UserRole.USER, 500);

        // Extra hosts (own the new shelters). All seeded extras share password "haslo123".
        AppUser hostMarek = user("marek.nowak", "marek.nowak@schroniskohub.pl", "haslo123", UserRole.HOST, 470);
        AppUser hostHalina = user("halina.gora", "halina.gora@schroniskohub.pl", "haslo123", UserRole.HOST, 450);
        AppUser hostTomasz = user("tomasz.wilk", "tomasz.wilk@schroniskohub.pl", "haslo123", UserRole.HOST, 430);

        // Regular guests.
        List<AppUser> guests = new ArrayList<>();
        guests.add(user);
        guests.add(user("anna.kowalska", "anna.kowalska@example.com", "haslo123", UserRole.USER, 410));
        guests.add(user("piotr.zielinski", "piotr.zielinski@example.com", "haslo123", UserRole.USER, 395));
        guests.add(user("ewa.lewandowska", "ewa.lewandowska@example.com", "haslo123", UserRole.USER, 380));
        guests.add(user("jakub.wozniak", "jakub.wozniak@example.com", "haslo123", UserRole.USER, 360));
        guests.add(user("magda.kaczmarek", "magda.kaczmarek@example.com", "haslo123", UserRole.USER, 340));
        guests.add(user("krzysztof.mazur", "krzysztof.mazur@example.com", "haslo123", UserRole.USER, 320));
        guests.add(user("natalia.krawczyk", "natalia.krawczyk@example.com", "haslo123", UserRole.USER, 300));
        guests.add(user("pawel.szymanski", "pawel.szymanski@example.com", "haslo123", UserRole.USER, 280));
        guests.add(user("ola.dabrowska", "ola.dabrowska@example.com", "haslo123", UserRole.USER, 250));
        guests.add(user("bartek.witkowski", "bartek.witkowski@example.com", "haslo123", UserRole.USER, 220));
        guests.add(user("zofia.adamczyk", "zofia.adamczyk@example.com", "haslo123", UserRole.USER, 180));
        guests.add(user("michal.pawlak", "michal.pawlak@example.com", "haslo123", UserRole.USER, 140));
        guests.add(user("karolina.gorska", "karolina.gorska@example.com", "haslo123", UserRole.USER, 90));

        // --- Shelters + rooms ----------------------------------------------
        List<Room> rooms = new ArrayList<>();
        List<Shelter> shelters = new ArrayList<>();

        Shelter granite = shelter(host, "Schronisko Pod Granitem", "Kameralne schronisko blisko wejścia na popularne szlaki Tatr Zachodnich.", "Tatry Zachodnie", "+48 600 100 200", "kontakt@podgranitem.pl", img("photo-1500534314209-a25ddb2bd429"));
        rooms.add(room(granite, "Pokój 2-osobowy", 2, RoomType.WHOLE, "110"));
        rooms.add(room(granite, "Pokój 4-osobowy", 4, RoomType.WHOLE, "89"));
        rooms.add(room(granite, "Sala turystyczna", 8, RoomType.SHARED, "55"));
        shelters.add(granite);

        Shelter halna = shelter(host, "Stacja Halna", "Baza noclegowa dla grup i samotnych wędrowców u podnóża Pilska.", "Beskid Żywiecki", "+48 600 200 300", "recepcja@stacjahalna.pl", img("photo-1519681393784-d120267933ba"));
        rooms.add(room(halna, "Pokój rodzinny", 5, RoomType.WHOLE, "72"));
        rooms.add(room(halna, "Dwójka z widokiem", 2, RoomType.WHOLE, "95"));
        rooms.add(room(halna, "Wspólna sypialnia", 10, RoomType.SHARED, "45"));
        shelters.add(halna);

        Shelter pass = shelter(admin, "Dom na Przełęczy", "Schronisko z panoramą na grań i prostą rezerwacją pokoi.", "Karkonosze", "+48 600 300 400", "hello@domnaprzeleczy.pl", img("photo-1445307806294-bff7f67ff225"));
        rooms.add(room(pass, "Apartament szczytowy", 3, RoomType.WHOLE, "140"));
        rooms.add(room(pass, "Sala wieloosobowa", 10, RoomType.SHARED, "60"));
        shelters.add(pass);

        Shelter orla = shelter(hostMarek, "Schronisko Orla Perć", "Wysokogórskie schronisko dla doświadczonych turystów, tuż przy najtrudniejszych szlakach.", "Tatry Wysokie", "+48 601 110 220", "biuro@orlaperc.pl", img("photo-1464822759023-fed622ff2c3b"));
        rooms.add(room(orla, "Pokój 2-osobowy", 2, RoomType.WHOLE, "130"));
        rooms.add(room(orla, "Pokój 3-osobowy", 3, RoomType.WHOLE, "115"));
        rooms.add(room(orla, "Sala zbiorowa", 12, RoomType.SHARED, "65"));
        shelters.add(orla);

        Shelter bacowka = shelter(hostMarek, "Bacówka nad Doliną", "Drewniana bacówka z regionalną kuchnią i widokiem na dolinę.", "Beskid Sądecki", "+48 601 220 330", "kontakt@bacowkadolina.pl", img("photo-1506905925346-21bda4d32df4"));
        rooms.add(room(bacowka, "Izba góralska", 4, RoomType.WHOLE, "85"));
        rooms.add(room(bacowka, "Poddasze turystyczne", 6, RoomType.SHARED, "50"));
        shelters.add(bacowka);

        Shelter regle = shelter(hostHalina, "Schronisko Pod Reglami", "Spokojne schronisko w sercu Gorców, idealne na rodzinne wędrówki.", "Gorce", "+48 602 330 440", "recepcja@podreglami.pl", img("photo-1454496522488-7a8e488e8606"));
        rooms.add(room(regle, "Pokój rodzinny", 5, RoomType.WHOLE, "98"));
        rooms.add(room(regle, "Dwójka", 2, RoomType.WHOLE, "88"));
        rooms.add(room(regle, "Sala wspólna", 8, RoomType.SHARED, "48"));
        shelters.add(regle);

        Shelter chatka = shelter(hostHalina, "Chatka Wędrowca", "Klimatyczna chatka na bieszczadzkim szlaku, z piecem i widokiem na połoniny.", "Bieszczady", "+48 602 440 550", "halo@chatkawedrowca.pl", img("photo-1483728642387-6c3bdd6c93e5"));
        rooms.add(room(chatka, "Pokój pod dachem", 3, RoomType.WHOLE, "78"));
        rooms.add(room(chatka, "Wspólna izba", 10, RoomType.SHARED, "42"));
        shelters.add(chatka);

        Shelter slonce = shelter(hostTomasz, "Schronisko Szczyt Słońca", "Nowoczesne schronisko z tarasem widokowym i sauną.", "Beskid Śląski", "+48 603 550 660", "biuro@szczytslonca.pl", img("photo-1470071459604-3b5ec3a7fe05"));
        rooms.add(room(slonce, "Apartament z tarasem", 2, RoomType.WHOLE, "160"));
        rooms.add(room(slonce, "Pokój 4-osobowy", 4, RoomType.WHOLE, "105"));
        rooms.add(room(slonce, "Sala turystyczna", 9, RoomType.SHARED, "58"));
        shelters.add(slonce);

        Shelter limba = shelter(hostTomasz, "Dom Górski Limba", "Stylowy dom górski z kominkiem, blisko wyciągów i szlaków.", "Tatry Wysokie", "+48 603 660 770", "rezerwacje@domlimba.pl", img("photo-1485160497022-3e09382fb310"));
        rooms.add(room(limba, "Pokój dwuosobowy", 2, RoomType.WHOLE, "145"));
        rooms.add(room(limba, "Apartament rodzinny", 5, RoomType.WHOLE, "190"));
        shelters.add(limba);

        Shelter turnia = shelter(host, "Schronisko Pod Turnią", "Niewielkie schronisko w Pieninach, nad samym przełomem rzeki.", "Pieniny", "+48 604 770 880", "kontakt@podturnia.pl", img("photo-1518602164578-cd0074062767"));
        rooms.add(room(turnia, "Pokój nad rzeką", 3, RoomType.WHOLE, "120"));
        rooms.add(room(turnia, "Wspólna sypialnia", 6, RoomType.SHARED, "52"));
        shelters.add(turnia);

        Shelter pasterska = shelter(hostMarek, "Bacówka Pasterska", "Cicha bacówka na uboczu, dla szukających spokoju w Beskidzie Niskim.", "Beskid Niski", "+48 604 880 990", "halo@bacowkapasterska.pl", img("photo-1486870591958-9b9d0d1dda99"));
        rooms.add(room(pasterska, "Izba z piecem", 4, RoomType.WHOLE, "80"));
        rooms.add(room(pasterska, "Poddasze", 8, RoomType.SHARED, "40"));
        shelters.add(pasterska);

        Shelter kotly = shelter(admin, "Schronisko Śnieżne Kotły", "Górne schronisko Karkonoszy, częsty przystanek przed Śnieżką.", "Karkonosze", "+48 605 990 110", "recepcja@snieznekotly.pl", img("photo-1517823382935-51bfcb0ec6bc"));
        rooms.add(room(kotly, "Pokój 2-osobowy", 2, RoomType.WHOLE, "125"));
        rooms.add(room(kotly, "Pokój 4-osobowy", 4, RoomType.WHOLE, "99"));
        rooms.add(room(kotly, "Wielka sala", 14, RoomType.SHARED, "55"));
        shelters.add(kotly);

        Shelter jodla = shelter(hostHalina, "Przystań Turystyczna Jodła", "Przytulna przystań u stóp Śnieżnika, z wypożyczalnią sprzętu.", "Masyw Śnieżnika", "+48 605 110 220", "kontakt@przystanjodla.pl", img("photo-1542718610-a1d656d1884c"));
        rooms.add(room(jodla, "Pokój kominkowy", 3, RoomType.WHOLE, "108"));
        rooms.add(room(jodla, "Dwójka standard", 2, RoomType.WHOLE, "90"));
        rooms.add(room(jodla, "Sala wspólna", 8, RoomType.SHARED, "47"));
        shelters.add(jodla);

        // --- Meal pricing ---------------------------------------------------
        // Each host sets their own meal surcharges (per guest, per night), so vary
        // them across shelters to show the pricing is configurable, not fixed.
        for (Shelter shelter : shelters) {
            shelter.setBoardBreakfastPrice(new BigDecimal(15 + rnd.nextInt(16)));  // 15..30
            shelter.setBoardHalfBoardPrice(new BigDecimal(35 + rnd.nextInt(21)));  // 35..55
            shelter.setBoardFullBoardPrice(new BigDecimal(55 + rnd.nextInt(31)));  // 55..85
            shelterRepository.save(shelter);
        }

        // --- Reservations ---------------------------------------------------
        // Each room gets a handful of non-overlapping stays spread across the 2026
        // calendar year, so the monthly admin charts have real shape.
        LocalDate today = LocalDate.now();
        LocalDate seasonEnd = LocalDate.of(2026, 12, 31);
        for (Room room : rooms) {
            LocalDate cursor = LocalDate.of(2026, 1, 1);
            int target = 2 + rnd.nextInt(4); // 2..5 stays per room
            int made = 0;
            while (made < target) {
                cursor = cursor.plusDays(4 + rnd.nextInt(34)); // gap between stays
                int nights = 1 + rnd.nextInt(5);
                LocalDate start = cursor;
                LocalDate end = start.plusDays(nights);
                cursor = end; // next stay starts no earlier than this one ends -> no overlap
                if (start.isAfter(seasonEnd)) {
                    break; // stop at the booking horizon
                }

                int capacity = room.getCapacity();
                int partySize = room.getRoomType() == RoomType.SHARED
                        ? 1 + rnd.nextInt(Math.min(capacity, 4))
                        : 1 + rnd.nextInt(capacity);

                ReservationStatus status;
                if (rnd.nextInt(12) == 0) {
                    status = ReservationStatus.CANCELLED;
                } else if (!end.isAfter(today)) {
                    status = ReservationStatus.CONFIRMED; // completed stay
                } else if (start.isAfter(today)) {
                    status = rnd.nextInt(10) < 4 ? ReservationStatus.PENDING : ReservationStatus.CONFIRMED;
                } else {
                    status = ReservationStatus.CONFIRMED; // currently staying
                }

                AppUser guest = guests.get(rnd.nextInt(guests.size()));
                String board = BOARD_TYPES[rnd.nextInt(BOARD_TYPES.length)];
                // Booked a few days to several weeks before arrival.
                Instant createdAt = start.minusDays(3 + rnd.nextInt(40))
                        .atStartOfDay(ZoneOffset.UTC)
                        .plusHours(8 + rnd.nextInt(12))
                        .toInstant();

                reservationRepository.save(reservation(guest, room, start, end, partySize, status, board, createdAt));
                made++;
            }
        }

        // --- Reviews --------------------------------------------------------
        // 2..5 reviews per shelter from distinct guests; the shelter's stored
        // rating is set to the average of its reviews so the cards stay honest.
        for (Shelter shelter : shelters) {
            int count = 2 + rnd.nextInt(4);
            Set<AppUser> reviewers = new LinkedHashSet<>();
            while (reviewers.size() < count && reviewers.size() < guests.size()) {
                reviewers.add(guests.get(rnd.nextInt(guests.size())));
            }
            int total = 0;
            for (AppUser reviewer : reviewers) {
                int rating = RATING_POOL[rnd.nextInt(RATING_POOL.length)];
                total += rating;
                String comment = REVIEW_COMMENTS[rnd.nextInt(REVIEW_COMMENTS.length)];
                Instant createdAt = today.minusDays(7 + rnd.nextInt(300))
                        .atStartOfDay(ZoneOffset.UTC)
                        .plusHours(9 + rnd.nextInt(11))
                        .toInstant();
                reviewRepository.save(review(reviewer, shelter, rating, comment, createdAt));
            }
            double average = (double) total / reviewers.size();
            shelter.setRating(Math.round(average * 10.0) / 10.0);
            shelterRepository.save(shelter);
        }
    }

    private static String img(String unsplashId) {
        return "https://images.unsplash.com/" + unsplashId + "?auto=format&fit=crop&w=900&q=80";
    }

    private AppUser user(String login, String email, String rawPassword, UserRole role, int createdDaysAgo) {
        AppUser appUser = new AppUser(login, email, passwordEncoder.encode(rawPassword), role);
        appUser.setCreatedAt(Instant.now().minus(createdDaysAgo, ChronoUnit.DAYS));
        return userRepository.save(appUser);
    }

    private Shelter shelter(AppUser owner, String name, String description, String location, String phone, String email, String imageUrl) {
        Shelter shelter = new Shelter();
        shelter.setOwner(owner);
        shelter.setName(name);
        shelter.setDescription(description);
        shelter.setLocation(location);
        shelter.setPhone(phone);
        shelter.setEmail(email);
        shelter.setImageUrl(imageUrl);
        shelter.setRating(0.0); // overwritten once reviews are generated
        return shelterRepository.save(shelter);
    }

    private Room room(Shelter shelter, String name, int capacity, RoomType roomType, String price) {
        Room room = new Room();
        room.setShelter(shelter);
        room.setName(name);
        room.setCapacity(capacity);
        room.setRoomType(roomType);
        room.setPricePerNight(new BigDecimal(price));
        return roomRepository.save(room);
    }

    private Reservation reservation(AppUser user, Room room, LocalDate startDate, LocalDate endDate, int guests, ReservationStatus status, String boardType, Instant createdAt) {
        Reservation reservation = new Reservation();
        reservation.setUser(user);
        reservation.setRoom(room);
        reservation.setStartDate(startDate);
        reservation.setEndDate(endDate);
        reservation.setGuestCount(guests);
        long nights = ChronoUnit.DAYS.between(startDate, endDate);
        BigDecimal cost = room.getPricePerNight().multiply(BigDecimal.valueOf(nights));
        if (room.getRoomType() == RoomType.SHARED) {
            cost = cost.multiply(BigDecimal.valueOf(guests));
        }
        cost = cost.add(boardSurcharge(room.getShelter(), boardType, guests, nights));
        reservation.setTotalPrice(cost);
        reservation.setStatus(status);
        reservation.setBoardType(boardType);
        reservation.setCreatedAt(createdAt);
        return reservation;
    }

    private static BigDecimal boardSurcharge(Shelter shelter, String boardType, int guests, long nights) {
        if (boardType == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal perPersonPerNight = switch (boardType) {
            case "Śniadanie"           -> shelter.getBoardBreakfastPrice();
            case "Śniadanie i kolacja" -> shelter.getBoardHalfBoardPrice();
            case "Pełne wyżywienie"    -> shelter.getBoardFullBoardPrice();
            default                    -> BigDecimal.ZERO;
        };
        if (perPersonPerNight == null) {
            return BigDecimal.ZERO;
        }
        return perPersonPerNight.multiply(BigDecimal.valueOf(guests)).multiply(BigDecimal.valueOf(nights));
    }

    private Review review(AppUser user, Shelter shelter, int rating, String comment, Instant createdAt) {
        Review review = new Review();
        review.setUser(user);
        review.setShelter(shelter);
        review.setRating(rating);
        review.setComment(comment);
        review.setCreatedAt(createdAt);
        return review;
    }
}

package pl.bnabd.backend.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.bnabd.backend.model.AppUser;
import pl.bnabd.backend.model.Reservation;
import pl.bnabd.backend.model.ReservationStatus;
import pl.bnabd.backend.model.Review;
import pl.bnabd.backend.model.Room;
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
        reviewRepository.deleteAll();
        reservationRepository.deleteAll();
        roomRepository.deleteAll();
        shelterRepository.deleteAll();
        userRepository.deleteAll();
        seed();
    }

    @Transactional
    public void seedIfEmpty() {
        if (userRepository.count() == 0) {
            seed();
        }
    }

    private void seed() {
        AppUser admin = userRepository.save(new AppUser("admin", "admin@schroniskohub.pl", passwordEncoder.encode("admin123"), UserRole.ADMIN));
        AppUser host = userRepository.save(new AppUser("host", "host@schroniskohub.pl", passwordEncoder.encode("host123"), UserRole.HOST));
        AppUser user = userRepository.save(new AppUser("user", "user@schroniskohub.pl", passwordEncoder.encode("user123"), UserRole.USER));

        Shelter granite = shelterRepository.save(shelter(host, "Schronisko Pod Granitem", "Kameralne schronisko blisko wejscia na popularne szlaki.", "Tatry Zachodnie", "+48 600 100 200", "kontakt@podgranitem.pl", "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80", 4.8));
        Shelter halna = shelterRepository.save(shelter(host, "Stacja Halna", "Baza noclegowa dla grup i samotnych wedrowcow.", "Beskid Zywiecki", "+48 600 200 300", "recepcja@stacjahalna.pl", "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80", 4.6));
        Shelter pass = shelterRepository.save(shelter(admin, "Dom na Przeleczy", "Schronisko z widokiem na gran i prosta rezerwacja pokoi.", "Karkonosze", "+48 600 300 400", "hello@domnaprzeleczy.pl", "https://images.unsplash.com/photo-1445307806294-bff7f67ff225?auto=format&fit=crop&w=900&q=80", 4.9));

        Room r1 = roomRepository.save(room(granite, "Pokoj 2-osobowy", 2, "110"));
        Room r2 = roomRepository.save(room(granite, "Pokoj 4-osobowy", 4, "89"));
        roomRepository.save(room(granite, "Sala turystyczna", 8, "55"));
        roomRepository.save(room(halna, "Pokoj rodzinny", 5, "72"));
        roomRepository.save(room(halna, "Dwojka z widokiem", 2, "95"));
        roomRepository.save(room(pass, "Apartament szczytowy", 3, "140"));
        roomRepository.save(room(pass, "Sala wieloosobowa", 10, "60"));

        reservationRepository.save(reservation(user, r1, LocalDate.now().plusDays(7), LocalDate.now().plusDays(10), 2, ReservationStatus.CONFIRMED));
        reservationRepository.save(reservation(user, r2, LocalDate.now().plusDays(20), LocalDate.now().plusDays(22), 3, ReservationStatus.PENDING));

        reviewRepository.save(review(user, granite, 5, "Swietna baza wypadowa i bardzo sprawna rezerwacja."));
        reviewRepository.save(review(admin, pass, 5, "Czysto, nowoczesnie i blisko szlakow."));
    }

    private Shelter shelter(AppUser owner, String name, String description, String location, String phone, String email, String imageUrl, double rating) {
        Shelter shelter = new Shelter();
        shelter.setOwner(owner);
        shelter.setName(name);
        shelter.setDescription(description);
        shelter.setLocation(location);
        shelter.setPhone(phone);
        shelter.setEmail(email);
        shelter.setImageUrl(imageUrl);
        shelter.setRating(rating);
        return shelter;
    }

    private Room room(Shelter shelter, String name, int capacity, String price) {
        Room room = new Room();
        room.setShelter(shelter);
        room.setName(name);
        room.setCapacity(capacity);
        room.setPricePerNight(new BigDecimal(price));
        return room;
    }

    private Reservation reservation(AppUser user, Room room, LocalDate startDate, LocalDate endDate, int guests, ReservationStatus status) {
        Reservation reservation = new Reservation();
        reservation.setUser(user);
        reservation.setRoom(room);
        reservation.setStartDate(startDate);
        reservation.setEndDate(endDate);
        reservation.setGuestCount(guests);
        reservation.setTotalPrice(room.getPricePerNight().multiply(BigDecimal.valueOf(java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate))));
        reservation.setStatus(status);
        return reservation;
    }

    private Review review(AppUser user, Shelter shelter, int rating, String comment) {
        Review review = new Review();
        review.setUser(user);
        review.setShelter(shelter);
        review.setRating(rating);
        review.setComment(comment);
        return review;
    }
}

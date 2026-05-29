package pl.bnabd.backend.service;

import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.bnabd.backend.dto.CreateReservationRequest;
import pl.bnabd.backend.dto.ReservationDto;
import pl.bnabd.backend.exception.NotFoundException;
import pl.bnabd.backend.model.AppUser;
import pl.bnabd.backend.model.Reservation;
import pl.bnabd.backend.model.ReservationStatus;
import pl.bnabd.backend.model.Room;
import pl.bnabd.backend.repository.ReservationRepository;
import pl.bnabd.backend.repository.UserRepository;

@Service
@Transactional
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final ShelterService shelterService;

    public ReservationService(
            ReservationRepository reservationRepository,
            UserRepository userRepository,
            ShelterService shelterService) {
        this.reservationRepository = reservationRepository;
        this.userRepository = userRepository;
        this.shelterService = shelterService;
    }

    @Transactional(readOnly = true)
    public List<ReservationDto> findAll(Long userId) {
        List<Reservation> reservations = userId == null
                ? reservationRepository.findAll()
                : reservationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return reservations.stream().map(this::toDto).toList();
    }

    public ReservationDto create(CreateReservationRequest request) {
        if (!request.endDate().isAfter(request.startDate())) {
            throw new IllegalArgumentException("Data konca musi byc pozniejsza niz data poczatku.");
        }

        AppUser user = userRepository.findById(request.userId())
                .orElseThrow(() -> new NotFoundException("Nie znaleziono uzytkownika o id " + request.userId() + "."));
        Room room = shelterService.findRoomById(request.roomId());

        if (request.guestCount() > room.getCapacity()) {
            throw new IllegalArgumentException("Liczba gosci przekracza pojemnosc pokoju.");
        }
        if (reservationRepository.existsOverlapping(room.getId(), request.startDate(), request.endDate())) {
            throw new IllegalArgumentException("Ten pokoj jest juz zajety w wybranym terminie.");
        }

        long nights = ChronoUnit.DAYS.between(request.startDate(), request.endDate());
        BigDecimal totalPrice = room.getPricePerNight().multiply(BigDecimal.valueOf(nights));

        Reservation reservation = new Reservation();
        reservation.setUser(user);
        reservation.setRoom(room);
        reservation.setStartDate(request.startDate());
        reservation.setEndDate(request.endDate());
        reservation.setGuestCount(request.guestCount());
        reservation.setTotalPrice(totalPrice);
        reservation.setStatus(ReservationStatus.PENDING);

        return toDto(reservationRepository.save(reservation));
    }

    public ReservationDto cancel(long id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Nie znaleziono rezerwacji o id " + id + "."));
        reservation.setStatus(ReservationStatus.CANCELLED);
        return toDto(reservation);
    }

    public ReservationDto confirm(long id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Nie znaleziono rezerwacji o id " + id + "."));
        reservation.setStatus(ReservationStatus.CONFIRMED);
        return toDto(reservation);
    }

    private ReservationDto toDto(Reservation reservation) {
        Room room = reservation.getRoom();
        return new ReservationDto(
                reservation.getId(),
                reservation.getUser().getId(),
                reservation.getUser().getLogin(),
                room.getId(),
                room.getName(),
                room.getShelter().getId(),
                room.getShelter().getName(),
                reservation.getStartDate(),
                reservation.getEndDate(),
                reservation.getGuestCount(),
                reservation.getTotalPrice(),
                reservation.getStatus(),
                reservation.getCreatedAt());
    }
}

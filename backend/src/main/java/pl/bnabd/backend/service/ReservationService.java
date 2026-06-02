package pl.bnabd.backend.service;

import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.bnabd.backend.dto.CreateReservationRequest;
import pl.bnabd.backend.dto.ReservationDto;
import pl.bnabd.backend.exception.ForbiddenException;
import pl.bnabd.backend.exception.NotFoundException;
import pl.bnabd.backend.model.AppUser;
import pl.bnabd.backend.model.Reservation;
import pl.bnabd.backend.model.ReservationStatus;
import pl.bnabd.backend.model.Room;
import pl.bnabd.backend.model.RoomType;
import pl.bnabd.backend.model.UserRole;
import pl.bnabd.backend.repository.ReservationRepository;

@Service
@Transactional
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final ShelterService shelterService;

    public ReservationService(
            ReservationRepository reservationRepository,
            ShelterService shelterService) {
        this.reservationRepository = reservationRepository;
        this.shelterService = shelterService;
    }

    @Transactional(readOnly = true)
    public List<ReservationDto> findAll(AppUser currentUser) {
        List<Reservation> reservations = switch (currentUser.getRole()) {
            case ADMIN -> reservationRepository.findAll();
            case HOST -> reservationRepository.findByRoom_Shelter_Owner_IdOrderByCreatedAtDesc(currentUser.getId());
            case USER -> reservationRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId());
        };
        return reservations.stream().map(this::toDto).toList();
    }

    public ReservationDto create(CreateReservationRequest request, AppUser currentUser) {
        if (!request.endDate().isAfter(request.startDate())) {
            throw new IllegalArgumentException("Data konca musi byc pozniejsza niz data poczatku.");
        }

        Room room = shelterService.findRoomById(request.roomId());

        if (request.guestCount() > room.getCapacity()) {
            throw new IllegalArgumentException("Liczba gosci przekracza pojemnosc pokoju.");
        }

        boolean shared = room.getRoomType() == RoomType.SHARED;
        if (shared) {
            int bookedSlots = reservationRepository.sumOverlappingGuests(
                    room.getId(), request.startDate(), request.endDate());
            if (bookedSlots + request.guestCount() > room.getCapacity()) {
                throw new IllegalArgumentException("Brak wolnych miejsc w pokoju wspolnym w wybranym terminie.");
            }
        } else if (reservationRepository.existsOverlapping(room.getId(), request.startDate(), request.endDate())) {
            throw new IllegalArgumentException("Ten pokoj jest juz zajety w wybranym terminie.");
        }

        long nights = ChronoUnit.DAYS.between(request.startDate(), request.endDate());
        BigDecimal roomCost = room.getPricePerNight().multiply(BigDecimal.valueOf(nights));
        if (shared) {
            roomCost = roomCost.multiply(BigDecimal.valueOf(request.guestCount()));
        }

        String boardType = (request.boardType() == null || request.boardType().isBlank())
                ? "Bez wyżywienia" : request.boardType();
        BigDecimal boardSurcharge = boardSurchargePerPersonPerNight(boardType)
                .multiply(BigDecimal.valueOf(request.guestCount()))
                .multiply(BigDecimal.valueOf(nights));
        BigDecimal totalPrice = roomCost.add(boardSurcharge);

        Reservation reservation = new Reservation();
        reservation.setUser(currentUser);
        reservation.setRoom(room);
        reservation.setStartDate(request.startDate());
        reservation.setEndDate(request.endDate());
        reservation.setGuestCount(request.guestCount());
        reservation.setTotalPrice(totalPrice);
        reservation.setBoardType(boardType);
        reservation.setStatus(ReservationStatus.PENDING);

        return toDto(reservationRepository.save(reservation));
    }

    public ReservationDto cancel(long id, AppUser currentUser) {
        Reservation reservation = findEntity(id);
        // A guest may cancel their own booking, an admin anyone's, and the host who
        // owns the shelter may cancel bookings in that shelter (mirrors confirm()).
        AppUser owner = reservation.getRoom().getShelter().getOwner();
        boolean allowed = currentUser.getRole() == UserRole.ADMIN
                || reservation.getUser().getId().equals(currentUser.getId())
                || (currentUser.getRole() == UserRole.HOST
                        && owner != null && owner.getId().equals(currentUser.getId()));
        if (!allowed) {
            throw new ForbiddenException("Nie mozesz anulowac cudzej rezerwacji.");
        }
        reservation.setStatus(ReservationStatus.CANCELLED);
        return toDto(reservation);
    }

    public ReservationDto confirm(long id, AppUser currentUser) {
        Reservation reservation = findEntity(id);
        // Only an admin or the host who owns the shelter may confirm a booking.
        AppUser owner = reservation.getRoom().getShelter().getOwner();
        boolean allowed = currentUser.getRole() == UserRole.ADMIN
                || (currentUser.getRole() == UserRole.HOST
                        && owner != null && owner.getId().equals(currentUser.getId()));
        if (!allowed) {
            throw new ForbiddenException("Tylko wlasciciel schroniska lub administrator moze potwierdzic rezerwacje.");
        }
        reservation.setStatus(ReservationStatus.CONFIRMED);
        return toDto(reservation);
    }

    private BigDecimal boardSurchargePerPersonPerNight(String boardType) {
        return switch (boardType) {
            case "Śniadanie"            -> new BigDecimal("20");
            case "Śniadanie i kolacja"  -> new BigDecimal("45");
            case "Pełne wyżywienie"     -> new BigDecimal("65");
            default                     -> BigDecimal.ZERO;
        };
    }

    private Reservation findEntity(long id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Nie znaleziono rezerwacji o id " + id + "."));
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
                reservation.getBoardType(),
                reservation.getCreatedAt());
    }
}

package pl.bnabd.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static pl.bnabd.backend.TestFixtures.reservation;
import static pl.bnabd.backend.TestFixtures.room;
import static pl.bnabd.backend.TestFixtures.shelter;
import static pl.bnabd.backend.TestFixtures.user;

import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pl.bnabd.backend.dto.CreateReservationRequest;
import pl.bnabd.backend.dto.ReservationDto;
import pl.bnabd.backend.exception.ForbiddenException;
import pl.bnabd.backend.model.AppUser;
import pl.bnabd.backend.model.Reservation;
import pl.bnabd.backend.model.ReservationStatus;
import pl.bnabd.backend.model.Room;
import pl.bnabd.backend.model.RoomType;
import pl.bnabd.backend.model.Shelter;
import pl.bnabd.backend.model.UserRole;
import pl.bnabd.backend.repository.ReservationRepository;

@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

    @Mock
    ReservationRepository reservationRepository;

    @Mock
    ShelterService shelterService;

    @InjectMocks
    ReservationService reservationService;

    private final AppUser guest = user(1, "user", UserRole.USER);
    private final AppUser host = user(2, "host", UserRole.HOST);
    private final Shelter shelter = shelter(10, host);
    private final Room room = room(100, shelter, 4, "100.00");

    // create: the core booking workflow

    // find room -> dates free -> create reservation (PENDING, price captured at booking)
    @Test
    void createBooksRoomAsPendingAndCapturesPrice() {
        when(shelterService.findRoomById(100L)).thenReturn(room);
        when(reservationRepository.existsOverlapping(eq(100L), any(), any())).thenReturn(false);
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(call -> call.getArgument(0));

        CreateReservationRequest request = new CreateReservationRequest(
                100L, LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 3), 2, null, null);

        ReservationDto dto = reservationService.create(request, guest);

        assertThat(dto.status()).isEqualTo(ReservationStatus.PENDING);
        assertThat(dto.userId()).isEqualTo(1L);
        assertThat(dto.guestCount()).isEqualTo(2);
        // 2 nights * 100.00
        assertThat(dto.totalPrice()).isEqualByComparingTo("200.00");
    }

    // create reservation with end <= start -> rejected
    @Test
    void createRejectsEndDateNotAfterStart() {
        CreateReservationRequest request = new CreateReservationRequest(
                100L, LocalDate.of(2026, 6, 3), LocalDate.of(2026, 6, 3), 2, null, null);

        assertThatThrownBy(() -> reservationService.create(request, guest))
                .isInstanceOf(IllegalArgumentException.class);
        verify(reservationRepository, never()).save(any());
    }

    // find room -> guests > room capacity -> rejected
    @Test
    void createRejectsGuestCountAboveCapacity() {
        when(shelterService.findRoomById(100L)).thenReturn(room);
        CreateReservationRequest request = new CreateReservationRequest(
                100L, LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 3), 5, null, null);

        assertThatThrownBy(() -> reservationService.create(request, guest))
                .isInstanceOf(IllegalArgumentException.class);
        verify(reservationRepository, never()).save(any());
    }

    // find room -> dates overlap an existing booking -> rejected
    @Test
    void createRejectsOverlappingDates() {
        when(shelterService.findRoomById(100L)).thenReturn(room);
        when(reservationRepository.existsOverlapping(eq(100L), any(), any())).thenReturn(true);
        CreateReservationRequest request = new CreateReservationRequest(
                100L, LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 3), 2, null, null);

        assertThatThrownBy(() -> reservationService.create(request, guest))
                .isInstanceOf(IllegalArgumentException.class);
        verify(reservationRepository, never()).save(any());
    }

    // shared (dormitory) rooms

    // shared room -> price scales with guest count, partial booking allowed within capacity
    @Test
    void createSharedRoomScalesPriceAndAllowsPartialBooking() {
        Room sharedRoom = room(100, shelter, 8, RoomType.SHARED, "50.00");
        when(shelterService.findRoomById(100L)).thenReturn(sharedRoom);
        when(reservationRepository.sumOverlappingGuests(eq(100L), any(), any())).thenReturn(3);
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(call -> call.getArgument(0));

        CreateReservationRequest request = new CreateReservationRequest(
                100L, LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 3), 2, null, null);

        ReservationDto dto = reservationService.create(request, guest);

        assertThat(dto.status()).isEqualTo(ReservationStatus.PENDING);
        // 2 nights * 50.00 * 2 guests
        assertThat(dto.totalPrice()).isEqualByComparingTo("200.00");
    }

    // shared room -> booked slots + requested guests exceed capacity -> rejected
    @Test
    void createSharedRoomRejectsWhenSlotsExceedCapacity() {
        Room sharedRoom = room(100, shelter, 8, RoomType.SHARED, "50.00");
        when(shelterService.findRoomById(100L)).thenReturn(sharedRoom);
        when(reservationRepository.sumOverlappingGuests(eq(100L), any(), any())).thenReturn(7);

        CreateReservationRequest request = new CreateReservationRequest(
                100L, LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 3), 2, null, null);

        assertThatThrownBy(() -> reservationService.create(request, guest))
                .isInstanceOf(IllegalArgumentException.class);
        verify(reservationRepository, never()).save(any());
    }

    // cancel

    // guest -> cancel own reservation -> CANCELLED
    @Test
    void ownerCanCancelOwnReservation() {
        Reservation reservation = reservation(50, guest, room, ReservationStatus.PENDING);
        when(reservationRepository.findById(50L)).thenReturn(Optional.of(reservation));

        ReservationDto dto = reservationService.cancel(50L, guest);

        assertThat(dto.status()).isEqualTo(ReservationStatus.CANCELLED);
    }

    // stranger -> cancel someone else's reservation -> forbidden
    @Test
    void otherUserCannotCancelSomeoneElsesReservation() {
        Reservation reservation = reservation(50, guest, room, ReservationStatus.PENDING);
        when(reservationRepository.findById(50L)).thenReturn(Optional.of(reservation));
        AppUser stranger = user(9, "stranger", UserRole.USER);

        assertThatThrownBy(() -> reservationService.cancel(50L, stranger))
                .isInstanceOf(ForbiddenException.class);
        assertThat(reservation.getStatus()).isEqualTo(ReservationStatus.PENDING);
    }

    // admin -> cancel any reservation -> CANCELLED
    @Test
    void adminCanCancelAnyReservation() {
        Reservation reservation = reservation(50, guest, room, ReservationStatus.PENDING);
        when(reservationRepository.findById(50L)).thenReturn(Optional.of(reservation));
        AppUser admin = user(3, "admin", UserRole.ADMIN);

        ReservationDto dto = reservationService.cancel(50L, admin);

        assertThat(dto.status()).isEqualTo(ReservationStatus.CANCELLED);
    }
}

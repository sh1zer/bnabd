package pl.bnabd.backend.service;

import org.springframework.stereotype.Service;
import pl.bnabd.backend.exception.ForbiddenException;
import pl.bnabd.backend.exception.NotFoundException;
import pl.bnabd.backend.model.AppUser;
import pl.bnabd.backend.model.Reservation;
import pl.bnabd.backend.model.ReservationStatus;
import pl.bnabd.backend.model.UserRole;
import pl.bnabd.backend.repository.ReservationRepository;

@Service
public class PaymentService {

    private final ReservationRepository reservationRepository;

    public PaymentService(ReservationRepository reservationRepository) {
        this.reservationRepository = reservationRepository;
    }

    public void confirm(Long reservationId, AppUser currentUser) {
        Reservation reservation = findAndAuthorize(reservationId, currentUser);
        reservation.setStatus(ReservationStatus.CONFIRMED);
        reservationRepository.save(reservation);
    }

    private Reservation findAndAuthorize(Long reservationId, AppUser currentUser) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new NotFoundException(
                        "Nie znaleziono rezerwacji o id " + reservationId + "."));

        boolean allowed = currentUser.getRole() == UserRole.ADMIN
                || reservation.getUser().getId().equals(currentUser.getId());
        if (!allowed) {
            throw new ForbiddenException("Brak dostępu do tej rezerwacji.");
        }
        return reservation;
    }
}

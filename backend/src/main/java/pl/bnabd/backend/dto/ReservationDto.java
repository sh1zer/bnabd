package pl.bnabd.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import pl.bnabd.backend.model.ReservationStatus;

public record ReservationDto(
        Long id,
        Long userId,
        String userLogin,
        Long roomId,
        String roomName,
        Long shelterId,
        String shelterName,
        LocalDate startDate,
        LocalDate endDate,
        int guestCount,
        BigDecimal totalPrice,
        ReservationStatus status,
        String boardType,
        Instant createdAt) {
}

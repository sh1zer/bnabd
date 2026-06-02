package pl.bnabd.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public record ShelterStatsResponse(
        long shelterId,
        String shelterName,
        long reservations,
        long pendingReservations,
        BigDecimal revenue,
        List<StatsResponse.MonthlyCount> monthlyReservations) {
}

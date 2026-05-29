package pl.bnabd.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public record StatsResponse(
        long users,
        long shelters,
        long rooms,
        long reservations,
        long pendingReservations,
        BigDecimal revenue,
        List<MonthlyCount> monthlyReservations,
        List<MonthlyRevenue> monthlyRevenue) {

    public record MonthlyCount(int month, long count) {
    }

    public record MonthlyRevenue(int month, BigDecimal revenue) {
    }
}

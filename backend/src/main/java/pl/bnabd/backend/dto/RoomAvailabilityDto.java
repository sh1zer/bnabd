package pl.bnabd.backend.dto;

import java.math.BigDecimal;

public record RoomAvailabilityDto(
        Long id,
        String name,
        int capacity,
        BigDecimal pricePerNight,
        boolean available) {
}

package pl.bnabd.backend.dto;

import java.math.BigDecimal;

public record RoomDto(
        Long id,
        Long shelterId,
        String shelterName,
        String name,
        int capacity,
        BigDecimal pricePerNight) {
}

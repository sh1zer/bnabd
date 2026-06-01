package pl.bnabd.backend.dto;

import java.math.BigDecimal;
import pl.bnabd.backend.model.RoomType;

public record RoomDto(
        Long id,
        Long shelterId,
        String shelterName,
        String name,
        int capacity,
        RoomType roomType,
        BigDecimal pricePerNight) {
}

package pl.bnabd.backend.dto;

import java.math.BigDecimal;
import pl.bnabd.backend.model.RoomType;

public record RoomAvailabilityDto(
        Long id,
        String name,
        int capacity,
        RoomType roomType,
        BigDecimal pricePerNight,
        boolean available,
        int availableCapacity) {
}

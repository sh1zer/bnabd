package pl.bnabd.backend.dto;

import java.math.BigDecimal;

public record MenuItemDto(
        Long id,
        Long shelterId,
        String shelterName,
        String name,
        String description,
        BigDecimal price,
        String category) {
}

package pl.bnabd.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

public record ShelterRequest(
        @NotBlank String name,
        String description,
        @NotBlank String location,
        String phone,
        String email,
        String imageUrl,
        @PositiveOrZero BigDecimal boardBreakfastPrice,
        @PositiveOrZero BigDecimal boardHalfBoardPrice,
        @PositiveOrZero BigDecimal boardFullBoardPrice) {
}

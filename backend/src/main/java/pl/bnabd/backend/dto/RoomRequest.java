package pl.bnabd.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record RoomRequest(
        @NotBlank String name,
        @Min(1) int capacity,
        @NotNull @DecimalMin(value = "0.0", inclusive = false) BigDecimal pricePerNight) {
}

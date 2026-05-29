package pl.bnabd.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateReviewRequest(
        @NotNull Long userId,
        @NotNull Long shelterId,
        @Min(1) @Max(5) int rating,
        @NotBlank String comment) {
}

package pl.bnabd.backend.dto;

import java.time.Instant;

public record ReviewDto(
        Long id,
        Long userId,
        String userLogin,
        Long shelterId,
        String shelterName,
        int rating,
        String comment,
        Instant createdAt) {
}

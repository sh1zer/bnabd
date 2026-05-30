package pl.bnabd.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record ShelterRequest(
        @NotBlank String name,
        String description,
        @NotBlank String location,
        String phone,
        String email,
        String imageUrl) {
}

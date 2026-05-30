package pl.bnabd.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Email String email,
        String currentPassword,
        @Size(min = 6) String newPassword) {
}

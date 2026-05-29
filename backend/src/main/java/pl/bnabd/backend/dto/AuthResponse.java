package pl.bnabd.backend.dto;

import pl.bnabd.backend.model.UserRole;

public record AuthResponse(
        String token,
        Long userId,
        String login,
        String email,
        UserRole role) {
}

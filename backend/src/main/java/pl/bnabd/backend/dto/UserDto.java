package pl.bnabd.backend.dto;

import java.time.Instant;
import pl.bnabd.backend.model.UserRole;

public record UserDto(
        Long id,
        String login,
        String email,
        UserRole role,
        Instant createdAt) {
}

package pl.bnabd.backend.dto;

import jakarta.validation.constraints.NotNull;
import pl.bnabd.backend.model.UserRole;

public record UpdateRoleRequest(@NotNull UserRole role) {
}

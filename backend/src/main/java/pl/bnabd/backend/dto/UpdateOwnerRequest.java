package pl.bnabd.backend.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateOwnerRequest(@NotNull Long ownerId) {
}

package pl.bnabd.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record EmployeeRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank String position,
        String phone) {
}

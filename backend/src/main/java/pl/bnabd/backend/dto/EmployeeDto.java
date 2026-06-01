package pl.bnabd.backend.dto;

public record EmployeeDto(
        Long id,
        Long shelterId,
        String shelterName,
        String firstName,
        String lastName,
        String position,
        String phone) {
}

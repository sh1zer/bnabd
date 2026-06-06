package pl.bnabd.backend.dto;

import jakarta.validation.constraints.NotNull;

public record ConfirmPaymentRequest(@NotNull Long reservationId) {}

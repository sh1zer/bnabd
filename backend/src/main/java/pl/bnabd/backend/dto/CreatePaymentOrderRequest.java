package pl.bnabd.backend.dto;

import jakarta.validation.constraints.NotNull;

public record CreatePaymentOrderRequest(@NotNull Long reservationId) {}

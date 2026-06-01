package pl.bnabd.backend.dto;

public record PaymentOrderResponse(String orderId, long amountPaise, String currency, String keyId) {}

package pl.bnabd.backend.dto;

import java.math.BigDecimal;

public record ShelterDto(
        Long id,
        Long ownerId,
        String name,
        String description,
        String location,
        String phone,
        String email,
        String imageUrl,
        double rating,
        int beds,
        String price,
        BigDecimal boardBreakfastPrice,
        BigDecimal boardHalfBoardPrice,
        BigDecimal boardFullBoardPrice) {
}

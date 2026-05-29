package pl.bnabd.backend.controller;

import jakarta.validation.Valid;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.bnabd.backend.dto.CreateReservationRequest;
import pl.bnabd.backend.dto.ReservationDto;
import pl.bnabd.backend.service.ReservationService;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @GetMapping
    List<ReservationDto> listReservations(@RequestParam(required = false) Long userId) {
        return reservationService.findAll(userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    ReservationDto createReservation(@Valid @RequestBody CreateReservationRequest request) {
        return reservationService.create(request);
    }

    @PatchMapping("/{id}/cancel")
    ReservationDto cancelReservation(@PathVariable long id) {
        return reservationService.cancel(id);
    }

    @PatchMapping("/{id}/confirm")
    ReservationDto confirmReservation(@PathVariable long id) {
        return reservationService.confirm(id);
    }
}

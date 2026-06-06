package pl.bnabd.backend.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.bnabd.backend.dto.ConfirmPaymentRequest;
import pl.bnabd.backend.service.CurrentUserProvider;
import pl.bnabd.backend.service.PaymentService;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final CurrentUserProvider currentUserProvider;

    public PaymentController(PaymentService paymentService, CurrentUserProvider currentUserProvider) {
        this.paymentService = paymentService;
        this.currentUserProvider = currentUserProvider;
    }

    /** Placeholder "payment": confirms the reservation. No real charge is made. */
    @PostMapping("/confirm")
    void confirm(@Valid @RequestBody ConfirmPaymentRequest request) {
        paymentService.confirm(request.reservationId(), currentUserProvider.require());
    }
}

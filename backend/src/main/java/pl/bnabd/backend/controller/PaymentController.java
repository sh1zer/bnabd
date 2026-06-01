package pl.bnabd.backend.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.bnabd.backend.dto.CreatePaymentOrderRequest;
import pl.bnabd.backend.dto.PaymentOrderResponse;
import pl.bnabd.backend.dto.VerifyPaymentRequest;
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

    @PostMapping("/create-order")
    PaymentOrderResponse createOrder(@Valid @RequestBody CreatePaymentOrderRequest request) {
        return paymentService.createOrder(request.reservationId(), currentUserProvider.require());
    }

    @PostMapping("/verify")
    void verifyPayment(@Valid @RequestBody VerifyPaymentRequest request) {
        paymentService.verifyAndConfirm(request, currentUserProvider.require());
    }
}

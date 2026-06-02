package pl.bnabd.backend.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import pl.bnabd.backend.dto.PaymentOrderResponse;
import pl.bnabd.backend.dto.VerifyPaymentRequest;
import pl.bnabd.backend.exception.ForbiddenException;
import pl.bnabd.backend.model.AppUser;
import pl.bnabd.backend.model.Reservation;
import pl.bnabd.backend.model.ReservationStatus;
import pl.bnabd.backend.model.UserRole;
import pl.bnabd.backend.repository.ReservationRepository;

@Service
public class PaymentService {

    private final ReservationRepository reservationRepository;
    private final String keyId;
    private final String keySecret;

    public PaymentService(
            ReservationRepository reservationRepository,
            @Value("${razorpay.key-id}") String keyId,
            @Value("${razorpay.key-secret}") String keySecret) {
        this.reservationRepository = reservationRepository;
        this.keyId = keyId;
        this.keySecret = keySecret;
    }

    public PaymentOrderResponse createOrder(Long reservationId, AppUser currentUser) {
        Reservation reservation = findAndAuthorize(reservationId, currentUser);

        try {
            RazorpayClient client = new RazorpayClient(keyId, keySecret);

            // Razorpay expects amount in smallest currency unit (grosze for PLN)
            long amountGrosze = reservation.getTotalPrice()
                    .multiply(java.math.BigDecimal.valueOf(100))
                    .longValue();

            JSONObject options = new JSONObject();
            options.put("amount", amountGrosze);
            options.put("currency", "PLN");
            options.put("receipt", "res_" + reservationId);
            options.put("payment_capture", 1);

            Order order = client.orders.create(options);
            return new PaymentOrderResponse(order.get("id"), amountGrosze, "PLN", keyId);
        } catch (Exception e) {
            throw new RuntimeException("Nie udało się utworzyć zamówienia płatności: " + e.getMessage(), e);
        }
    }

    public void verifyAndConfirm(VerifyPaymentRequest req, AppUser currentUser) {
        Reservation reservation = findAndAuthorize(req.reservationId(), currentUser);

        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", req.razorpayOrderId());
            attributes.put("razorpay_payment_id", req.razorpayPaymentId());
            attributes.put("razorpay_signature", req.razorpaySignature());

            Utils.verifyPaymentSignature(attributes, keySecret);
        } catch (Exception e) {
            throw new ForbiddenException("Weryfikacja podpisu płatności nie powiodła się.");
        }

        reservation.setStatus(ReservationStatus.CONFIRMED);
        reservationRepository.save(reservation);
    }

    private Reservation findAndAuthorize(Long reservationId, AppUser currentUser) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new pl.bnabd.backend.exception.NotFoundException(
                        "Nie znaleziono rezerwacji o id " + reservationId + "."));

        boolean allowed = currentUser.getRole() == UserRole.ADMIN
                || reservation.getUser().getId().equals(currentUser.getId());
        if (!allowed) {
            throw new ForbiddenException("Brak dostępu do tej rezerwacji.");
        }
        return reservation;
    }
}

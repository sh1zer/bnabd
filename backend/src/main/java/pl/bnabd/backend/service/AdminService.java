package pl.bnabd.backend.service;

import java.math.BigDecimal;
import java.time.ZoneOffset;
import java.util.List;
import java.util.stream.IntStream;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.bnabd.backend.dto.StatsResponse;
import pl.bnabd.backend.model.Reservation;
import pl.bnabd.backend.model.ReservationStatus;
import pl.bnabd.backend.repository.ReservationRepository;
import pl.bnabd.backend.repository.RoomRepository;
import pl.bnabd.backend.repository.ShelterRepository;
import pl.bnabd.backend.repository.UserRepository;

@Service
@Transactional(readOnly = true)
public class AdminService {

    private final UserRepository userRepository;
    private final ShelterRepository shelterRepository;
    private final RoomRepository roomRepository;
    private final ReservationRepository reservationRepository;

    public AdminService(
            UserRepository userRepository,
            ShelterRepository shelterRepository,
            RoomRepository roomRepository,
            ReservationRepository reservationRepository) {
        this.userRepository = userRepository;
        this.shelterRepository = shelterRepository;
        this.roomRepository = roomRepository;
        this.reservationRepository = reservationRepository;
    }

    public StatsResponse stats() {
        List<Reservation> reservations = reservationRepository.findAll();
        BigDecimal revenue = reservations.stream()
                .map(Reservation::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<StatsResponse.MonthlyCount> monthlyCounts = IntStream.rangeClosed(1, 12)
                .mapToObj(month -> new StatsResponse.MonthlyCount(
                        month,
                        reservations.stream().filter(reservation -> createdMonth(reservation) == month).count()))
                .toList();

        List<StatsResponse.MonthlyRevenue> monthlyRevenue = IntStream.rangeClosed(1, 12)
                .mapToObj(month -> new StatsResponse.MonthlyRevenue(
                        month,
                        reservations.stream()
                                .filter(reservation -> createdMonth(reservation) == month)
                                .map(Reservation::getTotalPrice)
                                .reduce(BigDecimal.ZERO, BigDecimal::add)))
                .toList();

        return new StatsResponse(
                userRepository.count(),
                shelterRepository.count(),
                roomRepository.count(),
                reservationRepository.count(),
                reservationRepository.countByStatus(ReservationStatus.PENDING),
                revenue,
                monthlyCounts,
                monthlyRevenue);
    }

    private int createdMonth(Reservation reservation) {
        return reservation.getCreatedAt().atZone(ZoneOffset.UTC).getMonthValue();
    }
}

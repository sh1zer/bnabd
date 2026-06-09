package pl.bnabd.backend.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.IntStream;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.bnabd.backend.dto.StatsResponse;
import pl.bnabd.backend.dto.UserDto;
import pl.bnabd.backend.exception.ForbiddenException;
import pl.bnabd.backend.exception.NotFoundException;
import pl.bnabd.backend.model.AppUser;
import pl.bnabd.backend.model.Reservation;
import pl.bnabd.backend.model.ReservationStatus;
import pl.bnabd.backend.model.Shelter;
import pl.bnabd.backend.model.UserRole;
import pl.bnabd.backend.repository.ReservationRepository;
import pl.bnabd.backend.repository.ReviewRepository;
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
    private final ReviewRepository reviewRepository;

    public AdminService(
            UserRepository userRepository,
            ShelterRepository shelterRepository,
            RoomRepository roomRepository,
            ReservationRepository reservationRepository,
            ReviewRepository reviewRepository) {
        this.userRepository = userRepository;
        this.shelterRepository = shelterRepository;
        this.roomRepository = roomRepository;
        this.reservationRepository = reservationRepository;
        this.reviewRepository = reviewRepository;
    }

    public List<UserDto> listUsers() {
        return userRepository.findAll().stream().map(AdminService::toUserDto).toList();
    }

    @Transactional
    public UserDto changeRole(long id, UserRole role) {
        AppUser user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Nie znaleziono uzytkownika o id " + id + "."));
        user.setRole(role);
        return toUserDto(user);
    }

    @Transactional
    public void deleteUser(long id, AppUser currentAdmin) {
        if (currentAdmin.getId().equals(id)) {
            throw new ForbiddenException("Nie mozesz usunac wlasnego konta.");
        }
        AppUser user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Nie znaleziono uzytkownika o id " + id + "."));
        // Remove the user's own activity, but keep their shelters (and the bookings of other
        // guests in them) alive by detaching ownership.
        reviewRepository.deleteByUserId(id);
        reservationRepository.deleteByUserId(id);
        for (Shelter shelter : shelterRepository.findByOwnerId(id)) {
            shelter.setOwner(null);
        }
        userRepository.delete(user);
    }

    private static UserDto toUserDto(AppUser user) {
        return new UserDto(user.getId(), user.getLogin(), user.getEmail(), user.getRole(), user.getCreatedAt());
    }

    public StatsResponse stats() {
        List<Reservation> reservations = reservationRepository.findAll();
        BigDecimal revenue = reservations.stream()
                .map(Reservation::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<StatsResponse.MonthlyCount> monthlyCounts = IntStream.rangeClosed(1, 12)
                .mapToObj(month -> new StatsResponse.MonthlyCount(
                        month,
                        reservations.stream().filter(reservation -> stayMonth(reservation) == month).count()))
                .toList();

        List<StatsResponse.MonthlyRevenue> monthlyRevenue = IntStream.rangeClosed(1, 12)
                .mapToObj(month -> new StatsResponse.MonthlyRevenue(
                        month,
                        reservations.stream()
                                .filter(reservation -> stayMonth(reservation) == month)
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

    private int stayMonth(Reservation reservation) {
        return reservation.getStartDate().getMonthValue();
    }
}

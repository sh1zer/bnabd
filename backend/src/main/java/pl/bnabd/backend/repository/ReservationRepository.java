package pl.bnabd.backend.repository;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pl.bnabd.backend.model.Reservation;
import pl.bnabd.backend.model.ReservationStatus;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByUserIdOrderByCreatedAtDesc(Long userId);

    long countByStatus(ReservationStatus status);

    @Query("""
            select count(r) > 0
            from Reservation r
            where r.room.id = :roomId
              and r.status <> pl.bnabd.backend.model.ReservationStatus.CANCELLED
              and r.startDate < :endDate
              and r.endDate > :startDate
            """)
    boolean existsOverlapping(
            @Param("roomId") Long roomId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}

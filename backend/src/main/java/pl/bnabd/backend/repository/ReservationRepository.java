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

    List<Reservation> findByRoom_Shelter_Owner_IdOrderByCreatedAtDesc(Long ownerId);

    void deleteByRoomId(Long roomId);

    void deleteByUserId(Long userId);

    void deleteByRoom_Shelter_Id(Long shelterId);

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

    @Query("""
            select coalesce(sum(r.guestCount), 0)
            from Reservation r
            where r.room.id = :roomId
              and r.status <> pl.bnabd.backend.model.ReservationStatus.CANCELLED
              and r.startDate < :endDate
              and r.endDate > :startDate
            """)
    int sumOverlappingGuests(
            @Param("roomId") Long roomId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("""
            select count(r) > 0
            from Reservation r
            where r.user.id = :userId
              and r.room.shelter.id = :shelterId
              and r.status <> pl.bnabd.backend.model.ReservationStatus.CANCELLED
              and r.endDate < :today
            """)
    boolean existsCompletedStay(
            @Param("userId") Long userId,
            @Param("shelterId") Long shelterId,
            @Param("today") LocalDate today);
}

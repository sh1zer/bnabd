package pl.bnabd.backend.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import pl.bnabd.backend.model.Room;

public interface RoomRepository extends JpaRepository<Room, Long> {
    List<Room> findByShelterId(Long shelterId);

    void deleteByShelterId(Long shelterId);
}

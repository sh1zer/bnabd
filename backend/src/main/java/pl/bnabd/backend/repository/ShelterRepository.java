package pl.bnabd.backend.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import pl.bnabd.backend.model.Shelter;

public interface ShelterRepository extends JpaRepository<Shelter, Long> {
    List<Shelter> findByLocationContainingIgnoreCase(String location);

    List<Shelter> findByOwnerId(Long ownerId);
}

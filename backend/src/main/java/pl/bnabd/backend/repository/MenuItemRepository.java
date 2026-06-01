package pl.bnabd.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.bnabd.backend.model.MenuItem;
import java.util.List;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByShelterId(Long shelterId);
    void deleteByShelterId(Long shelterId);
}

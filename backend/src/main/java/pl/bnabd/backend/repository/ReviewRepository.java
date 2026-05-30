package pl.bnabd.backend.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import pl.bnabd.backend.model.Review;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByShelterIdOrderByCreatedAtDesc(Long shelterId);

    void deleteByUserId(Long userId);

    void deleteByShelterId(Long shelterId);
}

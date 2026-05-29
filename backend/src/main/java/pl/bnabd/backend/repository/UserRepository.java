package pl.bnabd.backend.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import pl.bnabd.backend.model.AppUser;

public interface UserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByLogin(String login);

    boolean existsByLogin(String login);

    boolean existsByEmail(String email);
}

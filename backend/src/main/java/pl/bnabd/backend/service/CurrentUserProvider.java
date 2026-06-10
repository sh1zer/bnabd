package pl.bnabd.backend.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import pl.bnabd.backend.exception.ForbiddenException;
import pl.bnabd.backend.model.AppUser;
import pl.bnabd.backend.repository.UserRepository;

@Component
public class CurrentUserProvider {

    private final UserRepository userRepository;

    public CurrentUserProvider(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public AppUser require() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof String login)) {
            throw new ForbiddenException("Wymagane jest zalogowanie.");
        }
        return userRepository.findByLogin(login)
                .orElseThrow(() -> new ForbiddenException("Konto powiazane z tokenem nie istnieje."));
    }
}

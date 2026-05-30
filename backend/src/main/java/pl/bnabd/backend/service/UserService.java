package pl.bnabd.backend.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.bnabd.backend.dto.UpdateProfileRequest;
import pl.bnabd.backend.dto.UserDto;
import pl.bnabd.backend.exception.NotFoundException;
import pl.bnabd.backend.model.AppUser;
import pl.bnabd.backend.repository.UserRepository;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserDto updateProfile(long userId, UpdateProfileRequest request) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Nie znaleziono uzytkownika o id " + userId + "."));

        if (request.email() != null && !request.email().isBlank()
                && !request.email().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.email())) {
                throw new IllegalArgumentException("Ten email jest juz zajety.");
            }
            user.setEmail(request.email());
        }

        if (request.newPassword() != null && !request.newPassword().isBlank()) {
            if (request.currentPassword() == null
                    || !passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
                throw new IllegalArgumentException("Aktualne haslo jest nieprawidlowe.");
            }
            user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        }

        return toDto(user);
    }

    public static UserDto toDto(AppUser user) {
        return new UserDto(user.getId(), user.getLogin(), user.getEmail(), user.getRole(), user.getCreatedAt());
    }
}

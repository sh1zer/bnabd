package pl.bnabd.backend.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.bnabd.backend.dto.AuthResponse;
import pl.bnabd.backend.dto.LoginRequest;
import pl.bnabd.backend.dto.RegisterRequest;
import pl.bnabd.backend.model.AppUser;
import pl.bnabd.backend.model.UserRole;
import pl.bnabd.backend.repository.UserRepository;

@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByLogin(request.login())) {
            throw new IllegalArgumentException("Ten login jest juz zajety.");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Ten email jest juz zajety.");
        }

        AppUser user = userRepository.save(new AppUser(
                request.login(),
                request.email(),
                passwordEncoder.encode(request.password()),
                UserRole.USER));
        return toResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        AppUser user = userRepository.findByLogin(request.login())
                .orElseThrow(() -> new IllegalArgumentException("Nieprawidlowy login lub haslo."));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Nieprawidlowy login lub haslo.");
        }
        return toResponse(user);
    }

    private AuthResponse toResponse(AppUser user) {
        return new AuthResponse(
                jwtService.createToken(user),
                user.getId(),
                user.getLogin(),
                user.getEmail(),
                user.getRole());
    }
}

package pl.bnabd.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import pl.bnabd.backend.dto.AuthResponse;
import pl.bnabd.backend.dto.LoginRequest;
import pl.bnabd.backend.dto.RegisterRequest;
import pl.bnabd.backend.model.AppUser;
import pl.bnabd.backend.model.UserRole;
import pl.bnabd.backend.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    UserRepository userRepository;

    @Mock
    PasswordEncoder passwordEncoder;

    @Mock
    JwtService jwtService;

    @InjectMocks
    AuthService authService;

    // register new account -> role USER, password hashed, token issued
    @Test
    void registerCreatesUserWithUserRoleAndHashedPassword() {
        when(userRepository.existsByLogin("newbie")).thenReturn(false);
        when(userRepository.existsByEmail("newbie@example.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("hashed");
        when(userRepository.save(any(AppUser.class))).thenAnswer(call -> call.getArgument(0));
        when(jwtService.createToken(any(AppUser.class))).thenReturn("jwt-token");

        AuthResponse response = authService.register(
                new RegisterRequest("newbie", "newbie@example.com", "secret123"));

        assertThat(response.role()).isEqualTo(UserRole.USER);
        assertThat(response.token()).isEqualTo("jwt-token");
        verify(passwordEncoder).encode("secret123");
    }

    // register with an already-taken login -> rejected
    @Test
    void registerRejectsDuplicateLogin() {
        when(userRepository.existsByLogin("taken")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(
                new RegisterRequest("taken", "taken@example.com", "secret123")))
                .isInstanceOf(IllegalArgumentException.class);
        verify(userRepository, never()).save(any());
    }

    // login -> password matches -> token issued
    @Test
    void loginReturnsTokenWhenPasswordMatches() {
        AppUser user = new AppUser("user", "user@example.com", "stored-hash", UserRole.USER);
        when(userRepository.findByLogin("user")).thenReturn(java.util.Optional.of(user));
        when(passwordEncoder.matches("raw", "stored-hash")).thenReturn(true);
        when(jwtService.createToken(user)).thenReturn("jwt-token");

        AuthResponse response = authService.login(new LoginRequest("user", "raw"));

        assertThat(response.token()).isEqualTo("jwt-token");
    }

    // login -> password doesn't match -> rejected, no token
    @Test
    void loginRejectsWrongPassword() {
        AppUser user = new AppUser("user", "user@example.com", "stored-hash", UserRole.USER);
        when(userRepository.findByLogin("user")).thenReturn(java.util.Optional.of(user));
        when(passwordEncoder.matches(eq("wrong"), anyString())).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("user", "wrong")))
                .isInstanceOf(IllegalArgumentException.class);
        verify(jwtService, never()).createToken(any());
    }
}

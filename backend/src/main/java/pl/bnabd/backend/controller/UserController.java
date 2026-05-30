package pl.bnabd.backend.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.bnabd.backend.dto.UpdateProfileRequest;
import pl.bnabd.backend.dto.UserDto;
import pl.bnabd.backend.service.CurrentUserProvider;
import pl.bnabd.backend.service.UserService;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final CurrentUserProvider currentUserProvider;

    public UserController(UserService userService, CurrentUserProvider currentUserProvider) {
        this.userService = userService;
        this.currentUserProvider = currentUserProvider;
    }

    @GetMapping("/me")
    UserDto me() {
        return UserService.toDto(currentUserProvider.require());
    }

    @PutMapping("/me")
    UserDto updateMe(@Valid @RequestBody UpdateProfileRequest request) {
        return userService.updateProfile(currentUserProvider.require().getId(), request);
    }
}

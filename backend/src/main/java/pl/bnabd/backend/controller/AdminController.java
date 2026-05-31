package pl.bnabd.backend.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.bnabd.backend.dto.ShelterDto;
import pl.bnabd.backend.dto.StatsResponse;
import pl.bnabd.backend.dto.UpdateOwnerRequest;
import pl.bnabd.backend.dto.UpdateRoleRequest;
import pl.bnabd.backend.dto.UserDto;
import pl.bnabd.backend.service.AdminService;
import pl.bnabd.backend.service.CurrentUserProvider;
import pl.bnabd.backend.service.DatabaseSeedService;
import pl.bnabd.backend.service.ShelterService;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final ShelterService shelterService;
    private final DatabaseSeedService databaseSeedService;
    private final CurrentUserProvider currentUserProvider;

    public AdminController(
            AdminService adminService,
            ShelterService shelterService,
            DatabaseSeedService databaseSeedService,
            CurrentUserProvider currentUserProvider) {
        this.adminService = adminService;
        this.shelterService = shelterService;
        this.databaseSeedService = databaseSeedService;
        this.currentUserProvider = currentUserProvider;
    }

    @GetMapping("/stats")
    StatsResponse stats() {
        return adminService.stats();
    }

    @GetMapping("/users")
    List<UserDto> listUsers() {
        return adminService.listUsers();
    }

    @PatchMapping("/users/{id}/role")
    UserDto changeRole(@PathVariable long id, @Valid @RequestBody UpdateRoleRequest request) {
        return adminService.changeRole(id, request.role());
    }

    @DeleteMapping("/users/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteUser(@PathVariable long id) {
        adminService.deleteUser(id, currentUserProvider.require());
    }

    @DeleteMapping("/shelters/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteShelter(@PathVariable long id) {
        shelterService.deleteShelter(id, currentUserProvider.require());
    }

    @PatchMapping("/shelters/{id}/owner")
    ShelterDto reassignOwner(@PathVariable long id, @Valid @RequestBody UpdateOwnerRequest request) {
        return shelterService.reassignOwner(id, request.ownerId());
    }

    @PostMapping("/db/reset")
    Map<String, String> resetDatabase() {
        databaseSeedService.reset();
        return Map.of("status", "OK", "message", "Baza zostala zresetowana i wypelniona danymi testowymi.");
    }
}

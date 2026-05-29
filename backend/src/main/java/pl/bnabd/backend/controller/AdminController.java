package pl.bnabd.backend.controller;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.bnabd.backend.dto.StatsResponse;
import pl.bnabd.backend.service.AdminService;
import pl.bnabd.backend.service.DatabaseSeedService;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final DatabaseSeedService databaseSeedService;

    public AdminController(AdminService adminService, DatabaseSeedService databaseSeedService) {
        this.adminService = adminService;
        this.databaseSeedService = databaseSeedService;
    }

    @GetMapping("/stats")
    StatsResponse stats() {
        return adminService.stats();
    }

    @PostMapping("/db/reset")
    Map<String, String> resetDatabase() {
        databaseSeedService.reset();
        return Map.of("status", "OK", "message", "Baza zostala zresetowana i wypelniona danymi testowymi.");
    }
}

package pl.bnabd.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pl.bnabd.backend.dto.RoomDto;
import pl.bnabd.backend.dto.ShelterDto;
import pl.bnabd.backend.service.ShelterService;

@RestController
@RequestMapping("/api/shelters")
public class ShelterController {

    private final ShelterService shelterService;

    public ShelterController(ShelterService shelterService) {
        this.shelterService = shelterService;
    }

    @GetMapping
    List<ShelterDto> listShelters(@RequestParam(required = false) String location) {
        return shelterService.findAll(location);
    }

    @GetMapping("/{id}")
    ShelterDto getShelter(@PathVariable long id) {
        return shelterService.findById(id);
    }

    @GetMapping("/{id}/rooms")
    List<RoomDto> listRooms(@PathVariable long id) {
        return shelterService.findRooms(id);
    }
}

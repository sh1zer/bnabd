package pl.bnabd.backend.controller;

import jakarta.validation.Valid;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.bnabd.backend.dto.RoomDto;
import pl.bnabd.backend.dto.RoomRequest;
import pl.bnabd.backend.dto.ShelterDto;
import pl.bnabd.backend.dto.ShelterRequest;
import pl.bnabd.backend.service.CurrentUserProvider;
import pl.bnabd.backend.service.ShelterService;

@RestController
@RequestMapping("/api/shelters")
public class ShelterController {

    private final ShelterService shelterService;
    private final CurrentUserProvider currentUserProvider;

    public ShelterController(ShelterService shelterService, CurrentUserProvider currentUserProvider) {
        this.shelterService = shelterService;
        this.currentUserProvider = currentUserProvider;
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

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    ShelterDto createShelter(@Valid @RequestBody ShelterRequest request) {
        return shelterService.createShelter(request, currentUserProvider.require());
    }

    @PutMapping("/{id}")
    ShelterDto updateShelter(@PathVariable long id, @Valid @RequestBody ShelterRequest request) {
        return shelterService.updateShelter(id, request, currentUserProvider.require());
    }

    @PostMapping("/{id}/rooms")
    @ResponseStatus(HttpStatus.CREATED)
    RoomDto createRoom(@PathVariable long id, @Valid @RequestBody RoomRequest request) {
        return shelterService.createRoom(id, request, currentUserProvider.require());
    }

    @PutMapping("/{id}/rooms/{roomId}")
    RoomDto updateRoom(@PathVariable long id, @PathVariable long roomId, @Valid @RequestBody RoomRequest request) {
        return shelterService.updateRoom(id, roomId, request, currentUserProvider.require());
    }

    @DeleteMapping("/{id}/rooms/{roomId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteRoom(@PathVariable long id, @PathVariable long roomId) {
        shelterService.deleteRoom(id, roomId, currentUserProvider.require());
    }
}

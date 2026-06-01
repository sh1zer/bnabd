package pl.bnabd.backend.controller;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pl.bnabd.backend.dto.MenuItemDto;
import pl.bnabd.backend.dto.MenuItemRequest;
import pl.bnabd.backend.service.CurrentUserProvider;
import pl.bnabd.backend.service.MenuItemService;

@RestController
@RequestMapping("/api/shelters/{shelterId}/menu")
public class MenuItemController {

    private final MenuItemService menuItemService;
    private final CurrentUserProvider currentUserProvider;

    public MenuItemController(MenuItemService menuItemService, CurrentUserProvider currentUserProvider) {
        this.menuItemService = menuItemService;
        this.currentUserProvider = currentUserProvider;
    }

    @GetMapping
    public List<MenuItemDto> list(@PathVariable long shelterId) {
        return menuItemService.findByShelter(shelterId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MenuItemDto add(@PathVariable long shelterId, @Valid @RequestBody MenuItemRequest request) {
        return menuItemService.add(shelterId, request, currentUserProvider.require());
    }

    @DeleteMapping("/{itemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long shelterId, @PathVariable long itemId) {
        menuItemService.delete(shelterId, itemId, currentUserProvider.require());
    }
}

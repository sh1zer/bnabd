package pl.bnabd.backend.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.bnabd.backend.dto.MenuItemDto;
import pl.bnabd.backend.dto.MenuItemRequest;
import pl.bnabd.backend.exception.ForbiddenException;
import pl.bnabd.backend.exception.NotFoundException;
import pl.bnabd.backend.model.AppUser;
import pl.bnabd.backend.model.MenuItem;
import pl.bnabd.backend.model.Shelter;
import pl.bnabd.backend.model.UserRole;
import pl.bnabd.backend.repository.MenuItemRepository;
import pl.bnabd.backend.repository.ShelterRepository;

@Service
@Transactional(readOnly = true)
public class MenuItemService {

    private final MenuItemRepository menuItemRepository;
    private final ShelterRepository shelterRepository;

    public MenuItemService(MenuItemRepository menuItemRepository, ShelterRepository shelterRepository) {
        this.menuItemRepository = menuItemRepository;
        this.shelterRepository = shelterRepository;
    }

    public List<MenuItemDto> findByShelter(long shelterId) {
        getShelter(shelterId);
        return menuItemRepository.findByShelterId(shelterId).stream().map(this::toDto).toList();
    }

    @Transactional
    public MenuItemDto add(long shelterId, MenuItemRequest request, AppUser currentUser) {
        Shelter shelter = getShelter(shelterId);
        assertCanManage(shelter, currentUser);
        MenuItem item = new MenuItem();
        item.setShelter(shelter);
        apply(item, request);
        return toDto(menuItemRepository.save(item));
    }

    @Transactional
    public void delete(long shelterId, long itemId, AppUser currentUser) {
        Shelter shelter = getShelter(shelterId);
        assertCanManage(shelter, currentUser);
        MenuItem item = menuItemRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Nie znaleziono pozycji menu o id " + itemId + "."));
        if (!item.getShelter().getId().equals(shelterId)) {
            throw new NotFoundException("Pozycja menu nie należy do tego schroniska.");
        }
        menuItemRepository.delete(item);
    }

    private Shelter getShelter(long shelterId) {
        return shelterRepository.findById(shelterId)
                .orElseThrow(() -> new NotFoundException("Nie znaleziono schroniska o id " + shelterId + "."));
    }

    private void assertCanManage(Shelter shelter, AppUser user) {
        if (user.getRole() == UserRole.ADMIN) return;
        if (shelter.getOwner() == null || !shelter.getOwner().getId().equals(user.getId())) {
            throw new ForbiddenException("Nie zarządzasz tym schroniskiem.");
        }
    }

    private void apply(MenuItem item, MenuItemRequest r) {
        item.setName(r.name());
        item.setDescription(r.description());
        item.setPrice(r.price());
        item.setCategory(r.category());
    }

    private MenuItemDto toDto(MenuItem item) {
        return new MenuItemDto(
                item.getId(),
                item.getShelter().getId(),
                item.getShelter().getName(),
                item.getName(),
                item.getDescription(),
                item.getPrice(),
                item.getCategory());
    }
}

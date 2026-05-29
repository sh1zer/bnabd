package pl.bnabd.backend.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.bnabd.backend.dto.RoomDto;
import pl.bnabd.backend.dto.ShelterDto;
import pl.bnabd.backend.exception.NotFoundException;
import pl.bnabd.backend.model.Room;
import pl.bnabd.backend.model.Shelter;
import pl.bnabd.backend.repository.RoomRepository;
import pl.bnabd.backend.repository.ShelterRepository;

@Service
@Transactional(readOnly = true)
public class ShelterService {

    private final ShelterRepository shelterRepository;
    private final RoomRepository roomRepository;

    public ShelterService(ShelterRepository shelterRepository, RoomRepository roomRepository) {
        this.shelterRepository = shelterRepository;
        this.roomRepository = roomRepository;
    }

    public List<ShelterDto> findAll(String location) {
        List<Shelter> shelters = (location == null || location.isBlank())
                ? shelterRepository.findAll()
                : shelterRepository.findByLocationContainingIgnoreCase(location);

        return shelters.stream().map(this::toDto).toList();
    }

    public ShelterDto findById(long id) {
        return toDto(findEntityById(id));
    }

    public Shelter findEntityById(long id) {
        return shelterRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Nie znaleziono schroniska o id " + id + "."));
    }

    public Room findRoomById(long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Nie znaleziono pokoju o id " + id + "."));
    }

    public List<RoomDto> findRooms(long shelterId) {
        findEntityById(shelterId);
        return roomRepository.findByShelterId(shelterId).stream().map(this::toDto).toList();
    }

    private ShelterDto toDto(Shelter shelter) {
        List<Room> rooms = roomRepository.findByShelterId(shelter.getId());
        int beds = rooms.stream().mapToInt(Room::getCapacity).sum();
        String price = rooms.stream()
                .map(Room::getPricePerNight)
                .min(java.math.BigDecimal::compareTo)
                .map(pricePerNight -> pricePerNight.stripTrailingZeros().toPlainString() + " zl")
                .orElse("-");

        return new ShelterDto(
                shelter.getId(),
                shelter.getOwner() == null ? null : shelter.getOwner().getId(),
                shelter.getName(),
                shelter.getDescription(),
                shelter.getLocation(),
                shelter.getPhone(),
                shelter.getEmail(),
                shelter.getImageUrl(),
                shelter.getRating(),
                beds,
                price);
    }

    private RoomDto toDto(Room room) {
        return new RoomDto(
                room.getId(),
                room.getShelter().getId(),
                room.getShelter().getName(),
                room.getName(),
                room.getCapacity(),
                room.getPricePerNight());
    }
}

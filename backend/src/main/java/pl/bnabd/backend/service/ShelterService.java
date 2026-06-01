package pl.bnabd.backend.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.bnabd.backend.dto.RoomAvailabilityDto;
import pl.bnabd.backend.dto.RoomDto;
import pl.bnabd.backend.dto.RoomRequest;
import pl.bnabd.backend.dto.ShelterDto;
import pl.bnabd.backend.dto.ShelterRequest;
import pl.bnabd.backend.exception.ForbiddenException;
import pl.bnabd.backend.exception.NotFoundException;
import java.time.LocalDate;
import pl.bnabd.backend.model.AppUser;
import pl.bnabd.backend.model.Room;
import pl.bnabd.backend.model.Shelter;
import pl.bnabd.backend.model.UserRole;
import pl.bnabd.backend.repository.ReservationRepository;
import pl.bnabd.backend.repository.ReviewRepository;
import pl.bnabd.backend.repository.RoomRepository;
import pl.bnabd.backend.repository.ShelterRepository;
import pl.bnabd.backend.repository.UserRepository;

@Service
@Transactional(readOnly = true)
public class ShelterService {

    private final ShelterRepository shelterRepository;
    private final RoomRepository roomRepository;
    private final ReservationRepository reservationRepository;
    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;

    public ShelterService(
            ShelterRepository shelterRepository,
            RoomRepository roomRepository,
            ReservationRepository reservationRepository,
            ReviewRepository reviewRepository,
            UserRepository userRepository) {
        this.shelterRepository = shelterRepository;
        this.roomRepository = roomRepository;
        this.reservationRepository = reservationRepository;
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
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

    public List<RoomAvailabilityDto> findRoomsWithAvailability(long shelterId, LocalDate startDate, LocalDate endDate) {
        findEntityById(shelterId);
        return roomRepository.findByShelterId(shelterId).stream()
                .map(room -> {
                    boolean occupied = reservationRepository.existsOverlapping(room.getId(), startDate, endDate);
                    return new RoomAvailabilityDto(
                            room.getId(),
                            room.getName(),
                            room.getCapacity(),
                            room.getPricePerNight(),
                            !occupied);
                })
                .toList();
    }

    @Transactional
    public ShelterDto createShelter(ShelterRequest request, AppUser currentUser) {
        Shelter shelter = new Shelter();
        shelter.setOwner(currentUser);
        apply(shelter, request);
        return toDto(shelterRepository.save(shelter));
    }

    @Transactional
    public ShelterDto updateShelter(long id, ShelterRequest request, AppUser currentUser) {
        Shelter shelter = findEntityById(id);
        assertCanManage(shelter, currentUser);
        apply(shelter, request);
        return toDto(shelter);
    }

    @Transactional
    public RoomDto createRoom(long shelterId, RoomRequest request, AppUser currentUser) {
        Shelter shelter = findEntityById(shelterId);
        assertCanManage(shelter, currentUser);
        Room room = new Room();
        room.setShelter(shelter);
        apply(room, request);
        return toDto(roomRepository.save(room));
    }

    @Transactional
    public RoomDto updateRoom(long shelterId, long roomId, RoomRequest request, AppUser currentUser) {
        Room room = findRoomOfShelter(shelterId, roomId);
        assertCanManage(room.getShelter(), currentUser);
        apply(room, request);
        return toDto(room);
    }

    @Transactional
    public void deleteRoom(long shelterId, long roomId, AppUser currentUser) {
        Room room = findRoomOfShelter(shelterId, roomId);
        assertCanManage(room.getShelter(), currentUser);
        // Bookings reference the room, so clear them before removing it.
        reservationRepository.deleteByRoomId(room.getId());
        roomRepository.delete(room);
    }

    @Transactional
    public void deleteShelter(long id, AppUser currentUser) {
        Shelter shelter = findEntityById(id);
        assertCanManage(shelter, currentUser);
        // FK-safe teardown: bookings -> reviews -> rooms -> shelter.
        reservationRepository.deleteByRoom_Shelter_Id(id);
        reviewRepository.deleteByShelterId(id);
        roomRepository.deleteByShelterId(id);
        shelterRepository.delete(shelter);
    }

    @Transactional
    public ShelterDto reassignOwner(long id, long ownerId) {
        Shelter shelter = findEntityById(id);
        AppUser owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new NotFoundException("Nie znaleziono uzytkownika o id " + ownerId + "."));
        if (owner.getRole() == UserRole.USER) {
            throw new IllegalArgumentException("Wlascicielem schroniska moze byc tylko HOST lub ADMIN.");
        }
        shelter.setOwner(owner);
        return toDto(shelter);
    }

    private Room findRoomOfShelter(long shelterId, long roomId) {
        Room room = findRoomById(roomId);
        if (!room.getShelter().getId().equals(shelterId)) {
            throw new NotFoundException("Pokoj o id " + roomId + " nie nalezy do schroniska " + shelterId + ".");
        }
        return room;
    }

    private void assertCanManage(Shelter shelter, AppUser currentUser) {
        if (currentUser.getRole() == UserRole.ADMIN) {
            return;
        }
        AppUser owner = shelter.getOwner();
        if (owner == null || !owner.getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Nie zarzadzasz tym schroniskiem.");
        }
    }

    private void apply(Shelter shelter, ShelterRequest request) {
        shelter.setName(request.name());
        shelter.setDescription(request.description());
        shelter.setLocation(request.location());
        shelter.setPhone(request.phone());
        shelter.setEmail(request.email());
        shelter.setImageUrl(request.imageUrl());
    }

    private void apply(Room room, RoomRequest request) {
        room.setName(request.name());
        room.setCapacity(request.capacity());
        room.setPricePerNight(request.pricePerNight());
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

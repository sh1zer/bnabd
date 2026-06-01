package pl.bnabd.backend;

import java.math.BigDecimal;
import java.time.LocalDate;
import org.springframework.test.util.ReflectionTestUtils;
import pl.bnabd.backend.model.AppUser;
import pl.bnabd.backend.model.Reservation;
import pl.bnabd.backend.model.ReservationStatus;
import pl.bnabd.backend.model.Room;
import pl.bnabd.backend.model.RoomType;
import pl.bnabd.backend.model.Shelter;
import pl.bnabd.backend.model.UserRole;

/**
 * Builders for fully-wired domain objects with ids set (the entities have no id setter, so tests
 * assign it reflectively). Used by the service-layer unit tests.
 */
public final class TestFixtures {

    private TestFixtures() {
    }

    public static AppUser user(long id, String login, UserRole role) {
        AppUser user = new AppUser(login, login + "@example.com", "hashed", role);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    public static Shelter shelter(long id, AppUser owner) {
        Shelter shelter = new Shelter();
        ReflectionTestUtils.setField(shelter, "id", id);
        shelter.setOwner(owner);
        shelter.setName("Schronisko " + id);
        shelter.setLocation("Tatry");
        return shelter;
    }

    public static Room room(long id, Shelter shelter, int capacity, String pricePerNight) {
        return room(id, shelter, capacity, RoomType.WHOLE, pricePerNight);
    }

    public static Room room(long id, Shelter shelter, int capacity, RoomType roomType, String pricePerNight) {
        Room room = new Room();
        ReflectionTestUtils.setField(room, "id", id);
        room.setShelter(shelter);
        room.setName("Pokoj " + id);
        room.setCapacity(capacity);
        room.setRoomType(roomType);
        room.setPricePerNight(new BigDecimal(pricePerNight));
        return room;
    }

    public static Reservation reservation(long id, AppUser guest, Room room, ReservationStatus status) {
        Reservation reservation = new Reservation();
        ReflectionTestUtils.setField(reservation, "id", id);
        reservation.setUser(guest);
        reservation.setRoom(room);
        reservation.setStartDate(LocalDate.of(2026, 1, 1));
        reservation.setEndDate(LocalDate.of(2026, 1, 3));
        reservation.setGuestCount(2);
        reservation.setTotalPrice(new BigDecimal("200.00"));
        reservation.setStatus(status);
        return reservation;
    }
}

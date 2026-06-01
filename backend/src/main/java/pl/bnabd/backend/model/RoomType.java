package pl.bnabd.backend.model;

/**
 * WHOLE — the room is rented as a unit: one overlapping booking blocks it for everyone and the
 * price is flat per night. SHARED — a dormitory sold by the slot: guests share the room on
 * overlapping dates up to capacity and the price scales with the number of guests.
 */
public enum RoomType {
    WHOLE,
    SHARED
}

package pl.bnabd.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static pl.bnabd.backend.TestFixtures.shelter;
import static pl.bnabd.backend.TestFixtures.user;

import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import pl.bnabd.backend.dto.ShelterDto;
import pl.bnabd.backend.dto.ShelterRequest;
import pl.bnabd.backend.exception.ForbiddenException;
import pl.bnabd.backend.model.AppUser;
import pl.bnabd.backend.model.Shelter;
import pl.bnabd.backend.model.UserRole;
import pl.bnabd.backend.repository.ReservationRepository;
import pl.bnabd.backend.repository.ReviewRepository;
import pl.bnabd.backend.repository.RoomRepository;
import pl.bnabd.backend.repository.ShelterRepository;
import pl.bnabd.backend.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class ShelterServiceTest {

    @Mock
    ShelterRepository shelterRepository;

    @Mock
    RoomRepository roomRepository;

    @Mock
    ReservationRepository reservationRepository;

    @Mock
    ReviewRepository reviewRepository;

    @Mock
    UserRepository userRepository;

    @InjectMocks
    ShelterService shelterService;

    private final AppUser host = user(2, "host", UserRole.HOST);

    // host -> create shelter -> owner = host
    @Test
    void createShelterAssignsCurrentUserAsOwner() {
        when(shelterRepository.save(any(Shelter.class))).thenAnswer(call -> {
            Shelter saved = call.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 5L);
            return saved;
        });
        when(roomRepository.findByShelterId(5L)).thenReturn(List.of());

        ShelterRequest request = new ShelterRequest("Nowe", "opis", "Tatry", "123", "a@b.pl", null);
        ShelterDto dto = shelterService.createShelter(request, host);

        assertThat(dto.ownerId()).isEqualTo(2L);
        assertThat(dto.name()).isEqualTo("Nowe");
    }

    // owner -> delete own shelter -> deleted
    @Test
    void ownerCanDeleteOwnShelter() {
        Shelter shelter = shelter(10, host);
        when(shelterRepository.findById(10L)).thenReturn(Optional.of(shelter));

        shelterService.deleteShelter(10L, host);

        verify(shelterRepository).delete(shelter);
    }

    // host who doesn't own the shelter -> delete shelter -> forbidden
    @Test
    void nonOwnerHostCannotDeleteShelter() {
        Shelter shelter = shelter(10, host);
        when(shelterRepository.findById(10L)).thenReturn(Optional.of(shelter));
        AppUser otherHost = user(7, "host2", UserRole.HOST);

        assertThatThrownBy(() -> shelterService.deleteShelter(10L, otherHost))
                .isInstanceOf(ForbiddenException.class);
        verify(shelterRepository, never()).delete(any());
    }

    // admin -> delete any shelter -> deleted
    @Test
    void adminCanDeleteAnyShelter() {
        Shelter shelter = shelter(10, host);
        when(shelterRepository.findById(10L)).thenReturn(Optional.of(shelter));
        AppUser admin = user(3, "admin", UserRole.ADMIN);

        shelterService.deleteShelter(10L, admin);

        verify(shelterRepository).delete(shelter);
    }
}

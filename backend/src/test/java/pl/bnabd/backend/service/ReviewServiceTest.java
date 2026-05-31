package pl.bnabd.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static pl.bnabd.backend.TestFixtures.shelter;
import static pl.bnabd.backend.TestFixtures.user;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pl.bnabd.backend.dto.CreateReviewRequest;
import pl.bnabd.backend.dto.ReviewDto;
import pl.bnabd.backend.exception.ForbiddenException;
import pl.bnabd.backend.model.AppUser;
import pl.bnabd.backend.model.Review;
import pl.bnabd.backend.model.Shelter;
import pl.bnabd.backend.model.UserRole;
import pl.bnabd.backend.repository.ReservationRepository;
import pl.bnabd.backend.repository.ReviewRepository;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    ReviewRepository reviewRepository;

    @Mock
    ReservationRepository reservationRepository;

    @Mock
    ShelterService shelterService;

    @InjectMocks
    ReviewService reviewService;

    private final AppUser guest = user(1, "user", UserRole.USER);
    private final Shelter shelter = shelter(10, user(2, "host", UserRole.HOST));

    // guest with a completed stay -> create review -> saved
    @Test
    void guestWithCompletedStayCanReview() {
        when(shelterService.findEntityById(10L)).thenReturn(shelter);
        when(reservationRepository.existsCompletedStay(eq(1L), eq(10L), any(LocalDate.class)))
                .thenReturn(true);
        when(reviewRepository.save(any(Review.class))).thenAnswer(call -> call.getArgument(0));

        CreateReviewRequest request = new CreateReviewRequest(10L, 5, "Swietne miejsce");
        ReviewDto dto = reviewService.create(request, guest);

        assertThat(dto.rating()).isEqualTo(5);
        assertThat(dto.shelterId()).isEqualTo(10L);
        assertThat(dto.userId()).isEqualTo(1L);
    }

    // guest with no completed stay -> create review -> forbidden
    @Test
    void guestWithoutCompletedStayCannotReview() {
        when(shelterService.findEntityById(10L)).thenReturn(shelter);
        when(reservationRepository.existsCompletedStay(eq(1L), eq(10L), any(LocalDate.class)))
                .thenReturn(false);

        CreateReviewRequest request = new CreateReviewRequest(10L, 5, "Nie bylem tu nigdy");

        assertThatThrownBy(() -> reviewService.create(request, guest))
                .isInstanceOf(ForbiddenException.class);
        verify(reviewRepository, never()).save(any());
    }
}

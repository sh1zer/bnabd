package pl.bnabd.backend.service;

import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.bnabd.backend.dto.CreateReviewRequest;
import pl.bnabd.backend.dto.ReviewDto;
import pl.bnabd.backend.exception.ForbiddenException;
import pl.bnabd.backend.model.AppUser;
import pl.bnabd.backend.model.Review;
import pl.bnabd.backend.model.Shelter;
import pl.bnabd.backend.repository.ReservationRepository;
import pl.bnabd.backend.repository.ReviewRepository;

@Service
@Transactional
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReservationRepository reservationRepository;
    private final ShelterService shelterService;

    public ReviewService(
            ReviewRepository reviewRepository,
            ReservationRepository reservationRepository,
            ShelterService shelterService) {
        this.reviewRepository = reviewRepository;
        this.reservationRepository = reservationRepository;
        this.shelterService = shelterService;
    }

    @Transactional(readOnly = true)
    public List<ReviewDto> findByShelter(long shelterId) {
        return reviewRepository.findByShelterIdOrderByCreatedAtDesc(shelterId).stream().map(this::toDto).toList();
    }

    public ReviewDto create(CreateReviewRequest request, AppUser currentUser) {
        Shelter shelter = shelterService.findEntityById(request.shelterId());

        // Only guests whose stay has already ended may review the shelter.
        if (!reservationRepository.existsCompletedStay(currentUser.getId(), shelter.getId(), LocalDate.now())) {
            throw new ForbiddenException(
                    "Mozesz wystawic opinie tylko dla schroniska, w ktorym Twoj pobyt sie zakonczyl.");
        }

        Review review = new Review();
        review.setUser(currentUser);
        review.setShelter(shelter);
        review.setRating(request.rating());
        review.setComment(request.comment());

        return toDto(reviewRepository.save(review));
    }

    private ReviewDto toDto(Review review) {
        return new ReviewDto(
                review.getId(),
                review.getUser().getId(),
                review.getUser().getLogin(),
                review.getShelter().getId(),
                review.getShelter().getName(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt());
    }
}

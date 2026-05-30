package pl.bnabd.backend.controller;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.bnabd.backend.dto.CreateReviewRequest;
import pl.bnabd.backend.dto.ReviewDto;
import pl.bnabd.backend.service.CurrentUserProvider;
import pl.bnabd.backend.service.ReviewService;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;
    private final CurrentUserProvider currentUserProvider;

    public ReviewController(ReviewService reviewService, CurrentUserProvider currentUserProvider) {
        this.reviewService = reviewService;
        this.currentUserProvider = currentUserProvider;
    }

    @GetMapping("/shelter/{shelterId}")
    List<ReviewDto> listShelterReviews(@PathVariable long shelterId) {
        return reviewService.findByShelter(shelterId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    ReviewDto createReview(@Valid @RequestBody CreateReviewRequest request) {
        return reviewService.create(request, currentUserProvider.require());
    }
}

package pl.bnabd.backend.exception;

import java.time.Instant;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    Map<String, Object> notFound(NotFoundException exception) {
        return error("NOT_FOUND", exception.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    Map<String, Object> badRequest(IllegalArgumentException exception) {
        return error("BAD_REQUEST", exception.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    Map<String, Object> validationError(MethodArgumentNotValidException exception) {
        return error("VALIDATION_ERROR", "Sprawdź poprawność wysłanych danych.");
    }

    private Map<String, Object> error(String code, String message) {
        return Map.of(
                "code", code,
                "message", message,
                "time", Instant.now().toString());
    }
}

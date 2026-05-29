package pl.bnabd.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import pl.bnabd.backend.model.AppUser;
import pl.bnabd.backend.model.UserRole;

@Service
public class JwtService {

    private final String secret;
    private final ObjectMapper objectMapper;

    public JwtService(@Value("${app.jwt.secret}") String secret, ObjectMapper objectMapper) {
        this.secret = secret;
        this.objectMapper = objectMapper;
    }

    public String createToken(AppUser user) {
        try {
            String header = encodeJson(Map.of("alg", "HS256", "typ", "JWT"));
            String payload = encodeJson(Map.of(
                    "sub", user.getLogin(),
                    "uid", user.getId(),
                    "role", user.getRole().name(),
                    "exp", Instant.now().plusSeconds(60 * 60 * 8).getEpochSecond()));
            String unsigned = header + "." + payload;
            return unsigned + "." + sign(unsigned);
        } catch (Exception exception) {
            throw new IllegalStateException("Nie udalo sie utworzyc tokenu JWT.", exception);
        }
    }

    @SuppressWarnings("unchecked")
    public JwtUser parseToken(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                throw new IllegalArgumentException("Nieprawidlowy token JWT.");
            }
            String unsigned = parts[0] + "." + parts[1];
            if (!sign(unsigned).equals(parts[2])) {
                throw new IllegalArgumentException("Nieprawidlowy podpis JWT.");
            }

            Map<String, Object> payload = objectMapper.readValue(
                    Base64.getUrlDecoder().decode(parts[1]),
                    Map.class);
            long expiresAt = ((Number) payload.get("exp")).longValue();
            if (Instant.now().getEpochSecond() > expiresAt) {
                throw new IllegalArgumentException("Token JWT wygasl.");
            }

            return new JwtUser(
                    ((Number) payload.get("uid")).longValue(),
                    (String) payload.get("sub"),
                    UserRole.valueOf((String) payload.get("role")));
        } catch (Exception exception) {
            throw new IllegalArgumentException("Nieprawidlowy token JWT.", exception);
        }
    }

    public record JwtUser(Long userId, String login, UserRole role) {
    }

    private String encodeJson(Map<String, Object> value) throws Exception {
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(objectMapper.writeValueAsBytes(value));
    }

    private String sign(String value) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
    }
}

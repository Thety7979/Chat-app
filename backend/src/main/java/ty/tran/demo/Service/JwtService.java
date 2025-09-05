package ty.tran.demo.Service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {

    @Value("${jwt.secret:default-secret-key}")
    private String secretKey;

    @Value("${jwt.expiration:86400000}")
    private long jwtExpiration;

    @Value("${jwt.refresh-expiration:604800000}")
    private long refreshExpiration;

    public String extractUsername(String token) {
        // Simple token parsing for now
        try {
            String[] parts = token.split("\\.");
            if (parts.length == 3) {
                String payload = new String(Base64.getDecoder().decode(parts[1]));
                System.out.println("DEBUG - Token payload: " + payload); // Debug log
                
                // Extract email from payload (simple approach)
                if (payload.contains("email=")) {
                    int start = payload.indexOf("email=") + 6;
                    int end = payload.indexOf(",", start);
                    if (end == -1) end = payload.indexOf("}", start);
                    if (end > start) {
                        String email = payload.substring(start, end);
                        System.out.println("DEBUG - Extracted email: " + email); // Debug log
                        return email;
                    }
                }
                
                // Fallback: try to extract from "sub=" field
                if (payload.contains("sub=")) {
                    int start = payload.indexOf("sub=") + 4;
                    int end = payload.indexOf(",", start);
                    if (end == -1) end = payload.indexOf("}", start);
                    if (end > start) {
                        String sub = payload.substring(start, end);
                        System.out.println("DEBUG - Extracted sub: " + sub); // Debug log
                        return sub;
                    }
                }
                
                // Additional fallback: try to extract from "sub" field with quotes
                if (payload.contains("\"sub\"")) {
                    int start = payload.indexOf("\"sub\"") + 6;
                    int end = payload.indexOf("\"", start);
                    if (end > start) {
                        String sub = payload.substring(start, end);
                        System.out.println("DEBUG - Extracted sub with quotes: " + sub); // Debug log
                        return sub;
                    }
                }
                
                // Additional fallback: try to extract from "email" field with quotes
                if (payload.contains("\"email\"")) {
                    int start = payload.indexOf("\"email\"") + 8;
                    int end = payload.indexOf("\"", start);
                    if (end > start) {
                        String email = payload.substring(start, end);
                        System.out.println("DEBUG - Extracted email with quotes: " + email); // Debug log
                        return email;
                    }
                }
            } else {
                System.out.println("DEBUG - Token has " + parts.length + " parts, expected 3"); // Debug log
            }
        } catch (Exception e) {
            System.out.println("DEBUG - Error extracting username: " + e.getMessage()); // Debug log
            // Ignore parsing errors
        }
        return null;
    }
    
    // Test method to debug token format
    public void debugToken(String token) {
        System.out.println("DEBUG - Full token: " + token);
        try {
            String[] parts = token.split("\\.");
            System.out.println("DEBUG - Token parts count: " + parts.length);
            for (int i = 0; i < parts.length; i++) {
                System.out.println("DEBUG - Part " + i + ": " + parts[i]);
            }
        } catch (Exception e) {
            System.out.println("DEBUG - Error parsing token: " + e.getMessage());
        }
    }

    public String generateToken(String username) {
        return generateToken(new HashMap<>(), username);
    }

    public String generateToken(Map<String, Object> extraClaims, String username) {
        return buildToken(extraClaims, username, jwtExpiration);
    }

    public String generateRefreshToken(String username) {
        // Add unique identifier to prevent duplicate tokens
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("jti", java.util.UUID.randomUUID().toString()); // Unique token ID
        extraClaims.put("nano", System.nanoTime()); // Nano time for additional uniqueness
        return buildToken(extraClaims, username, refreshExpiration);
    }

    private String buildToken(Map<String, Object> claims, String username, long expiration) {
        // Simple token generation for now
        long now = System.currentTimeMillis();
        long expiry = now + expiration;
        
        // Create a simple JWT-like structure
        String header = Base64.getEncoder().encodeToString("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes());
        
        Map<String, Object> payload = new HashMap<>(claims);
        payload.put("sub", username);
        payload.put("iat", now);
        payload.put("exp", expiry);
        payload.put("email", username);
        
        String payloadStr = payload.toString().replace(" ", "");
        String payloadEncoded = Base64.getEncoder().encodeToString(payloadStr.getBytes());
        
        // Simple signature (not cryptographically secure for now)
        String signature = Base64.getEncoder().encodeToString(
            (header + "." + payloadEncoded + secretKey).getBytes()
        );
        
        return header + "." + payloadEncoded + "." + signature;
    }

    public boolean isTokenValid(String token, String username) {
        try {
            String extractedUsername = extractUsername(token);
            boolean usernameMatch = username.equals(extractedUsername);
            boolean notExpired = !isTokenExpired(token);
            System.out.println("DEBUG - Token validation: username=" + username + ", extracted=" + extractedUsername + ", match=" + usernameMatch + ", notExpired=" + notExpired);
            return usernameMatch && notExpired;
        } catch (Exception e) {
            System.out.println("DEBUG - Token validation error: " + e.getMessage());
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length == 3) {
                String payload = new String(Base64.getDecoder().decode(parts[1]));
                System.out.println("DEBUG - Checking expiration for payload: " + payload);
                if (payload.contains("exp=")) {
                    int start = payload.indexOf("exp=") + 4;
                    int end = payload.indexOf(",", start);
                    if (end == -1) end = payload.indexOf("}", start);
                    String expiryStr = payload.substring(start, end);
                    long expiry = Long.parseLong(expiryStr);
                    long currentTime = System.currentTimeMillis();
                    boolean expired = currentTime > expiry;
                    System.out.println("DEBUG - Token expiry check: current=" + currentTime + ", expiry=" + expiry + ", expired=" + expired);
                    return expired;
                }
            }
        } catch (Exception e) {
            System.out.println("DEBUG - Error checking token expiration: " + e.getMessage());
        }
        return true; // Consider expired if can't parse
    }
}

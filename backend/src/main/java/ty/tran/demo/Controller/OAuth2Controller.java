package ty.tran.demo.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import ty.tran.demo.Service.OAuth2Service;
import ty.tran.demo.Service.JwtService;
import ty.tran.demo.Service.UserService;
import ty.tran.demo.DTO.AuthResponse;
import ty.tran.demo.DTO.UserDTO;
import ty.tran.demo.Entity.User;

import java.util.Map;
import java.net.URLEncoder;
import java.io.UnsupportedEncodingException;
import java.util.HashMap;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

@RestController
@RequestMapping("/oauth2")
@CrossOrigin(origins = "*")
public class OAuth2Controller {

    @Autowired
    private OAuth2Service oauth2Service;
    
    @Autowired
    private JwtService jwtService;
    
    @Autowired
    private UserService userService;

    @Value("${google.oauth2.client-id}")
    private String clientId;

    @Value("${google.oauth2.client-secret}")
    private String clientSecret;

    @Value("${google.oauth2.redirect-uri}")
    private String redirectUri;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleOAuth2(@RequestBody Map<String, String> request) {
        try {
            String code = request.get("code");
            
            String accessToken = exchangeCodeForToken(code);
            
            GoogleUserInfo userInfo = getUserInfoFromGoogle(accessToken);
            
            User user = oauth2Service.processOAuth2User("GOOGLE", userInfo.getId(), userInfo.getEmail(), userInfo.getName(), userInfo.getPicture());
            
            String jwt = jwtService.generateToken(user.getEmail());
            String refreshToken = jwtService.generateRefreshToken(user.getEmail());

            UserDTO userDTO = new UserDTO(
                user.getId().toString(),
                user.getEmail(),
                user.getUsername(),
                user.getDisplayName(),
                user.getAvatarUrl() != null ? user.getAvatarUrl() : "",
                user.getAuthProvider().toString(),
                user.getIsActive()
            );
            
            AuthResponse response = new AuthResponse(jwt, refreshToken, "Bearer", 86400000L, userDTO);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    private String extractAccessTokenFromJson(String jsonResponse) {
        try {
            JsonNode jsonNode = objectMapper.readTree(jsonResponse);
            return jsonNode.get("access_token").asText();
        } catch (Exception e) {
            System.out.println("Error parsing JSON: " + e.getMessage());
            return null;
        }
    }

    @GetMapping("/test-config")
    public ResponseEntity<Map<String, String>> testConfig() {
        Map<String, String> config = new HashMap<>();
        config.put("clientId", clientId);
        config.put("redirectUri", redirectUri);
        config.put("clientSecret", clientSecret != null ? "***" : "null");
        return ResponseEntity.ok(config);
    }

    @GetMapping("/callback/google")
    public ResponseEntity<AuthResponse> googleOAuth2Callback(@RequestParam String code) {
        try {
            System.out.println("=== OAuth2 Callback Debug ===");
            System.out.println("Received code: " + code);
            
            // Exchange authorization code for access token
            System.out.println("About to exchange code for token...");
            String accessToken = exchangeCodeForToken(code);
            System.out.println("Token exchange successful");
            
            // Get user info from Google
            System.out.println("About to get user info from Google...");
            GoogleUserInfo userInfo = getUserInfoFromGoogle(accessToken);
            System.out.println("User info retrieved successfully");
            
            // Process OAuth2 user
            System.out.println("About to call processOAuth2User...");
            User user = oauth2Service.processOAuth2User("GOOGLE", userInfo.getId(), userInfo.getEmail(), userInfo.getName(), userInfo.getPicture());
            System.out.println("User processed successfully: " + user.getEmail());
            System.out.println("User ID: " + user.getId());
            System.out.println("About to generate JWT token...");
            
            // Generate tokens
            String jwt = jwtService.generateToken(user.getEmail());
            System.out.println("JWT token generated successfully");
            
            String refreshToken = jwtService.generateRefreshToken(user.getEmail());
            System.out.println("Refresh token generated successfully");
            
            // Create UserDTO
            System.out.println("Creating UserDTO...");
            UserDTO userDTO = new UserDTO(
                user.getId().toString(),
                user.getEmail(),
                user.getUsername(),
                user.getDisplayName(),
                user.getAvatarUrl() != null ? user.getAvatarUrl() : "",
                user.getAuthProvider().toString(),
                user.getIsActive()
            );
            System.out.println("UserDTO created successfully");
            
            // Create AuthResponse
            System.out.println("Creating AuthResponse...");
            AuthResponse response = new AuthResponse(jwt, refreshToken, "Bearer", 86400000L, userDTO);
            System.out.println("AuthResponse created successfully");
            
            // Redirect to frontend OAuth2 callback with tokens and user info
            String redirectUrl = String.format(
                "http://localhost:3000/oauth2/callback?token=%s&refreshToken=%s&email=%s",
                response.getToken(),
                response.getRefreshToken(),
                userDTO.getEmail()
            );
            
            System.out.println("Redirecting to: " + redirectUrl);
            
            return ResponseEntity.status(302)
                .header("Location", redirectUrl)
                .build();
        } catch (Exception e) {
            System.out.println("Error in OAuth2 callback: " + e.getMessage());
            e.printStackTrace();
            // Redirect to frontend with error
            String redirectUrl = "http://localhost:3000/oauth2/callback?error=login_failed";
            return ResponseEntity.status(302)
                .header("Location", redirectUrl)
                .build();
        }
    }

    private String exchangeCodeForToken(String code) {
        String tokenUrl = "https://oauth2.googleapis.com/token";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        
        String body = String.format(
            "client_id=%s&client_secret=%s&code=%s&grant_type=authorization_code&redirect_uri=%s",
            clientId, clientSecret, code, redirectUri
        );
        
        System.out.println("=== OAuth2 Debug ===");
        System.out.println("Token URL: " + tokenUrl);
        System.out.println("Client ID: " + clientId);
        System.out.println("Redirect URI: " + redirectUri);
        System.out.println("Code: " + code);
        System.out.println("Request body: " + body);
        
        HttpEntity<String> request = new HttpEntity<>(body, headers);
        
        // Get response from Google
        ResponseEntity<String> rawResponse = restTemplate.postForEntity(tokenUrl, request, String.class);
        System.out.println("Raw Response Status: " + rawResponse.getStatusCode());
        System.out.println("Raw Response Body: " + rawResponse.getBody());
        
        if (rawResponse.getStatusCode() == HttpStatus.OK && rawResponse.getBody() != null) {
            // Parse JSON manually to extract access token
            String jsonResponse = rawResponse.getBody();
            System.out.println("Parsing JSON response: " + jsonResponse);
            
            // Extract access_token from JSON
            String accessToken = extractAccessTokenFromJson(jsonResponse);
            if (accessToken != null) {
                System.out.println("Successfully extracted access token: " + accessToken);
                return accessToken;
            } else {
                throw new RuntimeException("Failed to extract access token from JSON response");
            }
        } else {
            System.out.println("Token exchange failed!");
            System.out.println("Status: " + rawResponse.getStatusCode());
            System.out.println("Body: " + rawResponse.getBody());
            throw new RuntimeException("Failed to exchange code for token");
        }
    }

    private GoogleUserInfo getUserInfoFromGoogle(String accessToken) {
        String userInfoUrl = "https://www.googleapis.com/oauth2/v2/userinfo";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        
        System.out.println("=== User Info Debug ===");
        System.out.println("User Info URL: " + userInfoUrl);
        System.out.println("Access Token: " + accessToken);
        System.out.println("Headers: " + headers);
        
        HttpEntity<String> request = new HttpEntity<>(headers);
        
        ResponseEntity<GoogleUserInfo> response = restTemplate.exchange(
            userInfoUrl, 
            HttpMethod.GET, 
            request, 
            GoogleUserInfo.class
        );
        
        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            System.out.println("User info successful!");
            System.out.println("User ID: " + response.getBody().getId());
            System.out.println("User Email: " + response.getBody().getEmail());
            System.out.println("User Name: " + response.getBody().getName());
            return response.getBody();
        } else {
            System.out.println("User info failed!");
            System.out.println("Status: " + response.getStatusCode());
            System.out.println("Body: " + response.getBody());
            throw new RuntimeException("Failed to get user info from Google");
        }
    }

    // Inner classes for Google API responses
    public static class GoogleTokenResponse {
        @JsonProperty("access_token")
        private String access_token;
        
        @JsonProperty("token_type")
        private String token_type;
        
        @JsonProperty("expires_in")
        private int expires_in;
        
        @JsonProperty("refresh_token")
        private String refresh_token;
        
        @JsonProperty("scope")
        private String scope;

        // Getters and setters
        public String getAccessToken() { return access_token; }
        public void setAccessToken(String access_token) { this.access_token = access_token; }
        public String getTokenType() { return token_type; }
        public void setTokenType(String token_type) { this.token_type = token_type; }
        public int getExpiresIn() { return expires_in; }
        public void setExpiresIn(int expires_in) { this.expires_in = expires_in; }
        public String getRefreshToken() { return refresh_token; }
        public void setRefreshToken(String refresh_token) { this.refresh_token = refresh_token; }
        public String getScope() { return scope; }
        public void setScope(String scope) { this.scope = scope; }

        @Override
        public String toString() {
            return String.format("GoogleTokenResponse{access_token='%s', token_type='%s', expires_in=%d, refresh_token='%s', scope='%s'}", 
                access_token, token_type, expires_in, refresh_token, scope);
        }
    }

    public static class GoogleUserInfo {
        private String id;
        private String email;
        private String name;
        private String picture;
        private String given_name;
        private String family_name;
        private boolean email_verified;

        // Getters and setters
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getPicture() { return picture; }
        public void setPicture(String picture) { this.picture = picture; }
        public String getGivenName() { return given_name; }
        public void setGivenName(String given_name) { this.given_name = given_name; }
        public String getFamilyName() { return family_name; }
        public void setFamilyName(String family_name) { this.family_name = family_name; }
        public boolean isEmailVerified() { return email_verified; }
        public void setEmailVerified(boolean email_verified) { this.email_verified = email_verified; }
    }
}

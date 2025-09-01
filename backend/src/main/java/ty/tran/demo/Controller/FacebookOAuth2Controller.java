package ty.tran.demo.Controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import ty.tran.demo.DTO.AuthResponse;
import ty.tran.demo.DTO.UserDTO;
import ty.tran.demo.Entity.User;
import ty.tran.demo.Service.JwtService;
import ty.tran.demo.Service.OAuth2Service;

@RestController
@RequestMapping("/oauth2")
@CrossOrigin(origins = "*")
public class FacebookOAuth2Controller {

    @Value("${facebook.oauth2.client-id}")
    private String clientId;

    @Value("${facebook.oauth2.client-secret}")
    private String clientSecret;

    @Value("${facebook.oauth2.redirect-uri}")
    private String redirectUri;

    @Autowired
    private OAuth2Service oauth2Service;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private RestTemplate restTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping("/callback/facebook")
    public ResponseEntity<AuthResponse> facebookOAuth2Callback(@RequestParam String code) {
        try {
            System.out.println("=== Facebook OAuth2 Callback Debug ===");
            System.out.println("Received code: " + code);
            
            // Exchange authorization code for access token
            System.out.println("About to exchange code for token...");
            String accessToken = exchangeCodeForToken(code);
            System.out.println("Token exchange successful");
            
            // Get user info from Facebook
            System.out.println("About to get user info from Facebook...");
            FacebookUserInfo userInfo = getUserInfoFromFacebook(accessToken);
            System.out.println("User info retrieved successfully");
            
            // Process OAuth2 user
            System.out.println("About to call processOAuth2User...");
            User user = oauth2Service.processOAuth2User("FACEBOOK", userInfo.getId(), userInfo.getEmail(), userInfo.getName(), userInfo.getPictureUrl());
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
            System.out.println("Error in Facebook OAuth2 callback: " + e.getMessage());
            e.printStackTrace();
            // Redirect to frontend with error
            String redirectUrl = "http://localhost:3000/oauth2/callback?error=login_failed";
            return ResponseEntity.status(302)
                .header("Location", redirectUrl)
                .build();
        }
    }

    private String exchangeCodeForToken(String code) {
        String tokenUrl = "https://graph.facebook.com/v18.0/oauth/access_token";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        
        String body = String.format(
            "client_id=%s&client_secret=%s&code=%s&grant_type=authorization_code&redirect_uri=%s",
            clientId, clientSecret, code, redirectUri
        );
        
        System.out.println("=== Facebook OAuth2 Debug ===");
        System.out.println("Token URL: " + tokenUrl);
        System.out.println("Client ID: " + clientId);
        System.out.println("Redirect URI: " + redirectUri);
        System.out.println("Code: " + code);
        System.out.println("Request body: " + body);
        
        HttpEntity<String> request = new HttpEntity<>(body, headers);
        
        // Get response from Facebook
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

    private FacebookUserInfo getUserInfoFromFacebook(String accessToken) {
        String userInfoUrl = "https://graph.facebook.com/v18.0/me?fields=id,name,email,picture";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        
        System.out.println("=== Facebook User Info Debug ===");
        System.out.println("User Info URL: " + userInfoUrl);
        System.out.println("Access Token: " + accessToken);
        System.out.println("Headers: " + headers);
        
        HttpEntity<String> request = new HttpEntity<>(headers);
        
        ResponseEntity<FacebookUserInfo> response = restTemplate.exchange(
            userInfoUrl, 
            HttpMethod.GET, 
            request, 
            FacebookUserInfo.class
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
            throw new RuntimeException("Failed to get user info from Facebook");
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

    @GetMapping("/test-facebook-config")
    public ResponseEntity<java.util.Map<String, String>> testConfig() {
        java.util.Map<String, String> config = new java.util.HashMap<>();
        config.put("clientId", clientId);
        config.put("redirectUri", redirectUri);
        config.put("clientSecret", clientSecret != null ? "***" : "null");
        return ResponseEntity.ok(config);
    }

    // Inner classes for Facebook API responses
    public static class FacebookUserInfo {
        private String id;
        private String name;
        private String email;
        private Picture picture;

        // Getters and setters
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public Picture getPicture() { return picture; }
        public void setPicture(Picture picture) { this.picture = picture; }
        
        public String getPictureUrl() {
            return picture != null && picture.getData() != null ? picture.getData().getUrl() : null;
        }

        public static class Picture {
            private PictureData data;
            
            public PictureData getData() { return data; }
            public void setData(PictureData data) { this.data = data; }
        }

        public static class PictureData {
            private String url;
            
            public String getUrl() { return url; }
            public void setUrl(String url) { this.url = url; }
        }
    }
}

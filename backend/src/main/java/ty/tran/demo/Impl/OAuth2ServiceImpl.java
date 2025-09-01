package ty.tran.demo.Impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import ty.tran.demo.DTO.AuthResponse;
import ty.tran.demo.DTO.UserDTO;
import ty.tran.demo.Entity.User;
import ty.tran.demo.Entity.User.AuthProvider;
import ty.tran.demo.Service.JwtService;
import ty.tran.demo.Service.OAuth2Service;
import ty.tran.demo.Service.RefreshTokenService;
import ty.tran.demo.Service.UserService;

import java.time.Instant;
import java.util.UUID;

@Service
public class OAuth2ServiceImpl implements OAuth2Service {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Override
    @Transactional
    public AuthResponse processOAuth2Login(String provider, String providerId) {
        User user = userService.findByProviderId(providerId);
        
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        // Generate tokens
        String jwt = jwtService.generateToken(user.getEmail());
        String refreshToken = jwtService.generateRefreshToken(user.getEmail());

        UserDTO userDTO = new UserDTO(
            user.getId().toString(),
            user.getEmail(),
            user.getUsername(),
            user.getDisplayName(),
            user.getAvatarUrl(),
            user.getAuthProvider().name(),
            user.getIsActive()
        );

        refreshTokenService.saveRefreshToken(refreshToken, user);

        return new AuthResponse(jwt, refreshToken, "Bearer", 86400000L, userDTO);
    }

    public User processOAuth2User(String provider, String providerId, String email, String name, String picture) {
        System.out.println("=== OAuth2 User Processing Debug ===");
        System.out.println("Provider: " + provider);
        System.out.println("Provider ID: " + providerId);
        System.out.println("Email: " + email);
        System.out.println("Name: " + name);
        
        User user = null;
        
        // First, try to find user by providerId
        try {
            user = userService.findByProviderId(providerId);
            System.out.println("Found user by providerId: " + (user != null ? user.getEmail() : "null"));
        } catch (Exception e) {
            System.out.println("User not found by providerId: " + e.getMessage());
        }
        
        if (user == null) {
            // Try to find user by email
            try {
                user = userService.findByEmail(email);
                System.out.println("Found user by email: " + user.getEmail());
                // Update existing user with OAuth2 info using mergeUser to avoid conflicts
                user = userService.mergeUserWithOAuth2Info(user, providerId, provider, picture);
                System.out.println("Successfully updated existing user");
            } catch (Exception e) {
                System.out.println("User not found by email, creating new user: " + e.getMessage());
                // User not found by email, create new user
                try {
                    user = userService.createUserWithOAuth2Info(email, name, providerId, provider, picture);
                    System.out.println("Successfully created new user: " + user.getEmail());
                } catch (Exception createException) {
                    System.out.println("Create user failed: " + createException.getMessage());
                    createException.printStackTrace();
                    try {
                        // Try to find user again (maybe it was created by another thread)
                        user = userService.findByEmail(email);
                        System.out.println("Found user after failed creation: " + user.getEmail());
                        user = userService.mergeUserWithOAuth2Info(user, providerId, provider, picture);
                        System.out.println("Successfully updated user after failed creation");
                    } catch (Exception findException) {
                        System.out.println("Final attempt failed: " + findException.getMessage());
                        findException.printStackTrace();
                        throw new RuntimeException("Failed to create or update user", findException);
                    }
                }
            }
        }

        System.out.println("Final user: " + (user != null ? user.getEmail() : "null"));
        System.out.println("About to return user from processOAuth2User...");
        try {
            return user;
        } catch (Exception e) {
            System.out.println("Error returning user: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    private String generateUsername(String email) {
        String baseUsername = email.split("@")[0];
        String username = baseUsername;
        int counter = 1;
        
        while (userService.existsByUsername(username)) {
            username = baseUsername + counter;
            counter++;
        }
        
        return username;
    }
}

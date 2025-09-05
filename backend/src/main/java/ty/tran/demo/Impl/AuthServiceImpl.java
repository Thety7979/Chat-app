package ty.tran.demo.Impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import ty.tran.demo.DTO.AuthRequest;
import ty.tran.demo.DTO.AuthResponse;
import ty.tran.demo.DTO.SignupRequest;
import ty.tran.demo.DTO.UserDTO;
import ty.tran.demo.Entity.User;
import ty.tran.demo.Entity.User.AuthProvider;
import ty.tran.demo.Service.AuthService;
import ty.tran.demo.Service.JwtService;
import ty.tran.demo.Service.RefreshTokenService;
import ty.tran.demo.Service.UserService;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthServiceImpl.class);

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserService userService;

    @Autowired
    private RefreshTokenService refreshTokenService;

    // Simple password encoder using SHA-256
    private String encodePassword(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(password.getBytes());
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Password encoding failed", e);
        }
    }

    private boolean matchesPassword(String rawPassword, String encodedPassword) {
        return encodePassword(rawPassword).equals(encodedPassword);
    }

    @Override
    public AuthResponse authenticate(AuthRequest request) {
        // Simple authentication
        User user = userService.findByEmail(request.getEmail());
        
        if (user == null || !matchesPassword(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid email or password");
        }

        // Generate tokens
        String jwt = jwtService.generateToken(user.getEmail());
        String refreshToken = jwtService.generateRefreshToken(user.getEmail());

        UserDTO userDTO = convertToDTO(user);
        refreshTokenService.saveRefreshToken(refreshToken, user);

        return new AuthResponse(jwt, refreshToken, "Bearer", 86400000L, userDTO);
    }

    @Override
    public AuthResponse signup(SignupRequest request) {
        // Check if user already exists
        if (userService.existsByEmail(request.getEmail())) {
            throw new RuntimeException("User already exists with this email");
        }

        if (userService.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already taken");
        }

        // Create new user
        User user = User.builder()
            .email(request.getEmail())
            .username(request.getUsername())
            .displayName(request.getDisplayName())
            .passwordHash(encodePassword(request.getPassword()))
            .authProvider(AuthProvider.LOCAL)
            .isActive(true)
            .emailVerified(false)
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();

        user = userService.save(user);

        // Generate tokens
        String jwt = jwtService.generateToken(user.getEmail());
        String refreshToken = jwtService.generateRefreshToken(user.getEmail());

        UserDTO userDTO = convertToDTO(user);
        refreshTokenService.saveRefreshToken(refreshToken, user);

        return new AuthResponse(jwt, refreshToken, "Bearer", 86400000L, userDTO);
    }

    @Override
    public AuthResponse refreshToken(String refreshToken) {
        logger.info("Starting token refresh process");
        
        // Debug the token first
        jwtService.debugToken(refreshToken);
        
        // First, try to validate the refresh token and get user from database
        User user = null;
        try {
            user = refreshTokenService.validateRefreshToken(refreshToken);
            logger.info("Successfully validated refresh token for user: {}", user.getEmail());
        } catch (Exception e) {
            logger.warn("Failed to validate refresh token, trying alternative approach: {}", e.getMessage());
            
            // Alternative approach: try to extract username from token
            String username = jwtService.extractUsername(refreshToken);
            if (username != null) {
                user = userService.findByEmail(username);
                if (user != null) {
                    logger.info("Found user by email extraction: {}", user.getEmail());
                } else {
                    logger.error("User not found for email: {}", username);
                    throw new RuntimeException("User not found");
                }
            } else {
                logger.error("Failed to extract username from token");
                throw new RuntimeException("Invalid token format - unable to extract username");
            }
        }
        
        if (user == null) {
            throw new RuntimeException("Unable to determine user from refresh token");
        }
        
        String newJwt = jwtService.generateToken(user.getEmail());
        UserDTO userDTO = convertToDTO(user);

        // Use the new transaction approach to avoid rollback issues
        String actualNewRefreshToken = refreshTokenService.refreshTokenInNewTransaction(refreshToken, user);
        
        // Cleanup old tokens in a separate operation (non-blocking) - don't let it affect the main transaction
        cleanupOldTokensAsync(refreshToken, actualNewRefreshToken, user);
        
        logger.info("Token refresh completed successfully for user: {}", user.getEmail());
        
        // Return the actual new token that was created
        return new AuthResponse(newJwt, actualNewRefreshToken, "Bearer", 86400000L, userDTO);
    }

    @Override
    public boolean checkEmailExists(String email) {
        return userService.existsByEmail(email);
    }
    
    private void cleanupOldTokensAsync(String oldToken, String newToken, User user) {
        // Run cleanup in a separate thread to avoid transaction issues
        new Thread(() -> {
            try {
                Thread.sleep(100); // Small delay to ensure main transaction completes
                refreshTokenService.cleanupOldTokens(oldToken, newToken, user);
            } catch (Exception e) {
                logger.warn("Failed to cleanup old tokens asynchronously: {}", e.getMessage());
            }
        }).start();
    }

    private UserDTO convertToDTO(User user) {
        return UserDTO.builder()
            .id(user.getId().toString())
            .email(user.getEmail())
            .username(user.getUsername())
            .displayName(user.getDisplayName())
            .avatarUrl(user.getAvatarUrl())
            .about(user.getAbout())
            .isActive(user.getIsActive())
            .lastSeenAt(user.getLastSeenAt())
            .createdAt(user.getCreatedAt())
            .build();
    }
}

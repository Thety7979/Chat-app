package ty.tran.demo.Impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import ty.tran.demo.DAO.RefreshTokenDAO;
import ty.tran.demo.Entity.RefreshToken;
import ty.tran.demo.Entity.User;
import ty.tran.demo.Service.RefreshTokenService;
import ty.tran.demo.Service.JwtService;

import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Service
@Transactional
public class RefreshTokenServiceImpl implements RefreshTokenService {

    private static final Logger logger = LoggerFactory.getLogger(RefreshTokenServiceImpl.class);

    @Autowired
    private RefreshTokenDAO refreshTokenDAO;

    @Autowired
    private JwtService jwtService;

    @Override
    @Transactional
    public void saveRefreshToken(String token, User user) {
        // First, check if there's an existing refresh token for this user
        // and update it instead of deleting to avoid transaction issues
        logger.info("Saving refresh token for user: {}", user.getEmail());
        
        // Delete all existing tokens for this user first to handle multiple tokens
        refreshTokenDAO.deleteByUser_Id(user.getId());
        
        // Create new refresh token
        RefreshToken refreshToken = RefreshToken.builder()
            .token(token)
            .user(user)
            .expiryDate(Instant.now().plusSeconds(604800)) // 7 days
            .createdAt(Instant.now())
            .isRevoked(false)
            .build();

        refreshTokenDAO.save(refreshToken);
        logger.info("New refresh token saved successfully for user: {}", user.getEmail());
    }

    @Override
    @Transactional
    public synchronized void updateRefreshToken(String oldToken, String newToken) {
        // Find the existing token and update it instead of deleting
        logger.info("Updating refresh token from old to new");
        
        try {
            RefreshToken existingToken = refreshTokenDAO.findByToken(oldToken)
                .orElseThrow(() -> new RuntimeException("Refresh token not found"));
            
            existingToken.setToken(newToken);
            existingToken.setExpiryDate(Instant.now().plusSeconds(604800)); // 7 days
            existingToken.setIsRevoked(false);
            
            refreshTokenDAO.save(existingToken);
            logger.info("Refresh token updated successfully");
        } catch (RuntimeException e) {
            // If old token not found, it might have been updated by another request
            // In this case, we'll just log it and continue
            logger.warn("Old refresh token not found, might have been updated by another request: {}", e.getMessage());
            // Don't throw exception, just log the warning
        }
    }

    @Override
    @Transactional
    public String refreshTokenSafely(String oldToken, User user) {
        // Safely refresh token by creating a new one and cleaning up old ones
        // This approach avoids race conditions
        logger.info("Safely refreshing token for user: {}", user.getEmail());
        
        // Generate new token using JWT service
        String newToken = jwtService.generateRefreshToken(user.getEmail());
        
        // Delete all existing tokens for this user (including the old one)
        refreshTokenDAO.deleteByUser_Id(user.getId());
        
        // Create new refresh token
        RefreshToken refreshToken = RefreshToken.builder()
            .token(newToken)
            .user(user)
            .expiryDate(Instant.now().plusSeconds(604800)) // 7 days
            .createdAt(Instant.now())
            .isRevoked(false)
            .build();

        refreshTokenDAO.save(refreshToken);
        logger.info("New refresh token created safely for user: {}", user.getEmail());
        
        return newToken;
    }

    @Override
    @Transactional
    public String refreshTokenWithRetry(String oldToken, User user) {
        // Refresh token with retry logic to handle race conditions
        logger.info("Refreshing token with retry for user: {}", user.getEmail());
        
        int maxRetries = 3;
        int retryCount = 0;
        
        while (retryCount < maxRetries) {
            try {
                // Generate new token
                String newToken = jwtService.generateRefreshToken(user.getEmail());
                
                // Create new token first
                RefreshToken refreshToken = RefreshToken.builder()
                    .token(newToken)
                    .user(user)
                    .expiryDate(Instant.now().plusSeconds(604800)) // 7 days
                    .createdAt(Instant.now())
                    .isRevoked(false)
                    .build();

                refreshTokenDAO.save(refreshToken);
                
                // Then try to delete other tokens (including the old one)
                try {
                    refreshTokenDAO.deleteOtherTokensForUser(user.getId(), newToken);
                } catch (Exception e) {
                    // If deletion fails, it's okay - we still have the new token
                    logger.warn("Failed to delete old tokens, but new token was created: {}", e.getMessage());
                }
                
                logger.info("New refresh token created with retry approach for user: {}", user.getEmail());
                return newToken;
                
            } catch (Exception e) {
                retryCount++;
                logger.warn("Attempt {} failed to refresh token: {}", retryCount, e.getMessage());
                
                if (retryCount >= maxRetries) {
                    logger.error("Failed to refresh token after {} attempts", maxRetries);
                    throw new RuntimeException("Failed to refresh token after multiple attempts", e);
                }
                
                // Wait a bit before retrying
                try {
                    Thread.sleep(100 * retryCount); // Exponential backoff
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Interrupted while retrying token refresh", ie);
                }
            }
        }
        
        throw new RuntimeException("Failed to refresh token after all retries");
    }

    @Override
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public String refreshTokenInNewTransaction(String oldToken, User user) {
        // Refresh token in a new transaction to avoid rollback issues
        logger.info("Refreshing token in new transaction for user: {}", user.getEmail());
        
        // Generate new token with unique identifier first
        String newToken = jwtService.generateRefreshToken(user.getEmail());
        
        // Create new token first (this is the main operation that must succeed)
        RefreshToken refreshToken = RefreshToken.builder()
            .token(newToken)
            .user(user)
            .expiryDate(Instant.now().plusSeconds(604800)) // 7 days
            .createdAt(Instant.now())
            .isRevoked(false)
            .build();

        refreshTokenDAO.save(refreshToken);
        logger.info("New token created successfully: {}", newToken);
        
        // Return the new token immediately - cleanup will be done in a separate method
        return newToken;
    }

    @Override
    @Transactional
    public void cleanupExpiredTokens() {
        // Delete all expired tokens to prevent database bloat
        logger.info("Cleaning up expired tokens");
        refreshTokenDAO.deleteExpiredTokens(Instant.now());
        logger.info("Expired tokens cleanup completed");
    }

    @Override
    public User validateRefreshToken(String token) {
        try {
            RefreshToken refreshToken = refreshTokenDAO.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Refresh token not found in database"));

            if (refreshToken.getIsRevoked()) {
                throw new RuntimeException("Refresh token is revoked");
            }

            if (refreshToken.getExpiryDate().isBefore(Instant.now())) {
                throw new RuntimeException("Refresh token has expired");
            }

            return refreshToken.getUser();
        } catch (Exception e) {
            logger.warn("Failed to validate refresh token: {}", e.getMessage());
            throw e;
        }
    }

    @Override
    @Transactional
    public void revokeRefreshToken(String token) {
        RefreshToken refreshToken = refreshTokenDAO.findByToken(token)
            .orElseThrow(() -> new RuntimeException("Invalid refresh token"));

        refreshToken.setIsRevoked(true);
        refreshTokenDAO.save(refreshToken);
    }

    @Override
    @Transactional
    public void revokeAllTokensForUser(User user) {
        // Revoke all refresh tokens for a specific user
        // This is useful for logout or security purposes
        logger.info("Revoking all tokens for user: {}", user.getEmail());
        // Delete all tokens for this user instead of trying to find and update
        refreshTokenDAO.deleteByUser_Id(user.getId());
        logger.info("All tokens revoked for user: {}", user.getEmail());
    }

    @Override
    public boolean hasActiveTokens(User user) {
        // Check if user has any active (non-revoked, non-expired) tokens
        // Since findByUser might return multiple results, we'll use a different approach
        // Since findByUser might return multiple results, we'll use a different approach
        // Check if there are any tokens at all for this user
        try {
            // Try to find any token for the user
            return refreshTokenDAO.findByUser(user).isPresent();
        } catch (Exception e) {
            // If there are multiple tokens, consider it as having active tokens
            // and let the cleanup process handle it
            logger.warn("Multiple tokens found for user: {}, considering as having active tokens", user.getEmail());
            return true;
        }
    }

    @Override
    @Transactional
    public void cleanupAllTokensForUser(User user) {
        // Clean up all tokens for a specific user
        // This is useful for maintenance and fixing data inconsistencies
        logger.info("Cleaning up all tokens for user: {}", user.getEmail());
        refreshTokenDAO.deleteByUser_Id(user.getId());
        logger.info("All tokens cleaned up for user: {}", user.getEmail());
    }

    @Override
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void cleanupOldTokens(String oldToken, String newToken, User user) {
        // Cleanup old tokens in a separate transaction
        logger.info("Cleaning up old tokens for user: {}", user.getEmail());
        
        try {
            // Only delete the specific old token, don't delete other tokens
            Optional<RefreshToken> oldRefreshToken = refreshTokenDAO.findByToken(oldToken);
            if (oldRefreshToken.isPresent()) {
                refreshTokenDAO.delete(oldRefreshToken.get());
                logger.info("Old token deleted successfully");
            } else {
                logger.warn("Old token not found in database");
            }
            
            // Don't delete other tokens to avoid race conditions
            // Let the system keep multiple tokens for a short time
            logger.info("Skipping deletion of other tokens to avoid race conditions");
            
        } catch (Exception e) {
            // If cleanup fails, just log it - the new token is already created
            logger.warn("Failed to cleanup old tokens: {}", e.getMessage());
        }
    }

    @Override
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void cleanupExpiredAndOldTokens() {
        // Cleanup expired tokens and old tokens for all users
        logger.info("Starting cleanup of expired and old tokens");
        
        try {
            // Delete expired tokens
            refreshTokenDAO.deleteExpiredTokens(Instant.now());
            logger.info("Expired tokens cleaned up successfully");
            
            // You can add additional cleanup logic here if needed
            // For example, delete tokens older than 30 days
            
        } catch (Exception e) {
            logger.warn("Failed to cleanup expired tokens: {}", e.getMessage());
        }
    }
}

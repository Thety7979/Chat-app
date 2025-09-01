package ty.tran.demo.Service;

import ty.tran.demo.Entity.User;

public interface RefreshTokenService {
    void saveRefreshToken(String token, User user);
    void updateRefreshToken(String oldToken, String newToken);
    User validateRefreshToken(String token);
    void revokeRefreshToken(String token);
    void revokeAllTokensForUser(User user);
    boolean hasActiveTokens(User user);
    void cleanupExpiredTokens();
    void cleanupAllTokensForUser(User user);
    String refreshTokenSafely(String oldToken, User user);
    String refreshTokenWithRetry(String oldToken, User user);
    String refreshTokenInNewTransaction(String oldToken, User user);
    void cleanupOldTokens(String oldToken, String newToken, User user);
    void cleanupExpiredAndOldTokens();
}

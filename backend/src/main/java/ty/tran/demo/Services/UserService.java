package ty.tran.demo.Services;

import ty.tran.demo.Entity.User;

public interface UserService {
    User findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    User save(User user);
    User findByProviderId(String providerId);
    User mergeUser(User user);
    User mergeUserWithOAuth2Info(User user, String providerId, String provider, String picture);
    User createUserWithOAuth2Info(String email, String name, String providerId, String provider, String picture);
}

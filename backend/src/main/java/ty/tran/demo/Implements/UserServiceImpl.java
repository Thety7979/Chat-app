package ty.tran.demo.Implements;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ty.tran.demo.DAO.UserDAO;
import ty.tran.demo.Entity.User;
import ty.tran.demo.Services.UserService;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    @Autowired
    private UserDAO userDAO;

    @Override
    public User findByEmail(String email) {
        return userDAO.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    public boolean existsByEmail(String email) {
        return userDAO.findByEmail(email).isPresent();
    }

    @Override
    public boolean existsByUsername(String username) {
        return userDAO.findByUsername(username).isPresent();
    }

    @Override
    public User save(User user) {
        return userDAO.save(user);
    }

    @Override
    public User findByProviderId(String providerId) {
        return userDAO.findByProviderId(providerId)
            .orElse(null);
    }

    @Override
    public User mergeUser(User user) {
        // Get fresh user from database and update fields
        User existingUser = findByEmail(user.getEmail());
        existingUser.setProviderId(user.getProviderId());
        existingUser.setAuthProvider(user.getAuthProvider());
        existingUser.setAvatarUrl(user.getAvatarUrl());
        existingUser.setEmailVerified(user.getEmailVerified());
        existingUser.setUpdatedAt(user.getUpdatedAt());
        return userDAO.save(existingUser);
    }

    @Override
    public User mergeUserWithOAuth2Info(User user, String providerId, String provider, String picture) {
        System.out.println("=== Merging User with OAuth2 Info ===");
        System.out.println("Email: " + user.getEmail());
        System.out.println("Provider: " + provider);
        System.out.println("Provider ID: " + providerId);
        System.out.println("Picture: " + picture);
        
        // Get fresh user from database and update OAuth2 fields
        User existingUser = findByEmail(user.getEmail());
        existingUser.setProviderId(providerId);
        existingUser.setAuthProvider(ty.tran.demo.Entity.User.AuthProvider.valueOf(provider.toUpperCase()));
        existingUser.setAvatarUrl(picture);
        existingUser.setEmailVerified(true);
        existingUser.setUpdatedAt(java.time.Instant.now());
        
        System.out.println("Updated avatarUrl to: " + picture);
        User savedUser = userDAO.save(existingUser);
        System.out.println("Saved user avatarUrl: " + savedUser.getAvatarUrl());
        
        return savedUser;
    }

    @Override
    public User createUserWithOAuth2Info(String email, String name, String providerId, String provider, String picture) {
        System.out.println("=== Creating User with OAuth2 Info ===");
        System.out.println("Email: " + email);
        System.out.println("Name: " + name);
        System.out.println("Provider: " + provider);
        System.out.println("Provider ID: " + providerId);
        System.out.println("Picture: " + picture);
        
        // Generate unique username
        String baseUsername = email.split("@")[0];
        String username = baseUsername;
        int counter = 1;
        
        while (existsByUsername(username)) {
            username = baseUsername + counter;
            counter++;
        }
        
        System.out.println("Generated username: " + username);
        
        // Create user without ID first, let Hibernate generate it
        User newUser = User.builder()
            .email(email)
            .username(username)
            .displayName(name)
            .avatarUrl(picture)
            .providerId(providerId)
            .authProvider(ty.tran.demo.Entity.User.AuthProvider.valueOf(provider.toUpperCase()))
            .isActive(true)
            .emailVerified(true)
            .passwordHash("OAUTH2_USER_NO_PASSWORD") // Set a default password for OAuth2 users
            .createdAt(java.time.Instant.now())
            .updatedAt(java.time.Instant.now())
            .build();
        
        System.out.println("User object created, about to save...");
        
        try {
            // Use regular save instead of EntityManager to avoid transaction issues
            User savedUser = userDAO.save(newUser);
            System.out.println("User saved successfully with ID: " + savedUser.getId());
            System.out.println("Saved user avatarUrl: " + savedUser.getAvatarUrl());
            return savedUser;
        } catch (Exception e) {
            System.out.println("Error saving user: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}

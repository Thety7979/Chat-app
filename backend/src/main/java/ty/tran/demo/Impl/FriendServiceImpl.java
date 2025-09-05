package ty.tran.demo.Impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ty.tran.demo.DAO.FriendshipDAO;
import ty.tran.demo.DAO.UserDAO;
import ty.tran.demo.DTO.SearchUserDTO;
import ty.tran.demo.DTO.UserDTO;
import ty.tran.demo.Entity.Friendship;
import ty.tran.demo.Entity.User;
import ty.tran.demo.Service.FriendService;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class FriendServiceImpl implements FriendService {

    private final FriendshipDAO friendshipDAO;
    private final UserDAO userDAO;

    @Override
    @Transactional(readOnly = true)
    public List<UserDTO> getFriends(UUID userId) {
        System.out.println("=== GET FRIENDS DEBUG START ===");
        System.out.println("DEBUG - getFriends: userId=" + userId);
        
        List<Friendship> friendships = friendshipDAO.findFriendshipsByUserId(userId);
        System.out.println("DEBUG - Found " + friendships.size() + " friendships");
        
        List<UserDTO> friends = friendships.stream()
                .map(friendship -> {
                    // Return the friend (the other user in the friendship)
                    User friend = friendship.getUser1().getId().equals(userId) 
                        ? friendship.getUser2() 
                        : friendship.getUser1();
                    System.out.println("DEBUG - Friend: " + friend.getDisplayName() + " (" + friend.getEmail() + ")");
                    return convertToUserDTO(friend);
                })
                .collect(Collectors.toList());
        
        System.out.println("DEBUG - Returning " + friends.size() + " friends");
        System.out.println("=== GET FRIENDS DEBUG END ===");
        return friends;
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDTO> searchFriends(UUID userId, String query) {
        List<Friendship> friendships = friendshipDAO.searchFriendships(userId, query);
        return friendships.stream()
                .map(friendship -> {
                    // Return the friend (the other user in the friendship)
                    User friend = friendship.getUser1().getId().equals(userId) 
                        ? friendship.getUser2() 
                        : friendship.getUser1();
                    return convertToUserDTO(friend);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public long countFriends(UUID userId) {
        return friendshipDAO.countFriendsByUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean areFriends(UUID user1Id, UUID user2Id) {
        return friendshipDAO.areFriends(user1Id, user2Id);
    }

    @Override
    public void removeFriend(UUID userId, UUID friendId) {
        friendshipDAO.findFriendshipBetweenUsers(userId, friendId)
                .ifPresent(friendshipDAO::delete);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SearchUserDTO> searchUsersToAddAsFriends(UUID userId, String query) {
        System.out.println("=== FRIEND SERVICE DEBUG START ===");
        System.out.println("DEBUG - FriendService: Searching users for userId=" + userId + ", query=" + query);
        try {
            // Debug: Check if user exists
            boolean userExists = userDAO.existsById(userId);
            System.out.println("DEBUG - FriendService: Current user exists: " + userExists);
            
            if (!userExists) {
                System.out.println("DEBUG - FriendService: User not found, returning empty list");
                return List.of();
            }
            
            // Debug: Check total users in database
            long totalUsers = userDAO.count();
            System.out.println("DEBUG - FriendService: Total users in database: " + totalUsers);
            
            // Validate query parameter
            if (query == null || query.trim().isEmpty()) {
                System.out.println("DEBUG - FriendService: Empty query, returning empty list");
                return List.of();
            }
            
            System.out.println("DEBUG - FriendService: About to call friendshipDAO.findUsersToAddAsFriends");
            List<User> users = friendshipDAO.findUsersToAddAsFriends(userId, query.trim());
            System.out.println("DEBUG - FriendService: Found " + users.size() + " users from database");
            
            System.out.println("DEBUG - FriendService: Converting users to DTOs");
            List<SearchUserDTO> result = users.stream()
                    .map(this::convertToSearchUserDTO)
                    .collect(Collectors.toList());
            
            System.out.println("DEBUG - FriendService: Successfully converted " + result.size() + " users to DTOs");
            System.out.println("=== FRIEND SERVICE DEBUG END ===");
            return result;
        } catch (Exception e) {
            System.out.println("=== FRIEND SERVICE ERROR ===");
            System.out.println("DEBUG - FriendService: Error searching users: " + e.getMessage());
            System.out.println("DEBUG - FriendService: Error type: " + e.getClass().getSimpleName());
            e.printStackTrace();
            System.out.println("=== FRIEND SERVICE ERROR END ===");
            throw new RuntimeException("Error searching users: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<SearchUserDTO> getAllUsersToAddAsFriends(UUID userId) {
        System.out.println("DEBUG - FriendService: Getting all users to add as friends for userId=" + userId);
        try {
            // Debug: Check if user exists
            boolean userExists = userDAO.existsById(userId);
            System.out.println("DEBUG - FriendService: Current user exists: " + userExists);
            
            if (!userExists) {
                System.out.println("DEBUG - FriendService: User not found, returning empty list");
                return List.of();
            }
            
            List<User> users = friendshipDAO.findAllUsersToAddAsFriends(userId);
            System.out.println("DEBUG - FriendService: Found " + users.size() + " users to add as friends");
            
            return users.stream()
                    .map(this::convertToSearchUserDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.out.println("DEBUG - FriendService: Error getting all users: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error getting all users: " + e.getMessage(), e);
        }
    }

    private UserDTO convertToUserDTO(User user) {
        return UserDTO.builder()
                .id(user.getId().toString())
                .username(user.getUsername())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .about(user.getAbout())
                .isActive(user.getIsActive())
                .lastSeenAt(user.getLastSeenAt())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private SearchUserDTO convertToSearchUserDTO(User user) {
        return SearchUserDTO.builder()
                .id(user.getId().toString())
                .username(user.getUsername())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .about(user.getAbout())
                .isActive(user.getIsActive())
                .lastSeenAt(user.getLastSeenAt())
                .createdAt(user.getCreatedAt())
                .build();
    }
}

package ty.tran.demo.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ty.tran.demo.DTO.SearchUserDTO;
import ty.tran.demo.DTO.UserDTO;
import ty.tran.demo.Entity.User;
import ty.tran.demo.Services.FriendService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/friends")
public class FriendController {

    private final FriendService friendService;
    
    // Constructor để debug dependency injection
    public FriendController(FriendService friendService) {
        System.out.println("=== FRIEND CONTROLLER CONSTRUCTOR ===");
        System.out.println("DEBUG - FriendController constructor called");
        System.out.println("DEBUG - FriendService injected: " + (friendService != null ? "SUCCESS" : "NULL"));
        this.friendService = friendService;
        System.out.println("=== FRIEND CONTROLLER CONSTRUCTOR END ===");
    }

    // Lấy danh sách bạn bè
    @GetMapping
    public ResponseEntity<List<UserDTO>> getFriends(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<UserDTO> friends = friendService.getFriends(user.getId());
        return ResponseEntity.ok(friends);
    }

    // Tìm kiếm bạn bè
    @GetMapping("/search")
    public ResponseEntity<List<UserDTO>> searchFriends(
            Authentication authentication,
            @RequestParam String query) {
        User user = (User) authentication.getPrincipal();
        List<UserDTO> friends = friendService.searchFriends(user.getId(), query);
        return ResponseEntity.ok(friends);
    }

    // Đếm số bạn bè
    @GetMapping("/count")
    public ResponseEntity<Long> countFriends(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        long count = friendService.countFriends(user.getId());
        return ResponseEntity.ok(count);
    }

    // Kiểm tra 2 user có phải bạn bè không
    @GetMapping("/check/{friendId}")
    public ResponseEntity<Boolean> areFriends(
            Authentication authentication,
            @PathVariable UUID friendId) {
        User user = (User) authentication.getPrincipal();
        boolean areFriends = friendService.areFriends(user.getId(), friendId);
        return ResponseEntity.ok(areFriends);
    }

    // Xóa bạn bè
    @DeleteMapping("/{friendId}")
    public ResponseEntity<Void> removeFriend(
            Authentication authentication,
            @PathVariable UUID friendId) {
        User user = (User) authentication.getPrincipal();
        friendService.removeFriend(user.getId(), friendId);
        return ResponseEntity.ok().build();
    }

    // Test endpoint to verify controller is working
    @GetMapping("/test")
    public ResponseEntity<String> testEndpoint(Authentication authentication) {
        System.out.println("=== TEST ENDPOINT CALLED ===");
        System.out.println("DEBUG - Test endpoint called, authentication=" + authentication);
        if (authentication != null) {
            User user = (User) authentication.getPrincipal();
            System.out.println("DEBUG - Test endpoint user=" + user.getEmail());
        }
        return ResponseEntity.ok("Test endpoint working");
    }

    // Tìm kiếm user để kết bạn
    @GetMapping("/search-users")
    public ResponseEntity<List<SearchUserDTO>> searchUsersToAddAsFriends(
            Authentication authentication,
            @RequestParam(required = false) String query) {
        System.out.println("=== FRIEND CONTROLLER DEBUG START ===");
        System.out.println("DEBUG - FriendController: searchUsersToAddAsFriends called with query=" + query);
        System.out.println("DEBUG - FriendController: Authentication=" + authentication);
        
        try {
            if (authentication == null) {
                System.out.println("DEBUG - FriendController: Authentication is null!");
                return ResponseEntity.status(401).build();
            }
            
            User user = (User) authentication.getPrincipal();
            System.out.println("DEBUG - FriendController: User=" + user.getEmail() + ", ID=" + user.getId());
            
            List<SearchUserDTO> users;
            
            if (query != null && !query.trim().isEmpty()) {
                System.out.println("DEBUG - FriendController: Calling searchUsersToAddAsFriends with query: " + query.trim());
                users = friendService.searchUsersToAddAsFriends(user.getId(), query.trim());
            } else {
                System.out.println("DEBUG - FriendController: Calling getAllUsersToAddAsFriends");
                users = friendService.getAllUsersToAddAsFriends(user.getId());
            }
            
            System.out.println("DEBUG - FriendController: Successfully retrieved " + users.size() + " users");
            System.out.println("=== FRIEND CONTROLLER DEBUG END ===");
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            System.out.println("=== FRIEND CONTROLLER ERROR ===");
            System.out.println("DEBUG - FriendController: Error in searchUsersToAddAsFriends: " + e.getMessage());
            System.out.println("DEBUG - FriendController: Error type: " + e.getClass().getSimpleName());
            e.printStackTrace();
            System.out.println("=== FRIEND CONTROLLER ERROR END ===");
            return ResponseEntity.internalServerError().build();
        }
    }
}

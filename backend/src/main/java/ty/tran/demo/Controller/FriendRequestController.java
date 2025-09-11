package ty.tran.demo.Controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ty.tran.demo.DTO.FriendRequestDTO;
import ty.tran.demo.DTO.RespondFriendRequestDTO;
import ty.tran.demo.DTO.SendFriendRequestDTO;
import ty.tran.demo.Entity.User;
import ty.tran.demo.Services.FriendRequestService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/friend-requests")
@RequiredArgsConstructor
public class FriendRequestController {

    private final FriendRequestService friendRequestService;

    // Gửi lời mời kết bạn
    @PostMapping
    public ResponseEntity<FriendRequestDTO> sendFriendRequest(
            Authentication authentication,
            @RequestBody SendFriendRequestDTO request) {
        User user = (User) authentication.getPrincipal();
        FriendRequestDTO friendRequest = friendRequestService.sendFriendRequest(user.getId(), request);
        return ResponseEntity.ok(friendRequest);
    }

    // Lấy danh sách lời mời đã gửi
    @GetMapping("/sent")
    public ResponseEntity<List<FriendRequestDTO>> getSentRequests(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<FriendRequestDTO> requests = friendRequestService.getSentRequests(user.getId());
        return ResponseEntity.ok(requests);
    }

    // Lấy danh sách lời mời đã nhận
    @GetMapping("/received")
    public ResponseEntity<List<FriendRequestDTO>> getReceivedRequests(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<FriendRequestDTO> requests = friendRequestService.getReceivedRequests(user.getId());
        return ResponseEntity.ok(requests);
    }

    // Phản hồi lời mời kết bạn (chấp nhận/từ chối)
    @PostMapping("/respond")
    public ResponseEntity<FriendRequestDTO> respondToFriendRequest(
            Authentication authentication,
            @RequestBody RespondFriendRequestDTO response) {
        User user = (User) authentication.getPrincipal();
        FriendRequestDTO friendRequest = friendRequestService.respondToFriendRequest(user.getId(), response);
        return ResponseEntity.ok(friendRequest);
    }

    // Hủy lời mời kết bạn
    @DeleteMapping("/{requestId}")
    public ResponseEntity<Void> cancelFriendRequest(
            Authentication authentication,
            @PathVariable UUID requestId) {
        User user = (User) authentication.getPrincipal();
        friendRequestService.cancelFriendRequest(user.getId(), requestId);
        return ResponseEntity.ok().build();
    }

    // Đếm số lời mời chưa đọc
    @GetMapping("/count")
    public ResponseEntity<Long> countPendingRequests(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        long count = friendRequestService.countPendingRequests(user.getId());
        return ResponseEntity.ok(count);
    }

    // Kiểm tra đã gửi lời mời chưa
    @GetMapping("/check/{receiverId}")
    public ResponseEntity<Boolean> hasPendingRequest(
            Authentication authentication,
            @PathVariable UUID receiverId) {
        User user = (User) authentication.getPrincipal();
        boolean hasRequest = friendRequestService.hasPendingRequest(user.getId(), receiverId);
        return ResponseEntity.ok(hasRequest);
    }
}

package ty.tran.demo.Impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ty.tran.demo.DAO.FriendRequestDAO;
import ty.tran.demo.DAO.FriendshipDAO;
import ty.tran.demo.DAO.UserDAO;
import ty.tran.demo.DTO.FriendRequestDTO;
import ty.tran.demo.DTO.RespondFriendRequestDTO;
import ty.tran.demo.DTO.SendFriendRequestDTO;
import ty.tran.demo.DTO.UserDTO;
import ty.tran.demo.Entity.FriendRequest;
import ty.tran.demo.Entity.Friendship;
import ty.tran.demo.Entity.User;
import ty.tran.demo.Service.FriendRequestService;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class FriendRequestServiceImpl implements FriendRequestService {

    private final FriendRequestDAO friendRequestDAO;
    private final FriendshipDAO friendshipDAO;
    private final UserDAO userDAO;

    @Override
    public FriendRequestDTO sendFriendRequest(UUID senderId, SendFriendRequestDTO request) {
        System.out.println("=== FRIEND REQUEST DEBUG START ===");
        System.out.println("DEBUG - sendFriendRequest: senderId=" + senderId + ", receiverId=" + request.getReceiverId());
        
        // Kiểm tra đã có friend request pending giữa 2 user chưa
        boolean hasPendingRequest = friendRequestDAO.hasPendingRequest(senderId, request.getReceiverId());
        System.out.println("DEBUG - hasPendingRequest: " + hasPendingRequest);
        if (hasPendingRequest) {
            throw new RuntimeException("Đã có lời mời kết bạn đang chờ phản hồi giữa hai người này rồi");
        }

        // Kiểm tra đã là bạn bè chưa
        boolean areFriends = friendshipDAO.areFriends(senderId, request.getReceiverId());
        System.out.println("DEBUG - areFriends: " + areFriends);
        if (areFriends) {
            throw new RuntimeException("Hai người đã là bạn bè rồi");
        }

        User sender = userDAO.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người gửi"));
        
        User receiver = userDAO.findById(request.getReceiverId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người nhận"));

        FriendRequest friendRequest = FriendRequest.builder()
                .sender(sender)
                .receiver(receiver)
                .status(FriendRequest.RequestStatus.pending)
                .message(request.getMessage())
                .createdAt(Instant.now())
                .build();

        FriendRequest savedRequest = friendRequestDAO.save(friendRequest);
        return convertToDTO(savedRequest);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FriendRequestDTO> getSentRequests(UUID userId) {
        List<FriendRequest> requests = friendRequestDAO.findSentRequestsByUserId(userId);
        return requests.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<FriendRequestDTO> getReceivedRequests(UUID userId) {
        List<FriendRequest> requests = friendRequestDAO.findReceivedRequestsByUserId(userId);
        return requests.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public FriendRequestDTO respondToFriendRequest(UUID userId, RespondFriendRequestDTO response) {
        FriendRequest request = friendRequestDAO.findById(response.getRequestId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lời mời kết bạn"));

        // Kiểm tra user có quyền phản hồi không
        if (!request.getReceiver().getId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền phản hồi lời mời này");
        }

        // Kiểm tra trạng thái - chỉ cho phép xử lý nếu đang pending
        if (request.getStatus() != FriendRequest.RequestStatus.pending) {
            throw new RuntimeException("Lời mời kết bạn đã được xử lý rồi (trạng thái hiện tại: " + request.getStatus() + ")");
        }

        // Kiểm tra xem đã là bạn bè chưa (tránh duplicate friendship)
        if (response.getStatus() == FriendRequest.RequestStatus.accepted && 
            friendshipDAO.areFriends(request.getSender().getId(), request.getReceiver().getId())) {
            throw new RuntimeException("Hai người đã là bạn bè rồi");
        }

        request.setStatus(response.getStatus());
        request.setRespondedAt(Instant.now());

        FriendRequest savedRequest = friendRequestDAO.save(request);

        // Nếu chấp nhận, tạo friendship
        if (response.getStatus() == FriendRequest.RequestStatus.accepted) {
            createFriendship(request.getSender().getId(), request.getReceiver().getId());
        }

        return convertToDTO(savedRequest);
    }

    @Override
    public void cancelFriendRequest(UUID userId, UUID requestId) {
        FriendRequest request = friendRequestDAO.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lời mời kết bạn"));

        // Kiểm tra user có quyền hủy không
        if (!request.getSender().getId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền hủy lời mời này");
        }

        // Kiểm tra trạng thái
        if (request.getStatus() != FriendRequest.RequestStatus.pending) {
            throw new RuntimeException("Lời mời kết bạn đã được xử lý rồi");
        }

        request.setStatus(FriendRequest.RequestStatus.canceled);
        request.setRespondedAt(Instant.now());
        friendRequestDAO.save(request);
    }

    @Override
    @Transactional(readOnly = true)
    public long countPendingRequests(UUID userId) {
        return friendRequestDAO.countPendingRequestsByUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasPendingRequest(UUID senderId, UUID receiverId) {
        return friendRequestDAO.hasPendingRequest(senderId, receiverId);
    }

    private void createFriendship(UUID user1Id, UUID user2Id) {
        // Tạo friendship 2 chiều
        Friendship friendship = Friendship.builder()
                .user1(userDAO.findById(user1Id).orElseThrow())
                .user2(userDAO.findById(user2Id).orElseThrow())
                .createdAt(Instant.now())
                .build();
        
        friendshipDAO.save(friendship);
    }

    private FriendRequestDTO convertToDTO(FriendRequest request) {
        return FriendRequestDTO.builder()
                .id(request.getId().toString())
                .sender(convertToUserDTO(request.getSender()))
                .receiver(convertToUserDTO(request.getReceiver()))
                .status(request.getStatus())
                .message(request.getMessage())
                .createdAt(request.getCreatedAt())
                .respondedAt(request.getRespondedAt())
                .build();
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
}

package ty.tran.demo.Service;

import ty.tran.demo.DTO.FriendRequestDTO;
import ty.tran.demo.DTO.SendFriendRequestDTO;
import ty.tran.demo.DTO.RespondFriendRequestDTO;

import java.util.List;
import java.util.UUID;

public interface FriendRequestService {
    
    // Gửi lời mời kết bạn
    FriendRequestDTO sendFriendRequest(UUID senderId, SendFriendRequestDTO request);
    
    // Lấy danh sách lời mời đã gửi
    List<FriendRequestDTO> getSentRequests(UUID userId);
    
    // Lấy danh sách lời mời đã nhận
    List<FriendRequestDTO> getReceivedRequests(UUID userId);
    
    // Phản hồi lời mời kết bạn (chấp nhận/từ chối)
    FriendRequestDTO respondToFriendRequest(UUID userId, RespondFriendRequestDTO response);
    
    // Hủy lời mời kết bạn
    void cancelFriendRequest(UUID userId, UUID requestId);
    
    // Đếm số lời mời chưa đọc
    long countPendingRequests(UUID userId);
    
    // Kiểm tra đã gửi lời mời chưa
    boolean hasPendingRequest(UUID senderId, UUID receiverId);
}

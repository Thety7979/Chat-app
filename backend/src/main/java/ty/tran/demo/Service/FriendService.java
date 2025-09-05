package ty.tran.demo.Service;

import ty.tran.demo.DTO.SearchUserDTO;
import ty.tran.demo.DTO.UserDTO;

import java.util.List;
import java.util.UUID;

public interface FriendService {
    
    // Lấy danh sách bạn bè
    List<UserDTO> getFriends(UUID userId);
    
    // Tìm kiếm bạn bè
    List<UserDTO> searchFriends(UUID userId, String query);
    
    // Đếm số bạn bè
    long countFriends(UUID userId);
    
    // Kiểm tra 2 user có phải bạn bè không
    boolean areFriends(UUID user1Id, UUID user2Id);
    
    // Xóa bạn bè
    void removeFriend(UUID userId, UUID friendId);
    
    // Tìm kiếm user để kết bạn
    List<SearchUserDTO> searchUsersToAddAsFriends(UUID userId, String query);
    
    // Lấy tất cả user có thể kết bạn
    List<SearchUserDTO> getAllUsersToAddAsFriends(UUID userId);
}

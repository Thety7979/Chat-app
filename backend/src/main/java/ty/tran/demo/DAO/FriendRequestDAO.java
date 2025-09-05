package ty.tran.demo.DAO;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ty.tran.demo.Entity.FriendRequest;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FriendRequestDAO extends JpaRepository<FriendRequest, UUID> {

    // Tìm friend request giữa 2 user
    @Query("SELECT fr FROM FriendRequest fr WHERE " +
           "(fr.sender.id = :senderId AND fr.receiver.id = :receiverId) OR " +
           "(fr.sender.id = :receiverId AND fr.receiver.id = :senderId)")
    Optional<FriendRequest> findFriendRequestBetweenUsers(@Param("senderId") UUID senderId, @Param("receiverId") UUID receiverId);

    // Lấy danh sách lời mời kết bạn đã gửi
    @Query("SELECT fr FROM FriendRequest fr WHERE fr.sender.id = :userId AND fr.status = 'pending'")
    List<FriendRequest> findSentRequestsByUserId(@Param("userId") UUID userId);

    // Lấy danh sách lời mời kết bạn đã nhận
    @Query("SELECT fr FROM FriendRequest fr WHERE fr.receiver.id = :userId AND fr.status = 'pending'")
    List<FriendRequest> findReceivedRequestsByUserId(@Param("userId") UUID userId);

    // Đếm số lời mời kết bạn chưa đọc
    @Query("SELECT COUNT(fr) FROM FriendRequest fr WHERE fr.receiver.id = :userId AND fr.status = 'pending'")
    long countPendingRequestsByUserId(@Param("userId") UUID userId);

    // Kiểm tra đã gửi lời mời kết bạn chưa
    @Query("SELECT COUNT(fr) > 0 FROM FriendRequest fr WHERE fr.sender.id = :senderId AND fr.receiver.id = :receiverId AND fr.status = 'pending'")
    boolean hasPendingRequest(@Param("senderId") UUID senderId, @Param("receiverId") UUID receiverId);
}

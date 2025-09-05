package ty.tran.demo.DAO;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ty.tran.demo.Entity.Friendship;
import ty.tran.demo.Entity.User;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FriendshipDAO extends JpaRepository<Friendship, UUID> {

    // Tìm friendship giữa 2 user
    @Query("SELECT f FROM Friendship f WHERE " +
           "(f.user1.id = :user1Id AND f.user2.id = :user2Id) OR " +
           "(f.user1.id = :user2Id AND f.user2.id = :user1Id)")
    Optional<Friendship> findFriendshipBetweenUsers(@Param("user1Id") UUID user1Id, @Param("user2Id") UUID user2Id);

    // Kiểm tra 2 user có phải bạn bè không
    @Query("SELECT COUNT(f) > 0 FROM Friendship f WHERE " +
           "(f.user1.id = :user1Id AND f.user2.id = :user2Id) OR " +
           "(f.user1.id = :user2Id AND f.user2.id = :user1Id)")
    boolean areFriends(@Param("user1Id") UUID user1Id, @Param("user2Id") UUID user2Id);

    // Lấy danh sách bạn bè của user - Simplified to avoid Hibernate ClassCastException
    @Query("SELECT f FROM Friendship f WHERE f.user1.id = :userId OR f.user2.id = :userId")
    List<Friendship> findFriendshipsByUserId(@Param("userId") UUID userId);

    // Đếm số bạn bè
    @Query("SELECT COUNT(f) FROM Friendship f WHERE f.user1.id = :userId OR f.user2.id = :userId")
    long countFriendsByUserId(@Param("userId") UUID userId);

    // Tìm kiếm bạn bè theo tên - Simplified to avoid Hibernate ClassCastException
    @Query("SELECT f FROM Friendship f WHERE (f.user1.id = :userId OR f.user2.id = :userId) " +
           "AND (LOWER(f.user1.displayName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(f.user1.username) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(f.user2.displayName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(f.user2.username) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Friendship> searchFriendships(@Param("userId") UUID userId, @Param("query") String query);

    // Tìm kiếm user có thể kết bạn (chưa kết bạn và chưa gửi lời mời) - Simplified version
    @Query("SELECT u FROM User u WHERE u.id != :userId " +
           "AND (LOWER(u.displayName) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<User> findUsersToAddAsFriends(@Param("userId") UUID userId, @Param("query") String query);

    // Lấy tất cả user có thể kết bạn (không có query) - Simplified version
    @Query("SELECT u FROM User u WHERE u.id != :userId")
    List<User> findAllUsersToAddAsFriends(@Param("userId") UUID userId);
}

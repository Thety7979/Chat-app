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

       @Query("SELECT f FROM Friendship f WHERE " +
                     "(f.user1.id = :user1Id AND f.user2.id = :user2Id) OR " +
                     "(f.user1.id = :user2Id AND f.user2.id = :user1Id)")
       Optional<Friendship> findFriendshipBetweenUsers(@Param("user1Id") UUID user1Id, @Param("user2Id") UUID user2Id);

       @Query("SELECT COUNT(f) > 0 FROM Friendship f WHERE " +
                     "(f.user1.id = :user1Id AND f.user2.id = :user2Id) OR " +
                     "(f.user1.id = :user2Id AND f.user2.id = :user1Id)")
       boolean areFriends(@Param("user1Id") UUID user1Id, @Param("user2Id") UUID user2Id);

       @Query("SELECT f FROM Friendship f WHERE f.user1.id = :userId OR f.user2.id = :userId")
       List<Friendship> findFriendshipsByUserId(@Param("userId") UUID userId);

       @Query("SELECT COUNT(f) FROM Friendship f WHERE f.user1.id = :userId OR f.user2.id = :userId")
       long countFriendsByUserId(@Param("userId") UUID userId);

       @Query("SELECT f FROM Friendship f WHERE (f.user1.id = :userId OR f.user2.id = :userId) " +
                     "AND ((f.user1.id = :userId AND (LOWER(f.user2.displayName) LIKE LOWER(CONCAT('%', :query, '%')) "
                     +
                     "OR LOWER(f.user2.username) LIKE LOWER(CONCAT('%', :query, '%')))) " +
                     "OR (f.user2.id = :userId AND (LOWER(f.user1.displayName) LIKE LOWER(CONCAT('%', :query, '%')) " +
                     "OR LOWER(f.user1.username) LIKE LOWER(CONCAT('%', :query, '%')))))")
       List<Friendship> searchFriendships(@Param("userId") UUID userId, @Param("query") String query);

       @Query("SELECT u FROM User u WHERE u.id != :userId " +
                     "AND NOT EXISTS (SELECT 1 FROM Friendship f WHERE " +
                     "(f.user1.id = :userId AND f.user2.id = u.id) OR " +
                     "(f.user1.id = u.id AND f.user2.id = :userId)) " +
                     "AND (LOWER(u.displayName) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')))")
       List<User> findUsersToAddAsFriends(@Param("userId") UUID userId, @Param("query") String query);

       @Query("SELECT u FROM User u WHERE u.id != :userId " +
                     "AND NOT EXISTS (SELECT 1 FROM Friendship f WHERE " +
                     "(f.user1.id = :userId AND f.user2.id = u.id) OR " +
                     "(f.user1.id = u.id AND f.user2.id = :userId))")
       List<User> findAllUsersToAddAsFriends(@Param("userId") UUID userId);
}

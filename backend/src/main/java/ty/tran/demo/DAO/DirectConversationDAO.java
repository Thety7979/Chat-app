package ty.tran.demo.DAO;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ty.tran.demo.Entity.DirectConversation;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DirectConversationDAO extends JpaRepository<DirectConversation, UUID> {

    @Query("SELECT dc FROM DirectConversation dc WHERE (dc.user1.id = :user1Id AND dc.user2.id = :user2Id) OR (dc.user1.id = :user2Id AND dc.user2.id = :user1Id)")
    Optional<DirectConversation> findDirectConversationBetweenUsers(@Param("user1Id") UUID user1Id,
            @Param("user2Id") UUID user2Id);

    @Query("SELECT dc FROM DirectConversation dc WHERE dc.user1.id = :userId OR dc.user2.id = :userId")
    java.util.List<DirectConversation> findByUserId(@Param("userId") UUID userId);
}

package ty.tran.demo.DAO;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ty.tran.demo.Entity.Conversation;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationDAO extends JpaRepository<Conversation, UUID> {

    @Query("SELECT c FROM Conversation c JOIN ConversationMember cm ON c.id = cm.conversation.id " +
            "WHERE cm.user.id = :userId " +
            "AND (c.type != 'direct' OR " +
            "EXISTS (SELECT 1 FROM Friendship f, ConversationMember cm2 WHERE " +
            "cm2.conversation.id = c.id AND cm2.user.id != :userId AND " +
            "((f.user1.id = :userId AND f.user2.id = cm2.user.id) OR " +
            "(f.user2.id = :userId AND f.user1.id = cm2.user.id)))) " +
            "ORDER BY c.updatedAt DESC")
    List<Conversation> findByUserId(@Param("userId") UUID userId);

    @Query("SELECT c FROM Conversation c JOIN ConversationMember cm1 ON c.id = cm1.conversation.id JOIN ConversationMember cm2 ON c.id = cm2.conversation.id WHERE cm1.user.id = :user1Id AND cm2.user.id = :user2Id AND c.type = 'direct'")
    Optional<Conversation> findDirectConversationBetweenUsers(@Param("user1Id") UUID user1Id,
            @Param("user2Id") UUID user2Id);

    @Query("SELECT c FROM Conversation c JOIN ConversationMember cm ON c.id = cm.conversation.id WHERE c.id = :conversationId AND cm.user.id = :userId")
    Optional<Conversation> findByIdAndUserId(@Param("conversationId") UUID conversationId,
            @Param("userId") UUID userId);

    @Query("SELECT c FROM Conversation c WHERE c.title ILIKE %:searchTerm% OR c.id IN (SELECT cm.conversation.id FROM ConversationMember cm JOIN User u ON cm.user.id = u.id WHERE u.username ILIKE %:searchTerm% OR u.displayName ILIKE %:searchTerm%)")
    List<Conversation> searchConversations(@Param("searchTerm") String searchTerm);
}

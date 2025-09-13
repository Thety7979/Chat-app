package ty.tran.demo.DAO;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import ty.tran.demo.Entity.Message;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MessageDAO extends JpaRepository<Message, UUID> {

    Page<Message> findByConversationIdOrderByCreatedAtDesc(UUID conversationId, Pageable pageable);

    @Query("SELECT m FROM Message m WHERE m.conversation.id = :conversationId AND m.deletedAt IS NULL")
    Page<Message> findActiveMessagesByConversationId(@Param("conversationId") UUID conversationId, Pageable pageable);

    @Query("SELECT m FROM Message m WHERE m.conversation.id = :conversationId AND m.createdAt > :after ORDER BY m.createdAt ASC")
    List<Message> findMessagesAfter(@Param("conversationId") UUID conversationId, @Param("after") Instant after);

    @Query("SELECT m FROM Message m WHERE m.conversation.id = :conversationId AND m.createdAt < :before ORDER BY m.createdAt DESC")
    Page<Message> findMessagesBefore(@Param("conversationId") UUID conversationId, @Param("before") Instant before,
            Pageable pageable);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversation.id = :conversationId AND m.createdAt > :after AND m.deletedAt IS NULL")
    long countUnreadMessages(@Param("conversationId") UUID conversationId, @Param("after") Instant after);

    Optional<Message> findFirstByConversationIdOrderByCreatedAtDesc(UUID conversationId);

    @Query("SELECT m FROM Message m WHERE m.conversation.id = :conversationId AND m.sender.id = :senderId AND m.content = :content AND m.createdAt >= :after ORDER BY m.createdAt DESC")
    List<Message> findDuplicateMessages(@Param("conversationId") UUID conversationId,
            @Param("senderId") UUID senderId,
            @Param("content") String content,
            @Param("after") Instant after);

    @Modifying
    @Transactional
    @Query("DELETE FROM Message m WHERE m.conversation.id = :conversationId")
    void deleteByConversationId(@Param("conversationId") UUID conversationId);
}

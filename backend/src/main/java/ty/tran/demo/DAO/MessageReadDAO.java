package ty.tran.demo.DAO;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ty.tran.demo.Entity.MessageRead;
import ty.tran.demo.Entity.MessageReadId;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface MessageReadDAO extends JpaRepository<MessageRead, MessageReadId> {
    
    @Query("SELECT mr FROM MessageRead mr WHERE mr.message.conversation.id = :conversationId AND mr.user.id = :userId")
    List<MessageRead> findByConversationIdAndUserId(@Param("conversationId") UUID conversationId, @Param("userId") UUID userId);
    
    @Query("SELECT mr FROM MessageRead mr WHERE mr.message.id = :messageId")
    List<MessageRead> findByMessageId(@Param("messageId") UUID messageId);
    
    @Query("SELECT mr FROM MessageRead mr WHERE mr.message.conversation.id = :conversationId AND mr.readAt > :after")
    List<MessageRead> findReadMessagesAfter(@Param("conversationId") UUID conversationId, @Param("after") Instant after);
    
    @Query("SELECT COUNT(mr) FROM MessageRead mr WHERE mr.message.conversation.id = :conversationId AND mr.user.id = :userId")
    long countReadMessagesByUser(@Param("conversationId") UUID conversationId, @Param("userId") UUID userId);
}

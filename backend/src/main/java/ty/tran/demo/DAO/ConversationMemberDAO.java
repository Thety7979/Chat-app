package ty.tran.demo.DAO;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ty.tran.demo.Entity.ConversationMember;
import ty.tran.demo.Entity.ConversationMemberId;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationMemberDAO extends JpaRepository<ConversationMember, ConversationMemberId> {
    
    List<ConversationMember> findByConversationId(UUID conversationId);
    
    List<ConversationMember> findByUserId(UUID userId);
    
    Optional<ConversationMember> findByConversationIdAndUserId(UUID conversationId, UUID userId);
    
    @Query("SELECT cm FROM ConversationMember cm WHERE cm.conversation.id = :conversationId AND cm.role = 'owner'")
    Optional<ConversationMember> findOwnerByConversationId(@Param("conversationId") UUID conversationId);
    
    @Query("SELECT cm FROM ConversationMember cm WHERE cm.conversation.id = :conversationId AND cm.role IN ('owner', 'admin')")
    List<ConversationMember> findAdminsByConversationId(@Param("conversationId") UUID conversationId);
    
    boolean existsByConversationIdAndUserId(UUID conversationId, UUID userId);
    
    @Query("SELECT COUNT(cm) FROM ConversationMember cm WHERE cm.conversation.id = :conversationId")
    long countByConversationId(@Param("conversationId") UUID conversationId);
    
    void deleteByConversationId(UUID conversationId);
}

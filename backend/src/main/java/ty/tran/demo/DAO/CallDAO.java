package ty.tran.demo.DAO;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import ty.tran.demo.Entity.Call;

import java.util.List;
import java.util.UUID;

@Repository
public interface CallDAO extends JpaRepository<Call, UUID> {

    @Query("SELECT c FROM Call c WHERE c.conversation.id = :conversationId ORDER BY c.createdAt DESC")
    List<Call> findByConversationIdOrderByCreatedAtDesc(@Param("conversationId") UUID conversationId);

    @Query("SELECT c FROM Call c WHERE c.initiator.id = :userId ORDER BY c.createdAt DESC")
    List<Call> findByInitiatorIdOrderByCreatedAtDesc(@Param("userId") UUID userId);

    @Query("SELECT c FROM Call c WHERE c.conversation.id = :conversationId AND c.status = :status ORDER BY c.createdAt DESC")
    List<Call> findByConversationIdAndStatusOrderByCreatedAtDesc(@Param("conversationId") UUID conversationId,
            @Param("status") Call.CallStatus status);

    @Query("SELECT c FROM Call c WHERE c.initiator.id = :userId AND c.status = :status ORDER BY c.createdAt DESC")
    List<Call> findByInitiatorIdAndStatusOrderByCreatedAtDesc(@Param("userId") UUID userId,
            @Param("status") Call.CallStatus status);

    @Query("SELECT c FROM Call c WHERE c.conversation.id = :conversationId AND c.status IN ('ringing', 'ongoing') ORDER BY c.createdAt DESC")
    List<Call> findActiveCallsByConversationId(@Param("conversationId") UUID conversationId);

    @Query("SELECT c FROM Call c WHERE c.initiator.id = :userId AND c.status IN ('ringing', 'ongoing') ORDER BY c.createdAt DESC")
    List<Call> findActiveCallsByInitiatorId(@Param("userId") UUID userId);

    @Query("SELECT c FROM Call c WHERE c.conversation.id = :conversationId AND c.type = :type ORDER BY c.createdAt DESC")
    List<Call> findByConversationIdAndTypeOrderByCreatedAtDesc(@Param("conversationId") UUID conversationId,
            @Param("type") Call.CallType type);

    @Query("SELECT c FROM Call c WHERE c.initiator.id = :userId AND c.type = :type ORDER BY c.createdAt DESC")
    List<Call> findByInitiatorIdAndTypeOrderByCreatedAtDesc(@Param("userId") UUID userId,
            @Param("type") Call.CallType type);

    @Query("SELECT COUNT(c) FROM Call c WHERE c.conversation.id = :conversationId AND c.status = :status")
    long countByConversationIdAndStatus(@Param("conversationId") UUID conversationId,
            @Param("status") Call.CallStatus status);

    @Query("SELECT COUNT(c) FROM Call c WHERE c.initiator.id = :userId AND c.status = :status")
    long countByInitiatorIdAndStatus(@Param("userId") UUID userId, @Param("status") Call.CallStatus status);

    @Query("SELECT c FROM Call c WHERE c.initiator.id = :userId ORDER BY c.createdAt DESC")
    Page<Call> findByInitiatorIdOrderByCreatedAtDesc(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT c FROM Call c WHERE c.status = :status AND c.createdAt < :expiredBefore ORDER BY c.createdAt DESC")
    List<Call> findExpiredCallsByStatus(@Param("status") Call.CallStatus status,
            @Param("expiredBefore") java.time.Instant expiredBefore);

    @Modifying
    @Transactional
    @Query("DELETE FROM Call c WHERE c.conversation.id = :conversationId")
    void deleteByConversationId(@Param("conversationId") UUID conversationId);
}

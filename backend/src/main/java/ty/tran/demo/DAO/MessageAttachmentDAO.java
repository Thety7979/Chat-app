package ty.tran.demo.DAO;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ty.tran.demo.Entity.MessageAttachment;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageAttachmentDAO extends JpaRepository<MessageAttachment, UUID> {
    
    List<MessageAttachment> findByMessageId(UUID messageId);
    
    void deleteByMessageId(UUID messageId);
}

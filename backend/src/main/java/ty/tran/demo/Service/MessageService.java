package ty.tran.demo.Service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import ty.tran.demo.DTO.MessageDTO;
import ty.tran.demo.DTO.SendMessageRequest;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface MessageService {
    
    MessageDTO sendMessage(UUID senderId, SendMessageRequest request);
    
    Page<MessageDTO> getMessages(UUID conversationId, UUID userId, Pageable pageable);
    
    List<MessageDTO> getMessagesAfter(UUID conversationId, UUID userId, Instant after);
    
    MessageDTO getMessageById(UUID messageId, UUID userId);
    
    MessageDTO editMessage(UUID messageId, UUID userId, String newContent);
    
    void deleteMessage(UUID messageId, UUID userId);
    
    void markAsRead(UUID messageId, UUID userId);
    
    void markConversationAsRead(UUID conversationId, UUID userId);
    
    long getUnreadCount(UUID conversationId, UUID userId);
    
    List<MessageDTO> searchMessages(UUID conversationId, UUID userId, String searchTerm);
}

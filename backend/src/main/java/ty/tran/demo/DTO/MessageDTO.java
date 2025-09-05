package ty.tran.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ty.tran.demo.Entity.Message;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageDTO {
    private UUID id;
    private UUID conversationId;
    private UUID senderId;
    private String senderUsername;
    private String senderDisplayName;
    private String senderAvatarUrl;
    private Message.MessageType type;
    private String content;
    private Object metadata;
    private UUID replyToId;
    private MessageDTO replyTo;
    private Instant createdAt;
    private Instant editedAt;
    private Instant deletedAt;
    private List<MessageAttachmentDTO> attachments;
    private boolean isRead;
    private Instant readAt;
    private int unreadCount;
}

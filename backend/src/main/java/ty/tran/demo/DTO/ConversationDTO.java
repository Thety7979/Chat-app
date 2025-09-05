package ty.tran.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ty.tran.demo.Entity.Conversation;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationDTO {
    private UUID id;
    private Conversation.ConversationType type;
    private String title;
    private String avatarUrl;
    private UUID createdById;
    private String createdByUsername;
    private Instant createdAt;
    private Instant updatedAt;
    private List<ConversationMemberDTO> members;
    private MessageDTO lastMessage;
    private int unreadCount;
    private boolean isOnline;
}

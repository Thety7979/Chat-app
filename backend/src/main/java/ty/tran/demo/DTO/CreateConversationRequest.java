package ty.tran.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ty.tran.demo.Entity.Conversation;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateConversationRequest {
    @NotNull(message = "Conversation type is required")
    private Conversation.ConversationType type;
    
    private String title;
    private String avatarUrl;
    
    @NotNull(message = "Member IDs are required")
    @Size(min = 1, message = "At least one member is required")
    private List<UUID> memberIds;
}

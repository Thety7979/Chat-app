package ty.tran.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ty.tran.demo.Entity.Message;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendMessageRequest {
    @NotNull(message = "Conversation ID is required")
    private UUID conversationId;
    
    @NotNull(message = "Message type is required")
    private Message.MessageType type;
    
    @NotBlank(message = "Content is required")
    private String content;
    
    private Object metadata;
    private UUID replyToId;
    private List<MessageAttachmentDTO> attachments;
}

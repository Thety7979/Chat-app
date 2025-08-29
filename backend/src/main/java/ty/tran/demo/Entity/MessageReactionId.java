package ty.tran.demo.Entity;

import java.io.Serializable;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageReactionId implements Serializable {
    @Column(name = "message_id")
    private UUID messageId;
    
    @Column(name = "user_id")
    private UUID userId;
    
    @Column(name = "reaction")
    private String reaction;
}


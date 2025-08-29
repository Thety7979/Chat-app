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
public class CallParticipantId implements Serializable {
    @Column(name = "call_id")
    private UUID callId;
    
    @Column(name = "user_id")
    private UUID userId;
}

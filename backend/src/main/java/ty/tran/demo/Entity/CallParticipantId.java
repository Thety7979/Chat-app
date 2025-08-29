package ty.tran.demo.Entity;

import java.io.Serializable;
import java.util.UUID;

import jakarta.persistence.Embeddable;
import lombok.*;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CallParticipantId implements Serializable {
    private UUID callId;
    private UUID userId;
}

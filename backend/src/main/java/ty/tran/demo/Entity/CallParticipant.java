package ty.tran.demo.Entity;

import java.time.Instant;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.*;

@Entity
@Table(name = "call_participants")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CallParticipant {

    @EmbeddedId
    private CallParticipantId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("callId")
    private Call call;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    private User user;

    private Instant joinedAt;
    private Instant leftAt;
    private String rtcSessionId;
}

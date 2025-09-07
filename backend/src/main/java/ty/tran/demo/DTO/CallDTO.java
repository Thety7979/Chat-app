package ty.tran.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ty.tran.demo.Entity.Call;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CallDTO {
    private UUID id;
    private UUID conversationId;
    private UUID initiatorId;
    private String initiatorName;
    private String initiatorEmail;
    private Call.CallType type;
    private Call.CallStatus status;
    private Instant startedAt;
    private Instant endedAt;
    private Instant createdAt;
    private Long duration; // in seconds
    private String conversationTitle;
}



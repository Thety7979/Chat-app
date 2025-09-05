package ty.tran.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ty.tran.demo.Entity.ConversationMember;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationMemberDTO {
    private UUID userId;
    private String username;
    private String displayName;
    private String avatarUrl;
    private ConversationMember.MemberRole role;
    private Instant joinedAt;
    private Instant mutedUntil;
    private UUID lastReadMessageId;
    private boolean isOnline;
    private Instant lastSeenAt;
}

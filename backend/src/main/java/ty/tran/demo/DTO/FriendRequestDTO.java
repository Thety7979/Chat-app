package ty.tran.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ty.tran.demo.Entity.FriendRequest;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FriendRequestDTO {
    private String id;
    private UserDTO sender;
    private UserDTO receiver;
    private FriendRequest.RequestStatus status;
    private String message;
    private Instant createdAt;
    private Instant respondedAt;
}

package ty.tran.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import ty.tran.demo.Entity.FriendRequest;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RespondFriendRequestDTO {
    private UUID requestId;
    private FriendRequest.RequestStatus status; // accepted, declined
}

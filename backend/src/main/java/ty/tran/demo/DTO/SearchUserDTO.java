package ty.tran.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchUserDTO {
    private String id;
    private String username;
    private String email;
    private String displayName;
    private String avatarUrl;
    private String about;
    private Boolean isActive;
    private Instant lastSeenAt;
    private Instant createdAt;
}

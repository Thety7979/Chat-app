package ty.tran.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private String id;
    private String email;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String provider; // "local", "google", "facebook"
    private boolean enabled;
}

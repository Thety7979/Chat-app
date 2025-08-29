package ty.tran.demo.Entity;

import java.io.Serializable;
import java.util.UUID;

import jakarta.persistence.Embeddable;
import lombok.*;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageReadId implements Serializable {
    private UUID messageId;
    private UUID userId;
}

package ty.tran.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageAttachmentDTO {
    private UUID id;
    private String url;
    private String mimeType;
    private Long bytes;
    private Integer width;
    private Integer height;
    private Integer durationMs;
    private String sha256;
}

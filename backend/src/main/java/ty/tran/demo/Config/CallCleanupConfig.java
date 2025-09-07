package ty.tran.demo.Config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import ty.tran.demo.Service.CallService;

@Component
@RequiredArgsConstructor
@Slf4j
public class CallCleanupConfig {

    private final CallService callService;

    @Scheduled(fixedRate = 30000) // Run every 30 seconds
    public void cleanupExpiredCalls() {
        try {
            callService.cleanupExpiredCalls();
        } catch (Exception e) {
            log.error("Error during call cleanup: {}", e.getMessage());
        }
    }
}

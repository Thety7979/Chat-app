package ty.tran.demo.Controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import ty.tran.demo.DTO.CallDTO;
import ty.tran.demo.Entity.Call;
import ty.tran.demo.Entity.User;
import ty.tran.demo.Services.CallService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Controller
@RestController
@RequestMapping("/calls")
@RequiredArgsConstructor
@Slf4j
public class CallController {

    private final SimpMessagingTemplate messagingTemplate;
    private final CallService callService;

    @MessageMapping("/call")
    public void handleCallEvent(@Payload Map<String, Object> callEvent) {
        try {
            String type = (String) callEvent.get("type");
            String callId = (String) callEvent.get("callId");
            String callerId = (String) callEvent.get("callerId");
            String calleeId = (String) callEvent.get("calleeId");

            System.out.println("=== CALL EVENT DEBUG START ===");
            System.out.println("Call event received: " + type + " from " + callerId + " to " + calleeId);
            System.out.println("Full event data: " + callEvent);
            System.out.println("=== CALL EVENT DEBUG END ===");

            switch (type) {
                case "call_outgoing":
                    // Send call_incoming event to callee
                    Map<String, Object> incomingEvent = new HashMap<>(callEvent);
                    incomingEvent.put("type", "call_incoming");
                    System.out.println("=== SENDING CALL_INCOMING EVENT ===");
                    System.out.println("Sending call_incoming event to user: " + calleeId);
                    System.out.println("Callee ID type: " + calleeId.getClass().getSimpleName());
                    System.out.println("Event data: " + incomingEvent);
                    System.out.println("Destination: /user/" + calleeId + "/queue/call-events");
                    
                    try {
                        // Try both methods to see which one works
                        String destination = "/user/" + calleeId + "/queue/call-events";
                        System.out.println("Trying direct destination: " + destination);
                        messagingTemplate.convertAndSend(destination, incomingEvent);
                        System.out.println("Call_incoming event sent successfully via direct destination");
                        
                        // Also try the user-specific method
                        messagingTemplate.convertAndSendToUser(
                            calleeId,
                            "/queue/call-events",
                            incomingEvent
                        );
                        System.out.println("Call_incoming event sent successfully via convertAndSendToUser");
                        
                        // Also try sending to a topic for testing
                        String topicDestination = "/topic/call-events/" + calleeId;
                        System.out.println("Trying topic destination: " + topicDestination);
                        messagingTemplate.convertAndSend(topicDestination, incomingEvent);
                        System.out.println("Call_incoming event sent successfully via topic destination");
                        
                    } catch (Exception e) {
                        System.out.println("Error sending call_incoming event: " + e.getMessage());
                        e.printStackTrace();
                    }
                    System.out.println("=== END SENDING CALL_INCOMING EVENT ===");
                    break;

                case "call_accepted":
                case "call_rejected":
                case "call_ended":
                case "call_failed":
                    // Send response back to caller
                    System.out.println("=== SENDING CALL RESPONSE EVENT ===");
                    System.out.println("Sending " + type + " event to caller: " + callerId);
                    System.out.println("Event data: " + callEvent);
                    System.out.println("Destination: /user/" + callerId + "/queue/call-events");
                    
                    try {
                        // Try user-specific destination
                        messagingTemplate.convertAndSendToUser(
                            callerId,
                            "/queue/call-events",
                            callEvent
                        );
                        System.out.println("Call response event sent successfully via convertAndSendToUser");
                        
                        // Also try topic destination
                        String topicDestination = "/topic/call-events/" + callerId;
                        System.out.println("Trying topic destination: " + topicDestination);
                        messagingTemplate.convertAndSend(topicDestination, callEvent);
                        System.out.println("Call response event sent successfully via topic destination");
                        
                    } catch (Exception e) {
                        System.out.println("Error sending call response event: " + e.getMessage());
                        e.printStackTrace();
                    }
                    System.out.println("=== END SENDING CALL RESPONSE EVENT ===");
                    break;

                case "offer":
                    // Forward offer to callee
                    System.out.println("=== FORWARDING OFFER ===");
                    System.out.println("Forwarding offer to callee: " + calleeId);
                    System.out.println("Event data: " + callEvent);
                    
                    // Send to both user-specific and topic destinations
                    messagingTemplate.convertAndSendToUser(
                        calleeId,
                        "/queue/call-events",
                        callEvent
                    );
                    
                    String offerTopicDestination = "/topic/call-events/" + calleeId;
                    messagingTemplate.convertAndSend(offerTopicDestination, callEvent);
                    
                    System.out.println("Offer forwarded successfully");
                    System.out.println("=== END FORWARDING OFFER ===");
                    break;

                case "answer":
                    // Forward answer to caller
                    System.out.println("=== FORWARDING ANSWER ===");
                    System.out.println("Forwarding answer to caller: " + callerId);
                    System.out.println("Event data: " + callEvent);
                    
                    // Send to both user-specific and topic destinations
                    messagingTemplate.convertAndSendToUser(
                        callerId,
                        "/queue/call-events",
                        callEvent
                    );
                    
                    String answerTopicDestination = "/topic/call-events/" + callerId;
                    messagingTemplate.convertAndSend(answerTopicDestination, callEvent);
                    
                    System.out.println("Answer forwarded successfully");
                    System.out.println("=== END FORWARDING ANSWER ===");
                    break;

                case "ice_candidate":
                    // Forward ICE candidate to the other party
                    String targetUserId = callerId.equals(callEvent.get("senderId")) ? calleeId : callerId;
                    System.out.println("=== SENDING ICE CANDIDATE ===");
                    System.out.println("Forwarding ICE candidate to: " + targetUserId);
                    System.out.println("Event data: " + callEvent);
                    
                    // Send to both user-specific and topic destinations
                    messagingTemplate.convertAndSendToUser(
                        targetUserId,
                        "/queue/call-events",
                        callEvent
                    );
                    
                    String iceTopicDestination = "/topic/call-events/" + targetUserId;
                    messagingTemplate.convertAndSend(iceTopicDestination, callEvent);
                    
                    System.out.println("ICE candidate sent successfully");
                    System.out.println("=== END SENDING ICE CANDIDATE ===");
                    break;

                default:
                    System.out.println("Unknown call event type: " + type);
            }

        } catch (Exception e) {
            System.err.println("=== CALL EVENT ERROR ===");
            System.err.println("Error handling call event: " + e.getMessage());
            e.printStackTrace();
            System.err.println("=== END CALL EVENT ERROR ===");
        }
    }

    // REST API Endpoints
    @PostMapping
    public ResponseEntity<CallDTO> createCall(
            Authentication authentication,
            @RequestParam UUID conversationId,
            @RequestParam String type) {
        try {
            System.out.println("=== CREATE CALL API DEBUG START ===");
            User user = (User) authentication.getPrincipal();
            System.out.println("User: " + user.getEmail() + " (ID: " + user.getId() + ")");
            System.out.println("Conversation ID: " + conversationId);
            System.out.println("Call type: " + type);
            Call.CallType callType = Call.CallType.valueOf(type.toLowerCase());
            CallDTO call = callService.createCall(conversationId, user.getId(), callType);
            System.out.println("Call created: " + call);
            System.out.println("=== CREATE CALL API DEBUG END ===");
            return ResponseEntity.ok(call);
        } catch (Exception e) {
            System.err.println("=== CREATE CALL API ERROR ===");
            log.error("Error creating call: {}", e.getMessage());
            e.printStackTrace();
            System.err.println("=== END CREATE CALL API ERROR ===");
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{callId}/status")
    public ResponseEntity<CallDTO> updateCallStatus(
            Authentication authentication,
            @PathVariable UUID callId,
            @RequestParam String status) {
        try {
            User user = (User) authentication.getPrincipal();
            Call.CallStatus callStatus = Call.CallStatus.valueOf(status.toLowerCase());
            CallDTO call = callService.updateCallStatus(callId, callStatus);
            return ResponseEntity.ok(call);
        } catch (Exception e) {
            log.error("Error updating call status: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{callId}/end")
    public ResponseEntity<CallDTO> endCall(
            Authentication authentication,
            @PathVariable UUID callId) {
        try {
            System.out.println("=== END CALL API DEBUG START ===");
            User user = (User) authentication.getPrincipal();
            System.out.println("User: " + user.getEmail() + " (ID: " + user.getId() + ")");
            System.out.println("Call ID: " + callId);
            CallDTO call = callService.endCall(callId, user.getId());
            System.out.println("Call ended: " + call);
            System.out.println("=== END CALL API DEBUG END ===");
            return ResponseEntity.ok(call);
        } catch (Exception e) {
            System.err.println("=== END CALL API ERROR ===");
            log.error("Error ending call: {}", e.getMessage());
            e.printStackTrace();
            System.err.println("=== END CALL API ERROR ===");
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{callId}")
    public ResponseEntity<CallDTO> getCall(
            Authentication authentication,
            @PathVariable UUID callId) {
        try {
            User user = (User) authentication.getPrincipal();
            CallDTO call = callService.getCallById(callId, user.getId());
            return ResponseEntity.ok(call);
        } catch (Exception e) {
            log.error("Error getting call: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/conversation/{conversationId}")
    public ResponseEntity<List<CallDTO>> getCallsByConversation(
            Authentication authentication,
            @PathVariable UUID conversationId) {
        try {
            User user = (User) authentication.getPrincipal();
            List<CallDTO> calls = callService.getCallsByConversation(conversationId, user.getId());
            return ResponseEntity.ok(calls);
        } catch (Exception e) {
            log.error("Error getting calls by conversation: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/user")
    public ResponseEntity<List<CallDTO>> getCallsByUser(Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            List<CallDTO> calls = callService.getCallsByUser(user.getId());
            return ResponseEntity.ok(calls);
        } catch (Exception e) {
            log.error("Error getting calls by user: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/active/conversation/{conversationId}")
    public ResponseEntity<List<CallDTO>> getActiveCallsByConversation(
            Authentication authentication,
            @PathVariable UUID conversationId) {
        try {
            User user = (User) authentication.getPrincipal();
            List<CallDTO> calls = callService.getActiveCallsByConversation(conversationId, user.getId());
            return ResponseEntity.ok(calls);
        } catch (Exception e) {
            log.error("Error getting active calls by conversation: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/active/user")
    public ResponseEntity<List<CallDTO>> getActiveCallsByUser(Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            List<CallDTO> calls = callService.getActiveCallsByUser(user.getId());
            return ResponseEntity.ok(calls);
        } catch (Exception e) {
            log.error("Error getting active calls by user: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/history")
    public ResponseEntity<List<CallDTO>> getCallHistory(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            User user = (User) authentication.getPrincipal();
            List<CallDTO> calls = callService.getCallHistory(user.getId(), page, size);
            return ResponseEntity.ok(calls);
        } catch (Exception e) {
            log.error("Error getting call history: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/cleanup")
    public ResponseEntity<String> cleanupExpiredCalls(Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            callService.cleanupExpiredCalls();
            return ResponseEntity.ok("Cleanup completed successfully");
        } catch (Exception e) {
            log.error("Error cleaning up expired calls: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}

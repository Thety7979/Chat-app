package ty.tran.demo.Controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import ty.tran.demo.DTO.SendMessageRequest;
import ty.tran.demo.Service.MessageService;
import ty.tran.demo.Service.ConversationService;

import java.util.UUID;

@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketController {

    private final MessageService messageService;
    private final ConversationService conversationService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/conversation/{conversationId}/send")
    public void sendMessage(
            @DestinationVariable UUID conversationId,
            @Payload SendMessageRequest request,
            SimpMessageHeaderAccessor headerAccessor) {
        try {
            // Get user ID from session attributes
            Object userIdObj = headerAccessor.getSessionAttributes().get("userId");
            if (userIdObj == null) {
                log.error("User ID not found in session");
                return;
            }
            
            UUID userId;
            if (userIdObj instanceof UUID) {
                userId = (UUID) userIdObj;
            } else if (userIdObj instanceof String) {
                userId = UUID.fromString((String) userIdObj);
            } else {
                log.error("Invalid user ID type in session: {}", userIdObj.getClass());
                return;
            }

            // Set conversation ID from path variable
            request.setConversationId(conversationId);

            // Send message
            var message = messageService.sendMessage(userId, request);
            
            // The message is already broadcasted in the service layer
            log.info("Message sent via WebSocket: {} in conversation {}", message.getId(), conversationId);
            
        } catch (Exception e) {
            log.error("Error sending message via WebSocket: {}", e.getMessage());
            // Send error back to sender
            messagingTemplate.convertAndSendToUser(
                    headerAccessor.getSessionId(),
                    "/queue/errors",
                    "Error sending message: " + e.getMessage()
            );
        }
    }

    @MessageMapping("/conversation/{conversationId}/typing")
    public void handleTyping(
            @DestinationVariable UUID conversationId,
            @Payload String isTyping,
            SimpMessageHeaderAccessor headerAccessor) {
        try {
            Object userIdObj = headerAccessor.getSessionAttributes().get("userId");
            if (userIdObj == null) {
                return;
            }
            
            UUID userId;
            if (userIdObj instanceof UUID) {
                userId = (UUID) userIdObj;
            } else if (userIdObj instanceof String) {
                userId = UUID.fromString((String) userIdObj);
            } else {
                return;
            }

            // Check if user is member of conversation
            if (!conversationService.isUserMember(conversationId, userId)) {
                return;
            }

            // Broadcast typing indicator to all conversation members except sender
            messagingTemplate.convertAndSend(
                    "/topic/conversation/" + conversationId + "/typing",
                    new TypingIndicator(userId, Boolean.parseBoolean(isTyping))
            );
            
        } catch (Exception e) {
            log.error("Error handling typing indicator: {}", e.getMessage());
        }
    }

    @MessageMapping("/conversation/{conversationId}/read")
    public void markAsRead(
            @DestinationVariable UUID conversationId,
            @Payload String messageId,
            SimpMessageHeaderAccessor headerAccessor) {
        try {
            Object userIdObj = headerAccessor.getSessionAttributes().get("userId");
            if (userIdObj == null) {
                return;
            }
            
            UUID userId;
            if (userIdObj instanceof UUID) {
                userId = (UUID) userIdObj;
            } else if (userIdObj instanceof String) {
                userId = UUID.fromString((String) userIdObj);
            } else {
                return;
            }

            UUID msgId = UUID.fromString(messageId);
            messageService.markAsRead(msgId, userId);

            // Broadcast read receipt to conversation members
            messagingTemplate.convertAndSend(
                    "/topic/conversation/" + conversationId + "/read",
                    new ReadReceipt(userId, msgId)
            );
            
        } catch (Exception e) {
            log.error("Error marking message as read: {}", e.getMessage());
        }
    }

    @MessageMapping("/conversation/{conversationId}/join")
    public void joinConversation(
            @DestinationVariable UUID conversationId,
            SimpMessageHeaderAccessor headerAccessor) {
        try {
            Object userIdObj = headerAccessor.getSessionAttributes().get("userId");
            if (userIdObj == null) {
                return;
            }
            
            UUID userId;
            if (userIdObj instanceof UUID) {
                userId = (UUID) userIdObj;
            } else if (userIdObj instanceof String) {
                userId = UUID.fromString((String) userIdObj);
            } else {
                return;
            }

            // Check if user is member of conversation
            if (!conversationService.isUserMember(conversationId, userId)) {
                return;
            }

            // Subscribe user to conversation-specific topics
            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/joined",
                    "Joined conversation " + conversationId
            );

            // Notify other members (optional)
            messagingTemplate.convertAndSend(
                    "/topic/conversation/" + conversationId + "/presence",
                    new PresenceUpdate(userId, "online")
            );
            
        } catch (Exception e) {
            log.error("Error joining conversation: {}", e.getMessage());
        }
    }

    @MessageMapping("/conversation/{conversationId}/leave")
    public void leaveConversation(
            @DestinationVariable UUID conversationId,
            SimpMessageHeaderAccessor headerAccessor) {
        try {
            Object userIdObj = headerAccessor.getSessionAttributes().get("userId");
            if (userIdObj == null) {
                return;
            }
            
            UUID userId;
            if (userIdObj instanceof UUID) {
                userId = (UUID) userIdObj;
            } else if (userIdObj instanceof String) {
                userId = UUID.fromString((String) userIdObj);
            } else {
                return;
            }

            // Notify other members
            messagingTemplate.convertAndSend(
                    "/topic/conversation/" + conversationId + "/presence",
                    new PresenceUpdate(userId, "offline")
            );
            
        } catch (Exception e) {
            log.error("Error leaving conversation: {}", e.getMessage());
        }
    }

    // Helper classes for WebSocket messages
    public static class TypingIndicator {
        public UUID userId;
        public boolean isTyping;
        public long timestamp;

        public TypingIndicator() {}

        public TypingIndicator(UUID userId, boolean isTyping) {
            this.userId = userId;
            this.isTyping = isTyping;
            this.timestamp = System.currentTimeMillis();
        }
    }

    public static class ReadReceipt {
        public UUID userId;
        public UUID messageId;
        public long timestamp;

        public ReadReceipt() {}

        public ReadReceipt(UUID userId, UUID messageId) {
            this.userId = userId;
            this.messageId = messageId;
            this.timestamp = System.currentTimeMillis();
        }
    }

    public static class PresenceUpdate {
        public UUID userId;
        public String status;
        public long timestamp;

        public PresenceUpdate() {}

        public PresenceUpdate(UUID userId, String status) {
            this.userId = userId;
            this.status = status;
            this.timestamp = System.currentTimeMillis();
        }
    }

    // Handle WebSocket disconnect events to send presence offline
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        var sessionAttributes = headerAccessor.getSessionAttributes();
        if (sessionAttributes == null) return;
        
        Object userIdObj = sessionAttributes.get("userId");
        if (userIdObj != null) {
            UUID userId;
            if (userIdObj instanceof UUID) {
                userId = (UUID) userIdObj;
            } else if (userIdObj instanceof String) {
                userId = UUID.fromString((String) userIdObj);
            } else {
                return;
            }
            
            log.info("User {} disconnected, sending presence offline to all conversations", userId);
            
            // Send presence offline to all conversations this user is a member of
            try {
                // Get all conversations for this user and send presence offline
                conversationService.getUserConversations(userId).forEach(conversation -> {
                    messagingTemplate.convertAndSend(
                        "/topic/conversation/" + conversation.getId() + "/presence",
                        new PresenceUpdate(userId, "offline")
                    );
                    log.info("Sent presence offline for user {} in conversation {}", userId, conversation.getId());
                });
            } catch (Exception e) {
                log.error("Error sending presence offline for user {}: {}", userId, e.getMessage());
            }
        }
    }

    // Handle WebSocket connect events to send presence online
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        var sessionAttributes = headerAccessor.getSessionAttributes();
        if (sessionAttributes == null) return;
        
        Object userIdObj = sessionAttributes.get("userId");
        if (userIdObj != null) {
            UUID userId;
            if (userIdObj instanceof UUID) {
                userId = (UUID) userIdObj;
            } else if (userIdObj instanceof String) {
                userId = UUID.fromString((String) userIdObj);
            } else {
                return;
            }
            
            log.info("User {} connected", userId);
        }
    }
}

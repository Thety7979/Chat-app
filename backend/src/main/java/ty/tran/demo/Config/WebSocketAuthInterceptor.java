package ty.tran.demo.Config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.lang.NonNull;

import ty.tran.demo.DAO.UserDAO;
import ty.tran.demo.Entity.User;
import ty.tran.demo.Services.JwtService;

import java.util.Map;
import java.util.UUID;

@Component
@Slf4j
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserDAO userDAO;

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                try {
                    if (jwtService == null) {
                        log.error("JwtService is null - dependency injection failed");
                        return message;
                    }
                    String userEmail = jwtService.extractUsername(token);
                    if (jwtService.isTokenValid(token, userEmail)) {
                        User user = userDAO.findByEmail(userEmail).orElse(null);
                        if (user != null) {
                            Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
                            if (sessionAttributes != null) {
                                sessionAttributes.put("userId", user.getId());
                                log.info("WebSocket connection authenticated for user: {} (ID: {})", user.getEmail(), user.getId());
                                log.info("Session attributes set: userId = {}", sessionAttributes.get("userId"));
                            }
                        } else {
                            log.error("User not found for email: {}", userEmail);
                        }
                    } else {
                        log.error("Invalid JWT token");
                    }
                } catch (Exception e) {
                    log.error("Error validating JWT token: {}", e.getMessage());
                }
            } else {
                // fallback userId
                String userId = accessor.getFirstNativeHeader("userId");
                if (userId != null) {
                    try {
                        UUID userUuid = UUID.fromString(userId);
                        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
                        if (sessionAttributes != null) {
                            sessionAttributes.put("userId", userUuid);
                            log.info("WebSocket connection authenticated for user: {}", userId);
                        }
                    } catch (IllegalArgumentException e) {
                        log.error("Invalid user ID format: {}", userId);
                    }
                } else {
                    log.warn("WebSocket connection attempted without authentication");
                }
            }
        }

        return message;
    }
}

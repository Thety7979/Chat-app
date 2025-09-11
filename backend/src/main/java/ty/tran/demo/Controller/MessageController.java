package ty.tran.demo.Controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ty.tran.demo.DTO.MessageDTO;
import ty.tran.demo.DTO.SendMessageRequest;
import ty.tran.demo.Entity.User;
import ty.tran.demo.Services.MessageService;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
@Slf4j
public class MessageController {

    private final MessageService messageService;

    @PostMapping
    public ResponseEntity<MessageDTO> sendMessage(
            Authentication authentication,
            @Valid @RequestBody SendMessageRequest request) {
        try {
            User user = (User) authentication.getPrincipal();
            MessageDTO message = messageService.sendMessage(user.getId(), request);
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            log.error("Error sending message: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/conversation/{conversationId}")
    public ResponseEntity<Page<MessageDTO>> getMessages(
            Authentication authentication,
            @PathVariable UUID conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        try {
            User user = (User) authentication.getPrincipal();
            Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
            Pageable pageable = PageRequest.of(page, size, sort);
            
            log.info("Getting messages for conversation {} with sortBy={}, sortDir={}", 
                conversationId, sortBy, sortDir);
            
            Page<MessageDTO> messages = messageService.getMessages(conversationId, user.getId(), pageable);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            log.error("Error getting messages: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/conversation/{conversationId}/after")
    public ResponseEntity<List<MessageDTO>> getMessagesAfter(
            Authentication authentication,
            @PathVariable UUID conversationId,
            @RequestParam String after) {
        try {
            User user = (User) authentication.getPrincipal();
            Instant afterTime = Instant.parse(after);
            List<MessageDTO> messages = messageService.getMessagesAfter(conversationId, user.getId(), afterTime);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            log.error("Error getting messages after: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{messageId}")
    public ResponseEntity<MessageDTO> getMessage(
            Authentication authentication,
            @PathVariable UUID messageId) {
        try {
            User user = (User) authentication.getPrincipal();
            MessageDTO message = messageService.getMessageById(messageId, user.getId());
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            log.error("Error getting message: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{messageId}")
    public ResponseEntity<MessageDTO> editMessage(
            Authentication authentication,
            @PathVariable UUID messageId,
            @RequestBody String newContent) {
        try {
            User user = (User) authentication.getPrincipal();
            MessageDTO message = messageService.editMessage(messageId, user.getId(), newContent);
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            log.error("Error editing message: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{messageId}")
    public ResponseEntity<Void> deleteMessage(
            Authentication authentication,
            @PathVariable UUID messageId) {
        try {
            User user = (User) authentication.getPrincipal();
            messageService.deleteMessage(messageId, user.getId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error deleting message: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{messageId}/read")
    public ResponseEntity<Void> markAsRead(
            Authentication authentication,
            @PathVariable UUID messageId) {
        try {
            User user = (User) authentication.getPrincipal();
            messageService.markAsRead(messageId, user.getId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error marking message as read: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/conversation/{conversationId}/read")
    public ResponseEntity<Void> markConversationAsRead(
            Authentication authentication,
            @PathVariable UUID conversationId) {
        try {
            User user = (User) authentication.getPrincipal();
            messageService.markConversationAsRead(conversationId, user.getId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error marking conversation as read: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/conversation/{conversationId}/unread-count")
    public ResponseEntity<Long> getUnreadCount(
            Authentication authentication,
            @PathVariable UUID conversationId) {
        try {
            User user = (User) authentication.getPrincipal();
            long unreadCount = messageService.getUnreadCount(conversationId, user.getId());
            return ResponseEntity.ok(unreadCount);
        } catch (Exception e) {
            log.error("Error getting unread count: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/conversation/{conversationId}/search")
    public ResponseEntity<List<MessageDTO>> searchMessages(
            Authentication authentication,
            @PathVariable UUID conversationId,
            @RequestParam String q) {
        try {
            User user = (User) authentication.getPrincipal();
            List<MessageDTO> messages = messageService.searchMessages(conversationId, user.getId(), q);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            log.error("Error searching messages: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
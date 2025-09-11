package ty.tran.demo.Controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ty.tran.demo.DTO.ConversationDTO;
import ty.tran.demo.DTO.CreateConversationRequest;
import ty.tran.demo.Entity.User;
import ty.tran.demo.Services.ConversationService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/conversations")
@RequiredArgsConstructor
@Slf4j
public class ConversationController {

    private final ConversationService conversationService;

    @PostMapping
    public ResponseEntity<ConversationDTO> createConversation(
            Authentication authentication,
            @Valid @RequestBody CreateConversationRequest request) {
        try {
            User user = (User) authentication.getPrincipal();
            ConversationDTO conversation = conversationService.createConversation(user.getId(), request);
            return ResponseEntity.ok(conversation);
        } catch (Exception e) {
            log.error("Error creating conversation: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<ConversationDTO>> getUserConversations(
            Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            List<ConversationDTO> conversations = conversationService.getUserConversations(user.getId());
            return ResponseEntity.ok(conversations);
        } catch (Exception e) {
            log.error("Error getting user conversations: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{conversationId}")
    public ResponseEntity<ConversationDTO> getConversation(
            Authentication authentication,
            @PathVariable UUID conversationId) {
        try {
            User user = (User) authentication.getPrincipal();
            ConversationDTO conversation = conversationService.getConversationById(conversationId, user.getId());
            return ResponseEntity.ok(conversation);
        } catch (Exception e) {
            log.error("Error getting conversation: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/direct")
    public ResponseEntity<ConversationDTO> getOrCreateDirectConversation(
            Authentication authentication,
            @RequestParam UUID user2Id) {
        try {
            User user = (User) authentication.getPrincipal();
            log.info("Creating direct conversation between user {} and user {}", user.getId(), user2Id);
            ConversationDTO conversation = conversationService.getOrCreateDirectConversation(user.getId(), user2Id);
            log.info("Successfully created/found conversation: {}", conversation.getId());
            return ResponseEntity.ok(conversation);
        } catch (Exception e) {
            log.error("Error getting/creating direct conversation: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{conversationId}")
    public ResponseEntity<ConversationDTO> updateConversation(
            Authentication authentication,
            @PathVariable UUID conversationId,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String avatarUrl) {
        try {
            User user = (User) authentication.getPrincipal();
            ConversationDTO conversation = conversationService.updateConversation(conversationId, user.getId(), title, avatarUrl);
            return ResponseEntity.ok(conversation);
        } catch (Exception e) {
            log.error("Error updating conversation: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{conversationId}/members")
    public ResponseEntity<Void> addMember(
            Authentication authentication,
            @PathVariable UUID conversationId,
            @RequestParam UUID newMemberId) {
        try {
            User user = (User) authentication.getPrincipal();
            conversationService.addMember(conversationId, user.getId(), newMemberId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error adding member: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{conversationId}/members/{memberId}")
    public ResponseEntity<Void> removeMember(
            Authentication authentication,
            @PathVariable UUID conversationId,
            @PathVariable UUID memberId) {
        try {
            User user = (User) authentication.getPrincipal();
            conversationService.removeMember(conversationId, user.getId(), memberId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error removing member: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{conversationId}/members/{memberId}/role")
    public ResponseEntity<Void> updateMemberRole(
            Authentication authentication,
            @PathVariable UUID conversationId,
            @PathVariable UUID memberId,
            @RequestParam String role) {
        try {
            User user = (User) authentication.getPrincipal();
            conversationService.updateMemberRole(conversationId, user.getId(), memberId, role);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error updating member role: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{conversationId}/leave")
    public ResponseEntity<Void> leaveConversation(
            Authentication authentication,
            @PathVariable UUID conversationId) {
        try {
            User user = (User) authentication.getPrincipal();
            conversationService.leaveConversation(conversationId, user.getId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error leaving conversation: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{conversationId}")
    public ResponseEntity<Void> deleteConversation(
            Authentication authentication,
            @PathVariable UUID conversationId) {
        try {
            User user = (User) authentication.getPrincipal();
            conversationService.deleteConversation(conversationId, user.getId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error deleting conversation: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<ConversationDTO>> searchConversations(
            Authentication authentication,
            @RequestParam String q) {
        try {
            User user = (User) authentication.getPrincipal();
            List<ConversationDTO> conversations = conversationService.searchConversations(user.getId(), q);
            return ResponseEntity.ok(conversations);
        } catch (Exception e) {
            log.error("Error searching conversations: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
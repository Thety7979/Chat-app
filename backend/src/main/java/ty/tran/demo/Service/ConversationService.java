package ty.tran.demo.Service;

import ty.tran.demo.DTO.ConversationDTO;
import ty.tran.demo.DTO.CreateConversationRequest;

import java.util.List;
import java.util.UUID;

public interface ConversationService {
    
    ConversationDTO createConversation(UUID creatorId, CreateConversationRequest request);
    
    List<ConversationDTO> getUserConversations(UUID userId);
    
    ConversationDTO getConversationById(UUID conversationId, UUID userId);
    
    ConversationDTO getOrCreateDirectConversation(UUID user1Id, UUID user2Id);
    
    ConversationDTO updateConversation(UUID conversationId, UUID userId, String title, String avatarUrl);
    
    void addMember(UUID conversationId, UUID adminId, UUID newMemberId);
    
    void removeMember(UUID conversationId, UUID adminId, UUID memberId);
    
    void updateMemberRole(UUID conversationId, UUID adminId, UUID memberId, String role);
    
    void leaveConversation(UUID conversationId, UUID userId);
    
    void deleteConversation(UUID conversationId, UUID userId);
    
    List<ConversationDTO> searchConversations(UUID userId, String searchTerm);
    
    boolean isUserMember(UUID conversationId, UUID userId);
    
    boolean isUserAdmin(UUID conversationId, UUID userId);
}

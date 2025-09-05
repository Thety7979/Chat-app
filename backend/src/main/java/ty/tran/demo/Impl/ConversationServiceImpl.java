package ty.tran.demo.Impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ty.tran.demo.DAO.*;
import ty.tran.demo.DTO.*;
import ty.tran.demo.Entity.*;
import ty.tran.demo.Service.ConversationService;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ConversationServiceImpl implements ConversationService {

    private final ConversationDAO conversationDAO;
    private final ConversationMemberDAO conversationMemberDAO;
    private final DirectConversationDAO directConversationDAO;
    private final UserDAO userDAO;
    private final MessageDAO messageDAO;
    private final SimpMessagingTemplate messagingTemplate;
    // Removed circular dependency - will use direct DAO access

    @Override
    public ConversationDTO createConversation(UUID creatorId, CreateConversationRequest request) {
        log.info("createConversation called with creatorId: {}, request: {}", creatorId, request);
        
        User creator = userDAO.findById(creatorId)
                .orElseThrow(() -> new RuntimeException("Creator not found"));
        log.info("Found creator: {}", creator.getEmail());

        // Validate all member IDs exist
        List<User> members = userDAO.findAllById(request.getMemberIds());
        log.info("Found {} members out of {} requested", members.size(), request.getMemberIds().size());
        if (members.size() != request.getMemberIds().size()) {
            log.error("Some member IDs are invalid. Requested: {}, Found: {}", request.getMemberIds(), members.stream().map(User::getId).toList());
            throw new RuntimeException("Some member IDs are invalid");
        }

        // For direct conversations, check if already exists
        if (request.getType() == Conversation.ConversationType.direct) {
            if (request.getMemberIds().size() != 2) {
                throw new RuntimeException("Direct conversation must have exactly 2 members");
            }
            
            UUID otherUserId = request.getMemberIds().stream()
                    .filter(id -> !id.equals(creatorId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Invalid direct conversation setup"));

            Optional<Conversation> existingDirect = conversationDAO.findDirectConversationBetweenUsers(creatorId, otherUserId);
            if (existingDirect.isPresent()) {
                return convertToDTO(existingDirect.get(), creatorId);
            }
        }

        // Create conversation
        Conversation conversation = Conversation.builder()
                .type(request.getType())
                .title(request.getTitle())
                .avatarUrl(request.getAvatarUrl())
                .createdBy(creator)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        conversation = conversationDAO.save(conversation);
        log.info("Conversation saved with ID: {}", conversation.getId());

        // Add creator as owner
        ConversationMember creatorMember = ConversationMember.builder()
                .id(new ConversationMemberId(conversation.getId(), creatorId))
                .conversation(conversation)
                .user(creator)
                .role(ConversationMember.MemberRole.owner)
                .joinedAt(Instant.now())
                .build();
        conversationMemberDAO.save(creatorMember);

        // Add other members
        for (UUID memberId : request.getMemberIds()) {
            if (!memberId.equals(creatorId)) {
                User member = userDAO.findById(memberId)
                        .orElseThrow(() -> new RuntimeException("Member not found: " + memberId));

                ConversationMember memberEntity = ConversationMember.builder()
                        .id(new ConversationMemberId(conversation.getId(), memberId))
                        .conversation(conversation)
                        .user(member)
                        .role(ConversationMember.MemberRole.member)
                        .joinedAt(Instant.now())
                        .build();
                conversationMemberDAO.save(memberEntity);
            }
        }

        // Flush to ensure conversation is persisted before creating DirectConversation
        conversationDAO.flush();

        // Create direct conversation record if needed
        if (request.getType() == Conversation.ConversationType.direct) {
            UUID user1Id = creatorId;
            UUID user2Id = request.getMemberIds().stream()
                    .filter(id -> !id.equals(creatorId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Invalid direct conversation setup"));

            log.info("Creating DirectConversation with conversationId: {}", conversation.getId());
            
            // Get users
            User user1 = userDAO.findById(user1Id).orElseThrow(() -> new RuntimeException("User not found"));
            User user2 = userDAO.findById(user2Id).orElseThrow(() -> new RuntimeException("User not found"));
            log.info("Found users: {} and {}", user1.getEmail(), user2.getEmail());
            
            DirectConversation directConversation = DirectConversation.builder()
                    .conversationId(conversation.getId())
                    .conversationid(conversation.getId())
                    .user1(user1)
                    .user2(user2)
                    .createdAt(Instant.now())
                    .build();
            
            log.info("DirectConversation object created: conversationId={}, user1={}, user2={}", 
                    directConversation.getConversationId(), 
                    directConversation.getUser1().getEmail(), 
                    directConversation.getUser2().getEmail());
            
            log.info("Saving DirectConversation...");
            directConversationDAO.save(directConversation);
            log.info("DirectConversation saved successfully");
        }

        ConversationDTO conversationDTO = convertToDTO(conversation, creatorId);

        // Send real-time notification to all members
        List<ConversationMember> allMembers = conversationMemberDAO.findByConversationId(conversation.getId());
        for (ConversationMember member : allMembers) {
            messagingTemplate.convertAndSendToUser(
                    member.getUser().getId().toString(),
                    "/queue/conversations",
                    conversationDTO
            );
        }

        log.info("Conversation created: {} by user {}", conversation.getId(), creatorId);
        return conversationDTO;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConversationDTO> getUserConversations(UUID userId) {
        System.out.println("=== GET USER CONVERSATIONS DEBUG START ===");
        System.out.println("DEBUG - getUserConversations: userId=" + userId);
        
        List<Conversation> conversations = conversationDAO.findByUserId(userId);
        System.out.println("DEBUG - Found " + conversations.size() + " conversations");
        
        List<ConversationDTO> result = conversations.stream()
                .map(conv -> {
                    System.out.println("DEBUG - Conversation: " + conv.getId() + " (" + conv.getType() + ")");
                    return convertToDTO(conv, userId);
                })
                .collect(Collectors.toList());
        
        System.out.println("DEBUG - Returning " + result.size() + " conversation DTOs");
        System.out.println("=== GET USER CONVERSATIONS DEBUG END ===");
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public ConversationDTO getConversationById(UUID conversationId, UUID userId) {
        Conversation conversation = conversationDAO.findByIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new RuntimeException("Conversation not found or user is not a member"));
        return convertToDTO(conversation, userId);
    }

    @Override
    public ConversationDTO getOrCreateDirectConversation(UUID user1Id, UUID user2Id) {
        log.info("getOrCreateDirectConversation called with user1Id: {}, user2Id: {}", user1Id, user2Id);
        
        // Check if direct conversation already exists
        Optional<Conversation> existing = conversationDAO.findDirectConversationBetweenUsers(user1Id, user2Id);
        if (existing.isPresent()) {
            log.info("Found existing direct conversation: {}", existing.get().getId());
            return convertToDTO(existing.get(), user1Id);
        }

        log.info("No existing conversation found, creating new one");
        // Create new direct conversation
        CreateConversationRequest request = CreateConversationRequest.builder()
                .type(Conversation.ConversationType.direct)
                .memberIds(List.of(user1Id, user2Id))
                .build();

        log.info("Created request with memberIds: {}", request.getMemberIds());
        return createConversation(user1Id, request);
    }

    @Override
    public ConversationDTO updateConversation(UUID conversationId, UUID userId, String title, String avatarUrl) {
        Conversation conversation = conversationDAO.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        // Validate user is admin or owner
        if (!isUserAdmin(conversationId, userId)) {
            throw new RuntimeException("User must be admin or owner to update conversation");
        }

        if (title != null) {
            conversation.setTitle(title);
        }
        if (avatarUrl != null) {
            conversation.setAvatarUrl(avatarUrl);
        }
        conversation.setUpdatedAt(Instant.now());

        conversation = conversationDAO.save(conversation);
        ConversationDTO conversationDTO = convertToDTO(conversation, userId);

        // Send real-time update
        messagingTemplate.convertAndSend("/topic/conversation/" + conversationId, conversationDTO);

        return conversationDTO;
    }

    @Override
    public void addMember(UUID conversationId, UUID adminId, UUID newMemberId) {
        // Validate admin permissions
        if (!isUserAdmin(conversationId, adminId)) {
            throw new RuntimeException("User must be admin or owner to add members");
        }

        // Check if user is already a member
        if (conversationMemberDAO.existsByConversationIdAndUserId(conversationId, newMemberId)) {
            throw new RuntimeException("User is already a member of this conversation");
        }

        User newMember = userDAO.findById(newMemberId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Conversation conversation = conversationDAO.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        ConversationMember member = ConversationMember.builder()
                .id(new ConversationMemberId(conversationId, newMemberId))
                .conversation(conversation)
                .user(newMember)
                .role(ConversationMember.MemberRole.member)
                .joinedAt(Instant.now())
                .build();

        conversationMemberDAO.save(member);

        // Send real-time notification
        ConversationDTO conversationDTO = convertToDTO(conversation, newMemberId);
        messagingTemplate.convertAndSendToUser(
                newMemberId.toString(),
                "/queue/conversations",
                conversationDTO
        );

        // Notify other members
        messagingTemplate.convertAndSend("/topic/conversation/" + conversationId, 
                "User " + newMember.getUsername() + " joined the conversation");
    }

    @Override
    public void removeMember(UUID conversationId, UUID adminId, UUID memberId) {
        // Validate admin permissions
        if (!isUserAdmin(conversationId, adminId)) {
            throw new RuntimeException("User must be admin or owner to remove members");
        }

        // Cannot remove owner
        ConversationMember member = conversationMemberDAO.findByConversationIdAndUserId(conversationId, memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));

        if (member.getRole() == ConversationMember.MemberRole.owner) {
            throw new RuntimeException("Cannot remove conversation owner");
        }

        conversationMemberDAO.delete(member);

        // Send real-time notification
        messagingTemplate.convertAndSend("/topic/conversation/" + conversationId, 
                "User " + member.getUser().getUsername() + " left the conversation");
    }

    @Override
    public void updateMemberRole(UUID conversationId, UUID adminId, UUID memberId, String role) {
        // Validate admin permissions
        if (!isUserAdmin(conversationId, adminId)) {
            throw new RuntimeException("User must be admin or owner to update member roles");
        }

        ConversationMember member = conversationMemberDAO.findByConversationIdAndUserId(conversationId, memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));

        try {
            ConversationMember.MemberRole newRole = ConversationMember.MemberRole.valueOf(role);
            member.setRole(newRole);
            conversationMemberDAO.save(member);

            // Send real-time notification
            messagingTemplate.convertAndSend("/topic/conversation/" + conversationId, 
                    "User " + member.getUser().getUsername() + " role updated to " + role);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid role: " + role);
        }
    }

    @Override
    public void leaveConversation(UUID conversationId, UUID userId) {
        ConversationMember member = conversationMemberDAO.findByConversationIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new RuntimeException("User is not a member of this conversation"));

        // If user is owner, transfer ownership to another admin or member
        if (member.getRole() == ConversationMember.MemberRole.owner) {
            List<ConversationMember> admins = conversationMemberDAO.findAdminsByConversationId(conversationId);
            admins.remove(member); // Remove current owner

            if (!admins.isEmpty()) {
                // Transfer to first admin
                ConversationMember newOwner = admins.get(0);
                newOwner.setRole(ConversationMember.MemberRole.owner);
                conversationMemberDAO.save(newOwner);
            } else {
                // No admins, transfer to first member
                List<ConversationMember> members = conversationMemberDAO.findByConversationId(conversationId);
                members.remove(member);
                if (!members.isEmpty()) {
                    ConversationMember newOwner = members.get(0);
                    newOwner.setRole(ConversationMember.MemberRole.owner);
                    conversationMemberDAO.save(newOwner);
                }
            }
        }

        conversationMemberDAO.delete(member);

        // Send real-time notification
        messagingTemplate.convertAndSend("/topic/conversation/" + conversationId, 
                "User " + member.getUser().getUsername() + " left the conversation");
    }

    @Override
    public void deleteConversation(UUID conversationId, UUID userId) {
        Conversation conversation = conversationDAO.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        // Only owner can delete conversation
        ConversationMember member = conversationMemberDAO.findByConversationIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new RuntimeException("User is not a member of this conversation"));

        if (member.getRole() != ConversationMember.MemberRole.owner) {
            throw new RuntimeException("Only conversation owner can delete the conversation");
        }

        // Delete direct conversation record if exists
        if (conversation.getType() == Conversation.ConversationType.direct) {
            directConversationDAO.deleteById(conversationId);
        }

        // Delete all members
        conversationMemberDAO.deleteByConversationId(conversationId);

        // Delete conversation
        conversationDAO.delete(conversation);

        // Send real-time notification
        messagingTemplate.convertAndSend("/topic/conversation/" + conversationId, "Conversation deleted");
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConversationDTO> searchConversations(UUID userId, String searchTerm) {
        List<Conversation> conversations = conversationDAO.searchConversations(searchTerm);
        return conversations.stream()
                .filter(conv -> isUserMember(conv.getId(), userId))
                .map(conv -> convertToDTO(conv, userId))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isUserMember(UUID conversationId, UUID userId) {
        return conversationMemberDAO.existsByConversationIdAndUserId(conversationId, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isUserAdmin(UUID conversationId, UUID userId) {
        Optional<ConversationMember> member = conversationMemberDAO.findByConversationIdAndUserId(conversationId, userId);
        return member.isPresent() && 
               (member.get().getRole() == ConversationMember.MemberRole.owner || 
                member.get().getRole() == ConversationMember.MemberRole.admin);
    }

    private ConversationDTO convertToDTO(Conversation conversation, UUID currentUserId) {
        List<ConversationMember> members = conversationMemberDAO.findByConversationId(conversation.getId());
        List<ConversationMemberDTO> memberDTOs = members.stream()
                .map(this::convertMemberToDTO)
                .collect(Collectors.toList());

        // Get last message
        MessageDTO lastMessage = null;
        Optional<Message> lastMsg = messageDAO.findFirstByConversationIdOrderByCreatedAtDesc(conversation.getId());
        if (lastMsg.isPresent()) {
            lastMessage = convertMessageToDTO(lastMsg.get());
        }

        // Get unread count - simplified for now
        long unreadCount = 0; // TODO: Implement unread count calculation

        return ConversationDTO.builder()
                .id(conversation.getId())
                .type(conversation.getType())
                .title(conversation.getTitle())
                .avatarUrl(conversation.getAvatarUrl())
                .createdById(conversation.getCreatedBy().getId())
                .createdByUsername(conversation.getCreatedBy().getUsername())
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .members(memberDTOs)
                .lastMessage(lastMessage)
                .unreadCount((int) unreadCount)
                .build();
    }

    private ConversationMemberDTO convertMemberToDTO(ConversationMember member) {
        return ConversationMemberDTO.builder()
                .userId(member.getUser().getId())
                .username(member.getUser().getUsername())
                .displayName(member.getUser().getDisplayName())
                .avatarUrl(member.getUser().getAvatarUrl())
                .role(member.getRole())
                .joinedAt(member.getJoinedAt())
                .mutedUntil(member.getMutedUntil())
                .lastReadMessageId(member.getLastReadMessageId())
                .lastSeenAt(member.getUser().getLastSeenAt())
                .build();
    }

    private MessageDTO convertMessageToDTO(Message message) {
        return MessageDTO.builder()
                .id(message.getId())
                .conversationId(message.getConversation().getId())
                .senderId(message.getSender().getId())
                .senderUsername(message.getSender().getUsername())
                .senderDisplayName(message.getSender().getDisplayName())
                .senderAvatarUrl(message.getSender().getAvatarUrl())
                .type(message.getType())
                .content(message.getContent())
                .metadata(message.getMetadata())
                .createdAt(message.getCreatedAt())
                .editedAt(message.getEditedAt())
                .deletedAt(message.getDeletedAt())
                .build();
    }
}

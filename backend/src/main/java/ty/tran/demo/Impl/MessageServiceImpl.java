package ty.tran.demo.Impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ty.tran.demo.DAO.*;
import ty.tran.demo.DTO.*;
import ty.tran.demo.Entity.*;
import ty.tran.demo.Service.MessageService;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class MessageServiceImpl implements MessageService {

    private final MessageDAO messageDAO;
    private final ConversationDAO conversationDAO;
    private final ConversationMemberDAO conversationMemberDAO;
    private final MessageReadDAO messageReadDAO;
    private final MessageAttachmentDAO messageAttachmentDAO;
    private final UserDAO userDAO;
    private final FriendshipDAO friendshipDAO;
    private final SimpMessagingTemplate messagingTemplate;
    // Removed circular dependency - will use direct DAO access

    @Override
    public MessageDTO sendMessage(UUID senderId, SendMessageRequest request) {
        // Validate user can send message in this conversation (includes friendship check for direct conversations)
        validateUserCanSendMessage(request.getConversationId(), senderId);

        // Get conversation and sender
        Conversation conversation = conversationDAO.findById(request.getConversationId())
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
        User sender = userDAO.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        // Check for duplicate messages (prevent spam) - only check within last 10 seconds
        Instant tenSecondsAgo = Instant.now().minusSeconds(10);
        List<Message> duplicates = messageDAO.findDuplicateMessages(
                request.getConversationId(), senderId, request.getContent(), tenSecondsAgo);
        if (!duplicates.isEmpty()) {
            log.warn("Duplicate message detected within 10 seconds, allowing it");
            // Don't throw error, just log it - users should be able to send the same message
        }

        // Create message
        Message message = Message.builder()
                .conversation(conversation)
                .sender(sender)
                .type(request.getType())
                .content(request.getContent())
                .metadata(request.getMetadata() != null ? request.getMetadata() : null)
                .createdAt(Instant.now())
                .build();

        // Set reply to if provided
        if (request.getReplyToId() != null) {
            Message replyTo = messageDAO.findById(request.getReplyToId())
                    .orElseThrow(() -> new RuntimeException("Reply to message not found"));
            message.setReplyTo(replyTo);
        }

        // Save message
        message = messageDAO.save(message);

        // Save attachments if any
        if (request.getAttachments() != null && !request.getAttachments().isEmpty()) {
            for (MessageAttachmentDTO attachmentDTO : request.getAttachments()) {
                MessageAttachment attachment = MessageAttachment.builder()
                        .message(message)
                        .url(attachmentDTO.getUrl())
                        .mimeType(attachmentDTO.getMimeType())
                        .bytes(attachmentDTO.getBytes())
                        .width(attachmentDTO.getWidth())
                        .height(attachmentDTO.getHeight())
                        .durationMs(attachmentDTO.getDurationMs())
                        .sha256(attachmentDTO.getSha256())
                        .build();
                messageAttachmentDAO.save(attachment);
            }
        }

        // Update conversation timestamp
        conversation.setUpdatedAt(Instant.now());
        conversationDAO.save(conversation);

        // Convert to DTO
        MessageDTO messageDTO = convertToDTO(message);

        // Send real-time notification to conversation topic (all members will receive)
        messagingTemplate.convertAndSend("/topic/conversation/" + conversation.getId(), messageDTO);

        log.info("Message sent: {} by user {} in conversation {}", message.getId(), senderId, conversation.getId());
        return messageDTO;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MessageDTO> getMessages(UUID conversationId, UUID userId, Pageable pageable) {
        // Validate user can access this conversation (includes friendship check for direct conversations)
        validateUserCanAccessConversation(conversationId, userId);

        log.info("MessageServiceImpl: Getting messages for conversation {} with sort={}", 
            conversationId, pageable.getSort());
        
        Page<Message> messages = messageDAO.findActiveMessagesByConversationId(conversationId, pageable);
        
        log.info("MessageServiceImpl: Found {} messages, first message createdAt: {}", 
            messages.getContent().size(), 
            messages.getContent().isEmpty() ? "none" : messages.getContent().get(0).getCreatedAt());
        
        return messages.map(this::convertToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageDTO> getMessagesAfter(UUID conversationId, UUID userId, Instant after) {
        // Validate user can access this conversation (includes friendship check for direct conversations)
        validateUserCanAccessConversation(conversationId, userId);

        List<Message> messages = messageDAO.findMessagesAfter(conversationId, after);
        return messages.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public MessageDTO getMessageById(UUID messageId, UUID userId) {
        Message message = messageDAO.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        // Validate user can access this conversation (includes friendship check for direct conversations)
        validateUserCanAccessConversation(message.getConversation().getId(), userId);

        return convertToDTO(message);
    }

    @Override
    public MessageDTO editMessage(UUID messageId, UUID userId, String newContent) {
        Message message = messageDAO.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        // Validate user is the sender
        if (!message.getSender().getId().equals(userId)) {
            throw new RuntimeException("User can only edit their own messages");
        }

        // Validate user can access this conversation (includes friendship check for direct conversations)
        validateUserCanAccessConversation(message.getConversation().getId(), userId);

        message.setContent(newContent);
        message.setEditedAt(Instant.now());
        message = messageDAO.save(message);

        MessageDTO messageDTO = convertToDTO(message);

        // Send real-time update
        messagingTemplate.convertAndSend("/topic/conversation/" + message.getConversation().getId(), messageDTO);

        return messageDTO;
    }

    @Override
    public void deleteMessage(UUID messageId, UUID userId) {
        Message message = messageDAO.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        // Validate user is the sender or admin
        boolean isSender = message.getSender().getId().equals(userId);
        boolean isAdmin = false;
        Optional<ConversationMember> member = conversationMemberDAO.findByConversationIdAndUserId(message.getConversation().getId(), userId);
        if (member.isPresent() && (member.get().getRole() == ConversationMember.MemberRole.owner || member.get().getRole() == ConversationMember.MemberRole.admin)) {
            isAdmin = true;
        }

        if (!isSender && !isAdmin) {
            throw new RuntimeException("User can only delete their own messages or must be admin");
        }

        // Validate user can access this conversation (includes friendship check for direct conversations)
        validateUserCanAccessConversation(message.getConversation().getId(), userId);

        message.setDeletedAt(Instant.now());
        messageDAO.save(message);

        MessageDTO messageDTO = convertToDTO(message);

        // Send real-time update
        messagingTemplate.convertAndSend("/topic/conversation/" + message.getConversation().getId(), messageDTO);
    }

    @Override
    public void markAsRead(UUID messageId, UUID userId) {
        Message message = messageDAO.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        // Validate user can access this conversation (includes friendship check for direct conversations)
        validateUserCanAccessConversation(message.getConversation().getId(), userId);

        // Check if already read
        MessageReadId readId = new MessageReadId(messageId, userId);
        if (messageReadDAO.existsById(readId)) {
            return; // Already read
        }

        // Mark as read
        MessageRead messageRead = MessageRead.builder()
                .id(readId)
                .message(message)
                .user(userDAO.findById(userId).orElseThrow(() -> new RuntimeException("User not found")))
                .readAt(Instant.now())
                .build();

        messageReadDAO.save(messageRead);

        // Update last read message in conversation member
        ConversationMember member = conversationMemberDAO.findByConversationIdAndUserId(
                message.getConversation().getId(), userId)
                .orElseThrow(() -> new RuntimeException("User is not a member of this conversation"));
        member.setLastReadMessageId(messageId);
        conversationMemberDAO.save(member);
    }

    @Override
    public void markConversationAsRead(UUID conversationId, UUID userId) {
        // Validate user can access this conversation (includes friendship check for direct conversations)
        validateUserCanAccessConversation(conversationId, userId);

        // Get last message
        Optional<Message> lastMessage = messageDAO.findFirstByConversationIdOrderByCreatedAtDesc(conversationId);
        if (lastMessage.isPresent()) {
            markAsRead(lastMessage.get().getId(), userId);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(UUID conversationId, UUID userId) {
        // Validate user can access this conversation (includes friendship check for direct conversations)
        validateUserCanAccessConversation(conversationId, userId);

        // Get last read message timestamp
        ConversationMember member = conversationMemberDAO.findByConversationIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new RuntimeException("User is not a member of this conversation"));

        if (member.getLastReadMessageId() == null) {
            // Count all messages
            return messageDAO.countUnreadMessages(conversationId, Instant.EPOCH);
        } else {
            // Count messages after last read
            Message lastReadMessage = messageDAO.findById(member.getLastReadMessageId())
                    .orElseThrow(() -> new RuntimeException("Last read message not found"));
            return messageDAO.countUnreadMessages(conversationId, lastReadMessage.getCreatedAt());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageDTO> searchMessages(UUID conversationId, UUID userId, String searchTerm) {
        // Validate user can access this conversation (includes friendship check for direct conversations)
        validateUserCanAccessConversation(conversationId, userId);

        // This would require a custom query - simplified for now
        List<Message> messages = messageDAO.findByConversationIdOrderByCreatedAtDesc(conversationId, Pageable.unpaged())
                .getContent()
                .stream()
                .filter(m -> m.getContent() != null && m.getContent().toLowerCase().contains(searchTerm.toLowerCase()))
                .collect(Collectors.toList());

        return messages.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    private MessageDTO convertToDTO(Message message) {
        MessageDTO.MessageDTOBuilder builder = MessageDTO.builder()
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
                .deletedAt(message.getDeletedAt());

        // Set reply to if exists
        if (message.getReplyTo() != null) {
            builder.replyToId(message.getReplyTo().getId());
            // For simplicity, we don't load the full reply message here
        }

        // Load attachments
        List<MessageAttachment> attachments = messageAttachmentDAO.findByMessageId(message.getId());
        List<MessageAttachmentDTO> attachmentDTOs = attachments.stream()
                .map(this::convertAttachmentToDTO)
                .collect(Collectors.toList());
        builder.attachments(attachmentDTOs);

        return builder.build();
    }

    private MessageAttachmentDTO convertAttachmentToDTO(MessageAttachment attachment) {
        return MessageAttachmentDTO.builder()
                .id(attachment.getId())
                .url(attachment.getUrl())
                .mimeType(attachment.getMimeType())
                .bytes(attachment.getBytes())
                .width(attachment.getWidth())
                .height(attachment.getHeight())
                .durationMs(attachment.getDurationMs())
                .sha256(attachment.getSha256())
                .build();
    }

    /**
     * Validates that a user can send messages in a conversation.
     * For direct conversations, also checks if users are friends.
     */
    private void validateUserCanSendMessage(UUID conversationId, UUID userId) {
        // First check if user is member of conversation
        if (!conversationMemberDAO.existsByConversationIdAndUserId(conversationId, userId)) {
            throw new RuntimeException("User is not a member of this conversation");
        }

        // For direct conversations, check if users are friends
        Conversation conversation = conversationDAO.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        if (conversation.getType() == Conversation.ConversationType.direct) {
            // Get the other user in the direct conversation
            List<ConversationMember> members = conversationMemberDAO.findByConversationId(conversationId);
            UUID otherUserId = members.stream()
                    .map(member -> member.getUser().getId())
                    .filter(id -> !id.equals(userId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Invalid direct conversation"));

            // Check if users are friends
            if (!friendshipDAO.areFriends(userId, otherUserId)) {
                throw new RuntimeException("Cannot send messages to non-friend users");
            }
        }
    }

    /**
     * Validates that a user can access a conversation.
     * For direct conversations, also checks if users are friends.
     */
    private void validateUserCanAccessConversation(UUID conversationId, UUID userId) {
        // First check if user is member of conversation
        if (!conversationMemberDAO.existsByConversationIdAndUserId(conversationId, userId)) {
            throw new RuntimeException("User is not a member of this conversation");
        }

        // For direct conversations, check if users are friends
        Conversation conversation = conversationDAO.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        if (conversation.getType() == Conversation.ConversationType.direct) {
            // Get the other user in the direct conversation
            List<ConversationMember> members = conversationMemberDAO.findByConversationId(conversationId);
            UUID otherUserId = members.stream()
                    .map(member -> member.getUser().getId())
                    .filter(id -> !id.equals(userId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Invalid direct conversation"));

            // Check if users are friends
            if (!friendshipDAO.areFriends(userId, otherUserId)) {
                throw new RuntimeException("Cannot access conversation with non-friend users");
            }
        }
    }
}

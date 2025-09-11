package ty.tran.demo.Implements;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ty.tran.demo.DAO.CallDAO;
import ty.tran.demo.DAO.ConversationDAO;
import ty.tran.demo.DAO.ConversationMemberDAO;
import ty.tran.demo.DAO.UserDAO;
import ty.tran.demo.DTO.CallDTO;
import ty.tran.demo.Entity.Call;
import ty.tran.demo.Entity.Conversation;
import ty.tran.demo.Services.CallService;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CallServiceImpl implements CallService {

    private final CallDAO callDAO;
    private final ConversationDAO conversationDAO;
    private final ConversationMemberDAO conversationMemberDAO;
    private final UserDAO userDAO;

    @Override
    public CallDTO createCall(UUID conversationId, UUID initiatorId, Call.CallType type) {
        log.info("Creating call for conversation {} by user {}", conversationId, initiatorId);
        
        // Verify conversation exists and user is a member
        Conversation conversation = conversationDAO.findById(conversationId)
            .orElseThrow(() -> new RuntimeException("Conversation not found"));
        
        if (!conversationMemberDAO.existsByConversationIdAndUserId(conversationId, initiatorId)) {
            throw new RuntimeException("User is not a member of this conversation");
        }
        
        // Check if there's already an active call
        List<Call> activeCalls = callDAO.findActiveCallsByConversationId(conversationId);
        if (!activeCalls.isEmpty()) {
            // If there are ringing calls, end them to allow the new call
            for (Call activeCall : activeCalls) {
                if (activeCall.getStatus() == Call.CallStatus.ringing) {
                    log.info("Ending existing ringing call {} to allow new call", activeCall.getId());
                    activeCall.setStatus(Call.CallStatus.canceled);
                    activeCall.setEndedAt(Instant.now());
                    callDAO.save(activeCall);
                } else if (activeCall.getStatus() == Call.CallStatus.ongoing) {
                    // Check if the ongoing call is very old (more than 5 minutes)
                    // If so, end it to allow a new call
                    Instant fiveMinutesAgo = Instant.now().minusSeconds(5 * 60);
                    if (activeCall.getStartedAt() != null && activeCall.getStartedAt().isBefore(fiveMinutesAgo)) {
                        log.info("Ending old ongoing call {} (started at {}) to allow new call", 
                                activeCall.getId(), activeCall.getStartedAt());
                        activeCall.setStatus(Call.CallStatus.ended);
                        activeCall.setEndedAt(Instant.now());
                        callDAO.save(activeCall);
                    } else {
                        // If there's a recent ongoing call, don't allow a new one
                        throw new RuntimeException("There is already an ongoing call in this conversation");
                    }
                }
            }
        }
        
        // Create new call
        Call call = Call.builder()
            .conversation(conversation)
            .initiator(userDAO.findById(initiatorId).orElseThrow(() -> new RuntimeException("User not found")))
            .type(type)
            .status(Call.CallStatus.ringing)
            .createdAt(Instant.now())
            .build();
        
        Call savedCall = callDAO.save(call);
        log.info("Call created successfully: {}", savedCall.getId());
        
        return convertToDTO(savedCall);
    }

    @Override
    public CallDTO updateCallStatus(UUID callId, Call.CallStatus status) {
        log.info("Updating call {} status to {}", callId, status);
        
        Call call = callDAO.findById(callId)
            .orElseThrow(() -> new RuntimeException("Call not found"));
        
        call.setStatus(status);
        
        if (status == Call.CallStatus.ongoing) {
            call.setStartedAt(Instant.now());
        } else if (status == Call.CallStatus.ended || status == Call.CallStatus.canceled || status == Call.CallStatus.failed) {
            call.setEndedAt(Instant.now());
        }
        
        Call updatedCall = callDAO.save(call);
        log.info("Call status updated successfully");
        
        return convertToDTO(updatedCall);
    }

    @Override
    public CallDTO endCall(UUID callId, UUID userId) {
        log.info("Ending call {} by user {}", callId, userId);
        
        Call call = callDAO.findById(callId)
            .orElseThrow(() -> new RuntimeException("Call not found"));
        
        // Verify user is the initiator or a member of the conversation
        if (!call.getInitiator().getId().equals(userId) && 
            !conversationMemberDAO.existsByConversationIdAndUserId(call.getConversation().getId(), userId)) {
            throw new RuntimeException("User is not authorized to end this call");
        }
        
        call.setStatus(Call.CallStatus.ended);
        call.setEndedAt(Instant.now());
        
        Call endedCall = callDAO.save(call);
        log.info("Call ended successfully");
        
        return convertToDTO(endedCall);
    }

    @Override
    @Transactional(readOnly = true)
    public CallDTO getCallById(UUID callId, UUID userId) {
        Call call = callDAO.findById(callId)
            .orElseThrow(() -> new RuntimeException("Call not found"));
        
        // Verify user is a member of the conversation
        if (!conversationMemberDAO.existsByConversationIdAndUserId(call.getConversation().getId(), userId)) {
            throw new RuntimeException("User is not authorized to view this call");
        }
        
        return convertToDTO(call);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CallDTO> getCallsByConversation(UUID conversationId, UUID userId) {
        // Verify user is a member of the conversation
        if (!conversationMemberDAO.existsByConversationIdAndUserId(conversationId, userId)) {
            throw new RuntimeException("User is not a member of this conversation");
        }
        
        List<Call> calls = callDAO.findByConversationIdOrderByCreatedAtDesc(conversationId);
        return calls.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CallDTO> getCallsByUser(UUID userId) {
        List<Call> calls = callDAO.findByInitiatorIdOrderByCreatedAtDesc(userId);
        return calls.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CallDTO> getActiveCallsByConversation(UUID conversationId, UUID userId) {
        // Verify user is a member of the conversation
        if (!conversationMemberDAO.existsByConversationIdAndUserId(conversationId, userId)) {
            throw new RuntimeException("User is not a member of this conversation");
        }
        
        List<Call> calls = callDAO.findActiveCallsByConversationId(conversationId);
        return calls.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CallDTO> getActiveCallsByUser(UUID userId) {
        List<Call> calls = callDAO.findActiveCallsByInitiatorId(userId);
        return calls.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CallDTO> getCallHistory(UUID userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Call> callPage = callDAO.findByInitiatorIdOrderByCreatedAtDesc(userId, pageable);
        return callPage.getContent().stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isUserInCall(UUID userId) {
        List<Call> activeCalls = callDAO.findActiveCallsByInitiatorId(userId);
        return !activeCalls.isEmpty();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isConversationInCall(UUID conversationId) {
        List<Call> activeCalls = callDAO.findActiveCallsByConversationId(conversationId);
        return !activeCalls.isEmpty();
    }

    @Override
    public void cleanupExpiredCalls() {
        log.info("Cleaning up expired calls");
        
        // Find all ringing calls older than 60 seconds and mark them as canceled
        Instant sixtySecondsAgo = Instant.now().minusSeconds(60);
        List<Call> expiredRingingCalls = callDAO.findExpiredCallsByStatus(Call.CallStatus.ringing, sixtySecondsAgo);
        
        for (Call call : expiredRingingCalls) {
            log.info("Marking expired ringing call {} as canceled", call.getId());
            call.setStatus(Call.CallStatus.canceled);
            call.setEndedAt(Instant.now());
            callDAO.save(call);
        }
        
        // Find all ongoing calls older than 30 minutes and mark them as ended
        // This handles cases where calls end without proper cleanup
        Instant thirtyMinutesAgo = Instant.now().minusSeconds(30 * 60);
        List<Call> expiredOngoingCalls = callDAO.findExpiredCallsByStatus(Call.CallStatus.ongoing, thirtyMinutesAgo);
        
        for (Call call : expiredOngoingCalls) {
            log.info("Marking expired ongoing call {} as ended", call.getId());
            call.setStatus(Call.CallStatus.ended);
            call.setEndedAt(Instant.now());
            callDAO.save(call);
        }
        
        log.info("Cleaned up {} expired ringing calls and {} expired ongoing calls", 
                expiredRingingCalls.size(), expiredOngoingCalls.size());
    }

    private CallDTO convertToDTO(Call call) {
        long duration = 0;
        if (call.getStartedAt() != null && call.getEndedAt() != null) {
            duration = call.getEndedAt().getEpochSecond() - call.getStartedAt().getEpochSecond();
        } else if (call.getStartedAt() != null && call.getStatus() == Call.CallStatus.ongoing) {
            duration = Instant.now().getEpochSecond() - call.getStartedAt().getEpochSecond();
        }
        
        return CallDTO.builder()
            .id(call.getId())
            .conversationId(call.getConversation().getId())
            .initiatorId(call.getInitiator().getId())
            .initiatorName(call.getInitiator().getDisplayName() != null ? call.getInitiator().getDisplayName() : call.getInitiator().getUsername())
            .initiatorEmail(call.getInitiator().getEmail())
            .type(call.getType())
            .status(call.getStatus())
            .startedAt(call.getStartedAt())
            .endedAt(call.getEndedAt())
            .createdAt(call.getCreatedAt())
            .duration(duration)
            .conversationTitle(call.getConversation().getTitle())
            .build();
    }
}

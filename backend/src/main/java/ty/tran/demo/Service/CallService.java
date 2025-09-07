package ty.tran.demo.Service;

import ty.tran.demo.DTO.CallDTO;
import ty.tran.demo.Entity.Call;

import java.util.List;
import java.util.UUID;

public interface CallService {
    
    CallDTO createCall(UUID conversationId, UUID initiatorId, Call.CallType type);
    
    CallDTO updateCallStatus(UUID callId, Call.CallStatus status);
    
    CallDTO endCall(UUID callId, UUID userId);
    
    CallDTO getCallById(UUID callId, UUID userId);
    
    List<CallDTO> getCallsByConversation(UUID conversationId, UUID userId);
    
    List<CallDTO> getCallsByUser(UUID userId);
    
    List<CallDTO> getActiveCallsByConversation(UUID conversationId, UUID userId);
    
    List<CallDTO> getActiveCallsByUser(UUID userId);
    
    List<CallDTO> getCallHistory(UUID userId, int page, int size);
    
    boolean isUserInCall(UUID userId);
    
    boolean isConversationInCall(UUID conversationId);
    
    void cleanupExpiredCalls();
}



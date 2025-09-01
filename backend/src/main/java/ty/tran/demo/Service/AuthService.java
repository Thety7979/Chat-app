package ty.tran.demo.Service;

import ty.tran.demo.DTO.AuthRequest;
import ty.tran.demo.DTO.AuthResponse;
import ty.tran.demo.DTO.SignupRequest;

public interface AuthService {
    AuthResponse authenticate(AuthRequest request);
    AuthResponse signup(SignupRequest request);
    AuthResponse refreshToken(String refreshToken);
    boolean checkEmailExists(String email);
}

package ty.tran.demo.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ty.tran.demo.DTO.AuthRequest;
import ty.tran.demo.DTO.AuthResponse;
import ty.tran.demo.DTO.SignupRequest;
import ty.tran.demo.Service.AuthService;
import ty.tran.demo.Service.OAuth2Service;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private OAuth2Service oauth2Service;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        AuthResponse response = authService.authenticate(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@RequestBody SignupRequest request) {
        AuthResponse response = authService.signup(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        AuthResponse response = authService.refreshToken(refreshToken);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/check-email")
    public ResponseEntity<Map<String, Object>> checkEmail(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        boolean exists = authService.checkEmailExists(email);
        
        Map<String, Object> response = new HashMap<>();
        response.put("exists", exists);
        response.put("message", exists ? "Email tồn tại" : "Email không tồn tại");
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/oauth2/google")
    public ResponseEntity<AuthResponse> googleOAuth2(@RequestParam String providerId) {
        AuthResponse response = oauth2Service.processOAuth2Login("google", providerId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(@RequestHeader("Authorization") String token) {
        return ResponseEntity.ok("Logged out successfully");
    }
}

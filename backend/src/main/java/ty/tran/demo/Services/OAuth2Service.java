package ty.tran.demo.Services;

import ty.tran.demo.DTO.AuthResponse;
import ty.tran.demo.Entity.User;

public interface OAuth2Service {
    AuthResponse processOAuth2Login(String provider, String providerId);
    User processOAuth2User(String provider, String providerId, String email, String name, String picture);
}

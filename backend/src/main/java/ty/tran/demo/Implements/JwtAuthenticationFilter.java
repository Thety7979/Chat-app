package ty.tran.demo.Implements;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import ty.tran.demo.DAO.UserDAO;
import ty.tran.demo.Entity.User;
import ty.tran.demo.Services.JwtService;

import java.util.Collections;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDAO userDAO;

    public JwtAuthenticationFilter(JwtService jwtService, UserDAO userDAO) {
        this.jwtService = jwtService;
        this.userDAO = userDAO;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);
        try {
            userEmail = jwtService.extractUsername(jwt);
        } catch (Exception e) {
            filterChain.doFilter(request, response);
            return;
        }

        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            System.out.println("DEBUG - JWT Filter: Loading user details for: " + userEmail);
            User user = this.userDAO.findByEmail(userEmail)
                    .orElse(null);
            
            if (user != null) {
                System.out.println("DEBUG - JWT Filter: User found: " + user.getEmail());
                
                if (jwtService.isTokenValid(jwt, user.getEmail())) {
                    System.out.println("DEBUG - JWT Filter: Token is valid, setting authentication");
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            user, // Sử dụng Entity User thay vì UserDetails
                            null,
                            Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
                    );
                    authToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    System.out.println("DEBUG - JWT Filter: Authentication set successfully");
                } else {
                    System.out.println("DEBUG - JWT Filter: Token is invalid");
                }
            } else {
                System.out.println("DEBUG - JWT Filter: User not found for email: " + userEmail);
            }
        } else {
            System.out.println("DEBUG - JWT Filter: userEmail=" + userEmail + ", existingAuth=" + (SecurityContextHolder.getContext().getAuthentication() != null));
        }
        filterChain.doFilter(request, response);
    }
}

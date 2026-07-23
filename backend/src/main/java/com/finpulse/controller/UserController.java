package com.finpulse.controller;

import com.finpulse.dto.ApiResponse;
import com.finpulse.entity.User;
import com.finpulse.service.UserService;
import com.finpulse.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    private Long getUserId(Authentication auth) {
        String email = ((UserDetails) auth.getPrincipal()).getUsername();
        return userRepository.findByEmail(email).get().getId();
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<User>> getProfile(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Profile fetched", userService.getProfile(getUserId(auth))));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<User>> updateProfile(Authentication auth, @RequestBody Map<String, Object> updates) {
        return ResponseEntity.ok(ApiResponse.success("Profile updated", userService.updateProfile(getUserId(auth), updates)));
    }

    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(Authentication auth, @RequestBody Map<String, String> passwords) {
        userService.changePassword(getUserId(auth), passwords.get("oldPassword"), passwords.get("newPassword"));
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }
}

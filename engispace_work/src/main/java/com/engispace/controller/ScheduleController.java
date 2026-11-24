package com.engispace.controller;

import com.engispace.auth.UserAccountService;
import com.engispace.model.Schedule;
import com.engispace.model.UserAccount;
import com.engispace.service.ScheduleService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Path;
import java.util.*;

@RestController
@RequestMapping("/api/schedules")
public class ScheduleController {
    private final ScheduleService service; private final UserAccountService users;
    public ScheduleController(ScheduleService service,UserAccountService users){this.service=service;this.users=users;}
    @GetMapping public List<Schedule> all(Authentication auth){
        boolean admin=auth.getAuthorities().stream().anyMatch(a->a.getAuthority().equals("ROLE_ADMIN"));
        return admin?service.getAllSchedules():service.getSchedulesByUser(auth.getName());
    }
    @GetMapping("/active") public List<Map<String,Object>> active(Authentication auth){
        return service.getAllSchedules().stream().filter(s->"OCCUPIED".equalsIgnoreCase(s.getStatus())).map(s->{
            Map<String,Object> item=new LinkedHashMap<>();item.put("roomId",s.getRoomId());item.put("occupant",s.getOccupant());item.put("timeIn",s.getTimeIn());item.put("status",s.getStatus());item.put("mine",auth.getName().equalsIgnoreCase(s.getRequestedBy()));return item;
        }).toList();
    }
    @GetMapping("/mine") public List<Schedule> mine(Authentication auth){return service.getSchedulesByUser(auth.getName());}
    @PostMapping("/occupy") public ResponseEntity<?> occupy(@RequestBody Schedule request,Authentication auth){
        try{UserAccount user=users.findByUsername(auth.getName());return ResponseEntity.ok(service.occupy(request,user.getUsername(),user.getFullName()));}
        catch(IllegalArgumentException e){return ResponseEntity.badRequest().body(Map.of("message",e.getMessage()));}
        catch(IllegalStateException e){return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message",e.getMessage()));}
    }
    @PostMapping(value="/leave",consumes=MediaType.MULTIPART_FORM_DATA_VALUE) public ResponseEntity<?> leave(@RequestParam String roomId,@RequestParam("proof") MultipartFile proof,Authentication auth){
        try{return ResponseEntity.ok(service.leave(auth.getName(),roomId,proof));}
        catch(IllegalArgumentException e){return ResponseEntity.badRequest().body(Map.of("message",e.getMessage()));}
        catch(IllegalStateException e){return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message",e.getMessage()));}
    }
    @GetMapping("/proof/{filename:.+}") public ResponseEntity<Resource> proof(@PathVariable String filename,Authentication auth){
        boolean admin=auth.getAuthorities().stream().anyMatch(a->a.getAuthority().equals("ROLE_ADMIN"));if(!admin)return ResponseEntity.status(403).build();
        Path p=service.getProofPath(filename);if(p==null)return ResponseEntity.notFound().build();String f=filename.toLowerCase();MediaType type=f.endsWith(".png")?MediaType.IMAGE_PNG:f.endsWith(".webp")?MediaType.parseMediaType("image/webp"):MediaType.IMAGE_JPEG;
        return ResponseEntity.ok().contentType(type).header(HttpHeaders.CACHE_CONTROL,"no-store").body(new FileSystemResource(p));
    }
    @DeleteMapping("/{index}") public ResponseEntity<Void> delete(@PathVariable int index){return service.deleteSchedule(index)?ResponseEntity.noContent().build():ResponseEntity.notFound().build();}
}

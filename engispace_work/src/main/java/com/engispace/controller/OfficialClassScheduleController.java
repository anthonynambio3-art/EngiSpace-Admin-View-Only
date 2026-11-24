package com.engispace.controller;

import com.engispace.model.OfficialClassSchedule;
import com.engispace.service.OfficialClassScheduleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/class-schedules")
public class OfficialClassScheduleController {
    private final OfficialClassScheduleService service;
    public OfficialClassScheduleController(OfficialClassScheduleService service){this.service=service;}
    @GetMapping public List<OfficialClassSchedule> all(){return service.all();}
    @PostMapping public ResponseEntity<?> add(@RequestBody OfficialClassSchedule item){try{return ResponseEntity.ok(service.add(item));}catch(IllegalArgumentException e){return ResponseEntity.badRequest().body(Map.of("message",e.getMessage()));}}
    @PutMapping("/{id}") public ResponseEntity<?> update(@PathVariable String id,@RequestBody OfficialClassSchedule item){try{OfficialClassSchedule result=service.update(id,item);return result==null?ResponseEntity.notFound().build():ResponseEntity.ok(result);}catch(IllegalArgumentException e){return ResponseEntity.badRequest().body(Map.of("message",e.getMessage()));}}
    @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable String id){return service.delete(id)?ResponseEntity.noContent().build():ResponseEntity.notFound().build();}
}

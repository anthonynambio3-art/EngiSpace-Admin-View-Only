
package com.engispace.controller;

import com.engispace.model.Classroom;
import com.engispace.service.ClassroomService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classrooms")
@CrossOrigin(origins = "*")
public class ClassroomController {

    private final ClassroomService classroomService;

    public ClassroomController(ClassroomService classroomService) {
        this.classroomService = classroomService;
    }

    // Display all classrooms
    @GetMapping
    public List<Classroom> getAllClassrooms() {
        return classroomService.getAllClassrooms();
    }

    // Add classroom
    @PostMapping
    public ResponseEntity<?> addClassroom(@RequestBody Classroom classroom) {
        try {
            return ResponseEntity.ok(classroomService.addClassroom(classroom));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Search classroom by Room ID
    @GetMapping("/{roomId}")
    public ResponseEntity<Classroom> getClassroom(@PathVariable String roomId) {
        Classroom classroom = classroomService.getClassroomById(roomId);

        if (classroom == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(classroom);
    }

    // Update classroom
    @PutMapping("/{roomId}")
    public ResponseEntity<Classroom> updateClassroom(
            @PathVariable String roomId,
            @RequestBody Classroom updatedClassroom) {

        Classroom classroom = classroomService.updateClassroom(roomId, updatedClassroom);

        if (classroom == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(classroom);
    }

    // Delete classroom
    @DeleteMapping("/{roomId}")
    public ResponseEntity<Void> deleteClassroom(@PathVariable String roomId) {
        boolean deleted = classroomService.deleteClassroom(roomId);

        if (!deleted) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.noContent().build();
    }
}
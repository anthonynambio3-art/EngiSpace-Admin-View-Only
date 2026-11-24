
package com.engispace.service;

import com.engispace.model.Classroom;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class ClassroomService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final File file = new File(
            "src/main/resources/data/classrooms.json");

    // Read classroom records from JSON
    public List<Classroom> getAllClassrooms() {
        try {
            if (!file.exists()) {
                return new ArrayList<>();
            }

            return objectMapper.readValue(
                    file,
                    new TypeReference<List<Classroom>>() {
                    });

        } catch (IOException e) {
            throw new RuntimeException("Unable to read classroom data.", e);
        }
    }

    // Save classroom records to JSON
    private void saveClassrooms(List<Classroom> classrooms) {
        try {
            file.getParentFile().mkdirs();

            objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValue(file, classrooms);

        } catch (IOException e) {
            throw new RuntimeException("Unable to save classroom data.", e);
        }
    }

    // Add classroom
    public Classroom addClassroom(Classroom classroom) {
        List<Classroom> classrooms = getAllClassrooms();

        if (getClassroomById(classroom.getRoomId()) != null) {
            throw new IllegalArgumentException("Room ID already exists.");
        }

        classrooms.add(classroom);
        saveClassrooms(classrooms);

        return classroom;
    }

    // Find classroom by Room ID
    public Classroom getClassroomById(String roomId) {
        return getAllClassrooms().stream()
                .filter(classroom -> classroom.getRoomId().equalsIgnoreCase(roomId))
                .findFirst()
                .orElse(null);
    }

    // Update classroom
    public Classroom updateClassroom(String roomId, Classroom updatedClassroom) {
        List<Classroom> classrooms = getAllClassrooms();

        for (Classroom classroom : classrooms) {
            if (classroom.getRoomId().equalsIgnoreCase(roomId)) {
                classroom.setRoomName(updatedClassroom.getRoomName());
                classroom.setBuilding(updatedClassroom.getBuilding());
                classroom.setFloor(updatedClassroom.getFloor());
                classroom.setRoomType(updatedClassroom.getRoomType());

                saveClassrooms(classrooms);
                return classroom;
            }
        }

        return null;
    }

    // Delete classroom
    public boolean deleteClassroom(String roomId) {
        List<Classroom> classrooms = getAllClassrooms();

        boolean removed = classrooms.removeIf(classroom -> classroom.getRoomId().equalsIgnoreCase(roomId));

        if (removed) {
            saveClassrooms(classrooms);
        }

        return removed;
    }
}
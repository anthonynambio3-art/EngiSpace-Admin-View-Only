package com.engispace.service;

import com.engispace.model.Schedule;
import com.engispace.model.Classroom;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Service
public class ScheduleService {
    private final ObjectMapper mapper = new ObjectMapper();
    private final File file = new File("src/main/resources/data/schedules.json");
    private final Path proofDirectory = Path.of("uploads", "occupancy-exit");
    private final ClassroomService classrooms;

    public ScheduleService(ClassroomService classrooms){this.classrooms=classrooms;}

    public synchronized List<Schedule> getAllSchedules(){
        try { if(!file.exists()) return new ArrayList<>(); return mapper.readValue(file,new TypeReference<List<Schedule>>(){}); }
        catch(IOException e){throw new RuntimeException("Unable to read occupancy records.",e);}
    }
    public synchronized List<Schedule> getSchedulesByUser(String username){return getAllSchedules().stream().filter(s->same(username,s.getRequestedBy())).toList();}
    private void save(List<Schedule> list){try{file.getParentFile().mkdirs();mapper.writerWithDefaultPrettyPrinter().writeValue(file,list);}catch(IOException e){throw new RuntimeException("Unable to save occupancy records.",e);}}

    public synchronized Schedule occupy(Schedule record,String username,String fullName){
        if(record==null||blank(record.getRoomId())||blank(record.getProgram())||blank(record.getSection())||blank(record.getPurpose())) throw new IllegalArgumentException("Please complete Program, Section, and Purpose.");
        Classroom room=classrooms.getClassroomById(record.getRoomId());
        if(room==null) throw new IllegalArgumentException("The selected classroom does not exist.");
        boolean laboratory="LABORATORY".equalsIgnoreCase(room.getRoomType()) || room.getRoomName()!=null&&room.getRoomName().toLowerCase().contains("laboratory");
        if(laboratory&&(blank(record.getInstructor())||blank(record.getSubject()))) throw new IllegalArgumentException("Instructor and Subject are required for laboratory rooms.");
        List<Schedule> list=getAllSchedules();
        if(list.stream().anyMatch(s->same(record.getRoomId(),s.getRoomId())&&"OCCUPIED".equalsIgnoreCase(s.getStatus()))) throw new IllegalStateException("This classroom is already occupied.");
        LocalDateTime now=LocalDateTime.now(ZoneId.of("Asia/Manila"));
        record.setRequestedBy(username); record.setOccupant(fullName); record.setTimeIn(now.toString()); record.setTimeOut(null); record.setStatus("OCCUPIED");
        record.setExitPhoto(null);
        list.add(record); save(list); return record;
    }

    public synchronized Schedule leave(String username,String roomId,MultipartFile proof){
        if(proof==null||proof.isEmpty()) throw new IllegalArgumentException("A classroom photo is required before leaving.");
        if(proof.getSize()>5*1024*1024) throw new IllegalArgumentException("Photo must not exceed 5 MB.");
        String type=proof.getContentType();
        if(type==null||!List.of("image/jpeg","image/png","image/webp").contains(type.toLowerCase())) throw new IllegalArgumentException("Only JPG, PNG, or WEBP photos are accepted.");
        List<Schedule> list=getAllSchedules();
        for(int i=list.size()-1;i>=0;i--){Schedule s=list.get(i);
            if(same(roomId,s.getRoomId())&&"OCCUPIED".equalsIgnoreCase(s.getStatus())){
                if(!same(username,s.getRequestedBy())) throw new IllegalStateException("Only the user who occupied this room can end the occupancy.");
                try{Files.createDirectories(proofDirectory);String ext=type.equalsIgnoreCase("image/png")?".png":type.equalsIgnoreCase("image/webp")?".webp":".jpg";String name=UUID.randomUUID()+ext;Files.copy(proof.getInputStream(),proofDirectory.resolve(name),StandardCopyOption.REPLACE_EXISTING);s.setExitPhoto(name);s.setTimeOut(LocalDateTime.now(ZoneId.of("Asia/Manila")).toString());s.setStatus("COMPLETED");save(list);return s;}
                catch(IOException e){throw new RuntimeException("Unable to save classroom photo.",e);}
            }
        }
        throw new IllegalArgumentException("There is no active occupancy for this classroom.");
    }
    public Path getProofPath(String name){if(name==null||!name.matches("[a-fA-F0-9-]+\\.(jpg|png|webp)"))return null;Path p=proofDirectory.resolve(name).normalize();return Files.isRegularFile(p)?p:null;}
    public synchronized Schedule getScheduleByIndex(int i){List<Schedule> l=getAllSchedules();return i<0||i>=l.size()?null:l.get(i);}
    public synchronized boolean deleteSchedule(int i){List<Schedule> l=getAllSchedules();if(i<0||i>=l.size())return false;l.remove(i);save(l);return true;}
    private boolean same(String a,String b){return a!=null&&b!=null&&a.equalsIgnoreCase(b);} private boolean blank(String s){return s==null||s.isBlank();}
}

package com.engispace.service;

import com.engispace.model.Classroom;
import com.engispace.model.OfficialClassSchedule;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import java.io.File;
import java.io.IOException;
import java.util.*;

@Service
public class OfficialClassScheduleService {
    private final ObjectMapper mapper = new ObjectMapper();
    private final File file = new File("src/main/resources/data/class-schedules.json");
    private final ClassroomService classrooms;
    public OfficialClassScheduleService(ClassroomService classrooms){this.classrooms=classrooms;}

    public synchronized List<OfficialClassSchedule> all(){
        try { if(!file.exists()) return new ArrayList<>(); return mapper.readValue(file,new TypeReference<List<OfficialClassSchedule>>(){}); }
        catch(IOException e){throw new RuntimeException("Unable to read official class schedules.",e);}
    }
    public synchronized OfficialClassSchedule add(OfficialClassSchedule item){
        validate(item); item.setId(UUID.randomUUID().toString()); List<OfficialClassSchedule> list=all(); list.add(item); save(list); return item;
    }
    public synchronized OfficialClassSchedule update(String id,OfficialClassSchedule item){
        validate(item); List<OfficialClassSchedule> list=all();
        for(int i=0;i<list.size();i++) if(Objects.equals(list.get(i).getId(),id)){item.setId(id);list.set(i,item);save(list);return item;}
        return null;
    }
    public synchronized boolean delete(String id){List<OfficialClassSchedule> list=all();boolean changed=list.removeIf(s->Objects.equals(s.getId(),id));if(changed)save(list);return changed;}
    private void validate(OfficialClassSchedule s){
        if(s==null||blank(s.getRoomId())||(blank(s.getDayOfWeek())&&blank(s.getDate()))||blank(s.getStartTime())||blank(s.getEndTime())||blank(s.getProgram())||blank(s.getSection())||blank(s.getSubject())) throw new IllegalArgumentException("Please complete classroom, day, start time, end time, program, section, and subject.");
        if(!blank(s.getDayOfWeek())&&!Set.of("Monday","Tuesday","Wednesday","Thursday","Friday","Saturday").contains(s.getDayOfWeek())) throw new IllegalArgumentException("Select a valid school day from Monday to Saturday.");
        Classroom room=classrooms.getClassroomById(s.getRoomId()); if(room==null)throw new IllegalArgumentException("The selected classroom does not exist.");
        if(s.getEndTime().compareTo(s.getStartTime())<=0)throw new IllegalArgumentException("End time must be later than start time.");
    }
    private void save(List<OfficialClassSchedule> list){try{file.getParentFile().mkdirs();mapper.writerWithDefaultPrettyPrinter().writeValue(file,list);}catch(IOException e){throw new RuntimeException("Unable to save official class schedules.",e);}}
    private boolean blank(String s){return s==null||s.isBlank();}
}

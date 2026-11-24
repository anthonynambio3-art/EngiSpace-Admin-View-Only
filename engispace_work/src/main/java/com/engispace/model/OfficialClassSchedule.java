package com.engispace.model;

public class OfficialClassSchedule {
    private String id;
    private String roomId;
    // date is retained for compatibility with schedules saved by earlier versions.
    private String date;
    private String dayOfWeek;
    private String startTime;
    private String endTime;
    private String program;
    private String section;
    private String instructor;
    private String subject;

    public OfficialClassSchedule() {}
    public String getId(){return id;} public void setId(String v){id=v;}
    public String getRoomId(){return roomId;} public void setRoomId(String v){roomId=v;}
    public String getDate(){return date;} public void setDate(String v){date=v;}
    public String getDayOfWeek(){return dayOfWeek;} public void setDayOfWeek(String v){dayOfWeek=v;}
    public String getStartTime(){return startTime;} public void setStartTime(String v){startTime=v;}
    public String getEndTime(){return endTime;} public void setEndTime(String v){endTime=v;}
    public String getProgram(){return program;} public void setProgram(String v){program=v;}
    public String getSection(){return section;} public void setSection(String v){section=v;}
    public String getInstructor(){return instructor;} public void setInstructor(String v){instructor=v;}
    public String getSubject(){return subject;} public void setSubject(String v){subject=v;}
}

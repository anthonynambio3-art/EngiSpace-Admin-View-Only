package com.engispace.model;

public class Schedule {
    private String roomId;
    private String program;
    private String section;
    private String instructor;
    private String subject;
    private String purpose;
    private String timeIn;
    private String timeOut;
    private String requestedBy;
    private String occupant;
    private String status = "OCCUPIED";
    private String exitPhoto;

    public Schedule() {}
    public String getRoomId(){return roomId;} public void setRoomId(String v){roomId=v;}
    public String getProgram(){return program;} public void setProgram(String v){program=v;}
    public String getSection(){return section;} public void setSection(String v){section=v;}
    public String getInstructor(){return instructor;} public void setInstructor(String v){instructor=v;}
    public String getSubject(){return subject;} public void setSubject(String v){subject=v;}
    public String getPurpose(){return purpose;} public void setPurpose(String v){purpose=v;}
    public String getTimeIn(){return timeIn;} public void setTimeIn(String v){timeIn=v;}
    public String getTimeOut(){return timeOut;} public void setTimeOut(String v){timeOut=v;}
    public String getRequestedBy(){return requestedBy;} public void setRequestedBy(String v){requestedBy=v;}
    public String getOccupant(){return occupant;} public void setOccupant(String v){occupant=v;}
    public String getStatus(){return status==null?"OCCUPIED":status;} public void setStatus(String v){status=v;}
    public String getExitPhoto(){return exitPhoto;} public void setExitPhoto(String v){exitPhoto=v;}
}

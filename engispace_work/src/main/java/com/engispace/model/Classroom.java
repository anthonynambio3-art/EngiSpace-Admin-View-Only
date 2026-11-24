package com.engispace.model;

public class Classroom {
    private String roomId;
    private String roomName;
    private String building;
    private String floor;
    private String roomType = "CLASSROOM";
    public Classroom() {}
    public Classroom(String roomId,String roomName,String building,String floor){this.roomId=roomId;this.roomName=roomName;this.building=building;this.floor=floor;}
    public String getRoomId(){return roomId;} public void setRoomId(String v){roomId=v;}
    public String getRoomName(){return roomName;} public void setRoomName(String v){roomName=v;}
    public String getBuilding(){return building;} public void setBuilding(String v){building=v;}
    public String getFloor(){return floor;} public void setFloor(String v){floor=v;}
    public String getRoomType(){return roomType==null||roomType.isBlank()?"CLASSROOM":roomType;} public void setRoomType(String v){roomType=v;}
}

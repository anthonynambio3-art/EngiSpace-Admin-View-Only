
package com.engispace.tree;

import com.engispace.model.Classroom;
import java.util.List;

public class GeneralTree {

    private TreeNode root;

    public GeneralTree(List<Classroom> classrooms) {

        root = new TreeNode("College of Engineering");

        TreeNode elb = new TreeNode("ELB");
        TreeNode oldBuilding = new TreeNode("Old Engineering Building");

        root.addChild(elb);
        root.addChild(oldBuilding);

        addFloors(elb, 5);
        addFloors(oldBuilding, 3);

        for (Classroom classroom : classrooms) {

            TreeNode buildingNode = findBuilding(classroom.getBuilding());

            if (buildingNode != null) {
                TreeNode floorNode = findFloor(
                    buildingNode,
                    classroom.getFloor()
                );

                if (floorNode != null) {
                    floorNode.addChild(
                        new TreeNode(classroom.getRoomName())
                    );
                }
            }
        }
    }

    private void addFloors(TreeNode building, int floorCount) {

        for (int i = 1; i <= floorCount; i++) {

            String suffix;

            if (i == 1) suffix = "st";
            else if (i == 2) suffix = "nd";
            else if (i == 3) suffix = "rd";
            else suffix = "th";

            building.addChild(
                new TreeNode(i + suffix + " Floor")
            );
        }
    }

    private TreeNode findBuilding(String buildingName) {

        for (TreeNode building : root.getChildren()) {
            if (building.getName().equalsIgnoreCase(buildingName)) {
                return building;
            }
        }

        return null;
    }

    private TreeNode findFloor(TreeNode building, String floorName) {

        for (TreeNode floor : building.getChildren()) {
            if (floor.getName().equalsIgnoreCase(floorName)) {
                return floor;
            }
        }

        return null;
    }

    public TreeNode getRoot() {
        return root;
    }

    // Depth-First Search
    public boolean search(String target) {
        return dfs(root, target);
    }

    private boolean dfs(TreeNode node, String target) {

        if (node.getName().equalsIgnoreCase(target)) {
            return true;
        }

        for (TreeNode child : node.getChildren()) {
            if (dfs(child, target)) {
                return true;
            }
        }

        return false;
    }
}

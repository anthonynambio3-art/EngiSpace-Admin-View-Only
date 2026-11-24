
package com.engispace.controller;

import com.engispace.service.ClassroomService;
import com.engispace.tree.GeneralTree;
import com.engispace.tree.TreeNode;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tree")
@CrossOrigin(origins = "*")
public class TreeController {

    private final ClassroomService classroomService;

    public TreeController(ClassroomService classroomService) {
        this.classroomService = classroomService;
    }

    @GetMapping
    public TreeNode getTree() {

        GeneralTree tree = new GeneralTree(
            classroomService.getAllClassrooms()
        );

        return tree.getRoot();
    }
}

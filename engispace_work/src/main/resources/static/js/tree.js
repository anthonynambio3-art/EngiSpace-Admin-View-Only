
async function loadTree() {
    const display = document.getElementById("treeDisplay");

    display.innerHTML = "<p>Loading building structure...</p>";

    try {
        const response = await fetch("/api/tree");

        if (!response.ok) {
            throw new Error("Unable to load building structure.");
        }

        const tree = await response.json();

        display.innerHTML = "";

        const treeList = document.createElement("ul");
        treeList.className = "tree-list";

        treeList.appendChild(renderNode(tree, "root"));

        display.appendChild(treeList);

    } catch (error) {
        display.innerHTML = `
            <p class="tree-error">${error.message}</p>
        `;
    }
}

function renderNode(node, level) {
    const listItem = document.createElement("li");

    const details = document.createElement("details");
    details.className = `tree-details ${level}-details`;

    // Keep the root expanded
    if (level === "root") {
        details.open = true;
    }

    const summary = document.createElement("summary");
    summary.className = `tree-node ${level}-node`;
    summary.textContent = node.name;

    details.appendChild(summary);

    const children = node.children || [];

    if (children.length > 0) {
        const childList = document.createElement("ul");
        childList.className = "tree-list";

        children.forEach(child => {
            let childLevel;

            if (level === "root") {
                childLevel = "building";
            } else if (level === "building") {
                childLevel = "floor";
            } else {
                childLevel = "room";
            }

            if (childLevel === "room") {
                const roomItem = document.createElement("li");

                const room = document.createElement("span");
                room.className = "tree-node room-node";
                room.textContent = child.name;

                roomItem.appendChild(room);
                childList.appendChild(roomItem);

            } else {
                childList.appendChild(renderNode(child, childLevel));
            }
        });

        details.appendChild(childList);

    } else if (level === "floor") {
        const empty = document.createElement("p");
        empty.className = "empty-node";
        empty.textContent = "No classrooms available";

        details.appendChild(empty);
    }

    listItem.appendChild(details);

    return listItem;
}

// Automatically load the latest tree data
loadTree();
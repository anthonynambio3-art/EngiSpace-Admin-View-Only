
const API_URL = "/api/classrooms";

// HTML Elements
const tableBody = document.getElementById("classroomTableBody");
const modal = document.getElementById("classroomModal");
const form = document.getElementById("classroomForm");
const searchInput = document.getElementById("searchInput");

const buildingSelect = document.getElementById("building");
const floorSelect = document.getElementById("floor");

const addButton = document.getElementById("addButton");
const cancelButton = document.getElementById("cancelButton");

let classrooms = [];
let editingRoomId = null;
let isAdmin = false;


// ========================================
// FLOOR OPTIONS
// ========================================

function getOrdinal(number) {
    if (number === 1) return "st";
    if (number === 2) return "nd";
    if (number === 3) return "rd";
    return "th";
}

function updateFloorOptions(building, selectedFloor = "") {

    floorSelect.innerHTML = '<option value="">Select Floor</option>';

    let floorCount = 0;

    if (building === "ELB") {
        floorCount = 5;
    } else if (building === "Old Engineering Building") {
        floorCount = 3;
    }

    for (let i = 1; i <= floorCount; i++) {

        const option = document.createElement("option");
        const floor = `${i}${getOrdinal(i)} Floor`;

        option.value = floor;
        option.textContent = floor;

        floorSelect.appendChild(option);
    }

    floorSelect.value = selectedFloor;
}


// Update floors when building changes
buildingSelect.addEventListener("change", () => {
    updateFloorOptions(buildingSelect.value);
});


// ========================================
// LOAD CLASSROOMS
// ========================================

async function loadClassrooms() {

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to load classrooms.");
        }

        classrooms = await response.json();

        displayClassrooms(classrooms);

    } catch (error) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    Unable to load classrooms. Please check the server.
                </td>
            </tr>
        `;

        console.error(error);
    }
}


// ========================================
// DISPLAY CLASSROOMS
// ========================================

function displayClassrooms(data) {

    tableBody.innerHTML = "";

    if (data.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6">No classroom records found.</td>
            </tr>
        `;

        return;
    }

    data.forEach(room => {

        const row = document.createElement("tr");

        [
            room.roomId,
            room.roomName,
            room.building,
            room.floor,
            room.roomType === "LABORATORY" ? "Laboratory" : "Regular Classroom"
        ].forEach(value => {

            const cell = document.createElement("td");
            cell.textContent = value || "-";

            row.appendChild(cell);
        });

        if (isAdmin) {
            const actions = document.createElement("td");

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.textContent = "Edit";
            editButton.className = "action-btn";
            editButton.addEventListener("click", () => editClassroom(room.roomId));

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.textContent = "Delete";
            deleteButton.className = "action-btn delete-btn";
            deleteButton.addEventListener("click", () => deleteClassroom(room.roomId));

            actions.append(editButton, deleteButton);
            row.appendChild(actions);
        }

        tableBody.appendChild(row);
    });
}


// ========================================
// OPEN ADD CLASSROOM MODAL
// ========================================

function openClassroomModal() {

    if (!isAdmin) return;

    editingRoomId = null;

    form.reset();

    updateFloorOptions("");

    document.getElementById("roomId").disabled = false;

    document.getElementById("modalTitle").textContent = "Add Classroom";

    document.getElementById("formError").textContent = "";

    modal.classList.add("show");
}


// Support both the HTML onclick and event listener
addButton.addEventListener("click", openClassroomModal);


// ========================================
// CLOSE MODAL
// ========================================

function closeClassroomModal() {

    modal.classList.remove("show");

    form.reset();

    updateFloorOptions("");

    document.getElementById("roomId").disabled = false;

    document.getElementById("formError").textContent = "";

    editingRoomId = null;
}

cancelButton.addEventListener("click", closeClassroomModal);


// Close when clicking outside the modal
modal.addEventListener("click", event => {

    if (event.target === modal) {
        closeClassroomModal();
    }

});


// ========================================
// SAVE CLASSROOM
// ========================================

form.addEventListener("submit", async event => {

    event.preventDefault();
    if (!isAdmin) return;

    const classroom = {

        roomId: document.getElementById("roomId").value.trim(),

        roomName: document.getElementById("roomName").value.trim(),

        building: buildingSelect.value,

        floor: floorSelect.value,
        roomType: document.getElementById("roomType").value

    };

    if (
        !classroom.roomId ||
        !classroom.roomName ||
        !classroom.building ||
        !classroom.floor
    ) {

        document.getElementById("formError").textContent =
            "Please complete all fields.";

        return;
    }

    const isEditing = editingRoomId !== null;

    const url = isEditing
        ? `${API_URL}/${encodeURIComponent(editingRoomId)}`
        : API_URL;

    try {

        const response = await fetch(url, {

            method: isEditing ? "PUT" : "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(classroom)

        });

        if (!response.ok) {

            const errorMessage = await response.text();

            throw new Error(
                errorMessage || "Unable to save classroom."
            );
        }

        closeClassroomModal();

        await loadClassrooms();

        document.getElementById("message").textContent =
            isEditing
                ? "Classroom updated successfully."
                : "Classroom added successfully.";

    } catch (error) {

        document.getElementById("formError").textContent =
            error.message;

    }
});


// ========================================
// EDIT CLASSROOM
// ========================================

function editClassroom(roomId) {

    if (!isAdmin) return;

    const room = classrooms.find(item =>
        item.roomId === roomId
    );

    if (!room) return;

    editingRoomId = roomId;

    document.getElementById("roomId").value = room.roomId;
    document.getElementById("roomId").disabled = true;

    document.getElementById("roomName").value = room.roomName;
    document.getElementById("roomType").value = room.roomType || "CLASSROOM";

    buildingSelect.value = room.building;

    updateFloorOptions(room.building, room.floor);

    document.getElementById("modalTitle").textContent = "Edit Classroom";

    document.getElementById("formError").textContent = "";

    document.getElementById("message").textContent = "";

    modal.classList.add("show");
}


// ========================================
// DELETE CLASSROOM
// ========================================

async function deleteClassroom(roomId) {

    if (!isAdmin) return;

    const confirmed = confirm(
        `Are you sure you want to delete classroom ${roomId}?`
    );

    if (!confirmed) return;

    try {

        const response = await fetch(
            `${API_URL}/${encodeURIComponent(roomId)}`,
            {
                method: "DELETE"
            }
        );

        if (!response.ok) {
            throw new Error("Unable to delete classroom.");
        }

        await loadClassrooms();

        document.getElementById("message").textContent =
            "Classroom deleted successfully.";

    } catch (error) {

        document.getElementById("message").textContent =
            error.message;

    }
}


// ========================================
// SEARCH CLASSROOMS
// ========================================

searchInput.addEventListener("input", () => {

    const keyword = searchInput.value.toLowerCase();

    const filteredClassrooms = classrooms.filter(room => {

        const roomId = (room.roomId || "").toLowerCase();
        const roomName = (room.roomName || "").toLowerCase();

        return roomId.includes(keyword) ||
               roomName.includes(keyword);

    });

    displayClassrooms(filteredClassrooms);
});


// ========================================
// INITIAL LOADING AND ROLE CHECK
// ========================================

async function initializeClassroomsPage() {
    try {
        const response = await fetch("/api/auth/me", { credentials: "same-origin" });
        if (!response.ok) {
            window.location.replace("login.html");
            return;
        }

        const account = await response.json();
        isAdmin = account.role === "ADMIN";

        // Classroom management controls are visible to administrators only.
        addButton.hidden = !isAdmin;
        document.getElementById("actionsHeader").hidden = !isAdmin;
        modal.hidden = !isAdmin;

        // Update the table's empty/loading cell layout for regular users.
        const initialCell = tableBody.querySelector("td[colspan]");
        if (initialCell) initialCell.colSpan = isAdmin ? 5 : 4;

        await loadClassrooms();
    } catch (error) {
        console.error("Unable to verify account role:", error);
        window.location.replace("login.html");
    }
}

initializeClassroomsPage();
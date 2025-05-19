import Task from "../classes/task.js";

const tasks = [];
let modalCreate, modalEdit, modalDelete;
let modalCreateInstance, modalEditInstance, modalDeleteInstance;

document.addEventListener("DOMContentLoaded", () => {
    modalCreate = document.getElementById("modalCriarTarefa");
    modalEdit = document.getElementById("modalEditarTarefa");
    modalDelete = document.getElementById("modalApagarTarefa");

    modalCreateInstance = new bootstrap.Modal(modalCreate);
    modalEditInstance = new bootstrap.Modal(modalEdit);
    modalDeleteInstance = new bootstrap.Modal(modalDelete);

    const createTaskButton = document.getElementById("create-task-button");
    if (createTaskButton) {
        createTaskButton.addEventListener("click", handleCreateTask);
    }
});

function addTaskToTable(task) {
    const tableBody = document.querySelector("tbody");
    const row = document.createElement("tr");

    const idCell = document.createElement("td");
    idCell.textContent = task.getId();
    row.appendChild(idCell);

    const nameCell = document.createElement("td");
    nameCell.textContent = task.getName();
    row.appendChild(nameCell);

    const descriptionCell = document.createElement("td");
    descriptionCell.textContent = task.getDescription();
    row.appendChild(descriptionCell);

    const dateFinalCell = document.createElement("td");
    dateFinalCell.textContent = task.getEndDate();
    row.appendChild(dateFinalCell);

    const completedCell = document.createElement("td");
    const completedBadge = document.createElement("span");
    completedBadge.className = `badge ${task.getCompleted() ? "bg-success" : "bg-secondary"
        }`;
    completedBadge.textContent = task.getCompleted() ? "Sim" : "Não";
    completedCell.appendChild(completedBadge);
    row.appendChild(completedCell);

    const userCell = document.createElement("td");
    userCell.textContent = task.getUser();
    row.appendChild(userCell);

    const actionsCell = document.createElement("td");
    actionsCell.className = "text-center";

    const editButton = document.createElement("button");
    editButton.className = "btn btn-sm btn-warning me-1";

    const editIcon = document.createElement("i");
    editIcon.className = "bi bi-pencil-fill";
    editButton.appendChild(editIcon);
    editButton.appendChild(document.createTextNode(" Editar"));
    editButton.addEventListener("click", () => handleEditTask(task.getName()));
    actionsCell.appendChild(editButton);

    const deleteButton = document.createElement("button");
    deleteButton.className = "btn btn-sm btn-danger";

    const deleteIcon = document.createElement("i");
    deleteIcon.className = "bi bi-trash-fill";
    deleteButton.appendChild(deleteIcon);
    deleteButton.appendChild(document.createTextNode(" Apagar"));
    deleteButton.addEventListener("click", () =>
        handleDeleteTask(task.getName())
    );
    actionsCell.appendChild(deleteButton);

    row.appendChild(actionsCell);
    tableBody.appendChild(row);
}

function handleCreateTask() {
    const modal = document.getElementById("modalCriarTarefa");
    modalCreateInstance.show();

    const saveButton = modal.querySelector(".btn-success");

    const nameInput = document.getElementById("nome");
    const descriptionInput = document.getElementById("descricao");
    const endDateInput = document.getElementById("dataFim");
    const userInput = document.getElementById("utilizador");
    const completedInput = document.getElementById("concluida");

    const saveHandler = (e) => {
        e.preventDefault();

        const name = nameInput.value.trim();
        const endDate = endDateInput.value;
        const description = descriptionInput.value.trim();
        const username = userInput.value.trim();
        const completed = completedInput.checked;

        if (!name || !endDate || !username) {
            alert(
                "Por favor, preencha os campos obrigatórios: nome, data fim e utilizador."
            );
            return;
        }

        try {
            const task = new Task(name, description, endDate, completed, username);
            tasks.push(task);
            addTaskToTable(task);
            modalCreateInstance.hide();

            nameInput.value = "";
            endDateInput.value = "";
            descriptionInput.value = "";
            userInput.value = "";
            completedInput.checked = false;
        } catch (error) {
            alert(error.message);
        }
    };

    const newSaveButton = saveButton.cloneNode(true);
    saveButton.parentNode.replaceChild(newSaveButton, saveButton);
    newSaveButton.addEventListener("click", saveHandler);
}

function handleEditTask(taskName) {
    const task = tasks.find((t) => t.getName() === taskName);
    if (!task) {
        alert("Tarefa não encontrada.");
        return;
    }

    modalEditInstance.show();

    const modal = document.getElementById("modalEditarTarefa");
    const nameInput = document.getElementById("editarNome");
    const endDateInput = document.getElementById("editarDataFim");
    const descriptionInput = document.getElementById("editarDescricao");
    const userInput = document.getElementById("editarUtilizador");
    const completedInput = document.getElementById("editarConcluida");
    const saveButton = modal.querySelector(".btn-warning");

    nameInput.value = task.getName();
    endDateInput.value = task.getEndDate();
    descriptionInput.value = task.getDescription();
    userInput.value = task.getUser();
    completedInput.checked = task.getCompleted();


    const newSaveButton = saveButton.cloneNode(true);
    saveButton.parentNode.replaceChild(newSaveButton, saveButton);

    newSaveButton.addEventListener("click", () => {
        const newName = nameInput.value.trim();
        const newEndDate = endDateInput.value.trim();
        const newDescription = descriptionInput.value.trim();
        const newUser = userInput.value.trim();
        const newCompleted = completedInput.checked;

        if (!newName || !newEndDate || !newUser) {
            alert("Por favor, preencha os campos obrigatórios: nome, data fim e utilizador.");
            return;
        }

        task.setName(newName);
        task.setEndDate(newEndDate);
        task.setDescription(newDescription);
        task.setUser(newUser);
        task.setCompleted(newCompleted);

        const tableBody = document.querySelector("tbody");
        const rowToUpdate = Array.from(tableBody.querySelectorAll("tr")).find(
            (row) => {
                const nameCell = row.querySelector("td:nth-child(2)");
                return nameCell && nameCell.textContent === taskName;
            }
        );
        if (rowToUpdate) {
            rowToUpdate.querySelector("td:nth-child(2)").textContent = newName;
            rowToUpdate.querySelector("td:nth-child(3)").textContent = newDescription;
            rowToUpdate.querySelector("td:nth-child(4)").textContent = newEndDate;
            const completedCell = rowToUpdate.querySelector("td:nth-child(5) span");
            completedCell.className = `badge ${newCompleted ? "bg-success" : "bg-secondary"}`;
            completedCell.textContent = newCompleted ? "Sim" : "Não";
            rowToUpdate.querySelector("td:nth-child(6)").textContent = newUser;
        }

        modalEditInstance.hide();
    });
}

function handleDeleteTask(taskName) {
    const task = tasks.find((t) => t.getName() === taskName);
    if (!task) {
        alert("Tarefa não encontrada.");
        return;
    }

    modalDeleteInstance.show();

    const modal = document.getElementById("modalApagarTarefa");
    const confirmDeleteButton = modal.querySelector(".btn-danger");

    const modalBody = modal.querySelector(".modal-body");
    if (modalBody) {
        modalBody.innerHTML = `
            <p>Tens a certeza que queres apagar esta tarefa?</p>
            <p><strong>${task.getName()}</strong> - ${task.getUser()}</p>
        `;
    }

    const newButton = confirmDeleteButton.cloneNode(true);
    confirmDeleteButton.parentNode.replaceChild(newButton, confirmDeleteButton);

    newButton.addEventListener("click", () => {
        const index = tasks.findIndex((t) => t.getName() === taskName);
        if (index !== -1) {
            tasks.splice(index, 1);
        }

        const tableBody = document.querySelector("tbody");
        const rowToDelete = Array.from(tableBody.querySelectorAll("tr")).find(
            (row) => {
                const nameCell = row.querySelector("td:nth-child(2)");
                return nameCell && nameCell.textContent === taskName;
            }
        );
        if (rowToDelete) {
            tableBody.removeChild(rowToDelete);
        }

        modalDeleteInstance.hide();
    });
}

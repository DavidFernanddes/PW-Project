import Task from "../classes/task.js";
import Type from "../classes/type.js";

let modalCreate, modalEdit, modalDelete;
let modalCreateInstance, modalEditInstance, modalDeleteInstance;

document.addEventListener("DOMContentLoaded", () => {
    initializeModals();
    setupEventListeners();
    loadTaskTypes();
    loadExistingTasks();
    setupFilters();
});

function initializeModals() {
    modalCreate = document.getElementById("modalCriarTarefa");
    modalEdit = document.getElementById("modalEditarTarefa");
    modalDelete = document.getElementById("modalApagarTarefa");

    if (typeof bootstrap !== 'undefined') {
        modalCreateInstance = new bootstrap.Modal(modalCreate);
        modalEditInstance = new bootstrap.Modal(modalEdit);
        modalDeleteInstance = new bootstrap.Modal(modalDelete);
    }
}

function setupEventListeners() {
    const createTaskButton = document.getElementById("create-task-button");
    if (createTaskButton) {
        createTaskButton.addEventListener("click", handleCreateTask);
    }
}

function setupFilters() {
    const filterSelect = document.getElementById("filter");
    if (filterSelect) {
        filterSelect.addEventListener("change", handleFilterChange);
    }
}

function handleFilterChange(event) {
    const filterValue = event.target.value;
    const filteredTasks = Task.ListarPorFiltro(filterValue);
    updateTaskTable(filteredTasks);
}

function loadTaskTypes() {
    // Carregar tipos de tarefa nos selects dos modais
    const createTypeSelect = document.getElementById("tipoTarefa");
    const editTypeSelect = document.getElementById("editarTipoTarefa");
    
    if (createTypeSelect || editTypeSelect) {
        const types = Type.ListarTodos();
        const typeOptions = types.map(type => 
            `<option value="${type.getTypeId()}">${type.getName()}</option>`
        ).join('');
        
        if (createTypeSelect) {
            createTypeSelect.innerHTML = '<option value="">Selecione um tipo (opcional)</option>' + typeOptions;
        }
        if (editTypeSelect) {
            editTypeSelect.innerHTML = '<option value="">Selecione um tipo (opcional)</option>' + typeOptions;
        }
    }
}

function loadExistingTasks() {
    // Carregar tarefas existentes se houver
    const tasks = Task.ListarTodas();
    updateTaskTable(tasks);
}

function updateTaskTable(tasks) {
    const tableBody = document.querySelector("tbody");
    if (!tableBody) return;

    // Limpar tabela
    tableBody.innerHTML = '';

    // Adicionar cada tarefa
    tasks.forEach(task => {
        addTaskToTable(task);
    });
}

function addTaskToTable(task) {
    const tableBody = document.querySelector("tbody");
    if (!tableBody) return;

    const row = document.createElement("tr");

    // ID
    const idCell = document.createElement("td");
    idCell.textContent = task.getId();
    row.appendChild(idCell);

    // Nome
    const nameCell = document.createElement("td");
    nameCell.textContent = task.getName();
    row.appendChild(nameCell);

    // Descrição
    const descriptionCell = document.createElement("td");
    descriptionCell.textContent = task.getDescription() || '-';
    row.appendChild(descriptionCell);

    // Data Fim
    const dateFinalCell = document.createElement("td");
    dateFinalCell.textContent = new Date(task.getEndDate()).toLocaleDateString('pt-PT');
    row.appendChild(dateFinalCell);

    // Concluída
    const completedCell = document.createElement("td");
    const completedBadge = document.createElement("span");
    completedBadge.className = `badge ${task.getCompleted() ? "bg-success" : "bg-secondary"}`;
    completedBadge.textContent = task.getCompleted() ? "Sim" : "Não";
    completedCell.appendChild(completedBadge);
    row.appendChild(completedCell);

    // Utilizador
    const userCell = document.createElement("td");
    userCell.textContent = task.getUser();
    row.appendChild(userCell);

    // Tipo (se existir)
    const typeCell = document.createElement("td");
    if (task.getTypeId()) {
        const type = Type.ListarPorId(task.getTypeId());
        typeCell.textContent = type ? type.getName() : '-';
    } else {
        typeCell.textContent = '-';
    }
    row.appendChild(typeCell);

    // Ações
    const actionsCell = document.createElement("td");
    actionsCell.className = "text-center";

    const editButton = document.createElement("button");
    editButton.className = "btn btn-sm btn-warning me-1";
    const editIcon = document.createElement("i");
    editIcon.className = "bi bi-pencil-fill";
    editButton.appendChild(editIcon);
    editButton.appendChild(document.createTextNode(" Editar"));
    editButton.addEventListener("click", () => handleEditTask(task.getId()));
    actionsCell.appendChild(editButton);

    const deleteButton = document.createElement("button");
    deleteButton.className = "btn btn-sm btn-danger";
    const deleteIcon = document.createElement("i");
    deleteIcon.className = "bi bi-trash-fill";
    deleteButton.appendChild(deleteIcon);
    deleteButton.appendChild(document.createTextNode(" Apagar"));
    deleteButton.addEventListener("click", () => handleDeleteTask(task.getId()));
    actionsCell.appendChild(deleteButton);

    row.appendChild(actionsCell);
    tableBody.appendChild(row);
}

function handleCreateTask() {
    if (!modalCreateInstance) return;

    // Limpar campos do modal
    document.getElementById("nome").value = "";
    document.getElementById("descricao").value = "";
    document.getElementById("dataFim").value = "";
    document.getElementById("utilizador").value = "";
    document.getElementById("concluida").checked = false;
    
    const typeSelect = document.getElementById("tipoTarefa");
    if (typeSelect) typeSelect.value = "";

    modalCreateInstance.show();

    const saveButton = modalCreate.querySelector('.btn-success');
    const newSaveButton = saveButton.cloneNode(true);
    saveButton.parentNode.replaceChild(newSaveButton, saveButton);

    newSaveButton.addEventListener("click", (e) => {
        e.preventDefault();

        const name = document.getElementById("nome").value.trim();
        const description = document.getElementById("descricao").value.trim();
        const endDate = document.getElementById("dataFim").value;
        const username = document.getElementById("utilizador").value.trim();
        const completed = document.getElementById("concluida").checked;
        const typeId = typeSelect ? (typeSelect.value ? parseInt(typeSelect.value) : null) : null;

        try {
            const task = Task.Criar(name, description, endDate, completed, username, typeId);
            addTaskToTable(task);
            modalCreateInstance.hide();
            showSuccess("Tarefa criada com sucesso!");
        } catch (error) {
            showError(error.message);
        }
    });
}

function handleEditTask(taskId) {
    const task = Task.ListarPorId(taskId);
    if (!task) {
        showError("Tarefa não encontrada.");
        return;
    }

    modalEditInstance.show();

    // Preencher campos do modal
    document.getElementById("editarNome").value = task.getName();
    document.getElementById("editarDescricao").value = task.getDescription();
    document.getElementById("editarDataFim").value = task.getEndDate();
    document.getElementById("editarUtilizador").value = task.getUser();
    document.getElementById("editarConcluida").checked = task.getCompleted();
    
    const editTypeSelect = document.getElementById("editarTipoTarefa");
    if (editTypeSelect) {
        editTypeSelect.value = task.getTypeId() || "";
    }

    const saveButton = modalEdit.querySelector(".btn-warning");
    const newSaveButton = saveButton.cloneNode(true);
    saveButton.parentNode.replaceChild(newSaveButton, saveButton);

    newSaveButton.addEventListener("click", () => {
        const newName = document.getElementById("editarNome").value.trim();
        const newDescription = document.getElementById("editarDescricao").value.trim();
        const newEndDate = document.getElementById("editarDataFim").value.trim();
        const newUser = document.getElementById("editarUtilizador").value.trim();
        const newCompleted = document.getElementById("editarConcluida").checked;
        const newTypeId = editTypeSelect ? (editTypeSelect.value ? parseInt(editTypeSelect.value) : null) : null;

        try {
            Task.Editar(taskId, newName, newDescription, newEndDate, newCompleted, newUser, newTypeId);
            updateTaskTable(Task.ListarTodas());
            modalEditInstance.hide();
            showSuccess("Tarefa editada com sucesso!");
        } catch (error) {
            showError(error.message);
        }
    });
}

function handleDeleteTask(taskId) {
    const task = Task.ListarPorId(taskId);
    if (!task) {
        showError("Tarefa não encontrada.");
        return;
    }

    modalDeleteInstance.show();

    const modalBody = modalDelete.querySelector(".modal-body");
    if (modalBody) {
        modalBody.innerHTML = '';
        
        const p1 = document.createElement("p");
        p1.textContent = "Tens a certeza que queres apagar esta tarefa?";
        modalBody.appendChild(p1);

        const p2 = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = task.getName();
        p2.appendChild(strong);
        p2.appendChild(document.createTextNode(" - " + task.getUser()));
        modalBody.appendChild(p2);
    }

    const confirmDeleteButton = modalDelete.querySelector(".btn-danger");
    const newButton = confirmDeleteButton.cloneNode(true);
    confirmDeleteButton.parentNode.replaceChild(newButton, confirmDeleteButton);

    newButton.addEventListener("click", () => {
        try {
            Task.Apagar(taskId);
            updateTaskTable(Task.ListarTodas());
            modalDeleteInstance.hide();
            showSuccess("Tarefa apagada com sucesso!");
        } catch (error) {
            showError(error.message);
        }
    });
}

function showError(message) {
    const errorElement = document.getElementById("error-message");
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = "block";
        setTimeout(() => {
            errorElement.style.display = "none";
        }, 5000);
    } else {
        alert(message);
    }
}

function showSuccess(message) {
    // Criar elemento de sucesso temporário
    const successElement = document.createElement("div");
    successElement.className = "alert alert-success mt-3";
    successElement.textContent = message;
    
    const container = document.querySelector("main .container");
    if (container) {
        container.appendChild(successElement);
        setTimeout(() => {
            successElement.remove();
        }, 3000);
    }
}
let modalCreate, modalEdit, modalDelete;
let modalCreateInstance, modalEditInstance, modalDeleteInstance;

document.addEventListener("DOMContentLoaded", async () => {
    // Verificar estado de autenticação
    await authService.checkAuthStatus();
    
    if (!authService.isLoggedIn) {
        authService.showLoginModal();
        return;
    }

    initializeModals();
    setupEventListeners();
    await loadTaskTypes();
    await loadActiveUsers();
    await loadExistingTasks();
    setupFilters();
    setupUserInfo();
});

function setupUserInfo() {
    // Adicionar informação do utilizador à página
    const header = document.querySelector('header .container');
    if (header && authService.user) {
        const userInfo = document.createElement('div');
        userInfo.className = 'mt-2';
        userInfo.innerHTML = `
            <small>Utilizador: ${authService.user.name} (${authService.user.role})</small>
            <button class="btn btn-sm btn-outline-light ms-2" onclick="authService.logout()">Sair</button>
        `;
        header.appendChild(userInfo);
    }
}

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

async function handleFilterChange(event) {
    const filterValue = event.target.value;
    try {
        const response = await apiService.getTasks({ filter: filterValue });
        if (response.success) {
            updateTaskTable(response.data);
        } else {
            showError('Erro ao filtrar tarefas: ' + response.message);
        }
    } catch (error) {
        showError('Erro ao filtrar tarefas: ' + error.message);
    }
}

async function loadTaskTypes() {
    try {
        const response = await apiService.getTaskTypes();
        if (response.success) {
            const createTypeSelect = document.getElementById("tipoTarefa");
            const editTypeSelect = document.getElementById("editarTipoTarefa");
            
            const typeOptions = response.data.map(type => 
                `<option value="${type.id}">${type.name}</option>`
            ).join('');
            
            if (createTypeSelect) {
                createTypeSelect.innerHTML = '<option value="">Selecione um tipo (opcional)</option>' + typeOptions;
            }
            if (editTypeSelect) {
                editTypeSelect.innerHTML = '<option value="">Selecione um tipo (opcional)</option>' + typeOptions;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar tipos de tarefa:', error);
    }
}

async function loadActiveUsers() {
    try {
        const response = await apiService.getActiveUsers();
        if (response.success) {
            const createUserSelect = document.getElementById("utilizadorSelect");
            const editUserSelect = document.getElementById("editarUtilizadorSelect");
            
            // Criar elementos select de utilizador se não existirem
            if (!createUserSelect) {
                // Substituir input de texto por select
                const userInput = document.getElementById("utilizador");
                if (userInput) {
                    const select = document.createElement("select");
                    select.id = "utilizadorSelect";
                    select.className = "form-select";
                    select.required = true;
                    userInput.parentNode.replaceChild(select, userInput);
                }
            }
            
            if (!editUserSelect) {
                const userInput = document.getElementById("editarUtilizador");
                if (userInput) {
                    const select = document.createElement("select");
                    select.id = "editarUtilizadorSelect";
                    select.className = "form-select";
                    select.required = true;
                    userInput.parentNode.replaceChild(select, userInput);
                }
            }
            
            const userOptions = response.data.map(user => 
                `<option value="${user.id}">${user.name}</option>`
            ).join('');
            
            const createSelect = document.getElementById("utilizadorSelect");
            const editSelect = document.getElementById("editarUtilizadorSelect");
            
            if (createSelect) {
                createSelect.innerHTML = '<option value="">Selecione um utilizador</option>' + userOptions;
            }
            if (editSelect) {
                editSelect.innerHTML = '<option value="">Selecione um utilizador</option>' + userOptions;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar utilizadores:', error);
    }
}

async function loadExistingTasks() {
    try {
        const response = await apiService.getTasks();
        if (response.success) {
            updateTaskTable(response.data);
        } else {
            showError('Erro ao carregar tarefas: ' + response.message);
        }
    } catch (error) {
        showError('Erro ao carregar tarefas: ' + error.message);
    }
}

function updateTaskTable(tasks) {
    const tableBody = document.querySelector("tbody");
    if (!tableBody) return;

    tableBody.innerHTML = '';
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
    idCell.textContent = task.id;
    row.appendChild(idCell);

    // Nome
    const nameCell = document.createElement("td");
    nameCell.textContent = task.name;
    row.appendChild(nameCell);

    // Descrição
    const descriptionCell = document.createElement("td");
    descriptionCell.textContent = task.description || '-';
    row.appendChild(descriptionCell);

    // Data Fim
    const dateFinalCell = document.createElement("td");
    dateFinalCell.textContent = new Date(task.end_date).toLocaleDateString('pt-PT');
    row.appendChild(dateFinalCell);

    // Concluída
    const completedCell = document.createElement("td");
    const completedBadge = document.createElement("span");
    completedBadge.className = `badge ${task.completed ? "bg-success" : "bg-secondary"}`;
    completedBadge.textContent = task.completed ? "Sim" : "Não";
    completedCell.appendChild(completedBadge);
    row.appendChild(completedCell);

    // Utilizador
    const userCell = document.createElement("td");
    userCell.textContent = task.user_name || '-';
    row.appendChild(userCell);

    // Tipo
    const typeCell = document.createElement("td");
    typeCell.textContent = task.type_name || '-';
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
    editButton.addEventListener("click", () => handleEditTask(task.id));
    actionsCell.appendChild(editButton);

    const deleteButton = document.createElement("button");
    deleteButton.className = "btn btn-sm btn-danger";
    const deleteIcon = document.createElement("i");
    deleteIcon.className = "bi bi-trash-fill";
    deleteButton.appendChild(deleteIcon);
    deleteButton.appendChild(document.createTextNode(" Apagar"));
    deleteButton.addEventListener("click", () => handleDeleteTask(task.id));
    actionsCell.appendChild(deleteButton);

    row.appendChild(actionsCell);
    tableBody.appendChild(row);
}

function handleCreateTask() {
    if (!authService.requireAuth()) return;
    
    if (!modalCreateInstance) return;

    // Limpar campos do modal
    document.getElementById("nome").value = "";
    document.getElementById("descricao").value = "";
    document.getElementById("dataFim").value = "";
    document.getElementById("concluida").checked = false;
    
    const typeSelect = document.getElementById("tipoTarefa");
    const userSelect = document.getElementById("utilizadorSelect");
    
    if (typeSelect) typeSelect.value = "";
    if (userSelect) userSelect.value = "";

    modalCreateInstance.show();

    const saveButton = modalCreate.querySelector('.btn-success');
    const newSaveButton = saveButton.cloneNode(true);
    saveButton.parentNode.replaceChild(newSaveButton, saveButton);

    newSaveButton.addEventListener("click", async (e) => {
        e.preventDefault();

        const name = document.getElementById("nome").value.trim();
        const description = document.getElementById("descricao").value.trim();
        const endDate = document.getElementById("dataFim").value;
        const completed = document.getElementById("concluida").checked;
        const typeId = typeSelect ? (typeSelect.value ? parseInt(typeSelect.value) : null) : null;
        const userId = userSelect ? parseInt(userSelect.value) : null;

        if (!name || !endDate || !userId) {
            showError('Nome, data fim e utilizador são obrigatórios');
            return;
        }

        try {
            newSaveButton.disabled = true;
            newSaveButton.textContent = 'Guardando...';

            const taskData = {
                name,
                description: description || null,
                end_date: endDate,
                user_id: userId,
                type_id: typeId,
                completed
            };

            const response = await apiService.createTask(taskData);
            
            if (response.success) {
                await loadExistingTasks(); // Recarregar tarefas
                modalCreateInstance.hide();
                showSuccess("Tarefa criada com sucesso!");
            } else {
                showError(response.message || 'Erro ao criar tarefa');
            }
        } catch (error) {
            showError('Erro ao criar tarefa: ' + error.message);
        } finally {
            newSaveButton.disabled = false;
            newSaveButton.textContent = 'Guardar';
        }
    });
}

async function handleEditTask(taskId) {
    if (!authService.requireAuth()) return;
    
    try {
        const response = await apiService.getTask(taskId);
        if (!response.success) {
            showError("Tarefa não encontrada.");
            return;
        }

        const task = response.data;
        modalEditInstance.show();

        // Preencher campos do modal
        document.getElementById("editarNome").value = task.name;
        document.getElementById("editarDescricao").value = task.description || '';
        document.getElementById("editarDataFim").value = task.end_date;
        document.getElementById("editarConcluida").checked = task.completed;
        
        const editTypeSelect = document.getElementById("editarTipoTarefa");
        const editUserSelect = document.getElementById("editarUtilizadorSelect");
        
        if (editTypeSelect) {
            editTypeSelect.value = task.type_id || "";
        }
        if (editUserSelect) {
            editUserSelect.value = task.user_id || "";
        }

        const saveButton = modalEdit.querySelector(".btn-warning");
        const newSaveButton = saveButton.cloneNode(true);
        saveButton.parentNode.replaceChild(newSaveButton, saveButton);

        newSaveButton.addEventListener("click", async () => {
            const newName = document.getElementById("editarNome").value.trim();
            const newDescription = document.getElementById("editarDescricao").value.trim();
            const newEndDate = document.getElementById("editarDataFim").value.trim();
            const newCompleted = document.getElementById("editarConcluida").checked;
            const newTypeId = editTypeSelect ? (editTypeSelect.value ? parseInt(editTypeSelect.value) : null) : null;
            const newUserId = editUserSelect ? parseInt(editUserSelect.value) : null;

            if (!newName || !newEndDate || !newUserId) {
                showError('Nome, data fim e utilizador são obrigatórios');
                return;
            }

            try {
                newSaveButton.disabled = true;
                newSaveButton.textContent = 'Guardando...';

                const taskData = {
                    name: newName,
                    description: newDescription || null,
                    end_date: newEndDate,
                    user_id: newUserId,
                    type_id: newTypeId,
                    completed: newCompleted
                };

                const updateResponse = await apiService.updateTask(taskId, taskData);
                
                if (updateResponse.success) {
                    await loadExistingTasks(); // Recarregar tarefas
                    modalEditInstance.hide();
                    showSuccess("Tarefa editada com sucesso!");
                } else {
                    showError(updateResponse.message || 'Erro ao editar tarefa');
                }
            } catch (error) {
                showError('Erro ao editar tarefa: ' + error.message);
            } finally {
                newSaveButton.disabled = false;
                newSaveButton.textContent = 'Guardar Alterações';
            }
        });
    } catch (error) {
        showError('Erro ao carregar tarefa: ' + error.message);
    }
}

async function handleDeleteTask(taskId) {
    if (!authService.requireAuth()) return;
    
    try {
        const response = await apiService.getTask(taskId);
        if (!response.success) {
            showError("Tarefa não encontrada.");
            return;
        }

        const task = response.data;
        modalDeleteInstance.show();

        const modalBody = modalDelete.querySelector(".modal-body");
        if (modalBody) {
            modalBody.innerHTML = '';
            
            const p1 = document.createElement("p");
            p1.textContent = "Tens a certeza que queres apagar esta tarefa?";
            modalBody.appendChild(p1);

            const p2 = document.createElement("p");
            const strong = document.createElement("strong");
            strong.textContent = task.name;
            p2.appendChild(strong);
            p2.appendChild(document.createTextNode(" - " + task.user_name));
            modalBody.appendChild(p2);
        }

        const confirmDeleteButton = modalDelete.querySelector(".btn-danger");
        const newButton = confirmDeleteButton.cloneNode(true);
        confirmDeleteButton.parentNode.replaceChild(newButton, confirmDeleteButton);

        newButton.addEventListener("click", async () => {
            try {
                newButton.disabled = true;
                newButton.textContent = 'Apagando...';

                const deleteResponse = await apiService.deleteTask(taskId);
                
                if (deleteResponse.success) {
                    await loadExistingTasks(); // Recarregar tarefas
                    modalDeleteInstance.hide();
                    showSuccess("Tarefa apagada com sucesso!");
                } else {
                    showError(deleteResponse.message || 'Erro ao apagar tarefa');
                }
            } catch (error) {
                showError('Erro ao apagar tarefa: ' + error.message);
            } finally {
                newButton.disabled = false;
                newButton.textContent = 'Apagar';
            }
        });
    } catch (error) {
        showError('Erro ao carregar tarefa: ' + error.message);
    }
}

function showError(message) {
  const toastContainer = document.querySelector(".toast-container");
  if (!toastContainer) return;

  const toastId = `toast-error-${Date.now()}`;

  const toastHTML = `
    <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="5000">
      <div class="toast-header bg-danger text-white">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        <strong class="me-auto">Erro</strong>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        ${message}
      </div>
    </div>
  `;

  toastContainer.insertAdjacentHTML("beforeend", toastHTML);

  const toastElement = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastElement);

  toastElement.addEventListener("hidden.bs.toast", () => {
    toastElement.remove();
  });

  toast.show();
}

function showSuccess(message) {
  const toastContainer = document.querySelector(".toast-container");
  if (!toastContainer) return;

  const toastId = `toast-success-${Date.now()}`;

  const toastHTML = `
    <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="4000">
      <div class="toast-header bg-success text-white">
        <i class="bi bi-check-circle-fill me-2"></i>
        <strong class="me-auto">Sucesso</strong>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        ${message}
      </div>
    </div>
  `;

  toastContainer.insertAdjacentHTML("beforeend", toastHTML);

  const toastElement = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastElement);

  toastElement.addEventListener("hidden.bs.toast", () => {
    toastElement.remove();
  });

  toast.show();
}
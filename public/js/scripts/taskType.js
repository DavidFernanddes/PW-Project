let modalCreate, modalEdit, modalDelete;
let modalCreateInstance, modalEditInstance, modalDeleteInstance;

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar estado de autenticação
    await authService.checkAuthStatus();
    
    if (!authService.isLoggedIn) {
        authService.showLoginModal();
        return;
    }

    // Verificar permissões (Administrador ou Gestor)
    if (!authService.isAdminOrManager()) {
        showError('Não tem permissões para aceder a esta página');
        setTimeout(() => {
            window.location.href = '/';
        }, 3000);
        return;
    }

    initializeModals();
    setupEventListeners();
    await loadExistingTypes();
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
    modalCreate = document.getElementById('modalCriarTipo');
    modalEdit = document.getElementById('modalEditarTipo');
    modalDelete = document.getElementById('modalApagarTipo');

    if (typeof bootstrap !== 'undefined') {
        modalCreateInstance = new bootstrap.Modal(modalCreate);
        modalEditInstance = new bootstrap.Modal(modalEdit);
        modalDeleteInstance = new bootstrap.Modal(modalDelete);
    }
}

function setupEventListeners() {
    const createTypeButton = document.getElementById('create-type-button');
    if (createTypeButton) {
        createTypeButton.addEventListener('click', handleCreateType);
    }
}

async function loadExistingTypes() {
    try {
        const response = await apiService.getTaskTypes();
        if (response.success) {
            updateTypeTable(response.data);
        } else {
            showError('Erro ao carregar tipos de tarefa: ' + response.message);
        }
    } catch (error) {
        showError('Erro ao carregar tipos de tarefa: ' + error.message);
    }
}

function updateTypeTable(types) {
    const tableBody = document.querySelector('tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    types.forEach(type => {
        addTypeToTable(type);
    });
}

function addTypeToTable(type) {
    const tableBody = document.querySelector('tbody');
    if (!tableBody) return;

    const row = document.createElement('tr');

    // ID
    const idCell = document.createElement('td');
    idCell.textContent = type.id;
    row.appendChild(idCell);

    // Nome
    const nameCell = document.createElement('td');
    nameCell.textContent = type.name;
    row.appendChild(nameCell);

    // Ações
    const actionsCell = document.createElement('td');
    actionsCell.className = 'text-center';

    const editButton = document.createElement('button');
    editButton.className = 'btn btn-sm btn-warning me-1';
    const editIcon = document.createElement('i');
    editIcon.className = 'bi bi-pencil-fill';
    editButton.appendChild(editIcon);
    editButton.appendChild(document.createTextNode(' Editar'));
    editButton.addEventListener('click', () => handleEditType(type.id));
    actionsCell.appendChild(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn btn-sm btn-danger';
    const deleteIcon = document.createElement('i');
    deleteIcon.className = 'bi bi-trash-fill';
    deleteButton.appendChild(deleteIcon);
    deleteButton.appendChild(document.createTextNode(' Apagar'));
    deleteButton.addEventListener('click', () => handleDeleteType(type.id));
    actionsCell.appendChild(deleteButton);

    row.appendChild(actionsCell);
    tableBody.appendChild(row);
}

function handleCreateType() {
    if (!authService.requirePermission(['Administrador', 'Gestor'])) return;
    
    if (!modalCreateInstance) return;

    // Limpar campo
    document.getElementById('nomeTipo').value = '';

    modalCreateInstance.show();

    const saveButton = modalCreate.querySelector('.btn-success');
    const newSaveButton = saveButton.cloneNode(true);
    saveButton.parentNode.replaceChild(newSaveButton, saveButton);

    newSaveButton.addEventListener("click", async () => {
        const typeName = document.getElementById('nomeTipo').value.trim();

        if (!typeName) {
            showError('Nome do tipo é obrigatório');
            return;
        }

        try {
            newSaveButton.disabled = true;
            newSaveButton.textContent = 'Guardando...';

            const response = await apiService.createTaskType({ name: typeName });
            
            if (response.success) {
                await loadExistingTypes(); // Recarregar tipos
                modalCreateInstance.hide();
                showSuccess('Tipo de tarefa criado com sucesso!');
            } else {
                showError(response.message || 'Erro ao criar tipo de tarefa');
            }
        } catch (error) {
            showError('Erro ao criar tipo de tarefa: ' + error.message);
        } finally {
            newSaveButton.disabled = false;
            newSaveButton.textContent = 'Guardar';
        }
    });
}

async function handleEditType(id) {
    if (!authService.requirePermission(['Administrador', 'Gestor'])) return;
    
    try {
        const response = await apiService.getTaskType(id);
        if (!response.success) {
            showError('Tipo não encontrado.');
            return;
        }

        const typeToEdit = response.data;
        modalEditInstance.show();

        // Preencher campo
        document.getElementById('editarNomeTipo').value = typeToEdit.name;

        const editButton = modalEdit.querySelector('.btn-warning');
        const newEditButton = editButton.cloneNode(true);
        editButton.parentNode.replaceChild(newEditButton, editButton);

        newEditButton.addEventListener('click', async () => {
            const newTypeName = document.getElementById('editarNomeTipo').value.trim();
            
            if (!newTypeName) {
                showError('Nome do tipo é obrigatório');
                return;
            }

            try {
                newEditButton.disabled = true;
                newEditButton.textContent = 'Guardando...';

                const updateResponse = await apiService.updateTaskType(id, { name: newTypeName });
                
                if (updateResponse.success) {
                    await loadExistingTypes(); // Recarregar tipos
                    modalEditInstance.hide();
                    showSuccess('Tipo de tarefa editado com sucesso!');
                } else {
                    showError(updateResponse.message || 'Erro ao editar tipo de tarefa');
                }
            } catch (error) {
                showError('Erro ao editar tipo de tarefa: ' + error.message);
            } finally {
                newEditButton.disabled = false;
                newEditButton.textContent = 'Guardar Alterações';
            }
        });
    } catch (error) {
        showError('Erro ao carregar tipo: ' + error.message);
    }
}

async function handleDeleteType(id) {
    if (!authService.requirePermission(['Administrador', 'Gestor'])) return;
    
    try {
        const response = await apiService.getTaskType(id);
        if (!response.success) {
            showError('Tipo não encontrado.');
            return;
        }

        const typeToDelete = response.data;

        const modalBody = modalDelete.querySelector('.modal-body');
        if (modalBody) {
            modalBody.innerHTML = '';

            const p1 = document.createElement('p');
            p1.textContent = 'Tens a certeza que queres apagar este tipo de tarefa?';
            modalBody.appendChild(p1);

            const p2 = document.createElement('p');
            const strong = document.createElement('strong');
            strong.textContent = typeToDelete.name;
            p2.appendChild(strong);
            modalBody.appendChild(p2);
        }

        modalDeleteInstance.show();

        const deleteButton = modalDelete.querySelector('.btn-danger');
        const newDeleteButton = deleteButton.cloneNode(true);
        deleteButton.parentNode.replaceChild(newDeleteButton, deleteButton);

        newDeleteButton.addEventListener('click', async () => {
            try {
                newDeleteButton.disabled = true;
                newDeleteButton.textContent = 'Apagando...';

                const deleteResponse = await apiService.deleteTaskType(id);
                
                if (deleteResponse.success) {
                    await loadExistingTypes(); // Recarregar tipos
                    modalDeleteInstance.hide();
                    showSuccess('Tipo de tarefa apagado com sucesso!');
                } else {
                    showError(deleteResponse.message || 'Erro ao apagar tipo de tarefa');
                }
            } catch (error) {
                showError('Erro ao apagar tipo de tarefa: ' + error.message);
            } finally {
                newDeleteButton.disabled = false;
                newDeleteButton.textContent = 'Apagar';
            }
        });
    } catch (error) {
        showError('Erro ao carregar tipo: ' + error.message);
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
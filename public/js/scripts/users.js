let modalCreate, modalEdit, modalDelete;
let modalCreateInstance, modalEditInstance, modalDeleteInstance;

document.addEventListener("DOMContentLoaded", async () => {
  // Check authentication status
  await authService.checkAuthStatus();
  
  if (!authService.isLoggedIn) {
    authService.showLoginModal();
    return;
  }

  // Check permissions (Admin or Manager)
  if (!authService.isAdminOrManager()) {
    showError('Não tem permissões para aceder a esta página');
    setTimeout(() => {
      window.location.href = '/';
    }, 3000);
    return;
  }

  initializeModals();
  setupEventListeners();
  await loadExistingUsers();
  setupUserInfo();
});

function setupUserInfo() {
  // Add user info to the page
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
  modalCreate = document.getElementById("modalCriarUtilizador");
  modalEdit = document.getElementById("modalEditarUtilizador");
  modalDelete = document.getElementById("modalApagarUtilizador");

  if (typeof bootstrap !== "undefined") {
    modalCreateInstance = new bootstrap.Modal(modalCreate);
    modalEditInstance = new bootstrap.Modal(modalEdit);
    modalDeleteInstance = new bootstrap.Modal(modalDelete);
  }
}

function setupEventListeners() {
  const createUserButton = document.getElementById("create-user-button");
  if (createUserButton) {
    createUserButton.addEventListener("click", handleCreateUser);
  }
}

async function loadExistingUsers() {
  try {
    const response = await apiService.getUsers();
    if (response.success) {
      updateUserTable(response.data);
    } else {
      showError('Erro ao carregar utilizadores: ' + response.message);
    }
  } catch (error) {
    showError('Erro ao carregar utilizadores: ' + error.message);
  }
}

function updateUserTable(users) {
  const tableBody = document.querySelector("tbody");
  if (!tableBody) return;

  tableBody.innerHTML = "";
  users.forEach((user) => {
    addUserToTable(user);
  });
}

function addUserToTable(user) {
  const tableBody = document.querySelector("tbody");
  if (!tableBody) return;

  const row = document.createElement("tr");

  // ID
  const idCell = document.createElement("td");
  idCell.textContent = user.id;
  row.appendChild(idCell);

  // Nome
  const nameCell = document.createElement("td");
  nameCell.textContent = user.name;
  row.appendChild(nameCell);

  // Username
  const usernameCell = document.createElement("td");
  usernameCell.textContent = user.username;
  row.appendChild(usernameCell);

  // Ativo
  const activeCell = document.createElement("td");
  const activeBadge = document.createElement("span");
  activeBadge.className = `badge ${
    user.active ? "bg-success" : "bg-secondary"
  }`;
  activeBadge.textContent = user.active ? "Sim" : "Não";
  activeCell.appendChild(activeBadge);
  row.appendChild(activeCell);

  // Role
  const roleCell = document.createElement("td");
  roleCell.textContent = user.role;
  row.appendChild(roleCell);

  // Ações
  const actionsCell = document.createElement("td");
  actionsCell.className = "text-center";

  const editButton = document.createElement("button");
  editButton.className = "btn btn-sm btn-warning me-1";
  const editIcon = document.createElement("i");
  editIcon.className = "bi bi-pencil-fill";
  editButton.appendChild(editIcon);
  editButton.appendChild(document.createTextNode(" Editar"));
  editButton.addEventListener("click", () => handleEditUser(user.id));
  actionsCell.appendChild(editButton);

  const deleteButton = document.createElement("button");
  deleteButton.className = "btn btn-sm btn-danger";
  const deleteIcon = document.createElement("i");
  deleteIcon.className = "bi bi-trash-fill";
  deleteButton.appendChild(deleteIcon);
  deleteButton.appendChild(document.createTextNode(" Apagar"));
  deleteButton.addEventListener("click", () => handleDeleteUser(user.id));
  actionsCell.appendChild(deleteButton);

  row.appendChild(actionsCell);
  tableBody.appendChild(row);
}

function handleCreateUser() {
  if (!authService.requirePermission(['Administrador', 'Gestor'])) return;
  
  if (!modalCreateInstance) return;

  // Limpar campos
  document.getElementById("nome").value = "";
  document.getElementById("username").value = "";
  document.getElementById("ativo").checked = false;
  const roleSelect = document.getElementById("create-role");
  if (roleSelect) roleSelect.value = "";

  modalCreateInstance.show();

  const saveButton = modalCreate.querySelector(".btn-success");
  const newSaveButton = saveButton.cloneNode(true);
  saveButton.parentNode.replaceChild(newSaveButton, saveButton);

  newSaveButton.addEventListener("click", async () => {
    const name = document.getElementById("nome").value.trim();
    const username = document.getElementById("username").value.trim();
    const active = document.getElementById("ativo").checked;
    const role = roleSelect ? roleSelect.value : "";

    if (!name || !username || !role) {
      showError('Nome, username e role são obrigatórios');
      return;
    }

    try {
      newSaveButton.disabled = true;
      newSaveButton.textContent = 'Guardando...';

      const userData = {
        name,
        username,
        role,
        active
      };

      const response = await apiService.createUser(userData);
      
      if (response.success) {
        await loadExistingUsers(); // Reload users
        modalCreateInstance.hide();
        showSuccess("Utilizador criado com sucesso!");
      } else {
        showError(response.message || 'Erro ao criar utilizador');
      }
    } catch (error) {
      showError('Erro ao criar utilizador: ' + error.message);
    } finally {
      newSaveButton.disabled = false;
      newSaveButton.textContent = 'Guardar';
    }
  });
}

async function handleEditUser(userId) {
  if (!authService.requirePermission(['Administrador', 'Gestor'])) return;
  
  try {
    const response = await apiService.getUser(userId);
    if (!response.success) {
      showError("Utilizador não encontrado.");
      return;
    }

    const user = response.data;
    modalEditInstance.show();

    // Preencher campos
    document.getElementById("edit-nome").value = user.name;
    document.getElementById("edit-username").value = user.username;
    document.getElementById("edit-ativo").checked = user.active;
    const roleSelect = document.getElementById("edit-role");
    if (roleSelect) roleSelect.value = user.role;

    const saveButton = modalEdit.querySelector(".btn-warning");
    const newSaveButton = saveButton.cloneNode(true);
    saveButton.parentNode.replaceChild(newSaveButton, saveButton);

    newSaveButton.addEventListener("click", async () => {
      const newName = document.getElementById("edit-nome").value.trim();
      const newUsername = document.getElementById("edit-username").value.trim();
      const newActive = document.getElementById("edit-ativo").checked;
      const newRole = roleSelect ? roleSelect.value : "";

      if (!newName || !newUsername || !newRole) {
        showError('Nome, username e role são obrigatórios');
        return;
      }

      try {
        newSaveButton.disabled = true;
        newSaveButton.textContent = 'Guardando...';

        const userData = {
          name: newName,
          username: newUsername,
          role: newRole,
          active: newActive
        };

        const updateResponse = await apiService.updateUser(userId, userData);
        
        if (updateResponse.success) {
          await loadExistingUsers(); // Reload users
          modalEditInstance.hide();
          showSuccess("Utilizador editado com sucesso!");
        } else {
          showError(updateResponse.message || 'Erro ao editar utilizador');
        }
      } catch (error) {
        showError('Erro ao editar utilizador: ' + error.message);
      } finally {
        newSaveButton.disabled = false;
        newSaveButton.textContent = 'Guardar Alterações';
      }
    });
  } catch (error) {
    showError('Erro ao carregar utilizador: ' + error.message);
  }
}

async function handleDeleteUser(userId) {
  if (!authService.requirePermission(['Administrador', 'Gestor'])) return;
  
  try {
    const response = await apiService.getUser(userId);
    if (!response.success) {
      showError("Utilizador não encontrado.");
      return;
    }

    const user = response.data;

    const modalBody = modalDelete.querySelector(".modal-body p strong");
    if (modalBody) {
      modalBody.textContent = `"${user.name}"`;
    }

    modalDeleteInstance.show();

    const confirmDeleteButton = modalDelete.querySelector(".btn-danger");
    const newConfirmButton = confirmDeleteButton.cloneNode(true);
    confirmDeleteButton.parentNode.replaceChild(
      newConfirmButton,
      confirmDeleteButton
    );

    newConfirmButton.addEventListener("click", async () => {
      try {
        newConfirmButton.disabled = true;
        newConfirmButton.textContent = 'Apagando...';

        const deleteResponse = await apiService.deleteUser(userId);
        
        if (deleteResponse.success) {
          await loadExistingUsers(); // Reload users
          modalDeleteInstance.hide();
          showSuccess("Utilizador apagado com sucesso!");
        } else {
          showError(deleteResponse.message || 'Erro ao apagar utilizador');
        }
      } catch (error) {
        showError('Erro ao apagar utilizador: ' + error.message);
      } finally {
        newConfirmButton.disabled = false;
        newConfirmButton.textContent = 'Apagar';
      }
    });
  } catch (error) {
    showError('Erro ao carregar utilizador: ' + error.message);
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
import User from "../classes/user.js";

let modalCreate, modalEdit, modalDelete;
let modalCreateInstance, modalEditInstance, modalDeleteInstance;

document.addEventListener("DOMContentLoaded", () => {
  initializeModals();
  setupEventListeners();
  loadExistingUsers();
});

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

function loadExistingUsers() {
  const users = User.ListarTodos();
  updateUserTable(users);
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
  idCell.textContent = user.getId();
  row.appendChild(idCell);

  // Nome
  const nameCell = document.createElement("td");
  nameCell.textContent = user.getName();
  row.appendChild(nameCell);

  // Username
  const usernameCell = document.createElement("td");
  usernameCell.textContent = user.getUsername();
  row.appendChild(usernameCell);

  // Ativo
  const activeCell = document.createElement("td");
  const activeBadge = document.createElement("span");
  activeBadge.className = `badge ${
    user.getActive() ? "bg-success" : "bg-secondary"
  }`;
  activeBadge.textContent = user.getActive() ? "Sim" : "Não";
  activeCell.appendChild(activeBadge);
  row.appendChild(activeCell);

  // Role
  const roleCell = document.createElement("td");
  roleCell.textContent = user.getRole();
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
  editButton.addEventListener("click", () => handleEditUser(user.getId()));
  actionsCell.appendChild(editButton);

  const deleteButton = document.createElement("button");
  deleteButton.className = "btn btn-sm btn-danger";
  const deleteIcon = document.createElement("i");
  deleteIcon.className = "bi bi-trash-fill";
  deleteButton.appendChild(deleteIcon);
  deleteButton.appendChild(document.createTextNode(" Apagar"));
  deleteButton.addEventListener("click", () => handleDeleteUser(user.getId()));
  actionsCell.appendChild(deleteButton);

  row.appendChild(actionsCell);
  tableBody.appendChild(row);
}

function handleCreateUser() {
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

  newSaveButton.addEventListener("click", () => {
    const name = document.getElementById("nome").value.trim();
    const username = document.getElementById("username").value.trim();
    const active = document.getElementById("ativo").checked;
    const role = roleSelect ? roleSelect.value : "";

    try {
      const user = User.Criar(name, username, "", active, role);
      addUserToTable(user);
      modalCreateInstance.hide();
      showSuccess("Utilizador criado com sucesso!");
    } catch (error) {
      showError(error.message);
    }
  });
}

function handleEditUser(userId) {
  const user = User.ListarPorId(userId);
  if (!user) {
    showError("Utilizador não encontrado.");
    return;
  }

  modalEditInstance.show();

  // Preencher campos
  document.getElementById("edit-nome").value = user.getName();
  document.getElementById("edit-username").value = user.getUsername();
  document.getElementById("edit-ativo").checked = user.getActive();
  const roleSelect = document.getElementById("edit-role");
  if (roleSelect) roleSelect.value = user.getRole();

  const saveButton = modalEdit.querySelector(".btn-warning");
  const newSaveButton = saveButton.cloneNode(true);
  saveButton.parentNode.replaceChild(newSaveButton, saveButton);

  newSaveButton.addEventListener("click", () => {
    const newName = document.getElementById("edit-nome").value.trim();
    const newUsername = document.getElementById("edit-username").value.trim();
    const newActive = document.getElementById("edit-ativo").checked;
    const newRole = roleSelect ? roleSelect.value : "";

    try {
      User.Editar(userId, newName, newUsername, "", newActive, newRole);
      updateUserTable(User.ListarTodos());
      modalEditInstance.hide();
      showSuccess("Utilizador editado com sucesso!");
    } catch (error) {
      showError(error.message);
    }
  });
}

function handleDeleteUser(userId) {
  const user = User.ListarPorId(userId);
  if (!user) {
    showError("Utilizador não encontrado.");
    return;
  }

  const modalBody = modalDelete.querySelector(".modal-body p strong");
  if (modalBody) {
    modalBody.textContent = `"${user.getName()}"`;
  }

  modalDeleteInstance.show();

  const confirmDeleteButton = modalDelete.querySelector(".btn-danger");
  const newConfirmButton = confirmDeleteButton.cloneNode(true);
  confirmDeleteButton.parentNode.replaceChild(
    newConfirmButton,
    confirmDeleteButton
  );

  newConfirmButton.addEventListener("click", () => {
    try {
      User.Apagar(userId);
      updateUserTable(User.ListarTodos());
      modalDeleteInstance.hide();
      showSuccess("Utilizador apagado com sucesso!");
    } catch (error) {
      showError(error.message);
    }
  });
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

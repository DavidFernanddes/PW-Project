import Type from '../classes/type.js';
import Task from '../classes/task.js';

let modalCreate, modalEdit, modalDelete;
let modalCreateInstance, modalEditInstance, modalDeleteInstance;

document.addEventListener('DOMContentLoaded', () => {
    initializeModals();
    setupEventListeners();
    loadExistingTypes();
});

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

function loadExistingTypes() {
    const types = Type.ListarTodos();
    updateTypeTable(types);
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
    idCell.textContent = type.getTypeId();
    row.appendChild(idCell);

    // Nome
    const nameCell = document.createElement('td');
    nameCell.textContent = type.getName();
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
    editButton.addEventListener('click', () => handleEditType(type.getTypeId()));
    actionsCell.appendChild(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn btn-sm btn-danger';
    const deleteIcon = document.createElement('i');
    deleteIcon.className = 'bi bi-trash-fill';
    deleteButton.appendChild(deleteIcon);
    deleteButton.appendChild(document.createTextNode(' Apagar'));
    deleteButton.addEventListener('click', () => handleDeleteType(type.getTypeId()));
    actionsCell.appendChild(deleteButton);

    row.appendChild(actionsCell);
    tableBody.appendChild(row);
}

function handleCreateType() {
    if (!modalCreateInstance) return;

    // Limpar campo
    document.getElementById('nomeTipo').value = '';

    modalCreateInstance.show();

    const saveButton = modalCreate.querySelector('.btn-success');
    const newSaveButton = saveButton.cloneNode(true);
    saveButton.parentNode.replaceChild(newSaveButton, saveButton);

    newSaveButton.addEventListener("click", () => {
        const typeName = document.getElementById('nomeTipo').value.trim();

        try {
            const newType = Type.Criar(typeName);
            addTypeToTable(newType);
            modalCreateInstance.hide();
            showSuccess('Tipo de tarefa criado com sucesso!');
        } catch (error) {
            showError(error.message);
        }
    });
}

function handleEditType(id) {
    const typeToEdit = Type.ListarPorId(id);
    if (!typeToEdit) {
        showError('Tipo não encontrado.');
        return;
    }

    modalEditInstance.show();

    // Preencher campo
    document.getElementById('editarNomeTipo').value = typeToEdit.getName();

    const editButton = modalEdit.querySelector('.btn-warning');
    const newEditButton = editButton.cloneNode(true);
    editButton.parentNode.replaceChild(newEditButton, editButton);

    newEditButton.addEventListener('click', () => {
        const newTypeName = document.getElementById('editarNomeTipo').value.trim();
        
        try {
            Type.Editar(id, newTypeName);
            updateTypeTable(Type.ListarTodos());
            modalEditInstance.hide();
            showSuccess('Tipo de tarefa editado com sucesso!');
        } catch (error) {
            showError(error.message);
        }
    });
}

function handleDeleteType(id) {
    const typeToDelete = Type.ListarPorId(id);
    if (!typeToDelete) {
        showError('Tipo não encontrado.');
        return;
    }

    const modalBody = modalDelete.querySelector('.modal-body');
    if (modalBody) {
        modalBody.innerHTML = '';

        const p1 = document.createElement('p');
        p1.textContent = 'Tens a certeza que queres apagar este tipo de tarefa?';
        modalBody.appendChild(p1);

        const p2 = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = typeToDelete.getName();
        p2.appendChild(strong);
        modalBody.appendChild(p2);
    }

    modalDeleteInstance.show();

    const deleteButton = modalDelete.querySelector('.btn-danger');
    const newDeleteButton = deleteButton.cloneNode(true);
    deleteButton.parentNode.replaceChild(newDeleteButton, deleteButton);

    newDeleteButton.addEventListener('click', () => {
        try {
            const allTasks = Task.ListarTodas();
            Type.Apagar(id, allTasks);
            updateTypeTable(Type.ListarTodos());
            modalDeleteInstance.hide();
            showSuccess('Tipo de tarefa apagado com sucesso!');
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
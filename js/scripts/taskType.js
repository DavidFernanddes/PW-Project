import Type from '../classes/type.js';

const taskTypes = [];
const modalElement = document.getElementById('modalCriarTipo');
const modalInstance = new bootstrap.Modal(modalElement);

function handleCreateType() {
    modalInstance.show();

    const saveButton = modalElement.querySelector('.btn-success');
    const inputField = document.getElementById('nomeTipo');

    const saveHandler = () => {
        const typeName = inputField.value.trim();
        if (!typeName) {
            alert('Por favor, insira um nome válido.');
            return;
        }

        try {
            const newType = new Type().Criar(typeName);
            taskTypes.push(newType);
            addTypeToTable(newType);
            modalInstance.hide();
            inputField.value = '';
        } catch (error) {
            alert(error.message);
        } finally {
            saveButton.removeEventListener('click', saveHandler);
        }
    };

    saveButton.addEventListener('click', saveHandler);
}


function addTypeToTable(type) {
    const tableBody = document.querySelector('tbody');
    const row = document.createElement('tr');

    const idCell = document.createElement('td');
    idCell.textContent = type.getTypeId();
    row.appendChild(idCell);

    const nameCell = document.createElement('td');
    nameCell.textContent = type.getName();
    row.appendChild(nameCell);

    const actionsCell = document.createElement('td');
    actionsCell.className = 'text-center';

    const editButton = document.createElement('button');
    editButton.className = 'btn btn-sm btn-warning me-1';
    const editIcon = document.createElement('i');
    editIcon.className = 'bi bi-pencil-fill';
    editButton.appendChild(editIcon);
    editButton.appendChild(document.createTextNode(' Editar'));
    actionsCell.appendChild(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn btn-sm btn-danger';
    const deleteIcon = document.createElement('i');
    deleteIcon.className = 'bi bi-trash-fill';
    deleteButton.appendChild(deleteIcon);
    deleteButton.appendChild(document.createTextNode(' Apagar'));
    actionsCell.appendChild(deleteButton);

    row.appendChild(actionsCell);

    tableBody.appendChild(row);
}

function handleDeleteType(id) {
    try {
        if (!confirm('Tem certeza que deseja apagar este tipo?')) {
            return;
        }
        const updatedTypes = new Type().Apagar(id, taskTypes);
        taskTypes.length = 0;
        taskTypes.push(...updatedTypes);

        alert('Tipo apagado com sucesso');
        const tableBody = document.querySelector('tbody');
        const rowToDelete = Array.from(tableBody.querySelectorAll('tr')).find(row => {
            const idCell = row.querySelector('td:first-child');
            return idCell && idCell.textContent === id.toString();
        });
        if (rowToDelete) {
            tableBody.removeChild(rowToDelete);
        }
    } catch (error) {
        alert(error.message);
    }
}

function handleEditType(id) {   
    const newTypeName = prompt('Digite o novo nome do tipo de tarefa:');
    if (newTypeName) {
        try {
            const updatedType = new Type().Editar(id, newTypeName);
            const tableBody = document.querySelector('tbody');
            const rowToEdit = Array.from(tableBody.querySelectorAll('tr')).find(row => {
                const idCell = row.querySelector('td:first-child');
                return idCell && idCell.textContent === id.toString();
            });
            if (rowToEdit) {
                const nameCell = rowToEdit.querySelector('td:nth-child(2)');
                nameCell.textContent = updatedType.getName();
            }
            alert('Tipo editado com sucesso');
        } catch (error) {
            alert(error.message);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const createTypeButton = document.getElementById('create-type-button');
    if (createTypeButton) {
        createTypeButton.addEventListener('click', handleCreateType);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const deleteTypeButon = document.getElementById('delete-type-button');
    if (deleteTypeButon) {
        deleteTypeButon.addEventListener('click', handleDeleteType);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const editTypeButon = document.getElementById('edit-type-button');
    if (editTypeButon) {
        editTypeButon.addEventListener('click', handleEditType);
    }
});

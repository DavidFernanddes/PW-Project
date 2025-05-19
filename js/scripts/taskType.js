import Type from '../classes/type.js';

const taskTypes = [];
let modalCreate, modalEdit, modalDelete;
let modalCreateInstance, modalEditInstance, modalDeleteInstance;

document.addEventListener('DOMContentLoaded', () => {
    modalCreate = document.getElementById('modalCriarTipo');
    modalEdit = document.getElementById('modalEditarTipo');
    modalDelete = document.getElementById('modalApagarTipo');

    modalCreateInstance = new bootstrap.Modal(modalCreate);
    modalEditInstance = new bootstrap.Modal(modalEdit);
    modalDeleteInstance = new bootstrap.Modal(modalDelete);

    const createTypeButton = document.getElementById('create-type-button');
    if (createTypeButton) {
        createTypeButton.addEventListener('click', handleCreateType);
    }
});

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
    modalCreateInstance.show();

    const saveButton = modalCreate.querySelector('.btn-success');
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
            modalCreateInstance.hide();
            inputField.value = '';
        } catch (error) {
            alert(error.message);
        } finally {
            saveButton.removeEventListener('click', saveHandler);
        }
    };

    saveButton.addEventListener('click', saveHandler);
}



function handleEditType(id) {  
    modalEditInstance.show();
    const editButton = modalEdit.querySelector('.btn-warning');
    const inputField = document.getElementById('editarNomeTipo');

    const editHandeler = () => {
        const newTypeName = inputField.value.trim();
        try {
            const updatedType = new Type().Editar(id, newTypeName);
            const tableBody = document.querySelector('tbody');
            modalEditInstance.hide();
            inputField.value = '';

            const rowToEdit = Array.from(tableBody.querySelectorAll('tr')).find(row => {
                const idCell = row.querySelector('td:first-child');
                return idCell && idCell.textContent === id.toString();
            });
            if (rowToEdit) {
                const nameCell = rowToEdit.querySelector('td:nth-child(2)');
                nameCell.textContent = updatedType.getName();
            }
        } catch (error) {
            alert(error.message);
        } finally {
            editButton.removeEventListener('click', editHandeler);
        }
    };

    editButton.addEventListener('click', editHandeler);
}

function handleDeleteType(id) {
    const typeToDelete = taskTypes.find(t => t.getTypeId() === id);

    const modalBody = modalDelete.querySelector('.modal-body');
    if (modalBody && typeToDelete) {
        while (modalBody.firstChild) {
            modalBody.removeChild(modalBody.firstChild);
        }

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

    const deleteHandler = () => {
        try {
            const updatedTypes = new Type().Apagar(id, taskTypes);
            taskTypes.length = 0;
            taskTypes.push(...updatedTypes);
            modalDeleteInstance.hide();

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
        } finally {
            deleteButton.removeEventListener('click', deleteHandler);
        }
    };

    deleteButton.addEventListener('click', deleteHandler);
}

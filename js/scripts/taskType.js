import Type from '../classes/type.js';

const taskTypes = [];

function handleCreateType() {
    const typeName = prompt('Digite o nome do novo tipo de tarefa:');
    if (typeName) {
        try {
            const newType = new Type().Criar(typeName);
            taskTypes.push(newType);
            addTypeToTable(newType);
        } catch (error) {
            alert(error.message);
        }
    }
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

    const editButton = document.createElement('button');
    editButton.id = 'edit-type-button';
    editButton.textContent = 'Editar';
    editButton.addEventListener('click', () => handleEditType(type.getTypeId()));
    actionsCell.appendChild(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.id = 'delete-type-button';
    deleteButton.textContent = 'Apagar';
    deleteButton.addEventListener('click', () => handleDeleteType(type.getTypeId()));
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

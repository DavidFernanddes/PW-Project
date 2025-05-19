import User from '../classes/user.js';

const users = [];
const modalCreate = document.getElementById('modalCriarUtilizador');
const modalCreateInstance = new bootstrap.Modal(modalCreate);

const modalEdit = document.getElementById('modalEditarUtilizador');
const modalEditInstance = new bootstrap.Modal(modalEdit);

const modalDelete = document.getElementById('modalApagarUtilizador');
const modalDeleteInstance = new bootstrap.Modal(modalDelete);

function addUserToTable(user) {
    const tableBody = document.querySelector('tbody');
    const row = document.createElement('tr');

    const idCell = document.createElement('td');
    idCell.textContent = user.getId();
    row.appendChild(idCell);

    const nameCell = document.createElement('td');
    nameCell.textContent = user.getName();
    row.appendChild(nameCell);

    const usernameCell = document.createElement('td');
    usernameCell.textContent = user.getUsername();
    row.appendChild(usernameCell);

    const activeCell = document.createElement('td');
    const activeBadge = document.createElement('span');
    activeBadge.className = `badge ${user.getActive() ? 'bg-success' : 'bg-secondary'}`;
    activeBadge.textContent = user.getActive() ? 'Sim' : 'Não';
    activeCell.appendChild(activeBadge);
    row.appendChild(activeCell);

    const roleCell = document.createElement('td');
    roleCell.textContent = user.getRole();
    row.appendChild(roleCell);

    const actionsCell = document.createElement('td');
    actionsCell.className = 'text-center';

    const editButton = document.createElement('button');
    editButton.className = 'btn btn-sm btn-warning me-1';

    const editIcon = document.createElement('i');
    editIcon.className = 'bi bi-pencil-fill';
    editButton.appendChild(editIcon);
    editButton.appendChild(document.createTextNode(' Editar'));
    editButton.addEventListener('click', () => handleEditUser(user.getUsername()));
    actionsCell.appendChild(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn btn-sm btn-danger';

    const deleteIcon = document.createElement('i');
    deleteIcon.className = 'bi bi-trash-fill';
    deleteButton.appendChild(deleteIcon);
    deleteButton.appendChild(document.createTextNode(' Apagar'));
    deleteButton.addEventListener('click', () => handleDeleteUser(user.getUsername()));
    actionsCell.appendChild(deleteButton);

    row.appendChild(actionsCell);
    tableBody.appendChild(row);
}

function handleCreateUser() {
    modalCreateInstance.show();

    const saveButton = modalCreate.querySelector('.btn-success');

    const nameInput = document.getElementById('nome');
    const usernameInput = document.getElementById('username');
    const activeInput = document.getElementById('ativo');
    const roleInput = document.getElementById('create-role');

    const saveHandler = () => {
        const name = nameInput.value.trim();
        const username = usernameInput.value.trim();
        const active = activeInput.checked;
        const role = roleInput.value;

        if (!name || !username || !role || role === 'Escolha uma opção') {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        try {
            const password = '';
            const user = new User(name, username, password, active, role);
            users.push(user);
            addUserToTable(user);
            modalCreateInstance.hide();
            nameInput.value = '';
            usernameInput.value = '';
            activeInput.checked = false;
            roleInput.value = 'Escolha uma opção';
        } catch (error) {
            alert(error.message);
        } finally {
            saveButton.removeEventListener('click', saveHandler);
        }
    };

    saveButton.removeEventListener('click', saveHandler);
    saveButton.addEventListener('click', saveHandler);
}

function handleEditUser(username) {
    modalEditInstance.show();

    const user = users.find(u => u.getUsername() === username);
    if (!user) {
        alert('Utilizador não encontrado.');
        return;
    }

    const nameInput = document.getElementById('edit-nome');
    const usernameInput = document.getElementById('edit-username');
    const activeInput = document.getElementById('edit-ativo');
    const roleInput = document.getElementById('edit-role');
    const saveButton = modalEdit.querySelector('.btn-warning');

    nameInput.value = user.getName();
    usernameInput.value = user.getUsername();
    activeInput.checked = user.getActive();
    roleInput.value = user.getRole();

    const saveHandler = () => {
        const newName = nameInput.value.trim();
        const newUsername = usernameInput.value.trim();
        const newActive = activeInput.checked;
        const newRole = roleInput.value;

        if (!newName || !newUsername || !newRole) {
            alert('Todos os campos são obrigatórios.');
            return;
        }

        try {
            user.setName(newName);
            user.setUsername(newUsername);
            user.setActive(newActive);
            user.setRole(newRole);

            const tableBody = document.querySelector('tbody');
            const rowToEdit = Array.from(tableBody.querySelectorAll('tr')).find(row => {
                const usernameCell = row.querySelector('td:nth-child(3)');
                return usernameCell && usernameCell.textContent === username;
            });

            if (rowToEdit) {
                rowToEdit.querySelector('td:nth-child(2)').textContent = newName;   // Nome
                rowToEdit.querySelector('td:nth-child(3)').textContent = newUsername; // Username
                const activeCell = rowToEdit.querySelector('td:nth-child(4) span');
                activeCell.textContent = newActive ? 'Sim' : 'Não';
                activeCell.className = `badge ${newActive ? 'bg-success' : 'bg-secondary'}`;
                rowToEdit.querySelector('td:nth-child(5)').textContent = newRole;   // Role
            }

            modalEditInstance.hide();
        } catch (error) {
            alert(error.message);
        } finally {
            saveButton.removeEventListener('click', saveHandler);
        }
    };

    saveButton.removeEventListener('click', saveHandler);
    saveButton.addEventListener('click', saveHandler);
}

function handleDeleteUser(username) {
    const user = users.find(u => u.getUsername() === username);
    if (!user) {
        alert('Utilizador não encontrado.');
        return;
    }

    const modalBody = modalDelete.querySelector('.modal-body p strong');
    modalBody.textContent = `"${user.getName()}"`;

    modalDeleteInstance.show();

    const confirmDeleteButton = modalDelete.querySelector('.btn-danger');

    const newConfirmHandler = () => {
        const index = users.findIndex(u => u.getUsername() === username);
        if (index !== -1) {
            users.splice(index, 1);
        }

        const tableBody = document.querySelector('tbody');
        const rowToDelete = Array.from(tableBody.querySelectorAll('tr')).find(row => {
            const usernameCell = row.querySelector('td:nth-child(3)');
            return usernameCell && usernameCell.textContent === username;
        });
        if (rowToDelete) {
            tableBody.removeChild(rowToDelete);
        }

        modalDeleteInstance.hide();

        confirmDeleteButton.removeEventListener('click', newConfirmHandler);
    };

    confirmDeleteButton.removeEventListener('click', newConfirmHandler);
    confirmDeleteButton.addEventListener('click', newConfirmHandler);
}


document.addEventListener('DOMContentLoaded', () => {
    const createUserButton = document.getElementById('create-user-button');
    if (createUserButton) {
        createUserButton.addEventListener('click', handleCreateUser);
    }
});
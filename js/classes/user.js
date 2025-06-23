import Roles from '../enum/roles.js';

export default class User {
    static currentId = 1;
    static users = [];
    
    #id
    #name
    #username
    #password
    #active
    #role

    constructor(name, username, password = '', active = false, role) {
        this.#id = User.currentId++;
        this.#name = name;
        this.#username = username;
        this.#password = password;
        this.#active = active;
        this.#role = role;
    }

    // Getters
    getId() { return this.#id; }
    getName() { return this.#name; }
    getUsername() { return this.#username; }
    getPassword() { return this.#password; }
    getActive() { return this.#active; }
    getRole() { return this.#role; }

    // Setters
    setName(name) { this.#name = name; }
    setUsername(username) { this.#username = username; }
    setPassword(password) { this.#password = password; }
    setActive(active) { this.#active = active; }
    setRole(role) {
        const validRoles = Object.values(Roles);
        if (!validRoles.includes(role)) {
            throw new Error('Role inválido');
        }
        this.#role = role;
    }

    static Criar(name, username, password = '', active = false, role) {
        if (!name || !username || !role) {
            throw new Error('Nome, username e role são obrigatórios');
        }

        if (User.users.find(user => user.getUsername().toLowerCase() === username.toLowerCase())) {
            throw new Error('Já existe um utilizador com este username. Escolha outro username.');
        }

        const validRoles = Object.values(Roles);
        if (!validRoles.includes(role)) {
            throw new Error('Role inválido');
        }

        const newUser = new User(name, username, password, active, role);
        User.users.push(newUser);
        return newUser;
    }

    static Editar(id, name, username, password, active, role) {
        const user = User.users.find(u => u.getId() === id);
        if (!user) {
            throw new Error('Utilizador não encontrado');
        }

        if (!name || !username || !role) {
            throw new Error('Nome, username e role são obrigatórios');
        }

        // Verificar se o username já existe (exceto para o próprio user)
        const existingUser = User.users.find(u => 
            u.getUsername().toLowerCase() === username.toLowerCase() && 
            u.getId() !== id
        );
        if (existingUser) {
            throw new Error('Já existe um utilizador com este username.');
        }

        const validRoles = Object.values(Roles);
        if (!validRoles.includes(role)) {
            throw new Error('Role inválido');
        }

        user.setName(name);
        user.setUsername(username);
        if (password) user.setPassword(password);
        user.setActive(active);
        user.setRole(role);

        return user;
    }

    static Apagar(id) {
        const userIndex = User.users.findIndex(user => user.getId() === id);
        if (userIndex === -1) {
            throw new Error('Utilizador não encontrado');
        }
        
        User.users.splice(userIndex, 1);
        return User.users;
    }

    static ListarTodos() {
        return User.users;
    }

    static ListarPorId(id) {
        return User.users.find(user => user.getId() === id);
    }

    static ListarPorUsername(username) {
        return User.users.find(user => user.getUsername().toLowerCase() === username.toLowerCase());
    }

    static ListarAtivos() {
        return User.users.filter(user => user.getActive());
    }
}
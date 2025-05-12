export default class User {
    static currentId = 0;
    #id
    #name
    #username
    #password
    #active
    #role

    constructor(name, username, password, active, role) {
        this.#id = User.currentId++;
        this.#name = name;
        this.#username = username;
        this.#password = password;
        this.#active = active;
        this.#role = role;
    }

    getId() {
        return this.#id;
    }
    getName() {
        return this.#name;
    }
    getUsername() {
        return this.#username;
    }
    getPassword() {
        return this.#password;
    }
    getActive() {
        return this.#active;
    }
    getRole() {
        return this.#role;
    }
    setName(name) {
        this.#name = name;
    }
    setUsername(username) {
        this.#username = username;
    }
    setPassword(password) {
        this.#password = password;
    }
    setActive(active) {
        this.#active = active;
    }
    setRole(role) {
        const validRoles = Object.values(Roles);
        if (!validRoles.includes(role)) {
            throw new Error('Role inválido');
        }
        this.#role = role;
    }

    Criar(name, username, password, active, role) {
        if (User.users.find(user => user.getUsername().toLowerCase() === username.toLowerCase())) {
            throw new Error('Já existe um utilizador com este username. Escolha outro username.');
        }
        const newUser = new User(name, username, password, active, role);
        User.users.push(newUser);
        return newUser;
    }

    Apagar(username) {
        const userIndex = User.users.findIndex(user => user.getUsername().toLowerCase() === username.toLowerCase());
        if (userIndex === -1) {
            throw new Error('Utilizador não encontrado');
        }
        User.users.splice(userIndex, 1);
    }
}
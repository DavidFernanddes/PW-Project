class Task {
    static currentId = 1;
    #id
    #name
    #description
    #endDate
    #completed
    #user
    constructor(name, description = '', endDate, completed, user) {
        this.#id = Task.currentId++;
        this.#name = name;
        this.#description = description;
        this.#endDate = endDate;
        this.#completed = completed;
        this.#user = user;
    }

    getId() {
        return this.#id;
    }
    getName() {
        return this.#name;
    }
    getDescription() {
        return this.#description;
    }
    getEndDate() {
        return this.#endDate;
    }
    getCompleted() {
        return this.#completed;
    }
    getUser() {
        return this.#user;
    }
    setName(name) {
        this.#name = name;
    }
    setDescription(description) {
        this.#description = description;
    }
    setEndDate(endDate) {
        this.#endDate = endDate;
    }
    setCompleted(completed) {
        this.#completed = completed;
    }
    setUser(user) {
        this.#user = user;
    }

    Criar(name, description, endDate, completed, user) {
        if (new Date(endDate) < new Date()) {
            throw new Error('A data de fim não pode estar no passado');
        }
        const newTask = new Task(name, description, endDate, completed, user);
        return newTask;
    }

    Apagar(name, tasks) {
        const index = tasks.findIndex(task => task.getName() === name);

        if (index === -1) {
            throw new Error('Tarefa não encontrada');
        }
        if (tasks[index].getCompleted() === true) {
            throw new Error('Não é possível apagar uma tarefa já concluída');
        }
        
        tasks.splice(index, 1);
    }
}
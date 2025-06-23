export default class Task {
    static currentId = 1;
    static tasks = [];
    
    #id
    #name
    #description
    #endDate
    #completed
    #user
    #typeId

    constructor(name, description = '', endDate, completed = false, user, typeId = null) {
        this.#id = Task.currentId++;
        this.#name = name;
        this.#description = description;
        this.#endDate = endDate;
        this.#completed = completed;
        this.#user = user;
        this.#typeId = typeId;
    }

    // Getters
    getId() { return this.#id; }
    getName() { return this.#name; }
    getDescription() { return this.#description; }
    getEndDate() { return this.#endDate; }
    getCompleted() { return this.#completed; }
    getUser() { return this.#user; }
    getTypeId() { return this.#typeId; }

    // Setters
    setName(name) { this.#name = name; }
    setDescription(description) { this.#description = description; }
    setEndDate(endDate) { this.#endDate = endDate; }
    setCompleted(completed) { this.#completed = completed; }
    setUser(user) { this.#user = user; }
    setTypeId(typeId) { this.#typeId = typeId; }

    static Criar(name, description, endDate, completed, user, typeId = null) {
        if (!name || !endDate || !user) {
            throw new Error('Nome, data fim e utilizador são obrigatórios');
        }

        if (new Date(endDate) < new Date().setHours(0, 0, 0, 0)) {
            throw new Error('A data de fim não pode estar no passado');
        }

        const newTask = new Task(name, description, endDate, completed, user, typeId);
        Task.tasks.push(newTask);
        return newTask;
    }

    static Editar(id, name, description, endDate, completed, user, typeId = null) {
        const task = Task.tasks.find(t => t.getId() === id);
        if (!task) {
            throw new Error('Tarefa não encontrada');
        }

        if (!name || !endDate || !user) {
            throw new Error('Nome, data fim e utilizador são obrigatórios');
        }

        if (new Date(endDate) < new Date().setHours(0, 0, 0, 0)) {
            throw new Error('A data de fim não pode estar no passado');
        }

        task.setName(name);
        task.setDescription(description);
        task.setEndDate(endDate);
        task.setCompleted(completed);
        task.setUser(user);
        task.setTypeId(typeId);

        return task;
    }

    static Apagar(id) {
        const index = Task.tasks.findIndex(task => task.getId() === id);
        
        if (index === -1) {
            throw new Error('Tarefa não encontrada');
        }
        
        if (Task.tasks[index].getCompleted() === true) {
            throw new Error('Não é possível apagar uma tarefa já concluída');
        }
        
        Task.tasks.splice(index, 1);
        return Task.tasks;
    }

    static ListarTodas() {
        return Task.tasks;
    }

    static ListarPorId(id) {
        return Task.tasks.find(task => task.getId() === id);
    }

    static ListarPorFiltro(filtro) {
        switch (filtro) {
            case 'completed':
                return Task.tasks.filter(task => task.getCompleted());
            case 'in-progress':
                return Task.tasks.filter(task => !task.getCompleted());
            case 'all':
            default:
                return Task.tasks;
        }
    }

    static ListarPorTipo(typeId) {
        return Task.tasks.filter(task => task.getTypeId() === typeId);
    }
}
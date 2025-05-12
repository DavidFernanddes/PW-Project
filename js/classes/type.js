export default class Type {
    static typeId = 0;
    static types = [];
    #id;
    #name;

    constructor(name) {
        this.#id = Type.typeId++;
        this.#name = name;
    }

    getTypeId() {
        return this.#id;
    }

    getName() {
        return this.#name;
    }

    setName(name) {
        this.#name = name;
    }

    Criar(name) {
        if (Type.types.find(type => type.getName().toLowerCase() === name.toLowerCase())) {
            throw new Error('Já existe um tipo com este nome. Escolha outro nome.');
        }
        const newType = new Type(name);
        Type.types.push(newType);
        return newType;
    }

    Editar(id, name) {
        const typeToEdit = Type.types.find(type => type.getTypeId() === id);
        if (!typeToEdit) {
            throw new Error('Tipo não encontrado');
        }

        const nameExists = Type.types.some(
            type => type.getName().toLowerCase() === name.toLowerCase() &&
                    type.getTypeId() !== id
        );
        if (nameExists) {
            throw new Error('Tipo já existe');
        }
        typeToEdit.setName(name);
        return typeToEdit;
    }

    Apagar(id, tasks) {
        const index = Type.types.findIndex(type => type.getTypeId() === id);
        if (index === -1) {
            throw new Error('Tipo não encontrado');
        }

        const typeToDelete = Type.types[index];
        const isTypeUsed = tasks.some(task => task.typeId === typeToDelete.getTypeId());
        if (isTypeUsed) {
            throw new Error('Não é possível apagar o tipo porque está associado a uma ou mais tarefas');
        }

        Type.types.splice(index, 1);
        return Type.types;
    }
}
// Serviço API para Sistema de Gestão de Tarefas
class ApiService {
    constructor() {
        this.baseUrl = '/api';
        this.currentUser = null;
    }

    // Método auxiliar para efectuar pedidos HTTP
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            credentials: 'include',
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            // Verifica se a resposta é válida primeiro
            if (!response.ok) {
                // Tenta obter mensagem de erro do JSON
                try {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP ${response.status}`);
                } catch (jsonError) {
                    throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
                }
            }

            // Verifica o tipo de conteúdo
            const contentType = response.headers.get('content-type');
            
            // Se for HTML, significa que fomos redireccionados (provavelmente para login)
            if (contentType && contentType.includes('text/html')) {
                // Só lança sessão expirada para endpoints que não sejam de login
                if (endpoint !== '/auth/login' && endpoint !== '/auth/status') {
                    throw new Error('Sessão expirada. Por favor, faça login novamente.');
                }
                // Para o endpoint de login, isto não deveria acontecer, por isso lança erro genérico
                throw new Error('Resposta inesperada do servidor');
            }

            // Tenta fazer parse do JSON
            try {
                const data = await response.json();
                return data;
            } catch (jsonError) {
                console.error('Erro ao fazer parse do JSON:', jsonError);
                throw new Error('Resposta inválida do servidor');
            }

        } catch (error) {
            // Se já for o nosso erro personalizado, relança-o
            if (error.message.includes('Sessão expirada') || 
                error.message.includes('HTTP') || 
                error.message.includes('Resposta inválida')) {
                throw error;
            }
            
            // Para erros de rede ou outros problemas
            console.error('Erro no Pedido API:', error);
            throw new Error('Erro de comunicação com o servidor');
        }
    }

    // Métodos de autenticação
    async login(username, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        if (response.success) {
            this.currentUser = response.user;
        }
        
        return response;
    }

    async logout() {
        const response = await this.request('/auth/logout', {
            method: 'POST'
        });
        
        this.currentUser = null;
        return response;
    }

    async getCurrentUser() {
        try {
            const response = await this.request('/auth/me');
            if (response.success) {
                this.currentUser = response.user;
            }
            return response;
        } catch (error) {
            this.currentUser = null;
            return { success: false, authenticated: false };
        }
    }

    async getAuthStatus() {
        try {
            const response = await this.request('/auth/status');
            if (response.authenticated) {
                this.currentUser = response.user;
            }
            return response;
        } catch (error) {
            return { success: true, authenticated: false, user: null };
        }
    }

    // Métodos de utilizador
    async getUsers() {
        return await this.request('/users');
    }

    async getActiveUsers() {
        return await this.request('/users/active');
    }

    async getUser(id) {
        return await this.request(`/users/${id}`);
    }

    async createUser(userData) {
        return await this.request('/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async updateUser(id, userData) {
        return await this.request(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    async deleteUser(id) {
        return await this.request(`/users/${id}`, {
            method: 'DELETE'
        });
    }

    // Métodos de Tipo de Tarefa
    async getTaskTypes() {
        return await this.request('/types');
    }

    async getTaskType(id) {
        return await this.request(`/types/${id}`);
    }

    async createTaskType(typeData) {
        return await this.request('/types', {
            method: 'POST',
            body: JSON.stringify(typeData)
        });
    }

    async updateTaskType(id, typeData) {
        return await this.request(`/types/${id}`, {
            method: 'PUT',
            body: JSON.stringify(typeData)
        });
    }

    async deleteTaskType(id) {
        return await this.request(`/types/${id}`, {
            method: 'DELETE'
        });
    }

    // Métodos de Tarefa
    async getTasks(filters = {}) {
        const queryParams = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined && filters[key] !== null) {
                queryParams.append(key, filters[key]);
            }
        });
        
        const queryString = queryParams.toString();
        const endpoint = queryString ? `/tasks?${queryString}` : '/tasks';
        
        return await this.request(endpoint);
    }

    async getTasksByFilter(filter) {
        return await this.request(`/tasks/filter/${filter}`);
    }

    async getTask(id) {
        return await this.request(`/tasks/${id}`);
    }

    async createTask(taskData) {
        return await this.request('/tasks', {
            method: 'POST',
            body: JSON.stringify(taskData)
        });
    }

    async updateTask(id, taskData) {
        return await this.request(`/tasks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(taskData)
        });
    }

    async deleteTask(id) {
        return await this.request(`/tasks/${id}`, {
            method: 'DELETE'
        });
    }

    // Métodos utilitários
    isAuthenticated() {
        return this.currentUser !== null;
    }

    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }

    hasAnyRole(roles) {
        return this.currentUser && roles.includes(this.currentUser.role);
    }

    isAdmin() {
        return this.hasRole('Administrador');
    }

    isAdminOrManager() {
        return this.hasAnyRole(['Administrador', 'Gestor']);
    }
}

// Cria instância global
const apiService = new ApiService();
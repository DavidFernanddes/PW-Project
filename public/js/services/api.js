// API Service for Task Management System
class ApiService {
    constructor() {
        this.baseUrl = '/api';
        this.currentUser = null;
    }

    // Helper method for making HTTP requests
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
            
            // Check if response is HTML (redirect to login page)
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('text/html')) {
                throw new Error('Sessão expirada. Por favor, faça login novamente.');
            }

            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                throw new Error('Resposta inválida do servidor');
            }

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // Authentication methods
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

    // User methods
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

    // Task Type methods
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

    // Task methods
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

    // Utility methods
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

// Create global instance
const apiService = new ApiService();
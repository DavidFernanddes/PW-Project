// Authentication Service
class AuthService {
    constructor() {
        this.user = null;
        this.isLoggedIn = false;
    }

    async checkAuthStatus() {
        try {
            const response = await apiService.getAuthStatus();
            if (response.authenticated) {
                this.user = response.user;
                this.isLoggedIn = true;
                this.updateUI();
                return true;
            } else {
                this.user = null;
                this.isLoggedIn = false;
                return false;
            }
        } catch (error) {
            console.error('Erro ao verificar estado de autenticação:', error);
            this.user = null;
            this.isLoggedIn = false;
            return false;
        }
    }

    async login(username, password) {
        try {
            const response = await apiService.login(username, password);
            if (response.success) {
                this.user = response.user;
                this.isLoggedIn = true;
                this.updateUI();
                
                // Trigger page update if on index page
                if (typeof updatePageContent === 'function') {
                    updatePageContent();
                }
                if (typeof loadDashboardStats === 'function') {
                    loadDashboardStats();
                }
                
                return response;
            }
            return response;
        } catch (error) {
            console.error('Erro no login:', error);
            throw error;
        }
    }

    async logout() {
        try {
            await apiService.logout();
            this.user = null;
            this.isLoggedIn = false;
            this.updateUI();
            // Redirect to login page or home
            window.location.href = '/';
        } catch (error) {
            console.error('Erro no logout:', error);
            // Force logout on client side even if server request fails
            this.user = null;
            this.isLoggedIn = false;
            this.updateUI();
            window.location.href = '/';
        }
    }

    updateUI() {
        const loginSection = document.getElementById('login-section');
        const userSection = document.getElementById('user-section');
        const userName = document.getElementById('user-name');
        const userRole = document.getElementById('user-role');

        if (this.isLoggedIn && this.user) {
            if (loginSection) loginSection.style.display = 'none';
            if (userSection) userSection.style.display = 'block';
            if (userName) userName.textContent = this.user.name;
            if (userRole) userRole.textContent = this.user.role;
        } else {
            if (loginSection) loginSection.style.display = 'block';
            if (userSection) userSection.style.display = 'none';
        }
    }

    hasPermission(requiredRoles) {
        if (!this.isLoggedIn || !this.user) {
            return false;
        }
        return requiredRoles.includes(this.user.role);
    }

    isAdmin() {
        return this.hasPermission(['Administrador']);
    }

    isAdminOrManager() {
        return this.hasPermission(['Administrador', 'Gestor']);
    }

    requireAuth() {
        if (!this.isLoggedIn) {
            this.showLoginModal();
            return false;
        }
        return true;
    }

    requirePermission(requiredRoles) {
        if (!this.requireAuth()) {
            return false;
        }
        
        if (!this.hasPermission(requiredRoles)) {
            showError('Não tem permissões para realizar esta ação');
            return false;
        }
        
        return true;
    }

    showLoginModal() {
        // Create and show login modal
        const modalHtml = `
            <div class="modal fade" id="loginModal" tabindex="-1" aria-labelledby="loginModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title" id="loginModalLabel">Iniciar Sessão</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="loginForm">
                                <div class="mb-3">
                                    <label for="loginUsername" class="form-label">Username</label>
                                    <input type="text" class="form-control" id="loginUsername" required>
                                </div>
                                <div class="mb-3">
                                    <label for="loginPassword" class="form-label">Password</label>
                                    <input type="password" class="form-control" id="loginPassword" required>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="loginButton">Entrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('loginModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Setup modal event listeners
        const modal = new bootstrap.Modal(document.getElementById('loginModal'));
        const loginButton = document.getElementById('loginButton');
        const loginForm = document.getElementById('loginForm');

        const handleLogin = async () => {
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;

            if (!username || !password) {
                showError('Por favor, preencha todos os campos');
                return;
            }

            try {
                loginButton.disabled = true;
                loginButton.textContent = 'Entrando...';

                const response = await this.login(username, password);
                if (response.success) {
                    modal.hide();
                    showSuccess('Login efetuado com sucesso');
                } else {
                    showError(response.message || 'Erro no login');
                }
            } catch (error) {
                showError('Erro no login: ' + error.message);
            } finally {
                loginButton.disabled = false;
                loginButton.textContent = 'Entrar';
            }
        };

        loginButton.addEventListener('click', handleLogin);
        
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleLogin();
        });

        modal.show();
    }
}

// Create global auth service instance
const authService = new AuthService();
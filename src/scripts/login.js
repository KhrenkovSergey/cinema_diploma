import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/main.scss';
import { apiRequest } from './api';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async e => {
            e.preventDefault();
            const emailInput = document.getElementById('login-email');
            const passwordInput = document.getElementById('login-password');
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            if (!email || !password) {
                return alert('Введите E-mail и пароль');
            }

            try {
                // Используем нашу обертку apiRequest
                await apiRequest('login', 'POST', { email, password });
                    localStorage.setItem('adminAuth', 'true');
                    window.location.href = 'admin.html';
            } catch (error) {
                alert(error.message || 'Ошибка авторизации. Проверьте логин и пароль.');
            }
        });
    }
}); 
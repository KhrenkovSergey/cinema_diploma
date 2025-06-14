import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/main.scss';
import { apiRequest } from './api';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value.trim();

        if (!email || !password) {
            return alert('Пожалуйста, введите E-mail и пароль.');
        }

        try {
            const params = new URLSearchParams();
            params.append('login', email);
            params.append('password', password);
            
            // Используем нашу централизованную функцию
            // requireAuth = true здесь нужен, так как это запрос на авторизацию
            const result = await apiRequest('login', 'POST', params, true);

            if (result && result.success) {
                localStorage.setItem('adminAuth', 'true');
                window.location.href = 'admin.html';
            } else {
                const errorMessage = result ? 'Неверный E-mail или пароль.' : 'Произошла ошибка при попытке авторизации. Пожалуйста, проверьте подключение к интернету и попробуйте снова.';
                alert(errorMessage);
            }
        } catch (error) {
            console.error('Ошибка при авторизации:', error);
            alert('Произошла критическая ошибка. Пожалуйста, проверьте консоль.');
        }
    });
}); 
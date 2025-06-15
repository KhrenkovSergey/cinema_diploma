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
            const formData = new FormData();
            formData.append('login', email);
            formData.append('password', password);
            
            // Используем нашу централизованную функцию
            // requireAuth = true здесь нужен, так как это запрос на авторизацию
            const result = await apiRequest('login', 'POST', formData, true);

            // `apiRequest` возвращает null при ошибке, и объект с данными при успехе.
            // Для успешного логина, сервер возвращает непустой ответ, поэтому result не будет null.
            if (result) {
                localStorage.setItem('adminAuth', 'true');
                window.location.href = 'admin.html';
            } else {
                const errorMessage = 'Произошла ошибка при попытке авторизации. Пожалуйста, проверьте подключение к интернету и попробуйте снова.';
                alert(errorMessage);
            }
        } catch (error) {
            console.error('Ошибка при авторизации:', error);
            // Покажем пользователю ошибку, которую вернул сервер
            alert(error.message || 'Произошла критическая ошибка. Пожалуйста, проверьте консоль.');
        }
    });
}); 
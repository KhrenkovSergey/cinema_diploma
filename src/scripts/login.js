import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/main.scss';
import { apiRequest } from './api';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async e => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value.trim();

            if (!email || !password) {
                return alert('Введите E-mail и пароль');
            }

            try {
                const res = await apiRequest('login', 'POST', {
                    login: email,
                    password: password
                });

                if (res.success) {
                    localStorage.setItem('adminAuth', 'true');
                    window.location.href = 'admin.html';
                } else {
                    alert('Ошибка авторизации. Проверьте логин и пароль.');
                }
            } catch (error) {
                console.error('Ошибка при авторизации:', error);
                alert('Произошла ошибка при попытке авторизации. Пожалуйста, проверьте подключение к интернету и попробуйте снова.');
            }
        });
    }
}); 
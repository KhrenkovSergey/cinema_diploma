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
                alert('Введите логин и пароль');
                return;
            }

            const fd = new FormData();
            fd.append('login', email);
            fd.append('password', password);

            const res = await fetch('https://shfe-diplom.neto-server.ru/login', {
                method: 'POST',
                body: fd
            }).then(r => r.json());

            if (res.success) {
                localStorage.setItem('adminAuth', 'true');
                window.location.href = 'admin.html';
            } else {
                alert('Ошибка авторизации. Проверьте логин и пароль.');
            }
        });
    }
}); 
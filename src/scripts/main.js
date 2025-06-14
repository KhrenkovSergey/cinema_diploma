import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/main.scss';
import { apiRequest } from './api';
import './schedule';

document.addEventListener('DOMContentLoaded', async () => {
    const scheduleContent = document.querySelector('.schedule__content');
    
    if (!scheduleContent) {
        console.error('Не найден контейнер для расписания');
        return;
    }

    try {
        scheduleContent.innerHTML = '<div class="schedule__loading">Загрузка расписания...</div>';
        
        const response = await apiRequest('alldata', 'GET', null, false);
        if (!response || !response.success) {
            throw new Error('Не удалось загрузить данные');
        }

        const data = response.result;
        if (!data || !data.films || !data.seances || !data.halls) {
            throw new Error('Некорректные данные от сервера');
        }

        // Инициализация расписания произойдет в schedule.js

    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        scheduleContent.innerHTML = `
            <div class="error-message">
                ${error.message || 'Произошла ошибка при загрузке данных'}
            </div>
        `;
    }
}); 
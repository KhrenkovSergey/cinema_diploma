import { apiRequest } from './api';

document.addEventListener('DOMContentLoaded', () => {
    const dateSlider = document.querySelector('.schedule__date-slider');
    const scheduleContent = document.querySelector('.schedule__content');

    if (!dateSlider || !scheduleContent) return;

    // Функция для форматирования даты
    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    // Функция для получения дней недели
    function getDayName(date) {
        const days = {
            'Mon': 'Пн',
            'Tue': 'Вт',
            'Wed': 'Ср',
            'Thu': 'Чт',
            'Fri': 'Пт',
            'Sat': 'Сб',
            'Sun': 'Вс'
        };
        return days[date.toLocaleString('en', { weekday: 'short' })];
    }

    let currentStartDate = new Date();

    // Функция для загрузки расписания
    async function loadSchedule(date) {
        try {
            console.log('Загрузка расписания для даты:', date);
            scheduleContent.innerHTML = '<div class="schedule__loading">Загрузка расписания...</div>';
            
            const response = await apiRequest('alldata', 'GET', null, false);
            
            if (!response) {
                throw new Error('Не удалось загрузить данные');
            }
            
            // Извлекаем данные из свойства result
            const data = response.result;
            if (!data || !data.films || !data.seances || !data.halls) {
                throw new Error('Некорректные данные от сервера');
            }

            console.log('Фильмы:', data.films);
            console.log('Сеансы:', data.seances);
            console.log('Залы:', data.halls);

            // Фильтруем сеансы по выбранной дате
            // В данном случае нам не нужно фильтровать по дате, так как все сеансы относятся к выбранной дате
            const filteredSeances = data.seances;
            console.log('Отфильтрованные сеансы:', filteredSeances);

            if (filteredSeances.length === 0) {
                scheduleContent.innerHTML = '<div class="schedule__empty">На выбранную дату сеансов нет</div>';
                return;
            }

            // Группируем сеансы по фильмам
            const movieSessions = {};
            filteredSeances.forEach(seance => {
                const movie = data.films.find(f => f.id === seance.seance_filmid);
                console.log('Поиск фильма:', { seance, movie });
                
                if (!movie) return;

                if (!movieSessions[movie.id]) {
                    movieSessions[movie.id] = {
                        movie,
                        sessions: []
                    };
                }
                movieSessions[movie.id].sessions.push({
                    ...seance,
                    hall: data.halls.find(h => h.id === seance.seance_hallid)
                });
            });

            console.log('Сгруппированные сеансы по фильмам:', movieSessions);

            // Отображаем фильмы
            scheduleContent.innerHTML = Object.values(movieSessions)
                .map(({ movie, sessions }) => `
                    <div class="movie-card">
                        <img src="${movie.film_poster}" alt="${movie.film_name}" class="movie-card__image">
                        <div class="movie-card__content">
                            <h3 class="movie-card__title">${movie.film_name}</h3>
                            <div class="movie-card__info">
                                ${[
                                    movie.film_duration && `${movie.film_duration} минут`,
                                    movie.film_origin,
                                ].filter(Boolean).join(' • ')}
                            </div>
                            <div class="movie-card__description">
                                ${movie.film_description || 'Описание фильма отсутствует'}
                            </div>
                        </div>
                        <div class="movie-card__sessions">
                            ${Object.entries(sessions.reduce((acc, session) => {
                                const hallName = session.hall ? session.hall.hall_name : 'Неизвестный зал';
                                if (!acc[hallName]) {
                                    acc[hallName] = [];
                                }
                                acc[hallName].push(session);
                                return acc;
                            }, {}))
                            .sort(([hallNameA], [hallNameB]) => hallNameA.localeCompare(hallNameB))
                            .map(([hallName, hallSessions]) => `
                                <div class="movie-card__hall">
                                    <div class="movie-card__hall-name">${hallName}</div>
                                    <div class="movie-card__hall-sessions">
                                        ${hallSessions
                                            .sort((a, b) => a.seance_time.localeCompare(b.seance_time))
                                            .map(session => `
                                                <a href="booking.html?seanceId=${session.id}&date=${date}" 
                                                   class="movie-card__session">
                                                    ${session.seance_time}
                                                </a>
                                            `).join('')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('');

        } catch (error) {
            console.error('Ошибка при загрузке расписания:', error);
            scheduleContent.innerHTML = `<div class="error-message">${error.message}</div>`;
        }
    }

    // Функция для создания элементов дат
    function createDateElements(startDate) {
        const dates = Array.from({ length: 6 }, (_, i) => {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            return date;
        });

        return dates.map((date, index) => {
            const isToday = date.toDateString() === new Date().toDateString();
            return `
                <div class="schedule__date${index === 0 ? ' schedule__date--active' : ''}" data-date="${formatDate(date)}">
                    <div class="schedule__date-day">${isToday ? 'Сегодня' : getDayName(date)}</div>
                    <div class="schedule__date-number">${date.getDate()}</div>
                </div>
            `;
        }).join('') + `
            <div class="schedule__date schedule__date-next">
            </div>
        `;
    }

    // Инициализация дат
    dateSlider.innerHTML = createDateElements(currentStartDate);

    // Обработчик клика по датам
    dateSlider.addEventListener('click', (event) => {
        const dateElement = event.target.closest('.schedule__date');
        if (!dateElement) return;

        // Если клик по кнопке "следующие даты"
        if (dateElement.classList.contains('schedule__date-next')) {
            currentStartDate.setDate(currentStartDate.getDate() + 6);
            dateSlider.innerHTML = createDateElements(currentStartDate);
            // Загружаем расписание для первой даты нового диапазона
            loadSchedule(formatDate(currentStartDate));
            return;
        }

        // Убираем активный класс у всех дат
        dateSlider.querySelectorAll('.schedule__date').forEach(el => {
            el.classList.remove('schedule__date--active');
        });

        // Добавляем активный класс выбранной дате
        dateElement.classList.add('schedule__date--active');

        // Загружаем расписание для выбранной даты
        loadSchedule(dateElement.dataset.date);
    });

    // Загружаем расписание для текущей даты
    loadSchedule(formatDate(currentStartDate));
}); 
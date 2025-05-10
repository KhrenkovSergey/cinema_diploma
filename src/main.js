import './styles/main.scss';
import { apiRequest } from './api';

/**
 * Функция для получения параметров из URL
 * @param {string} param - имя параметра
 * @returns {string | null} - значение параметра
 */
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

document.addEventListener('DOMContentLoaded', async () => {
    // ————— Блок авторизации для админ-панели —————
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async event => {
            event.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value.trim();
            if (!email || !password) {
                alert('Введите логин и пароль');
                return;
            }

            // Формируем FormData для отправки точно так, как ждет сервер
            const formData = new FormData();
            formData.append('login', email);
            formData.append('password', password);

            try {
                const response = await fetch('https://shfe-diplom.neto-server.ru/login', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();

                if (data.success) {
                    alert('Авторизация успешна!');
                    localStorage.setItem('adminAuth', 'true');
                    window.location.href = 'admin.html';
                } else {
                    alert('Ошибка авторизации. Проверьте логин и пароль.');
                }
            } catch (e) {
                console.error(e);
                alert('Ошибка сети при авторизации');
            }
        });

        // Если это страница логина — дальше не выполняем остальной код
        return;
    }

    // ————— Защита админ-страниц —————
    if (document.body.classList.contains('admin-page') && localStorage.getItem('adminAuth') !== 'true') {
        alert('Необходимо авторизоваться для доступа к этой странице.');
        window.location.href = 'login.html';
        return;
    }

    // Собственно весь ваш существующий код без изменений:
    const scheduleContainer = document.getElementById('schedule');
    const hallContainer = document.getElementById('hall');
    const bookButton = document.getElementById('book');
    const hallsContainer = document.getElementById('halls');
    const addHallForm = document.getElementById('add-hall-form');
    const filmsContainer = document.getElementById('films');
    const addFilmForm = document.getElementById('add-film-form');
    const seancesContainer = document.getElementById('seances');
    const addSeanceForm = document.getElementById('add-seance-form');
    const seanceHallSelect = document.getElementById('seance-hall');
    const seanceFilmSelect = document.getElementById('seance-film');

    // Обработка главной страницы
    if (scheduleContainer) {
        scheduleContainer.innerHTML = '<p>Загрузка расписания...</p>';

        const data = await apiRequest('alldata');
        if (!data) {
            scheduleContainer.innerHTML = '<p>Ошибка загрузки данных</p>';
            return;
        }

        scheduleContainer.innerHTML = '';
        data.films.forEach(film => {
            const filmBlock = document.createElement('div');
            filmBlock.classList.add('film');
            filmBlock.innerHTML = `
                <h3>${film.film_name}</h3>
                <img src="${film.film_poster}" alt="${film.film_name}" width="150">
                <p>Длительность: ${film.film_duration} мин</p>
            `;
            const seancesList = document.createElement('ul');
            data.seances
                .filter(seance => seance.seance_filmid === film.id)
                .forEach(seance => {
                    const seanceItem = document.createElement('li');
                    seanceItem.innerHTML = `
                        Сеанс в ${seance.seance_time} 
                        <button class="select-seance" data-seance-id="${seance.id}">Выбрать</button>
                    `;
                    seancesList.appendChild(seanceItem);
                });
            if (!seancesList.children.length) {
                seancesList.innerHTML = '<li>Нет сеансов</li>';
            }
            filmBlock.appendChild(seancesList);
            scheduleContainer.appendChild(filmBlock);
        });

        document.body.addEventListener('click', event => {
            if (event.target.classList.contains('select-seance')) {
                const seanceId = event.target.dataset.seanceId;
                window.location.href = `booking.html?seanceId=${seanceId}`;
            }
        });
    }

    // Обработка страницы бронирования
    if (hallContainer) {
        hallContainer.innerHTML = '<p>Загрузка схемы зала...</p>';

        const seanceId = getQueryParam('seanceId');
        if (!seanceId) {
            hallContainer.innerHTML = '<p>Сеанс не выбран</p>';
            return;
        }

        const hallConfig = await apiRequest(`hallconfig?seanceId=${seanceId}&date=2025-02-14`);
        if (!hallConfig) {
            hallContainer.innerHTML = '<p>Ошибка загрузки данных</p>';
            return;
        }

        hallContainer.innerHTML = '';
        hallConfig.forEach((row, rowIndex) => {
            const rowDiv = document.createElement('div');
            rowDiv.classList.add('row');
            row.forEach((place, placeIndex) => {
                const placeDiv = document.createElement('div');
                placeDiv.classList.add('place', place);
                if (place === 'taken') {
                    placeDiv.classList.add('disabled');
                } else {
                    placeDiv.addEventListener('click', () => placeDiv.classList.toggle('selected'));
                }
                placeDiv.dataset.row = rowIndex + 1;
                placeDiv.dataset.place = placeIndex + 1;
                rowDiv.appendChild(placeDiv);
            });
            hallContainer.appendChild(rowDiv);
        });

        bookButton.addEventListener('click', async () => {
            const selectedPlaces = Array.from(hallContainer.querySelectorAll('.place.selected'));
            if (!selectedPlaces.length) {
                alert('Выберите хотя бы одно место!');
                return;
            }
            const tickets = selectedPlaces.map(place => ({
                row: +place.dataset.row,
                place: +place.dataset.place,
                coast: place.classList.contains('vip') ? 350 : 100,
            }));
            const result = await apiRequest('ticket', 'POST', {
                seanceId,
                ticketDate: '2025-02-14',
                tickets: JSON.stringify(tickets)
            });
            if (result) {
                alert('Ваши билеты успешно забронированы!');
                location.reload();
            } else {
                alert('Ошибка бронирования. Попробуйте снова.');
            }
        });
    }

    // Обработка залов
    if (hallsContainer) {
        const loadHalls = async () => {
            hallsContainer.innerHTML = '<p>Загрузка залов...</p>';
            const data = await apiRequest('alldata');
            if (!data || !data.halls) {
                hallsContainer.innerHTML = '<p>Ошибка загрузки залов</p>';
                return;
            }
            hallsContainer.innerHTML = '';
            data.halls.forEach(hall => {
                const hallDiv = document.createElement('div');
                hallDiv.classList.add('hall');
                hallDiv.innerHTML = `
                    <p>${hall.hall_name}</p>
                    <button class="delete-hall" data-hall-id="${hall.id}">Удалить</button>
                `;
                hallsContainer.appendChild(hallDiv);
            });
        };
        await loadHalls();
        addHallForm.addEventListener('submit', async event => {
            event.preventDefault();
            const hallName = document.getElementById('hall-name').value.trim();
            if (!hallName) {
                alert('Введите название зала');
                return;
            }
            const result = await apiRequest('hall', 'POST', { hallName });
            if (result) {
                alert('Зал добавлен успешно!');
                await loadHalls();
                addHallForm.reset();
            } else {
                alert('Ошибка добавления зала');
            }
        });
        hallsContainer.addEventListener('click', async event => {
            if (event.target.classList.contains('delete-hall')) {
                const hallId = event.target.dataset.hallId;
                const result = await apiRequest(`hall/${hallId}`, 'DELETE');
                if (result) {
                    alert('Зал удалён успешно!');
                    await loadHalls();
                } else {
                    alert('Ошибка удаления зала');
                }
            }
        });
    }

    // Обработка фильмов
    if (filmsContainer) {
        const loadFilms = async () => {
            filmsContainer.innerHTML = '<p>Загрузка фильмов...</p>';
            const data = await apiRequest('alldata');
            if (!data || !data.films) {
                filmsContainer.innerHTML = '<p>Ошибка загрузки фильмов</p>';
                return;
            }
            filmsContainer.innerHTML = '';
            data.films.forEach(film => {
                const filmDiv = document.createElement('div');
                filmDiv.classList.add('film');
                filmDiv.innerHTML = `
                    <p>${film.film_name} (${film.film_duration} мин, ${film.film_origin})</p>
                    <img src="${film.film_poster}" alt="${film.film_name}" width="100">
                    <button class="delete-film" data-film-id="${film.id}">Удалить</button>
                `;
                filmsContainer.appendChild(filmDiv);
            });
        };
        await loadFilms();
        addFilmForm.addEventListener('submit', async event => {
            event.preventDefault();
            const filmName = document.getElementById('film-name').value.trim();
            const filmDuration = document.getElementById('film-duration').value.trim();
            const filmOrigin = document.getElementById('film-origin').value.trim();
            const filmPoster = document.getElementById('film-poster').files[0];
            if (!filmName || !filmDuration || !filmOrigin || !filmPoster) {
                alert('Заполните все поля!');
                return;
            }
            const formData = new FormData();
            formData.append('filmName', filmName);
            formData.append('filmDuration', filmDuration);
            formData.append('filmOrigin', filmOrigin);
            formData.append('filePoster', filmPoster);
            const result = await apiRequest('film', 'POST', formData);
            if (result) {
                alert('Фильм добавлен успешно!');
                await loadFilms();
                addFilmForm.reset();
            } else {
                alert('Ошибка добавления фильма');
            }
        });
        filmsContainer.addEventListener('click', async event => {
            if (event.target.classList.contains('delete-film')) {
                const filmId = event.target.dataset.filmId;
                const result = await apiRequest(`film/${filmId}`, 'DELETE');
                if (result) {
                    alert('Фильм удалён успешно!');
                    await loadFilms();
                } else {
                    alert('Ошибка удаления фильма');
                }
            }
        });
    }

    // Обработка сеансов
    if (seancesContainer) {
        const loadSeances = async () => {
            seancesContainer.innerHTML = '<p>Загрузка сеансов...</p>';
            const data = await apiRequest('alldata');
            if (!data || !data.seances) {
                seancesContainer.innerHTML = '<p>Ошибка загрузки сеансов</p>';
                return;
            }
            seancesContainer.innerHTML = '';
            data.seances.forEach(seance => {
                const film = data.films.find(f => f.id === seance.seance_filmid);
                const hall = data.halls.find(h => h.id === seance.seance_hallid);
                const seanceDiv = document.createElement('div');
                seanceDiv.classList.add('seance');
                seanceDiv.innerHTML = `
                    <p>Фильм: ${film ? film.film_name : 'Неизвестно'}</p>
                    <p>Зал: ${hall ? hall.hall_name : 'Неизвестно'}</p>
                    <p>Время: ${seance.seance_time}</p>
                    <button class="delete-seance" data-seance-id="${seance.id}">Удалить</button>
                `;
                seancesContainer.appendChild(seanceDiv);
            });
            seanceHallSelect.innerHTML = '<option value="" disabled selected>Выберите зал</option>';
            seanceFilmSelect.innerHTML = '<option value="" disabled selected>Выберите фильм</option>';
            data.halls.forEach(h => {
                const opt = document.createElement('option');
                opt.value = h.id;
                opt.textContent = h.hall_name;
                seanceHallSelect.appendChild(opt);
            });
            data.films.forEach(f => {
                const opt = document.createElement('option');
                opt.value = f.id;
                opt.textContent = f.film_name;
                seanceFilmSelect.appendChild(opt);
            });
        };
        await loadSeances();
        addSeanceForm.addEventListener('submit', async event => {
            event.preventDefault();
            const hallId = seanceHallSelect.value;
            const filmId = seanceFilmSelect.value;
            const seanceTime = document.getElementById('seance-time').value;
            if (!hallId || !filmId || !seanceTime) {
                alert('Заполните все поля!');
                return;
            }
            const result = await apiRequest('seance','POST',{ seanceHallid: hallId, seanceFilmid: filmId, seanceTime });
            if (result) {
                alert('Сеанс добавлен успешно!');
                await loadSeances();
                addSeanceForm.reset();
            } else {
                alert('Ошибка добавления сеанса');
            }
        });
        seancesContainer.addEventListener('click', async event => {
            if (event.target.classList.contains('delete-seance')) {
                const seanceId = event.target.dataset.seanceId;
                const result = await apiRequest(`seance/${seanceId}`,'DELETE');
                if (result) {
                    alert('Сеанс удалён успешно!');
                    await loadSeances();
                } else {
                    alert('Ошибка удаления сеанса');
                }
            }
        });
    }
});

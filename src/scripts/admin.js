import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/main.scss';
import { apiRequest } from './api';

// Проверка авторизации
if (localStorage.getItem('adminAuth') !== 'true') {
    alert('Необходимо авторизоваться для доступа к этой странице.');
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', async () => {
    // Элементы управления залами
    const hallsContainer = document.getElementById('halls');
    const addHallForm = document.getElementById('add-hall-form');

    // Элементы управления фильмами
    const filmsContainer = document.getElementById('films');
    const showAddFilmBtn = document.getElementById('show-add-film');
    const addFilmModal = document.getElementById('add-film-modal');
    const cancelAddFilmBtn = document.getElementById('cancel-add-film');
    const addFilmForm = document.getElementById('add-film-form');

    // Элементы управления сеансами
    const seancesContainer = document.getElementById('seances');
    const showAddSeanceBtn = document.getElementById('show-add-seance');
    const addSeanceModal = document.getElementById('add-seance-modal');
    const cancelAddSeanceBtn = document.getElementById('cancel-add-seance');
    const addSeanceForm = document.getElementById('add-seance-form');
    const seanceHallSelect = document.getElementById('seance-hall');
    const seanceFilmSelect = document.getElementById('seance-film');

    // Модальные окна
    if (showAddFilmBtn && addFilmModal && cancelAddFilmBtn) {
        showAddFilmBtn.addEventListener('click', () => addFilmModal.classList.remove('hidden'));
        cancelAddFilmBtn.addEventListener('click', () => addFilmModal.classList.add('hidden'));
    }

    if (showAddSeanceBtn && addSeanceModal && cancelAddSeanceBtn) {
        showAddSeanceBtn.addEventListener('click', () => addSeanceModal.classList.remove('hidden'));
        cancelAddSeanceBtn.addEventListener('click', () => addSeanceModal.classList.add('hidden'));
    }

    // Загрузка данных
    async function loadHalls() {
        const data = await apiRequest('alldata');
        if (data?.halls) {
            if (hallsContainer) {
                hallsContainer.innerHTML = data.halls.map(hall => `
                    <div class="hall-item">
                        <input type="checkbox" id="hall-${hall.id}" ${hall.hall_open ? 'checked' : ''}>
                        <label for="hall-${hall.id}">${hall.hall_name}</label>
                    </div>
                `).join('');
            }

            if (seanceHallSelect) {
                seanceHallSelect.innerHTML = data.halls.map(hall =>
                    `<option value="${hall.id}">${hall.hall_name}</option>`
                ).join('');
            }
        }
    }

    async function loadFilms() {
        const data = await apiRequest('alldata');
        if (data?.films) {
            if (filmsContainer) {
                filmsContainer.innerHTML = data.films.map(film => `
                    <div class="film-item">
                        <img src="${film.film_poster}" alt="${film.film_name}" class="film-poster">
                        <div class="film-info">
                            <h3>${film.film_name}</h3>
                            <p>${film.film_description}</p>
                        </div>
                    </div>
                `).join('');
            }

            if (seanceFilmSelect) {
                seanceFilmSelect.innerHTML = data.films.map(film =>
                    `<option value="${film.id}">${film.film_name}</option>`
                ).join('');
            }
        }
    }

    async function loadSeances() {
        const data = await apiRequest('alldata');
        if (data?.seances) {
            if (seancesContainer) {
                // Группируем сеансы по залам
                const seancesByHall = {};
                data.seances.forEach(seance => {
                    if (!seancesByHall[seance.seance_hallid]) {
                        seancesByHall[seance.seance_hallid] = [];
                    }
                    seancesByHall[seance.seance_hallid].push(seance);
                });

                // Отображаем сеансы по залам
                seancesContainer.innerHTML = Object.entries(seancesByHall).map(([hallId, seances]) => {
                    const hall = data.halls.find(h => h.id === parseInt(hallId));
                    return `
                        <div class="hall-seances">
                            <h3>${hall ? hall.hall_name : 'Зал'}</h3>
                            <div class="seances-list">
                                ${seances.map(seance => {
                                    const film = data.films.find(f => f.id === seance.seance_filmid);
                                    return `
                                        <div class="seance-item">
                                            <span>${seance.seance_time}</span>
                                            <span>${film ? film.film_name : 'Фильм'}</span>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    }

    // Инициализация
    await Promise.all([
        loadHalls(),
        loadFilms(),
        loadSeances()
    ]);

    // Обработчики форм
    if (addHallForm) {
        addHallForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(addHallForm);
            const res = await apiRequest('hall', 'POST', Object.fromEntries(formData));
            if (res) {
                await loadHalls();
                addHallForm.reset();
            }
        });
    }

    if (addFilmForm) {
        addFilmForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(addFilmForm);
            const res = await apiRequest('film', 'POST', Object.fromEntries(formData));
            if (res) {
                await loadFilms();
                addFilmForm.reset();
                addFilmModal.classList.add('hidden');
            }
        });
    }

    if (addSeanceForm) {
        addSeanceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(addSeanceForm);
            const res = await apiRequest('seance', 'POST', Object.fromEntries(formData));
            if (res) {
                await loadSeances();
                addSeanceForm.reset();
                addSeanceModal.classList.add('hidden');
            }
        });
    }
}); 
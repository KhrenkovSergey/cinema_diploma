import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/main.scss';
import { apiRequest } from './api';
import deleteButtonImg from '../assets/button.png';

// Проверка авторизации
if (localStorage.getItem('adminAuth') !== 'true') {
    alert('Необходимо авторизоваться для доступа к этой странице.');
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    // --- STATE ---
    let halls = [];
    let films = [];
    let seances = [];

    // --- DOM ELEMENTS ---
    const hallsList = document.getElementById('halls-list');
    const addHallModal = document.getElementById('add-hall-modal');
    const addHallBtn = document.getElementById('add-hall-btn');
    const addHallForm = document.getElementById('add-hall-form');
    const closeAddHallBtn = document.getElementById('close-add-hall');
    const cancelAddHallBtn = document.getElementById('cancel-add-hall');

    const filmsContainer = document.getElementById('draggable-films-container');
    const seancesContainer = document.getElementById('seance-grid-container');

    const addFilmBtn = document.getElementById('add-film-btn');
    const addFilmModal = document.getElementById('add-film-modal');
    const addFilmForm = document.getElementById('add-film-form');
    const closeAddFilmModalBtn = document.getElementById('close-add-film-modal');
    const cancelAddFilmBtn = document.getElementById('cancel-add-film');
    const posterFileInput = document.getElementById('film-poster-input');
    const posterFileNameSpan = document.getElementById('poster-file-name');

    const filmColors = ['#c8e6c9', '#fff9c4', '#ffcdd2', '#d1c4e9', '#b2ebf2'];

    const hallConfigForm = document.getElementById('hall-config-form');
    const hallConfigSelect = document.getElementById('hall-config-select');
    const hallConfigGrid = document.getElementById('hall-config-grid');
    const rowsCountInput = document.getElementById('rows-count');
    const seatsCountInput = document.getElementById('seats-count');

    const priceConfigForm = document.getElementById('price-config-form');
    const priceConfigSelect = document.getElementById('price-config-select');
    const standartPriceInput = document.getElementById('standart-price');
    const vipPriceInput = document.getElementById('vip-price');

    const openSalesForm = document.getElementById('open-sales-form');
    const salesHallSelect = document.getElementById('sales-hall-select');
    const openSalesBtn = openSalesForm ? openSalesForm.querySelector('button[type="submit"]') : null;

    // --- RENDER FUNCTIONS ---
    function renderHalls() {
        if (!hallsList) return;
        hallsList.innerHTML = '<ul>' + halls.map(hall => `
            <li>
              <span>- ${hall.hall_name}</span>
              <a href="#" class="btn-reset delete-hall-btn" data-hall-id="${hall.id}" aria-label="Удалить зал">
                <img src="${deleteButtonImg}" alt="Удалить зал">
              </a>
            </li>
        `).join('') + '</ul>' || '<p>Залов пока нет. Создайте первый!</p>';
        populateHallSelects();
    }

    function populateHallSelects() {
        const selects = [hallConfigSelect, priceConfigSelect, salesHallSelect, document.getElementById('seance-hall')];
        selects.forEach(select => {
            if (select) {
                const selectedValue = select.value;
                select.innerHTML = '<option selected disabled>Выберите зал</option>';
                halls.forEach(hall => {
                    select.innerHTML += `<option value="${hall.id}">${hall.hall_name}</option>`;
                });
                if (halls.some(h => h.id == selectedValue)) {
                    select.value = selectedValue;
                }
            }
        });
    }

    function renderFilms() {
        if (!filmsContainer) return;

        filmsContainer.innerHTML = '';
        films.forEach((film, index) => {
            const filmElement = document.createElement('div');
            filmElement.className = 'film-item-draggable';
            filmElement.style.backgroundColor = filmColors[index % filmColors.length];
            filmElement.innerHTML = `
                <div class="dnd-film-item__poster-wrapper">
                    <div class="dnd-film-item__poster" style="background-image: url(${film.film_poster});"></div>
                </div>
                <div class="film-item-draggable__info">
                    <h5 class="film-item-draggable__title">${film.film_name}</h5>
                    <p class="film-item-draggable__duration">${film.film_duration} мин.</p>
                </div>
                 <a href="#" class="btn-reset delete-film-btn" data-film-id="${film.id}" aria-label="Удалить фильм">
                    <img src="${deleteButtonImg}" alt="Удалить фильм">
                 </a>
            `;
            filmsContainer.appendChild(filmElement);
        });
    }

    function renderSeances() {
        if (!seancesContainer) return;
        seancesContainer.innerHTML = '<h5>Сетка сеансов</h5>';
        // Тут будет более сложная логика отрисовки таймлайнов
        // Пока просто выведем список для проверки
        const seancesList = document.createElement('ul');
        seances.forEach(seance => {
            const film = films.find(f => f.id === seance.seance_filmid);
            const hall = halls.find(h => h.id === seance.seance_hallid);
            if (film && hall) {
                 const listItem = document.createElement('li');
                 listItem.textContent = `Фильм "${film.film_name}" в зале "${hall.hall_name}" в ${seance.seance_time}`;
                 seancesList.appendChild(listItem);
            }
        });
        if (seances.length === 0) {
            seancesContainer.innerHTML += '<p>Сеансов пока нет.</p>';
        } else {
            seancesContainer.appendChild(seancesList);
        }
    }

    function renderAll() {
        renderHalls();
        renderFilms();
        renderSeances();
    }

    // --- DATA LOADING ---
    async function loadAllData() {
        const data = await apiRequest('alldata');
        if (data && data.success) {
            halls = data.result.halls || [];
            films = data.result.films || [];
            seances = data.result.seances || [];
            renderAll();
            initializeSeanceGrid();
        } else {
            if (hallsList) hallsList.innerHTML = `<p class="text-danger">Не удалось загрузить данные о залах.</p>`;
        }
    }

    // --- EVENT LISTENERS & LOGIC ---

    // Модальное окно "Добавить зал"
    if (addHallBtn) addHallBtn.addEventListener('click', () => addHallModal.classList.remove('hidden'));
    if (closeAddHallBtn) closeAddHallBtn.addEventListener('click', () => addHallModal.classList.add('hidden'));
    if (cancelAddHallBtn) cancelAddHallBtn.addEventListener('click', () => addHallModal.classList.add('hidden'));

    if (addHallForm) {
        addHallForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const hallName = addHallForm.querySelector('[name="hallName"]').value.trim();
            if (!hallName) return alert('Название зала не может быть пустым.');
            
            const result = await apiRequest('hall', 'POST', { hallName });
            if (result && result.success) {
                addHallModal.classList.add('hidden');
                addHallForm.reset();
                await loadAllData();
            } else {
                alert(result.error || 'Произошла неизвестная ошибка.');
            }
        });
    }

    // Удаление зала
    if (hallsList) {
        hallsList.addEventListener('click', async (e) => {
            const deleteBtn = e.target.closest('.delete-hall-btn');
            if (deleteBtn) {
                e.preventDefault();
                const hallId = deleteBtn.dataset.hallId;
                if (confirm('Вы уверены, что хотите удалить этот зал? Это действие необратимо.')) {
                    const result = await apiRequest(`hall/${hallId}`, 'DELETE');
                    if (result && result.success) {
                        await loadAllData();
                    } else {
                        alert(result.error || 'Не удалось удалить зал.');
                    }
                }
            }
        });
    }

    // --- Модальное окно "Добавить фильм" ---
    if (addFilmBtn) {
        addFilmBtn.addEventListener('click', () => addFilmModal.classList.remove('hidden'));
    }
    if (closeAddFilmModalBtn) {
        closeAddFilmModalBtn.addEventListener('click', () => addFilmModal.classList.add('hidden'));
    }
    if (cancelAddFilmBtn) {
        cancelAddFilmBtn.addEventListener('click', () => addFilmModal.classList.add('hidden'));
    }

    if (posterFileInput) {
        posterFileInput.addEventListener('change', () => {
            if (posterFileInput.files.length > 0) {
                posterFileNameSpan.textContent = posterFileInput.files[0].name;
            } else {
                posterFileNameSpan.textContent = 'Файл не выбран';
            }
        });
    }
    
    if (addFilmForm) {
        addFilmForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData();
            formData.append('filmName', document.getElementById('film-title-input').value);
            formData.append('filmDuration', document.getElementById('film-duration-input').value);
            formData.append('filmDescription', document.getElementById('film-description-input').value);
            formData.append('filmOrigin', document.getElementById('film-origin-input').value);
            if(posterFileInput.files[0]) {
                 formData.append('filePoster', posterFileInput.files[0]);
            }

            const result = await apiRequest('film', 'POST', formData);

            if (result && result.success) {
                addFilmModal.classList.add('hidden');
                addFilmForm.reset();
                posterFileNameSpan.textContent = 'Файл не выбран';
                await loadAllData();
            } else {
                alert(result.error || 'Произошла ошибка при добавлении фильма.');
            }
        });
    }

    // Конфигурация залов
    let selectedHallForConfig = null;

    function renderHallConfigGrid() {
        if (!hallConfigGrid) return;
        const rows = parseInt(rowsCountInput.value, 10) || 0;
        const seats = parseInt(seatsCountInput.value, 10) || 0;
        const config = selectedHallForConfig ? selectedHallForConfig.hall_config : [];

        hallConfigGrid.innerHTML = '';
        for (let i = 0; i < rows; i++) {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'hall-config__row';
            for (let j = 0; j < seats; j++) {
                const seatDiv = document.createElement('div');
                const seatType = (config && config[i] && config[i][j]) ? config[i][j] : 'standart';
                seatDiv.className = `hall-config__seat hall-config__seat--${seatType}`;
                rowDiv.appendChild(seatDiv);
            }
            hallConfigGrid.appendChild(rowDiv);
        }
    }

    if (hallConfigSelect) {
        hallConfigSelect.addEventListener('change', () => {
            selectedHallForConfig = halls.find(h => h.id == hallConfigSelect.value);
            if (selectedHallForConfig) {
                rowsCountInput.value = selectedHallForConfig.hall_rows;
                seatsCountInput.value = selectedHallForConfig.hall_places;
                renderHallConfigGrid();
            }
        });
    }
    
    [rowsCountInput, seatsCountInput].forEach(input => {
        if(input) input.addEventListener('input', () => {
            if (selectedHallForConfig) {
                 renderHallConfigGrid();
            } else {
                alert("Сначала выберите зал, чтобы менять его размеры.");
                rowsCountInput.value = '';
                seatsCountInput.value = '';
            }
        });
    });

    if (hallConfigGrid) {
        hallConfigGrid.addEventListener('click', (e) => {
            if (e.target.matches('.hall-config__seat')) {
                const classList = e.target.classList;
                if (classList.contains('hall-config__seat--standart')) {
                    classList.replace('hall-config__seat--standart', 'hall-config__seat--vip');
                } else if (classList.contains('hall-config__seat--vip')) {
                    classList.replace('hall-config__seat--vip', 'hall-config__seat--disabled');
                } else {
                    classList.replace('hall-config__seat--disabled', 'hall-config__seat--standart');
                }
            }
        });
    }

    if (hallConfigForm) {
        hallConfigForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!selectedHallForConfig) return alert('Сначала выберите зал для конфигурации.');
            
            const newConfig = Array.from(hallConfigGrid.querySelectorAll('.hall-config__row')).map(row => 
                Array.from(row.querySelectorAll('.hall-config__seat')).map(seat => {
                    if (seat.classList.contains('hall-config__seat--vip')) return 'vip';
                    if (seat.classList.contains('hall-config__seat--disabled')) return 'disabled';
                    return 'standart';
                })
            );
            
            const params = {
                rowCount: rowsCountInput.value,
                placeCount: seatsCountInput.value,
                config: JSON.stringify(newConfig)
            };
            
            const result = await apiRequest(`hall/${selectedHallForConfig.id}`, 'POST', params);
            if(result !== null) {
                alert('Конфигурация зала успешно сохранена!');
                await loadAllData();
            }
        });
    }

    // Конфигурация цен
    let selectedHallForPricing = null;
    if (priceConfigSelect) {
        priceConfigSelect.addEventListener('change', () => {
            selectedHallForPricing = halls.find(h => h.id == priceConfigSelect.value);
            if (selectedHallForPricing) {
                standartPriceInput.value = selectedHallForPricing.hall_price_standart;
                vipPriceInput.value = selectedHallForPricing.hall_price_vip;
            }
        });
    }

    if (priceConfigForm) {
        priceConfigForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!selectedHallForPricing) return alert('Сначала выберите зал для конфигурации цен.');
            
            const params = {
                priceStandart: standartPriceInput.value,
                priceVip: vipPriceInput.value
            };

            const result = await apiRequest(`price/${selectedHallForPricing.id}`, 'POST', params);
            if (result !== null) {
                alert('Цены успешно сохранены!');
                await loadAllData();
            }
        });
    }

    // Открыть/Закрыть продажи
    let selectedHallForSales = null;
    function updateSalesButton() {
        if (!openSalesBtn) return;
        if (selectedHallForSales) {
            const isOpen = Number(selectedHallForSales.hall_open) === 1;
            openSalesBtn.textContent = isOpen ? 'Приостановить продажу билетов' : 'Открыть продажу билетов';
            openSalesBtn.classList.toggle('btn-danger', isOpen);
            openSalesBtn.classList.toggle('btn-primary', !isOpen);
            openSalesBtn.disabled = false;
        } else {
            openSalesBtn.textContent = 'Выберите зал';
            openSalesBtn.disabled = true;
        }
    }

    if (salesHallSelect) {
        salesHallSelect.addEventListener('change', () => {
            selectedHallForSales = halls.find(h => h.id == salesHallSelect.value);
            updateSalesButton();
        });
    }

    if (openSalesForm) {
        openSalesForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!selectedHallForSales) return alert('Сначала выберите зал.');
            
            const params = {
                hallOpen: Number(selectedHallForSales.hall_open) === 1 ? '0' : '1'
            };
            
            const result = await apiRequest(`open/${selectedHallForSales.id}`, 'POST', params);
            if(result !== null) {
                alert('Статус продаж успешно изменен!');
                await loadAllData();
            }
        });
    }

    // --- DnD Сетка сеансов ---
    function initializeSeanceGrid() {
        const dndFilmsList = document.getElementById('dnd-films-list');
        const dndTimelines = document.getElementById('dnd-timelines');

        if (!dndFilmsList || !dndTimelines) return;

        // 1. Рендер списка фильмов для перетаскивания
        dndFilmsList.innerHTML = '';
        dndFilmsList.className = 'row gy-3'; // Используем Bootstrap Grid

        films.forEach(film => {
            const filmWrapper = document.createElement('div');
            // Каждая плитка - это колонка. На средних экранах (md) и больше - 3 в ряд (col-md-4)
            filmWrapper.className = 'col-md-4'; 

            const filmEl = document.createElement('div');
            filmEl.className = 'dnd-film-item';
            filmEl.draggable = true;
            filmEl.dataset.filmId = film.id;
            filmEl.dataset.duration = film.film_duration;
            const bgColor = filmColors[film.id % filmColors.length];
            filmEl.style.backgroundColor = bgColor;

            const posterDiv = document.createElement('div');
            posterDiv.className = 'dnd-film-item__poster';

            try {
                // Преобразуем абсолютный URL в относительный для прокси
                const posterUrl = new URL(film.film_poster);
                posterDiv.style.backgroundImage = `url(${posterUrl.pathname})`;
            } catch (e) {
                console.error(`Invalid poster URL: ${film.film_poster}`);
            }

            const infoDiv = document.createElement('div');
            infoDiv.className = 'dnd-film-item__info';
            infoDiv.innerHTML = `
                <h5 class="dnd-film-item__title">${film.film_name}</h5>
                <p class="dnd-film-item__duration">${film.film_duration} мин.</p>
            `;

            const deleteLink = document.createElement('a');
            deleteLink.href = '#';
            deleteLink.className = 'btn-reset delete-film-btn';
            deleteLink.dataset.filmId = film.id;
            deleteLink.setAttribute('aria-label', 'Удалить фильм');
            deleteLink.innerHTML = `<img src="${deleteButtonImg}" alt="Удалить фильм">`;

            filmEl.appendChild(posterDiv);
            filmEl.appendChild(infoDiv);
            filmEl.appendChild(deleteLink);

            filmWrapper.appendChild(filmEl);
            dndFilmsList.appendChild(filmWrapper);
        });

        // 2. Рендер таймлайнов
        dndTimelines.innerHTML = '';
        const totalMinutesInTimeline = 24 * 60; 

        halls.forEach(hall => {
            const hallDiv = document.createElement('div');
            hallDiv.className = 'dnd-hall-block';
            hallDiv.innerHTML = `<h5 class="dnd-hall-block__title">${hall.hall_name}</h5>`;
            
            const timeline = document.createElement('div');
            timeline.className = 'dnd-timeline';
            timeline.dataset.hallId = hall.id;

            // Рендер существующих сеансов
            seances.filter(s => s.seance_hallid === hall.id).forEach(seance => {
                const film = films.find(f => f.id === seance.seance_filmid);
                if (!film) return;

                const filmDuration = film.film_duration;
                const [startHour, startMinute] = seance.seance_time.split(':').map(Number);
                const seanceStartInMinutes = startHour * 60 + startMinute;
                
                const seanceEl = document.createElement('div');
                seanceEl.className = 'dnd-seance';
                seanceEl.draggable = true;
                seanceEl.dataset.seanceId = seance.id;
                seanceEl.dataset.filmId = film.id;
                
                const filmColor = filmColors[film.id % filmColors.length];
                seanceEl.style.backgroundColor = filmColor;
                seanceEl.style.left = `${(seanceStartInMinutes / totalMinutesInTimeline) * 100}%`;
                seanceEl.style.width = `${(filmDuration / totalMinutesInTimeline) * 100}%`;
                
                seanceEl.innerHTML = `
                    <p class="dnd-seance__title">${film.film_name}</p>
                    <p class="dnd-seance__time">${seance.seance_time}</p>
                    <button class="btn-reset dnd-seance__delete" data-seance-id="${seance.id}">&times;</button>
                `;
                timeline.appendChild(seanceEl);
            });
            
            hallDiv.appendChild(timeline);
            dndTimelines.appendChild(hallDiv);
        });

        // 3. Логика DND
        let draggedElement = null;

        dndFilmsList.addEventListener('dragstart', e => {
            if (e.target.classList.contains('dnd-film-item')) {
                draggedElement = e.target;
            }
        });
        
        dndTimelines.addEventListener('dragstart', e => {
            if (e.target.classList.contains('dnd-seance')) {
                draggedElement = e.target;
            }
        });

        dndTimelines.addEventListener('dragover', e => {
            e.preventDefault();
        });

        dndTimelines.addEventListener('drop', async e => {
            e.preventDefault();
            const timeline = e.target.closest('.dnd-timeline');
            if (!timeline || !draggedElement) return;

            const hallId = timeline.dataset.hallId;
            const timelineRect = timeline.getBoundingClientRect();
            const dropPosition = e.clientX - timelineRect.left;
            const dropTimeInMinutes = Math.round((dropPosition / timelineRect.width) * totalMinutesInTimeline);
            
            const hours = Math.floor(dropTimeInMinutes / 60);
            const minutes = dropTimeInMinutes % 60;
            const seanceTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            
            const filmId = draggedElement.dataset.filmId;

            // TODO: Проверка на пересечение сеансов

            if (draggedElement.classList.contains('dnd-film-item')) { // Добавление нового сеанса
                const result = await apiRequest('seance', 'POST', {
                    seanceHallid: hallId,
                    seanceFilmid: filmId,
                    seanceTime: seanceTime
                });

                if (result && result.success) {
                    await loadAllData(); 
                } else {
                    alert(result.error || 'Ошибка добавления сеанса');
                }
            }
            draggedElement = null;
        });

        // 4. Удаление сеанса
        dndTimelines.addEventListener('click', async (e) => {
            const deleteBtn = e.target.closest('.dnd-seance__delete');
            if(deleteBtn) {
                const seanceId = deleteBtn.dataset.seanceId;
                 if (confirm('Удалить этот сеанс?')) {
                     // Предполагаем, что есть такой эндпоинт, хоть его и нет в доках
                     const result = await apiRequest(`seance/${seanceId}`, 'DELETE');
                     if(result && result.success) {
                         await loadAllData();
                     } else {
                         alert(result.error || 'Не удалось удалить сеанс.');
                     }
                 }
            }
        });
    }

    // --- INITIALIZATION ---
    loadAllData();
}); 
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/main.scss';
import { apiRequest } from './api';

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

    const filmsContainer = document.getElementById('films');
    const seancesContainer = document.getElementById('seances');

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
        hallsList.innerHTML = halls.map(hall => `
            <div class="hall-item">
              <span>${hall.hall_name}</span>
              <button class="btn btn-sm btn-danger delete-hall-btn" data-hall-id="${hall.id}" aria-label="Удалить зал">&times;</button>
            </div>
        `).join('') || '<p>Залов пока нет. Создайте первый!</p>';
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

    function renderAll() {
        renderHalls();
        // Заглушки для будущего функционала
        if (filmsContainer) filmsContainer.innerHTML = '<p>Фильмов пока нет.</p>';
        if (seancesContainer) seancesContainer.innerHTML = '<p>Сеансов пока нет.</p>';
    }

    // --- DATA LOADING ---
    async function loadAllData() {
        const data = await apiRequest('alldata');
        if (data) {
            halls = data.halls || [];
            films = data.films || [];
            seances = data.seances || [];
            renderAll();
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
            if (result !== null) {
                addHallModal.classList.add('hidden');
                addHallForm.reset();
                await loadAllData();
            }
        });
    }

    // Удаление зала
    if (hallsList) {
        hallsList.addEventListener('click', async (e) => {
            if (e.target.matches('.delete-hall-btn')) {
                e.preventDefault();
                const hallId = e.target.dataset.hallId;
                if (confirm('Вы уверены, что хотите удалить этот зал? Это действие необратимо.')) {
                    const result = await apiRequest(`hall/${hallId}`, 'DELETE');
                    if (result !== null) {
                        await loadAllData();
                    }
                }
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

    // --- INITIALIZATION ---
    loadAllData();
}); 
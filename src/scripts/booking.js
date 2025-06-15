import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/main.scss';
import { apiRequest } from './api';

function getQueryParam(param) {
    const value = new URLSearchParams(window.location.search).get(param);
    if (!value) throw new Error(`Параметр ${param} не указан`);
    return value;
}

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const seanceId = params.get('seanceId');
    const date = params.get('date'); // Получаем дату из URL

    const bookingInfoContainer = document.querySelector('.booking-info');
    const hallSchemeContainer = document.querySelector('.hall-scheme');
    const bookingButton = document.querySelector('.booking-total__button');

    if (!seanceId || !date) {
        if (bookingInfoContainer) bookingInfoContainer.innerHTML = '<p class="error-message">Ошибка: ID сеанса или дата не указаны в URL.</p>';
        return;
    }

    let hallData = null;
    let filmData = null;
    let seanceData = null;
    let hallConfig = [];

    try {
        const response = await apiRequest('alldata', 'GET', null, false);
        const configResponse = await apiRequest(`hallconfig?seanceId=${seanceId}&date=${date}`, 'GET', null, false);
        
        if (!response.success || !configResponse.success) {
            throw new Error("Не удалось загрузить данные о сеансе или конфигурацию зала");
        }

        const allData = response.result; 
        hallConfig = configResponse.result;

        seanceData = allData.seances.find(s => s.id == seanceId);
        if (!seanceData) throw new Error('Сеанс не найден');

        hallData = allData.halls.find(h => h.id == seanceData.seance_hallid);
        if (!hallData) throw new Error('Зал не найден');
        
        filmData = allData.films.find(f => f.id == seanceData.seance_filmid);
        if (!filmData) throw new Error('Фильм не найден');

        renderBookingInfo();
        renderHallScheme();
        setupBookingButton();

    } catch (error) {
        if (bookingInfoContainer) bookingInfoContainer.innerHTML = `<p class="error-message">${error.message}</p>`;
        console.error('Ошибка при загрузке данных для бронирования:', error);
    }
    
    function renderBookingInfo() {
        if (!bookingInfoContainer) return;
        bookingInfoContainer.innerHTML = `
                <div class="booking-info__poster">
                <img src="${filmData.film_poster}" alt="Постер фильма ${filmData.film_name}">
                </div>
                <div class="booking-info__details">
                <h2 class="booking-info__title">${filmData.film_name}</h2>
                    <div class="booking-info__session">
                    <p><strong>Начало:</strong> ${seanceData.seance_time}</p>
                    <p><strong>Зал:</strong> ${hallData.hall_name}</p>
                    <p><strong>Дата:</strong> ${new Date(date).toLocaleDateString('ru-RU')}</p>
                </div>
            </div>
        `;
    }

    function renderHallScheme() {
        if (!hallSchemeContainer) return;

        // Очищаем предыдущую схему
        hallSchemeContainer.innerHTML = ''; 

        const screenDiv = document.createElement('div');
        screenDiv.className = 'hall-screen-label';
        screenDiv.textContent = 'ЭКРАН';
        hallSchemeContainer.appendChild(screenDiv);

        const schemeGrid = document.createElement('div');
        schemeGrid.className = 'hall-scheme__grid';

        hallConfig.forEach((row, rowIndex) => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'hall-row';
            row.forEach((seatType, seatIndex) => {
                const seatDiv = document.createElement('div');
                seatDiv.className = `seat seat--${seatType}`;
                if (seatType !== 'taken') {
                    seatDiv.dataset.row = rowIndex + 1;
                    seatDiv.dataset.place = seatIndex + 1;
                    seatDiv.dataset.type = seatType; // 'standart' или 'vip'
                    seatDiv.addEventListener('click', () => {
                        seatDiv.classList.toggle('seat--selected');
                        updateBookingButtonState();
                    });
                }
                rowDiv.appendChild(seatDiv);
            });
            schemeGrid.appendChild(rowDiv);
        });
        hallSchemeContainer.appendChild(schemeGrid);
        renderLegend();
    }

    function renderLegend() {
        const legendContainer = document.querySelector('.hall-legend');
        if (!legendContainer) return;
        legendContainer.innerHTML = `
            <div class="hall-legend__item">
                <div class="seat seat--standart"></div> <span class="hall-legend__text">— Свободно (${hallData.hall_price_standart}руб)</span>
            </div>
            <div class="hall-legend__item">
                <div class="seat seat--vip"></div> <span class="hall-legend__text">— Свободно VIP (${hallData.hall_price_vip}руб)</span>
            </div>
            <div class="hall-legend__item">
                <div class="seat seat--taken"></div> <span class="hall-legend__text">— Занято</span>
            </div>
            <div class="hall-legend__item">
                <div class="seat seat--selected"></div> <span class="hall-legend__text">— Выбрано</span>
            </div>
        `;
    }

    function updateBookingButtonState() {
        const selectedSeats = hallSchemeContainer.querySelectorAll('.seat--selected');
        bookingButton.disabled = selectedSeats.length === 0;
    }

    function setupBookingButton() {
        if (!bookingButton) return;
        bookingButton.disabled = true; // Изначально кнопка неактивна

        bookingButton.addEventListener('click', async () => {
            const selectedSeats = Array.from(hallSchemeContainer.querySelectorAll('.seat--selected'));
            if (selectedSeats.length === 0) {
                return;
            }

            const tickets = selectedSeats.map(seat => ({
                row: seat.dataset.row,
                place: seat.dataset.place,
                coast: seat.dataset.type === 'vip' ? hallData.hall_price_vip : hallData.hall_price_standart
                }));

            const totalCost = tickets.reduce((sum, ticket) => sum + Number(ticket.coast), 0);

            try {
                bookingButton.textContent = 'Обработка...';
                bookingButton.disabled = true;

                await apiRequest('ticket', 'POST', {
                    seanceId: seanceId,
                    ticketDate: date,
                    tickets: JSON.stringify(tickets)
                }, false);

                // Сохраняем данные для страницы билета
                const ticketPageData = {
                    filmName: filmData.film_name,
                    hallName: hallData.hall_name,
                    seanceTime: seanceData.seance_time,
                    date: date,
                    seats: tickets.map(t => ({ row: t.row, place: t.place })),
                    totalCost: totalCost
                };
                localStorage.setItem('lastBookedTicket', JSON.stringify(ticketPageData));

                // Перенаправляем на страницу билета
                window.location.href = 'ticket.html';

            } catch (error) {
                alert(`Ошибка бронирования: ${error.message}`);
                bookingButton.textContent = 'Забронировать';
                updateBookingButtonState(); // Восстанавливаем состояние кнопки
            }
        });
    }
});

function showError(container, message) {
    container.innerHTML = `
        <div class="error-message">
            ${message}
        </div>
    `;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
} 
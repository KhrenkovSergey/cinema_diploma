import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/main.scss';
import { apiRequest } from './api';

function getQueryParam(param) {
    const value = new URLSearchParams(window.location.search).get(param);
    if (!value) throw new Error(`Параметр ${param} не указан`);
    return value;
}

document.addEventListener('DOMContentLoaded', async () => {
    const hallContainer = document.getElementById('hall');
    const bookingInfo = document.getElementById('booking-info');

    if (!hallContainer || !bookingInfo) {
        document.body.innerHTML = `
            <div class="container">
                <div class="error-message">
                    Ошибка: не найдены необходимые элементы на странице
                </div>
            </div>
        `;
        return;
    }

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const seanceId = urlParams.get('seanceId');
        const date = urlParams.get('date');

        if (!seanceId || !date) {
            showError(bookingInfo, 'Не указаны необходимые параметры для бронирования');
            return;
        }

        // Загружаем данные
        const response = await apiRequest('alldata');
        if (!response || !response.success) {
            throw new Error('Не удалось загрузить данные');
        }

        const data = response.result;
        if (!data || !data.films || !data.seances || !data.halls) {
            throw new Error('Некорректные данные от сервера');
        }

        // Находим информацию о сеансе
        const seance = data.seances.find(s => s.id === parseInt(seanceId));
        if (!seance) {
            throw new Error('Сеанс не найден');
        }

        // Находим информацию о фильме
        const film = data.films.find(f => f.id === seance.seance_filmid);
        if (!film) {
            throw new Error('Фильм не найден');
        }

        // Находим информацию о зале
        const hall = data.halls.find(h => h.id === seance.seance_hallid);
        if (!hall) {
            throw new Error('Зал не найден');
        }

        // Отображаем информацию о фильме и сеансе
        bookingInfo.innerHTML = `
            <div class="booking-info">
                <div class="booking-info__poster">
                    <img src="${film.film_poster}" alt="${film.film_name}">
                </div>
                <div class="booking-info__details">
                    <h1 class="booking-info__title">${film.film_name}</h1>
                    <div class="booking-info__meta">
                        <span>${film.film_duration} минут</span>
                        <span>${film.film_origin}</span>
                    </div>
                    <div class="booking-info__description">${film.film_description}</div>
                    <div class="booking-info__session">
                        <div>Дата: ${formatDate(date)}</div>
                        <div>Время: ${seance.seance_time}</div>
                        <div>Зал: ${hall.hall_name}</div>
                    </div>
                </div>
            </div>
            <div class="booking-prices">
                <div class="booking-prices__item">
                    <span>Обычные места:</span>
                    <span>${hall.hall_price_standart} ₽</span>
                </div>
                <div class="booking-prices__item">
                    <span>VIP места:</span>
                    <span>${hall.hall_price_vip} ₽</span>
                </div>
            </div>
        `;

        // Загружаем конфигурацию зала
        const hallConfigResponse = await apiRequest(`hallconfig?seanceId=${seanceId}&date=${date}`);
        if (!hallConfigResponse || !hallConfigResponse.success) {
            throw new Error('Не удалось загрузить схему зала');
        }

        const hallConfig = hallConfigResponse.result;
        if (!Array.isArray(hallConfig)) {
            throw new Error('Некорректная схема зала');
        }

        // Отображаем схему зала
        const schemeContainer = document.createElement('div');
        schemeContainer.className = 'hall-scheme';

        hallConfig.forEach((row, rowIndex) => {
            const rowElement = document.createElement('div');
            rowElement.className = 'hall-row';

            row.forEach((seat, seatIndex) => {
                const seatElement = document.createElement('div');
                seatElement.className = `seat seat--${seat}`;
                seatElement.dataset.row = rowIndex + 1;
                seatElement.dataset.seat = seatIndex + 1;
                seatElement.dataset.type = seat;

                if (seat !== 'taken') {
                    seatElement.addEventListener('click', () => {
                        if (seatElement.classList.contains('seat--selected')) {
                            seatElement.classList.remove('seat--selected');
                        } else {
                            seatElement.classList.add('seat--selected');
                        }
                        updateTotalPrice();
                    });
                }

                rowElement.appendChild(seatElement);
            });

            schemeContainer.appendChild(rowElement);
        });

        // Очищаем и добавляем схему зала
        hallContainer.innerHTML = '';
        hallContainer.appendChild(schemeContainer);

        // Добавляем легенду
        const legend = document.createElement('div');
        legend.className = 'hall-legend';
        legend.innerHTML = `
            <div class="hall-legend__item">
                <div class="seat seat--standart"></div>
                <span>Обычное место (${hall.hall_price_standart} ₽)</span>
            </div>
            <div class="hall-legend__item">
                <div class="seat seat--vip"></div>
                <span>VIP место (${hall.hall_price_vip} ₽)</span>
            </div>
            <div class="hall-legend__item">
                <div class="seat seat--taken"></div>
                <span>Занято</span>
            </div>
            <div class="hall-legend__item">
                <div class="seat seat--selected"></div>
                <span>Выбрано</span>
            </div>
        `;
        hallContainer.appendChild(legend);

        // Добавляем информацию о выбранных местах и общей стоимости
        const totalInfo = document.createElement('div');
        totalInfo.className = 'booking-total';
        totalInfo.innerHTML = `
            <div class="booking-total__info">
                <span>Выбрано мест: <strong id="selected-seats">0</strong></span>
                <span>Общая стоимость: <strong id="total-price">0</strong> ₽</span>
            </div>
            <button class="booking-total__button" id="book-button" disabled>
                Забронировать
            </button>
        `;
        hallContainer.appendChild(totalInfo);

        // Функция обновления общей стоимости
        function updateTotalPrice() {
            const selectedSeats = schemeContainer.querySelectorAll('.seat--selected');
            const totalPrice = Array.from(selectedSeats).reduce((sum, seat) => {
                const isVip = seat.dataset.type === 'vip';
                return sum + (isVip ? hall.hall_price_vip : hall.hall_price_standart);
            }, 0);

            document.getElementById('selected-seats').textContent = selectedSeats.length;
            document.getElementById('total-price').textContent = totalPrice;
            document.getElementById('book-button').disabled = selectedSeats.length === 0;
        }

        // Обработчик бронирования
        document.getElementById('book-button').addEventListener('click', async () => {
            try {
                const selectedSeats = schemeContainer.querySelectorAll('.seat--selected');
                const tickets = Array.from(selectedSeats).map(seat => ({
                    row: parseInt(seat.dataset.row),
                    place: parseInt(seat.dataset.seat),
                    coast: seat.dataset.type === 'vip' ? hall.hall_price_vip : hall.hall_price_standart
                }));

                const bookingResponse = await apiRequest('ticket', 'POST', {
                    seanceId,
                    ticketDate: date,
                    tickets
                });

                if (!bookingResponse || !bookingResponse.success) {
                    throw new Error(bookingResponse?.error || 'Не удалось забронировать места');
                }

                alert('Места успешно забронированы!');
                window.location.href = '/';
            } catch (error) {
                console.error('Ошибка при бронировании:', error);
                alert(error.message);
            }
        });

    } catch (error) {
        console.error('Ошибка при загрузке страницы бронирования:', error);
        showError(bookingInfo, error.message || 'Произошла ошибка при загрузке данных');
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
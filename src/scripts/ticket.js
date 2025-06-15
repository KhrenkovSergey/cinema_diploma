import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/main.scss';
import QRCode from 'qrcode';

document.addEventListener('DOMContentLoaded', () => {
    const ticketData = JSON.parse(localStorage.getItem('lastBookedTicket'));

    if (!ticketData) {
        console.error('No ticket data found in localStorage.');
        // Возможно, перенаправить пользователя на главную страницу или показать сообщение об ошибке
        return;
    }

    const filmTitleSpan = document.getElementById('ticket-film-title');
    const seatsSpan = document.getElementById('ticket-seats');
    const hallNameSpan = document.getElementById('ticket-hall-name');
    const startTimeSpan = document.getElementById('ticket-start-time');
    const totalCostSpan = document.getElementById('ticket-total-cost');
    const qrCodeContainer = document.getElementById('qr-code-container');
    const getBookingCodeBtn = document.getElementById('get-booking-code-btn');
    const ticketHintText = document.getElementById('ticket-hint-text');

    // Изначально скрываем QR-код
    qrCodeContainer.style.display = 'none';

    filmTitleSpan.textContent = ticketData.filmName;
    seatsSpan.textContent = ticketData.seats.map(s => `${s.row}/${s.place}`).join(', ');
    hallNameSpan.textContent = ticketData.hallName;
    startTimeSpan.textContent = ticketData.seanceTime;
    totalCostSpan.textContent = `${ticketData.totalCost} рублей`;

    getBookingCodeBtn.addEventListener('click', async () => {
        // Генерируем QR-код только при нажатии на кнопку
        const qrData = `Фильм: ${ticketData.filmName}, Зал: ${ticketData.hallName}, Сеанс: ${ticketData.seanceTime}, Места: ${ticketData.seats.map(s => `${s.row}/${s.place}`).join(', ')}, Стоимость: ${ticketData.totalCost} рублей`;
        try {
            // Очищаем контейнер перед генерацией
            qrCodeContainer.innerHTML = '';
            await QRCode.toCanvas(qrCodeContainer, qrData);
            qrCodeContainer.style.display = 'block'; // Показываем QR-код
            getBookingCodeBtn.style.display = 'none'; // Скрываем кнопку после генерации
            ticketHintText.textContent = 'Покажите QR-код нашему контроллеру для подтверждения бронирования.';
        } catch (err) {
            console.error('Ошибка при генерации QR-кода', err);
            alert('Не удалось сгенерировать QR-код.');
        }
    });
}); 
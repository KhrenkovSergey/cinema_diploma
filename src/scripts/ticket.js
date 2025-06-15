import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/main.scss';
import QRCode from 'qrcode';

document.addEventListener('DOMContentLoaded', () => {
    const storedTicketData = localStorage.getItem('lastBookedTicket');
    if (!storedTicketData) {
        document.querySelector('.ticket-section').innerHTML = `
            <h2 class="ticket-section__title">Информация о билете не найдена</h2>
            <p>Возможно, вы зашли на эту страницу напрямую. Пожалуйста, вернитесь на <a href="index.html">главную</a>, чтобы забронировать билет.</p>
        `;
        return;
    }

    const ticketData = JSON.parse(storedTicketData);
    
    // Заполняем информацию о билете
    document.getElementById('ticket-film-title').textContent = ticketData.filmName;
    document.getElementById('ticket-hall-name').textContent = ticketData.hallName;
    document.getElementById('ticket-start-time').textContent = ticketData.seanceTime;
    document.getElementById('ticket-date').textContent = new Date(ticketData.date).toLocaleDateString('ru-RU');
    document.getElementById('ticket-seats').textContent = ticketData.seats.map(s => `${s.row}/${s.place}`).join(', ');

    // Формируем строку для QR-кода
    const qrString = `
Билет действителен строго на свой сеанс
Фильм: ${ticketData.filmName}
Зал: ${ticketData.hallName}
Ряд/Место: ${ticketData.seats.map(s => `${s.row}/${s.place}`).join(', ')}
Дата: ${new Date(ticketData.date).toLocaleDateString('ru-RU')}
Начало: ${ticketData.seanceTime}
Стоимость: ${ticketData.totalCost} руб.
    `.trim();

    // Генерируем QR-код
    const qrContainer = document.getElementById('qr-code-container');
    QRCode.toCanvas(qrContainer, qrString, { width: 250 }, (error) => {
        if (error) console.error(error);
        console.log('QR-код успешно сгенерирован!');
    });

    // Очищаем данные после использования
    localStorage.removeItem('lastBookedTicket');
}); 
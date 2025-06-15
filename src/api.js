const API_BASE = 'https://shfe-diplom.neto-server.ru/';

/**
 * Выполняет асинхронный запрос к API.
 * @param {string} endpoint - Конечная точка API (например, 'alldata').
 * @param {string} method - HTTP-метод ('GET', 'POST', 'DELETE', и т.д.).
 * @param {Object|null} body - Тело запроса для POST.
 * @returns {Promise<any>} - Результат запроса в случае успеха.
 * @throws {Error} - Выбрасывает ошибку в случае сбоя сети или ошибки API.
 */
export async function apiRequest(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            credentials: 'include' // НЕОБХОДИМО для отправки cookie авторизации
        };

        if (body) {
            // Если тело запроса уже является объектом FormData (например, при загрузке файла),
            // используем его напрямую. В противном случае, создаем новый объект FormData
            // из переданного объекта.
            if (body instanceof FormData) {
                options.body = body;
            } else {
                const formData = new FormData();
                Object.entries(body).forEach(([key, value]) => {
                    if (value !== null && value !== undefined) {
                        formData.append(key, value);
                    }
                });
                options.body = formData;
            }
        }

        const response = await fetch(`${API_BASE}${endpoint}`, options);
        
        // Попытка получить JSON даже при ошибке, чтобы извлечь сообщение
        const data = await response.json().catch(() => null);

        if (!response.ok || (data && !data.success)) {
            const errorMessage = (data && data.error) ? data.error : `HTTP ошибка! Статус: ${response.status}`;
            throw new Error(errorMessage);
        }

        return data.result;
    } catch (error) {
        console.error(`API Error on endpoint '${endpoint}': ${error.message}`);
        // Пробрасываем ошибку дальше, чтобы ее можно было поймать в вызывающем коде
        throw error;
    }
}
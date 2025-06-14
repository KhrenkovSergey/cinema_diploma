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
            const formData = new FormData();
            Object.entries(body).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    formData.append(key, value);
                }
            });
            options.body = formData;
        }

        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Ошибка запроса');
        }

        return data.result;
    } catch (error) {
        console.error(`API Error: ${error.message}`);
        return null;
    }
}
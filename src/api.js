const API_BASE = 'https://shfe-diplom.neto-server.ru/';

/**
 * Запрос к API
 * @param {string} endpoint - Конечный адрес (например, 'alldata')
 * @param {string} method - Метод запроса (GET, POST, DELETE)
 * @param {Object} body - Данные для запроса (опционально)
 * @returns {Promise<Object>} - Ответ API в формате JSON
 */
export async function apiRequest(endpoint, method = 'GET', body = null) {
    try {
        const options = { method };

        if (body) {
            const formData = new FormData();
            Object.entries(body).forEach(([key, value]) => formData.append(key, value));
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
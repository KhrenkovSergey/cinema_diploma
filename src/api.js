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
            headers: {} // Добавляем объект headers
        };

        // Добавляем токен авторизации для всех запросов, кроме логина
        if (endpoint !== 'login') {
            const token = localStorage.getItem('authToken');
            if (token) {
                options.headers['Authorization'] = `Bearer ${token}`;
            }
        }
        
        if (body) {
            // Если тело - FormData, оставляем как есть.
            if (body instanceof FormData) {
                options.body = body;
            } else { 
                // В остальных случаях, если это не FormData, превращаем объект в FormData.
                // Это нужно для совместимости с текущим API, которое ожидает multipart/form-data.
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
        
        const data = await response.json().catch(() => null);

        if (!response.ok || (data && !data.success)) {
            const errorMessage = (data && data.error) ? data.error : `HTTP ошибка! Статус: ${response.status}`;
            throw new Error(errorMessage);
        }
        
        // Сохраняем токен после успешного логина
        if (endpoint === 'login' && data.result.token) {
            localStorage.setItem('authToken', data.result.token);
        }

        return data;
    } catch (error) {
        console.error(`API Error on endpoint '${endpoint}': ${error.message}`);
        throw error;
    }
}
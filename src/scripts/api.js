const API_BASE = process.env.NODE_ENV === 'production' 
    ? 'https://shfe-diplom.neto-server.ru/' 
    : '/api/';

/**
 * Выполняет асинхронный запрос к API.
 */
export async function apiRequest(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            credentials: 'include'
        };

        if (data) {
            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    formData.append(key, value);
                }
            });
            options.body = formData;
        }

        console.log(`Отправка ${method} запроса к ${endpoint}`);
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        
        if (!response.ok) {
            let errorBody = 'No error body';
            try {
                errorBody = await response.json();
            } catch (e) {
                try {
                    errorBody = await response.text();
                } catch (e2) { /* ignore */ }
            }
            console.error('Server returned an error:', response.status, errorBody);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();

        if (result.success === false) {
            console.error('API operation failed:', result.error);
            throw new Error(result.error || 'Ошибка API');
        }

        console.log(`Получены данные:`, result);
        return result;
    } catch (error) {
        console.error(`API Error: ${error.message}`);
        return null;
    }
} 
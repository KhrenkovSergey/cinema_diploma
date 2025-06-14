const API_URL = 'https://shfe-diplom.neto-server.ru';

export async function apiRequest(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            credentials: 'include'
        };

        if (data) {
            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                formData.append(key, value);
            });
            options.body = formData;
        }

        console.log(`Отправка ${method} запроса к ${endpoint}`);
        const response = await fetch(`/api/${endpoint}`, options);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log(`Получены данные:`, result);
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
} 
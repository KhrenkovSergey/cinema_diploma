const API_BASE = 'https://shfe-diplom.neto-server.ru/';

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
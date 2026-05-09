import Cookies from 'js-cookie';

export const authFetch = (url, options = {}) => {
    const token = Cookies.get('authToken');
    return fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token ?? ''}`,
            ...options.headers,
        },
    });
};

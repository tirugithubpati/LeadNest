const API_BASE_URL = process.env.REACT_APP_API_URL ;

const config = {
    API_URL: API_BASE_URL,
    API_CONFIG: {
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        mode: 'cors'
    }
};
 
export { API_BASE_URL };
export default config; 
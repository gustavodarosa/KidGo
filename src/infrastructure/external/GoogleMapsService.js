class GoogleMapsService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://maps.googleapis.com/maps/api';
    }

    async getGeocode(address) {
        const response = await fetch(`${this.baseUrl}/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`);
        if (!response.ok) {
            throw new Error('Failed to fetch geocode data');
        }
        const data = await response.json();
        return data.results;
    }

    async getDirections(origin, destination) {
        const response = await fetch(`${this.baseUrl}/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${this.apiKey}`);
        if (!response.ok) {
            throw new Error('Failed to fetch directions');
        }
        const data = await response.json();
        return data.routes;
    }

    async getDistanceMatrix(origins, destinations) {
        const response = await fetch(`${this.baseUrl}/distancematrix/json?origins=${encodeURIComponent(origins)}&destinations=${encodeURIComponent(destinations)}&key=${this.apiKey}`);
        if (!response.ok) {
            throw new Error('Failed to fetch distance matrix');
        }
        const data = await response.json();
        return data.rows;
    }
}

export default GoogleMapsService;
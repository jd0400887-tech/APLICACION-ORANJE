
export function getFromLocalStorage<T>(key: string, initialDataFactory: () => T[]): T[] {
    try {
        const item = window.localStorage.getItem(key);
        if (item) {
            return JSON.parse(item);
        } else {
            const initialData = initialDataFactory();
            window.localStorage.setItem(key, JSON.stringify(initialData));
            return initialData;
        }
    } catch (error) {
        console.error(`Error reading from localStorage key “${key}”:`, error);
        const initialData = initialDataFactory();
        return initialData;
    }
}

export function saveToLocalStorage<T>(key: string, data: T[]): void {
    try {
        const serializedData = JSON.stringify(data);
        window.localStorage.setItem(key, serializedData);
    } catch (error) {
        console.error(`Error writing to localStorage key “${key}”:`, error);
    }
}

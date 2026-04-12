import PocketBase from 'pocketbase';

// Kini nga function maghimo og bag-ong instance sa matag request
export function createPocketBase() {
    return new PocketBase('http://127.0.0.1:8091');
}

// Para sa backward compatibility sa client-side code
export const pb = createPocketBase();

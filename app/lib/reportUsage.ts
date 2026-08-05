export async function reportUsage(type: 'map_load' | 'directions') {
    try {
        await fetch('/api/usage/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type }),
        });
    } catch {
        // Fire-and-forget: nunca bloquear la UX por un conteo de uso.
    }
}

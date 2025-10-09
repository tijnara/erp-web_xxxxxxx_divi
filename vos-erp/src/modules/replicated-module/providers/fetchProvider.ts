export function fetchProvider() {
    const apiUrl = "http://example.com/api/replicated";

    async function fetchReplicated(page: number) {
        const response = await fetch(`${apiUrl}?page=${page}&limit=20`);
        if (!response.ok) {
            throw new Error("Failed to fetch replicated data");
        }
        return response.json();
    }

    async function registerReplicated(data: any) {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error("Failed to register replicated data");
        }
    }

    return { fetchReplicated, registerReplicated };
}

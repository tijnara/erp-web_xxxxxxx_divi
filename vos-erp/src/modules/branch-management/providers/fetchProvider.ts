export function fetchProvider() {
    const apiUrl = "http://100.119.3.44:8090/items/branches";

    async function fetchBranches(page: number) {
        const response = await fetch(`${apiUrl}?page=${page}&limit=20`);
        if (!response.ok) {
            throw new Error("Failed to fetch branches");
        }
        return response.json();
    }

    async function registerBranch(branch: any) {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(branch),
        });
        if (!response.ok) {
            throw new Error("Failed to register branch");
        }
    }

    return { fetchBranches, registerBranch };
}

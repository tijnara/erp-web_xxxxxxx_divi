export function fetchProvider() {
    const apiUrl = "http://100.119.3.44:8090/items/branches";

    async function fetchBranches(page: number) {
        const response = await fetch(`${apiUrl}?page=${page}&limit=20`);
        if (!response.ok) {
            throw new Error("Failed to fetch branches");
        }
        return response.json();
    }

    function toAPI(data: any) {
        return {
            ...data,
            state_province: String(data.state_province),
            city: String(data.city),
            brgy: String(data.brgy),
            date_added: new Date().toISOString(),
        };
    }

    async function registerBranch(branch: any) {
        const payload = toAPI(branch);
        console.log("Payload sent to API:", JSON.stringify(payload));
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });
        const responseText = await response.text();
        console.log("API Response:", responseText);
        if (!response.ok) {
            throw new Error(`Failed to register branch: ${response.status} - ${responseText}`);
        }
    }

    return { fetchBranches, registerBranch };
}

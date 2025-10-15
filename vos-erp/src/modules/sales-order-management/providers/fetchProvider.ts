// Fixed the module export issue
export function fetchProvider() {
    return {
        fetchData: async () => {
            // Logic for fetching data specific to Sales Order Management
            console.log("Fetching sales order data...");
        },
    };
}


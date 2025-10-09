// src/app/api/assets-equipments/[...parts]/route.ts
import {NextRequest, NextResponse} from 'next/server';

const API_BASE = 'http://100.119.3.44:8090/items';

const ENDPOINT_MAP: Record<string, string> = {
    'assets': 'assets_and_equipment',
    'items': 'items',
    'types': 'item_type',
    'classifications': 'item_classification',
    'departments': 'department',
    'users': 'user',
};

async function proxyRequest(request: NextRequest) {
    const { pathname, search } = new URL(request.url);
    const parts = pathname.split('/').filter(Boolean);
    // parts will be ['api', 'assets-equipments', 'items', '1'] for /api/assets-equipments/items/1
    const resource = parts[2];
    const idPart = parts.slice(3).join('/');

    const mappedResource = ENDPOINT_MAP[resource] || resource;

    const targetUrl = `${API_BASE}/${mappedResource}${idPart ? `/${idPart}` : ''}${search}`;

    const options: RequestInit = {
        method: request.method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined,
        cache: 'no-store',
    };

    try {
        console.log(`[ASSET_PROXY] ${request.method} to ${targetUrl}`);
        const apiResponse = await fetch(targetUrl, options);

        if (apiResponse.status === 204) {
            return new NextResponse(null, { status: 204 });
        }

        const text = await apiResponse.text();
        if (text) {
            try {
                const json = JSON.parse(text);
                // The API wraps responses in a 'data' object. We unwrap it here.
                if (json.data) {
                    return NextResponse.json(json.data, { status: apiResponse.status });
                }
                return NextResponse.json(json, { status: apiResponse.status });
            } catch (e) {
                // If it's not JSON, return as plain text.
                return new NextResponse(text, { status: apiResponse.status, headers: { 'Content-Type': 'text/plain' } });
            }
        }
        return new NextResponse(null, { status: apiResponse.status });

    } catch (error) {
        console.error(`[ASSET_PROXY_ERROR]`, error);
        return NextResponse.json({ message: 'Error proxying request to the asset API.' }, { status: 502 });
    }
}

export async function GET(request: NextRequest) {
    return proxyRequest(request);
}

export async function POST(request: NextRequest) {
    return proxyRequest(request);
}

export async function PUT(request: NextRequest) {
    return proxyRequest(request);
}

export async function DELETE(request: NextRequest) {
    return proxyRequest(request);
}

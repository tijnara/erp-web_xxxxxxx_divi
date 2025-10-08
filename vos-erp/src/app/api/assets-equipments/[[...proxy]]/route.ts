// src/app/api/assets-equipments/[[...proxy]]/route.ts
import { NextResponse } from 'next/server';

const API_SOURCE = process.env.API_SOURCE || 'http://100.119.3.44:8080/api';

async function proxyRequest(request: Request) {
    const { pathname, search } = new URL(request.url);
    const endpoint = pathname.replace('/api/assets-equipments', '');
    const targetUrl = `${API_SOURCE}${endpoint}${search}`;

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
        const apiResponse = await fetch(targetUrl, options);

        if (apiResponse.status === 204) {
            return new NextResponse(null, { status: 204 });
        }

        const data = await apiResponse.json();
        return NextResponse.json(data, { status: apiResponse.status });
    } catch (error) {
        console.error(`[ASSET_PROXY_ERROR]`, error);
        return NextResponse.json({ message: 'Error proxying request to the asset API.' }, { status: 502 });
    }
}

export async function GET(request: Request) {
    return proxyRequest(request);
}

export async function POST(request: Request) {
    return proxyRequest(request);
}

export async function PUT(request: Request) {
    return proxyRequest(request);
}

export async function DELETE(request: Request) {
    return proxyRequest(request);
}


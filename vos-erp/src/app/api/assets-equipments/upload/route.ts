// src/app/api/assets-equipments/upload/route.ts
import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
    try {
        const data = await request.formData();
        const file: File | null = data.get('image') as unknown as File;

        if (!file) {
            return NextResponse.json({ message: 'No file was uploaded.' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `${uniqueSuffix}${path.extname(file.name)}`;
        const uploadPath = path.join(process.cwd(), 'public/uploads', filename);

        // Ensure the directory exists
        const dir = path.dirname(uploadPath);
        const fs = require('fs');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        await writeFile(uploadPath, buffer);

        const fileUrl = `/uploads/${filename}`;
        return NextResponse.json({ url: fileUrl });

    } catch (error) {
        console.error('[UPLOAD_ERROR]', error);
        return NextResponse.json({ message: 'File upload failed.' }, { status: 500 });
    }
}


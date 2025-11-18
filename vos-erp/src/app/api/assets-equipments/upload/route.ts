// src/app/api/assets-equipments/upload/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase'; // Ensure this points to your client

export async function POST(request: Request) {
    try {
        const data = await request.formData();
        const file: File | null = data.get('image') as unknown as File;

        if (!file) {
            return NextResponse.json({ message: 'No file was uploaded.' }, { status: 400 });
        }

        // 1. Prepare file for upload
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate a unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `uploads/${fileName}`; // Organizing inside an 'uploads' folder

        // 2. Upload to Supabase Storage
        const { error: uploadError } = await supabase
            .storage
            .from('assets') // Ensure you created this bucket in Supabase
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) {
            console.error('Supabase Upload Error:', uploadError);
            throw uploadError;
        }

        // 3. Get Public URL
        const { data: urlData } = supabase
            .storage
            .from('assets')
            .getPublicUrl(filePath);

        // Return the full public URL
        return NextResponse.json({ url: urlData.publicUrl });
    } catch (error) {
        console.error('[UPLOAD_ERROR]', error);
        return NextResponse.json({ message: 'File upload failed.' }, { status: 500 });
    }
}

import { Router } from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fetch from 'node-fetch';
import dayjs from 'dayjs';
import path from 'path';

const router = Router();

// Konfigurasi Multer (simpan file di memori sementara)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/', upload.single('file'), async (req, res) => {
    const file = req.file;
    const turnstileToken = req.body['cf-turnstile-response']; // Nama field default dari Turnstile

    if (!file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    if (!turnstileToken) {
        return res.status(400).json({ success: false, message: 'CAPTCHA token is missing.' });
    }

    // 1. Verifikasi Cloudflare Turnstile Token
    try {
        const verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
        const formData = new URLSearchParams();
        formData.append('secret', process.env.TURNSTILE_SECRET_KEY);
        formData.append('response', turnstileToken);
        // Jika perlu, tambahkan remoteip: formData.append('remoteip', req.ip);

        const turnstileResponse = await fetch(verifyUrl, {
            method: 'POST',
            body: formData,
        });
        const turnstileData = await turnstileResponse.json();

        if (!turnstileData.success) {
            console.error('CAPTCHA verification failed:', turnstileData['error-codes']);
            return res.status(403).json({
                success: false,
                message: 'CAPTCHA verification failed.',
                errors: turnstileData['error-codes'],
            });
        }
    } catch (error) {
        console.error('Error verifying CAPTCHA:', error);
        return res.status(500).json({ success: false, message: 'Error verifying CAPTCHA.' });
    }

    // 2. Unggah file ke GCS
    const s3Client = new S3Client({
      endpoint: process.env.GCS_S3_ENDPOINT,
      region: process.env.GCS_REGION || 'auto',
      credentials: {
        accessKeyId: process.env.GCS_ACCESS_KEY_ID,
        secretAccessKey: process.env.GCS_SECRET_ACCESS_KEY,
      },
    });
    const fileName = `${dayjs().format('YYYYMMDD')}/${crypto.randomUUID()}${path.extname(file.originalname)}`;
    const params = {
        Bucket: process.env.GCS_BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        // ACL: 'public-read', // Opsional: jika ingin file bisa diakses publik secara default
    };

    try {
        const command = new PutObjectCommand(params);
        await s3Client.send(command);

        // GCS URL format (bisa berbeda tergantung konfigurasi bucket & object ACL)
        // Untuk objek yang tidak publik, Anda perlu generate signed URL
        const fileUrl = `${process.env.GCS_S3_ENDPOINT}/${process.env.GCS_BUCKET_NAME}/${fileName}`;

        res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            fileName: fileName,
            filePath: fileUrl, // Atau path relatif jika tidak publik
        });
    } catch (error) {
        console.error('Error uploading:', error);
        res.status(500).json({ success: false, message: 'Failed to upload.' });
    }
});

export default router;
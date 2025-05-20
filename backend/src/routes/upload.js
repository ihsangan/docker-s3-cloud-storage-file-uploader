import { Router } from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fetch from 'node-fetch';
import dayjs from 'dayjs';
import path from 'path';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/', upload.single('file'), async (req, res) => {
    const file = req.file;
    const turnstileToken = req.body['cf-turnstile-response'];
    if (!file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    if (!turnstileToken) {
        return res.status(400).json({ success: false, message: 'CAPTCHA token is missing.' });
    }

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

    const s3Client = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || 'auto',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
      },
    });
    const fileName = `${dayjs().format('YYYYMMDD')}/${crypto.randomUUID()}${path.extname(file.originalname)}`;
    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        // ACL: 'public-read', // Opsional: jika ingin file bisa diakses publik secara default
    };

    try {
        const command = new PutObjectCommand(params);
        await s3Client.send(command);
        const fileUrl = `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET_NAME}/${fileName}`;

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
import { Hono } from 'hono'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dayjs from 'dayjs';
import path from 'path';

const uploadApp = new Hono()

uploadApp.post('/', async (c) => {
  const body = await c.req.parseBody()
  const fdata = await c.req.formData()
  const file = body['file']
  const turnstileToken = body['cf-turnstile-response']
  if (!file || typeof file === 'string') {
    return c.json({ success: false, message: 'No file uploaded.' }, 400)
  }
  if (!turnstileToken || typeof turnstileToken !== 'string') {
    return c.json({ success: false, message: 'CAPTCHA token is missing.' }, 400)
  }
  
  try {
    const formData = new FormData()
    formData.append('secret', process.env.TURNSTILE_SECRET_KEY!)
    formData.append('response', turnstileToken)

    const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    })

    const data = await turnstileRes.json()
    if (!data.success) {
      console.error('CAPTCHA verification failed:', data['error-codes'])
      return c.json({
        success: false,
        message: 'CAPTCHA verification failed.',
        errors: data['error-codes'],
      }, 403)
    }
  } catch (err) {
    console.error('Error verifying CAPTCHA:', err)
    return c.json({ success: false, message: 'Error verifying CAPTCHA.' }, 500)
  }
  
  /**return c.json({
    success: true,
    message: 'hore'
  }, 200)**/
  
  const s3Client = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'auto',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY!,
      secretAccessKey: process.env.S3_SECRET_KEY!,
    },
  })
  
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const fileName = `${dayjs().format('YYYYMMDD')}/${crypto.randomUUID()}${path.extname(file.name)}`

  const uploadParams = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentType: file.type,
  }

  try {
    await s3Client.send(new PutObjectCommand(uploadParams))
    const fileUrl = `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET_NAME}/${fileName}`

    return c.json({
      success: true,
      message: 'File uploaded successfully',
      fileName,
      filePath: fileUrl,
    }, 200)
  } catch (err) {
    console.error('Error uploading to S3:', err)
    return c.json({ success: false, message: 'Failed to upload.' }, 500)
  }
})

export default uploadApp
import React, { useState, useRef } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import styles from './FileUploader.module.css';

declare global {
    interface Window {
        turnstile?: {
            reset: (widgetIdOrContainer: string | HTMLElement) => void;
            getResponse: (widgetIdOrContainer: string | HTMLElement) => string | undefined;
            render: (container: string | HTMLElement, options: TurnstileOptions) => string | undefined;
        };
    }
}

interface TurnstileOptions {
    sitekey: string;
    callback?: (token: string) => void;
    'expired-callback'?: () => void;
    'error-callback'?: () => void;
}

interface UploadResponse {
    success: boolean;
    message: string;
    fileName?: string;
    filePath?: string;
    errors?: string[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function FileUploader(): React.JSX.Element {
    const [file, setFile] = useState<File | null>(null);
    const [message, setMessage] = useState<string>('');
    const [isError, setIsError] = useState<boolean>(false);
    const [uploading, setUploading] = useState<boolean>(false);
    const [uploadedFileUrl, setUploadedFileUrl] = useState<string>('');
    const turnstileRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setFile(event.target.files[0]);
            setMessage('');
            setUploadedFileUrl('');
            setIsError(false);
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!file) {
            setMessage('Please select a file first.');
            setIsError(true);
            return;
        }

        const formData = new FormData(event.currentTarget); // event.currentTarget adalah form
        // File sudah otomatis ada di formData jika input type="file" memiliki 'name'
        // dan merupakan bagian dari form.
        // Jika tidak, tambahkan secara manual: formData.append('file', file);

        setUploading(true);
        setMessage('Uploading...');
        setUploadedFileUrl('');
        setIsError(false);
        
        try {
            const response = await fetch(`${API_BASE_URL}/upload`, {
                method: 'POST',
                body: formData,
            });
            const data: UploadResponse = await response.json();

            if (!response.ok) {
                setIsError(true);
                setMessage(data.message || `Error: Upload failed with status ${response.status}`);
                if (data.errors) {
                    console.error('Server validation errors:', data.errors);
                }
            } else {
                setMessage(data.message);
                setIsError(!data.success);
                if (data.success && data.filePath) {
                    setUploadedFileUrl(data.filePath);
                }
            }
        } catch (error: any) {
            setIsError(true);
            setMessage(`Network or parsing error: ${error.message || 'An unknown error occurred.'}`);
            console.error('Upload error (fetch catch block):', error);
        }  finally {
            setUploading(false);
            if (window.turnstile && turnstileRef.current) {
                window.turnstile.reset(turnstileRef.current);
            }
            // Consider resetting file input
            // if (fileInputRef.current) {
            //   fileInputRef.current.value = "";
            // }
            // setFile(null);
        }
    };

    return (
        <div className={styles.uploaderContainer}>
            <h2>Upload File to Cloud Storage</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
                <label htmlFor="fileInput" className={styles.fileInputLabel}>Choose file:</label>
                <div
                    className={styles.fileInputContainer}
                    onClick={() => fileInputRef.current?.click()} // Klik input tersembunyi
                >
                    {file ? `Selected: ${file.name}` : "Click or drag file here"}
                    <input
                        type="file"
                        id="fileInput"
                        name="file"
                        onChange={handleFileChange}
                        disabled={uploading}
                        ref={fileInputRef}
                        className={styles.fileInput} // Sembunyikan input asli
                    />
                </div>
                {file && <div className={styles.fileNameDisplay}>Ready to upload: {file.name} ({Math.round(file.size / 1024)} KB)</div>}


                <div
                    ref={turnstileRef}
                    className={`cf-turnstile ${styles.turnstileWidget}`}
                    data-sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                ></div>

                <button type="submit" disabled={uploading || !file} className={styles.submitButton}>
                    {uploading ? 'Uploading...' : 'Upload File'}
                </button>
            </form>
            {message && (
                <p className={`${styles.messageArea} ${isError ? styles.errorMessage : styles.successMessage}`}>
                    {message}
                </p>
            )}
            {uploading && <p className={styles.uploading}>Please wait, file is being uploaded...</p>}
            {uploadedFileUrl && (
                <p>
                    File accessible at: <a href={uploadedFileUrl} target="_blank" rel="noopener noreferrer" className={styles.fileLink}>{uploadedFileUrl}</a>
                    <br/>
                </p>
            )}
        </div>
    );
}

export default FileUploader;

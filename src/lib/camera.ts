import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';

// Interface for photo data
export interface PhotoData {
  dataUrl: string;
  format: string;
  saved: boolean;
}

// Take a photo using device camera
export async function takePhoto(): Promise<PhotoData> {
  try {
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      quality: 90,
      width: 1024,
      height: 1024,
      correctOrientation: true,
      promptLabelHeader: 'Ambil Foto',
      promptLabelCancel: 'Batal',
      promptLabelPhoto: 'Dari Galeri',
      promptLabelPicture: 'Ambil Foto',
    });

    return {
      dataUrl: capturedPhoto.dataUrl || '',
      format: capturedPhoto.format || 'jpeg',
      saved: false,
    };
  } catch (error) {
    console.error('Error taking photo:', error);
    throw new Error('Gagal mengambil foto. Pastikan izin kamera diberikan.');
  }
}

// Select a photo from gallery
export async function selectPhoto(): Promise<PhotoData> {
  try {
    const selectedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
      quality: 90,
      width: 1024,
      height: 1024,
      correctOrientation: true,
      promptLabelHeader: 'Pilih Foto',
      promptLabelCancel: 'Batal',
    });

    return {
      dataUrl: selectedPhoto.dataUrl || '',
      format: selectedPhoto.format || 'jpeg',
      saved: false,
    };
  } catch (error) {
    console.error('Error selecting photo:', error);
    throw new Error('Gagal memilih foto. Pastikan izin galeri diberikan.');
  }
}

// Convert data URL to Blob
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
}

// Convert data URL to File
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const blob = dataUrlToBlob(dataUrl);
  return new File([blob], filename, { type: blob.type });
}

// Upload photo to server
export async function uploadPhoto(photoData: PhotoData, endpoint: string): Promise<string> {
  try {
    const blob = dataUrlToBlob(photoData.dataUrl);
    const formData = new FormData();
    const filename = `photo_${Date.now()}.${photoData.format}`;
    formData.append('file', blob, filename);

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return data.url || '';
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw new Error('Gagal mengunggah foto. Silakan coba lagi.');
  }
}

// Compress image before upload
export function compressImage(dataUrl: string, maxWidth: number, maxHeight: number, quality: number = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
  });
}
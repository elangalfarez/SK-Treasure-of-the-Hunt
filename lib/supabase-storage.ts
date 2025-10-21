import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface PhotoMetadata {
  playerId: number;
  locationId: string;
  timestamp: string;
  deviceInfo: string;
  geolocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  faceDetection: {
    faceCount: number;
    confidence: number;
    validated: boolean;
  };
}

export const uploadPhotoToStorage = async (
  photoBlob: Blob,
  metadata: PhotoMetadata
): Promise<{ photoUrl: string; error?: string }> => {
  try {
    // Generate unique filename
    const fileName = `${metadata.playerId}-${metadata.locationId}-${Date.now()}.jpg`;
    
    // Upload photo to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('treasure-hunt-photos')
      .upload(fileName, photoBlob, {
        cacheControl: '3600',
        upsert: false,
        metadata: {
          playerId: metadata.playerId.toString(),
          locationId: metadata.locationId,
          timestamp: metadata.timestamp,
          deviceInfo: metadata.deviceInfo,
          geolocation: metadata.geolocation ? JSON.stringify(metadata.geolocation) : null,
          faceDetection: JSON.stringify(metadata.faceDetection),
        }
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { 
        photoUrl: '', 
        error: 'Gagal mengupload foto. Silakan coba lagi.' 
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('treasure-hunt-photos')
      .getPublicUrl(fileName);

    return { photoUrl: urlData.publicUrl };
  } catch (error) {
    console.error('Storage error:', error);
    return { 
      photoUrl: '', 
      error: 'Terjadi kesalahan sistem. Silakan coba lagi.' 
    };
  }
};

// Function to create storage bucket (run this once in your Supabase dashboard or admin function)
export const createStorageBucket = async () => {
  const { data, error } = await supabase.storage.createBucket('treasure-hunt-photos', {
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    fileSizeLimit: 5242880, // 5MB
  });

  if (error) {
    console.error('Bucket creation error:', error);
    return false;
  }
  
  console.log('Storage bucket created:', data);
  return true;
};
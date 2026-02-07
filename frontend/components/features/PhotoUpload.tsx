'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Plus, X, GripVertical, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Photo } from '@/lib/api';

interface PhotoUploadProps {
  photos: Photo[];
  maxPhotos?: number;
  onUpload: (file: File, position: number) => Promise<void>;
  onDelete: (photoId: string) => Promise<void>;
  onReorder?: (photoIds: string[]) => Promise<void>;
  className?: string;
}

export function PhotoUpload({
  photos,
  maxPhotos = 6,
  onUpload,
  onDelete,
  onReorder,
  className,
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const handleSlotClick = (position: number) => {
    const existingPhoto = photos.find((p) => p.position === position);
    if (!existingPhoto) {
      setSelectedSlot(position);
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedSlot !== null) {
      setUploading(selectedSlot);
      try {
        await onUpload(file, selectedSlot);
      } finally {
        setUploading(null);
        setSelectedSlot(null);
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(photoId);
    try {
      await onDelete(photoId);
    } finally {
      setDeleting(null);
    }
  };

  // Create slots array
  const slots = Array.from({ length: maxPhotos }, (_, i) => {
    const photo = photos.find((p) => p.position === i);
    return { position: i, photo };
  });

  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid grid-cols-3 gap-3">
        {slots.map(({ position, photo }) => (
          <div
            key={position}
            onClick={() => handleSlotClick(position)}
            className={cn(
              'relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-200',
              photo
                ? 'bg-dark-900'
                : 'bg-dark-100 border-2 border-dashed border-dark-300 hover:border-primary-400 hover:bg-dark-50',
              position === 0 && 'col-span-2 row-span-2'
            )}
          >
            {photo ? (
              <>
                <Image
                  src={photo.url}
                  alt={`Photo ${position + 1}`}
                  fill
                  className="object-cover"
                />

                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(photo.id, e)}
                  disabled={deleting === photo.id}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  {deleting === photo.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </button>

                {/* Main photo badge */}
                {position === 0 && (
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/50 text-white text-xs font-medium">
                    Main photo
                  </div>
                )}

                {/* Drag handle */}
                {onReorder && (
                  <div className="absolute top-2 left-2 p-1.5 rounded-full bg-black/50 text-white cursor-grab">
                    <GripVertical className="w-4 h-4" />
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-dark-400">
                {uploading === position ? (
                  <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                ) : (
                  <>
                    <Plus className="w-8 h-8" />
                    <span className="text-xs mt-1">Add photo</span>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <p className="text-sm text-dark-500 text-center">
        Add up to {maxPhotos} photos. Your first photo will be your main profile picture.
      </p>
    </div>
  );
}

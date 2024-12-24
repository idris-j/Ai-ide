import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onUploadSuccess?: () => void;
}

export function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      toast({
        title: 'Invalid file type',
        description: 'Only .zip files are supported. Please compress your project folder into a zip file before uploading.',
        variant: 'destructive',
      });
      // Reset the input
      if (event.target) {
        event.target.value = '';
      }
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('project', file);

    try {
      console.log('Starting file upload:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
        // Remove signal and timeout to prevent connection issues
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(data.error || 'Failed to upload project');
      }

      const data = await response.json();
      console.log('Upload response:', data);

      toast({
        title: 'Success',
        description: 'Project uploaded successfully',
      });

      // Reset the input
      if (event.target) {
        event.target.value = '';
      }
      // Trigger refresh
      onUploadSuccess?.();
    } catch (error) {
      console.error('Upload error:', error);
      let errorMessage = 'Failed to upload project';

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="px-4 py-2 border-t">
      <div className="space-y-2">
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2"
          disabled={uploading}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <Upload size={16} />
          {uploading ? 'Uploading...' : 'Upload Project (.zip)'}
        </Button>
        <p className="text-xs text-muted-foreground px-2">
          Only .zip files are supported
        </p>
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".zip"
          onChange={handleFileUpload}
        />
      </div>
    </div>
  );
}
import { HiXMark, HiPhoto } from 'react-icons/hi2';
import { useIntlayer } from 'react-intlayer';
import { toast } from 'react-hot-toast';

/**
 * Image upload and preview component
 * @param {Object} props
 * @param {File[]} props.images - Array of image files
 * @param {Function} props.onAdd - Add images handler (files) => void
 * @param {Function} props.onRemove - Remove image handler (index) => void
 * @param {number} props.maxImages - Maximum number of images allowed
 * @param {number} props.maxSizeMB - Maximum file size in MB
 */
export default function ImageUploadPreview({ 
  images = [], 
  onAdd, 
  onRemove, 
  maxImages = 10,
  maxSizeMB = 5 
}) {
  const  content  = useIntlayer('postComposer');

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    
    // Validate files
    const validFiles = files.filter(file => {
      // Check file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error(content.invalidImageType);
        return false;
      }
      
      // Check file size
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        toast.error(content.imageTooLarge);
        return false;
      }
      
      return true;
    });

    if (images.length + validFiles.length > maxImages) {
      toast.error(content.tooManyImages);
      return;
    }

    onAdd(validFiles);
    
    // Reset input
    e.target.value = '';
  };

  return (
    <div>
      {/* Image previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          {images.map((image, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-neutral-100">
              <img
                src={URL.createObjectURL(image)}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-md"
                aria-label={content.removeImage}
              >
                <HiXMark className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {images.length < maxImages && (
        <label className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-neutral-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors cursor-pointer">
          <HiPhoto className="w-5 h-5 text-neutral-600" />
          <span className="text-sm font-medium text-neutral-700">
            {content.addImage} ({images.length}/{maxImages})
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}

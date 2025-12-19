# POST_COMPOSER — Logic-First React Component Spec

Source of truth: `docs/FRONTEND-CONTRACT.md`, `docs/User-Flows.md`, `docs/Screen-Map.md`. No APIs, fields, or routes are invented.

## Tech Stack Integration

- **Framework**: React 19 with JSX
- **State Management**: Zustand (read auth token), React Query for mutations
- **Routing**: React Router DOM v7 (navigate to home after success)
- **UI**: Headless UI + Tailwind CSS v4
- **Forms**: React Hook Form with file validation
- **i18n**: Intlayer with full RTL support for AR/EN
- **Notifications**: react-hot-toast
- **HTTP Client**: axios via React Query mutation (multipart/form-data)
- **Icons**: react-icons (FiImage, FiX, FiSend, FiLoader)

## Testing Requirements

- **Unit Tests**: Test PostComposerForm with various validation states
- **Integration Tests**: Test PostComposerController with mocked file uploads
- **Test Scenarios**:
  - Successful post creation with text only
  - Successful post creation with images
  - Image file validation (type, size)
  - Maximum images limit
  - Server validation errors
  - Upload errors (network failure)
  - Auth requirement check
  - Navigation after success
  - React Query cache invalidation

## Component Tree

```
PostComposerController
├─ PostComposerForm
└─ PostComposerStatus
```

- PostComposerController (parent): Orchestrates client-side validation, multipart upload to `POST /posts`, and navigation to Home on success.
- PostComposerForm (child): Pure, controlled form logic via props; emits abstract events; no fetching/global state.
- PostComposerStatus (child): Pure status relay (idle/uploading/success/error); no fetching/global state.

## Responsibilities

| Component               | Responsibilities                                                                                                                                                                                                                   | Fetching | Local State | Side-Effects |
|-------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|-------------|--------------|
| PostComposerController  | - Require auth token; emit `onRequireAuth` and abort without it.
- Manage values and submission lifecycle for `POST /posts` (multipart).
- Client-side validation: images MIME/size/count, content optional, tags optional, community optional—per Upload Contract.
- Interpret envelopes; handle `VALIDATION_ERROR` and `UPLOAD_ERROR` (no auto-retry).
- On success: emit `onCreatedPost({ post })` and `onNavigateHome`.
- Provide props to children; children never fetch or access global state. | Yes (POST multipart) | Yes (values, selected files, status, errors) | Yes (navigation emission) |
| PostComposerForm        | - Present logic-only form via props.
- Accept controlled values and per-field errors.
- Emit `onChange(field, value)`, `onAddImage(file)`, `onRemoveImage(index)`, and `onSubmit(payload)`.
- No fetching, no storage, no global state. | No | No | No |
| PostComposerStatus      | - Relay abstract status and expose upload progress/failed validation messages via props.
- Emit `onRetry()` if parent allows a new attempt after corrections. | No | No | No |

## Props and Emitted Events

### PostComposerController (Parent)

Inputs/Props:
- authToken: `string` — required; controller includes `Authorization` header.
- constraints?: `{ maxImages?: number, allowedMime?: string[], maxImageSizeMB?: number }` — optional override; defaults from Upload Contract:
  - Posts: allowed MIME: `image/jpeg`, `image/png`, `image/webp`; width ≤ 2000px, max 5 MB per image, quality ~85.
  - Default `maxImages=10?` is not specified; server constraints imply practicality; if unknown, controller should enforce only MIME and size; count can be app-configured via this prop.
- onNavigateHome: `() => void` — emitted after success.
- onCreatedPost: `(payload: { post: Post }) => void` — emitted with server `post` to let app place it at top in Home feed.

Emitted Upstream Events:
- onError(payload): `{ code: string, message: string, fields?: Record<string,string> }` — envelopes forwarded.
- onRequireAuth(): `void` — when token is missing.

### Child: PostComposerForm

Props:
- values: `{ content?: string, tags?: string[], communityId?: string }` — controlled by parent.
- images: `File[]` — selected images controlled by parent.
- fieldErrors?: `Record<string, string>` — includes client validations and server `VALIDATION_ERROR.fields`.
- submitting: `boolean` — true during active POST.
- disabled: `boolean` — parent-controlled.

Events (emitted to parent):
- onChange: `{ field: 'content' | 'tags' | 'communityId', value: any }`.
- onAddImage: `{ file: File }` — parent validates and may accept/reject with fieldErrors.
- onRemoveImage: `{ index: number }` — parent updates `images`.
- onSubmit: `{ content?: string, tags?: string[], communityId?: string }`.

### Child: PostComposerStatus

Props:
- status: `'idle' | 'uploading' | 'success' | 'error'`.
- error?: `{ code: string, message: string, fields?: Record<string,string> } | null`.
- uploadProgress?: `{ totalFiles: number, completed: number }` — optional; parent may supply coarse progress.

Events:
- onRetry: `void` — parent decides if retry is permitted.

## Data Flow

Endpoint: `POST /posts` (multipart) with fields: `content?`, `tags?`, `community?`, `images[]?`.

1) Init
- Controller: `status='idle'`, `values={ content:'', tags:[], communityId:undefined }`, `images=[]`, `fieldErrors={}`.

2) Input & Validation
- Form emits `onChange` and image add/remove events.
- Controller validates images (MIME/size) per Upload Contract and limits via `constraints`.
- Invalid inputs populate `fieldErrors` and block submit.

3) Submit
- If valid and `authToken` present:
  - `status='uploading'`, `submitting=true`, clear `fieldErrors`.
  - Build `FormData`:
    - `content` (optional), `tags` (string or JSON per server expectation—no extra transforms implied), `community` (id, optional), `images[]` (each file).
  - POST `/posts` with `Authorization` header.

4) Response Handling
- Success: retrieve `{ post }`.
  - Emit `onCreatedPost({ post })`.
  - Emit `onNavigateHome()`.
  - `status='success'`, `submitting=false`.
- Error: read `error.code`.
  - `VALIDATION_ERROR`: populate `fieldErrors`; `status='error'`.
  - `UPLOAD_ERROR`: `status='error'`; do not auto-retry.
  - Auth errors: emit `onRequireAuth`; `status='error'`.
  - Others: `status='error'`; emit `onError`.
- `submitting=false` in all error cases.

## State Machine

```
idle -> uploading -> success
            └-> error -> idle (after corrections/retry)
```

## Defaults & Configuration
- Constraints default to Upload Contract; app can override via props.
- Tags: allowed tags endpoint not implemented; controller does not fetch; tags provided in values by app.
- Community: controller does not fetch community options; app provides selected community id via values.

## Contracts & References
- Endpoint: `POST /posts` (multipart).
- Envelope and Upload Contract per `FRONTEND-CONTRACT.md`.
- Flows: create post → navigate Home; newly created post appears first.
- Screen Map: `POST_COMPOSER`.

## Notes
- Children are pure and do not fetch or access global state.
- Controller never reads localStorage; receives token via `authToken` prop.

## Tech Stack Implementation Details

### React Query Mutation with File Upload

```javascript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useAuthStore } from '@/store/useAuthStore'

export const useCreatePost = () => {
  const queryClient = useQueryClient()
  const { token } = useAuthStore()
  
  return useMutation({
    mutationFn: async ({ content, tags, communityId, images }) => {
      const formData = new FormData()
      
      if (content) formData.append('content', content)
      if (communityId) formData.append('community', communityId)
      if (tags && tags.length > 0) {
        // Check server expectation: JSON array or repeated field
        formData.append('tags', JSON.stringify(tags))
      }
      
      // Append each image file
      images.forEach((file) => {
        formData.append('images', file)
      })
      
      const response = await axios.post('/posts', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      
      return response.data.data
    },
    onSuccess: (data) => {
      // Invalidate home feed to show new post at top
      queryClient.invalidateQueries(['feed', 'home'])
      queryClient.invalidateQueries(['feed', 'following'])
      
      // If posted to a community, invalidate community feed
      if (data.post.community) {
        queryClient.invalidateQueries(['community', data.post.community._id, 'feed'])
      }
      
      toast.success('Post created successfully!')
    },
    onError: (error) => {
      const errorCode = error.response?.data?.error?.code
      
      if (errorCode === 'UPLOAD_ERROR') {
        toast.error('Failed to upload images. Please try again.')
      } else if (errorCode === 'VALIDATION_ERROR') {
        // Handled in component via setError
      } else {
        toast.error('Failed to create post')
      }
    }
  })
}
```

### React Hook Form with File Validation

```javascript
import { useForm } from 'react-hook-form'
import { useState } from 'react'

const PostComposerController = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
    watch
  } = useForm({
    defaultValues: {
      content: '',
      tags: [],
      communityId: undefined
    }
  })
  
  const [images, setImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  
  const createPostMutation = useCreatePost()
  const navigate = useNavigate()
  
  // File validation constants (from Upload Contract)
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
  const MAX_IMAGES = 5 // App-specific limit
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  
  const handleImageAdd = (files) => {
    const fileArray = Array.from(files)
    
    // Validate count
    if (images.length + fileArray.length > MAX_IMAGES) {
      setError('images', {
        type: 'manual',
        message: `Maximum ${MAX_IMAGES} images allowed`
      })
      return
    }
    
    // Validate each file
    const validFiles = []
    const invalidFiles = []
    
    fileArray.forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        invalidFiles.push(`${file.name}: Invalid type`)
      } else if (file.size > MAX_IMAGE_SIZE) {
        invalidFiles.push(`${file.name}: File too large (max 5MB)`)
      } else {
        validFiles.push(file)
      }
    })
    
    if (invalidFiles.length > 0) {
      setError('images', {
        type: 'manual',
        message: invalidFiles.join(', ')
      })
      return
    }
    
    // Create previews
    const newPreviews = validFiles.map((file) => URL.createObjectURL(file))
    
    setImages([...images, ...validFiles])
    setImagePreviews([...imagePreviews, ...newPreviews])
  }
  
  const handleImageRemove = (index) => {
    URL.revokeObjectURL(imagePreviews[index])
    setImages(images.filter((_, i) => i !== index))
    setImagePreviews(imagePreviews.filter((_, i) => i !== index))
  }
  
  const onSubmit = async (data) => {
    try {
      const result = await createPostMutation.mutateAsync({
        ...data,
        images
      })
      
      // Clean up previews
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview))
      
      // Navigate to home
      navigate('/')
    } catch (error) {
      // Map server validation errors
      if (error.response?.data?.error?.fields) {
        Object.entries(error.response.data.error.fields).forEach(
          ([field, message]) => {
            setError(field, { type: 'server', message })
          }
        )
      }
    }
  }
  
  return (
    <PostComposerForm
      onSubmit={handleSubmit(onSubmit)}
      errors={errors}
      isSubmitting={isSubmitting}
      register={register}
      images={imagePreviews}
      onImageAdd={handleImageAdd}
      onImageRemove={handleImageRemove}
    />
  )
}
```

### Presentational Form Component with RTL

```jsx
const PostComposerForm = ({
  onSubmit,
  errors,
  isSubmitting,
  register,
  images,
  onImageAdd,
  onImageRemove
}) => {
  const { content } = useIntlayer('post-composer')
  const { dir } = useUIStore()
  const fileInputRef = useRef(null)
  
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Content Textarea */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {content.contentLabel}
        </label>
        <textarea
          {...register('content')}
          placeholder={content.contentPlaceholder}
          rows={5}
          className="block w-full rounded-md border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-700
                     text-gray-900 dark:text-gray-100
                     shadow-sm focus:border-primary-500 focus:ring-primary-500
                     rtl:text-right resize-none"
        />
        {errors.content && (
          <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
        )}
      </div>
      
      {/* Image Upload */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => onImageAdd(e.target.files)}
          className="hidden"
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center px-4 py-2 border border-gray-300 
                     rounded-md shadow-sm text-sm font-medium text-gray-700 
                     bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 
                     focus:ring-offset-2 focus:ring-primary-500"
        >
          <FiImage className={`w-5 h-5 ${dir === 'ltr' ? 'mr-2' : 'ml-2'}`} />
          {content.addImages}
        </button>
        
        {errors.images && (
          <p className="mt-1 text-sm text-red-600">{errors.images.message}</p>
        )}
      </div>
      
      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-md"
              />
              <button
                type="button"
                onClick={() => onImageRemove(index)}
                className="absolute top-2 ltr:right-2 rtl:left-2 
                          bg-red-500 text-white rounded-full p-1 
                          opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Tags Input (Future Enhancement) */}
      {/* Community Selector (Future Enhancement) */}
      
      {/* Submit Button */}
      <div className="flex justify-end space-x-3 rtl:space-x-reverse">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm 
                     font-medium text-gray-700 hover:bg-gray-50"
        >
          {content.cancel}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-transparent 
                     rounded-md shadow-sm text-sm font-medium text-white 
                     bg-primary-600 hover:bg-primary-700 
                     focus:outline-none focus:ring-2 focus:ring-offset-2 
                     focus:ring-primary-500
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting && (
            <FiLoader className={`animate-spin w-4 h-4 ${dir === 'ltr' ? 'mr-2' : 'ml-2'}`} />
          )}
          {isSubmitting ? content.posting : content.post}
        </button>
      </div>
    </form>
  )
}
```

### i18n Translation Keys

```typescript
// postComposer.content.ts
import { t, type DeclarationContent } from 'intlayer'

const postComposerContent = {
  key: 'post-composer',
  content: {
    title: t({
      en: 'Create Post',
      ar: 'إنشاء منشور'
    }),
    contentLabel: t({
      en: "What's on your mind?",
      ar: 'ماذا يدور في ذهنك؟'
    }),
    contentPlaceholder: t({
      en: 'Share your thoughts...',
      ar: 'شارك أفكارك...'
    }),
    addImages: t({
      en: 'Add Images',
      ar: 'إضافة صور'
    }),
    maxImagesError: t({
      en: 'Maximum {max} images allowed',
      ar: 'الحد الأقصى {max} صور مسموح به'
    }),
    invalidTypeError: t({
      en: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
      ar: 'نوع الملف غير صالح. فقط JPEG و PNG و WebP مسموح بها.'
    }),
    fileTooLargeError: t({
      en: 'File too large. Maximum size is 5MB.',
      ar: 'الملف كبير جداً. الحد الأقصى للحجم 5 ميجابايت.'
    }),
    post: t({
      en: 'Post',
      ar: 'نشر'
    }),
    posting: t({
      en: 'Posting...',
      ar: 'جاري النشر...'
    }),
    cancel: t({
      en: 'Cancel',
      ar: 'إلغاء'
    }),
    postCreated: t({
      en: 'Post created successfully!',
      ar: 'تم إنشاء المنشور بنجاح!'
    }),
    createError: t({
      en: 'Failed to create post',
      ar: 'فشل إنشاء المنشور'
    }),
    uploadError: t({
      en: 'Failed to upload images. Please try again.',
      ar: 'فشل تحميل الصور. يرجى المحاولة مرة أخرى.'
    })
  }
} satisfies DeclarationContent

export default postComposerContent
```

### Styling with Tailwind

**Layout:**
```jsx
<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
  <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {content.title}
      </h1>
      {/* Form */}
    </div>
  </div>
</div>
```

**Image Preview Grid:**
```jsx
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
  {images.map((preview, index) => (
    <div
      key={index}
      className="relative aspect-square rounded-lg overflow-hidden 
                 border-2 border-gray-200 dark:border-gray-700 group"
    >
      <img
        src={preview}
        alt={`Preview ${index + 1}`}
        className="w-full h-full object-cover"
      />
      <button
        type="button"
        onClick={() => onImageRemove(index)}
        className="absolute top-2 ltr:right-2 rtl:left-2 
                  bg-red-500 hover:bg-red-600 text-white 
                  rounded-full p-1.5 shadow-lg
                  opacity-0 group-hover:opacity-100 
                  transition-opacity duration-200
                  focus:outline-none focus:ring-2 focus:ring-red-500"
        aria-label="Remove image"
      >
        <FiX className="w-4 h-4" />
      </button>
    </div>
  ))}
</div>
```

### Upload Progress (Optional Enhancement)

```javascript
const createPostMutation = useMutation({
  mutationFn: async ({ content, tags, communityId, images }) => {
    const formData = new FormData()
    // ... append fields
    
    const response = await axios.post('/posts', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )
        // Update UI with progress
        console.log(`Upload progress: ${percentCompleted}%`)
      }
    })
    
    return response.data.data
  }
})
```

### Error Handling

```javascript
// In controller
const onSubmit = async (data) => {
  try {
    await createPostMutation.mutateAsync({ ...data, images })
    navigate('/')
  } catch (error) {
    const errorData = error.response?.data?.error
    
    if (errorData?.code === 'VALIDATION_ERROR' && errorData?.fields) {
      // Map field errors to form
      Object.entries(errorData.fields).forEach(([field, message]) => {
        setError(field, { type: 'server', message })
      })
    } else if (errorData?.code === 'UPLOAD_ERROR') {
      toast.error(content.uploadError)
    } else if (errorData?.code === 'TOKEN_EXPIRED') {
      useAuthStore.getState().logout()
      navigate('/login')
    } else {
      toast.error(content.createError)
    }
  }
}
```

### Memory Management (Image Previews)

```javascript
// Clean up object URLs when component unmounts
useEffect(() => {
  return () => {
    imagePreviews.forEach((preview) => URL.revokeObjectURL(preview))
  }
}, [])

// Also clean up when images are removed
const handleImageRemove = (index) => {
  URL.revokeObjectURL(imagePreviews[index])
  setImages(images.filter((_, i) => i !== index))
  setImagePreviews(imagePreviews.filter((_, i) => i !== index))
}
```

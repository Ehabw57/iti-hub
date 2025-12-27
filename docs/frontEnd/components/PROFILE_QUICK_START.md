# 🚀 Quick Start Guide - Profile Feature

## الاستخدام السريع

### 1. التنقل إلى صفحة البروفايل

```javascript
// في أي Component
import { Link } from 'react-router-dom';

<Link to="/profile/alex_rivera">
  View Profile
</Link>

// أو برمجياً
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/profile/alex_rivera');
```

### 2. التفعيل الأساسي (بدون Hooks)

الصفحة تعمل حالياً بـ mock data. لتفعيل البيانات الحقيقية:

#### في Profile.jsx - استبدل:

```javascript
// احذف هذا
const profileData = { ... mock data ... };

// استبدله بهذا
import { useGetUserProfile } from '@hooks/mutations/useUserProfile';

const { data: profileData, isLoading, error } = useGetUserProfile(username);

if (isLoading) {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-neutral-600">Loading profile...</p>
      </div>
    </div>
  );
}

if (error) {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Error</h2>
        <p className="text-neutral-600">{error.message}</p>
      </div>
    </div>
  );
}

if (!profileData) {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">User Not Found</h2>
        <p className="text-neutral-600">@{username} doesn't exist</p>
      </div>
    </div>
  );
}
```

### 3. تفعيل Follow/Block

#### في ProfileHeader.jsx - استبدل handleFollow و handleBlock:

```javascript
// أضف في أعلى الملف
import { useToggleFollow, useToggleBlock } from '@hooks/mutations/useConnections';

// في الـ Component
const { toggleFollow, isLoading: isFollowLoading } = useToggleFollow();
const { toggleBlock, isLoading: isBlockLoading } = useToggleBlock();

const handleFollow = async () => {
  try {
    await toggleFollow(profile._id, profile.isFollowing);
  } catch (error) {
    console.error('Failed to toggle follow:', error);
    alert('Failed to update follow status');
  }
};

const handleBlock = async () => {
  const confirmed = window.confirm(
    profile.isBlocked 
      ? 'Are you sure you want to unblock this user?' 
      : 'Are you sure you want to block this user?'
  );
  
  if (!confirmed) return;

  try {
    await toggleBlock(profile._id, profile.isBlocked);
  } catch (error) {
    console.error('Failed to toggle block:', error);
    alert('Failed to update block status');
  }
};

// تحديث الأزرار لإظهار Loading
<button
  onClick={handleFollow}
  disabled={isFollowLoading}
  className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
    profile?.isFollowing
      ? 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
      : 'bg-primary-600 text-white hover:bg-primary-700'
  } disabled:opacity-50 disabled:cursor-not-allowed`}
>
  {isFollowLoading ? (
    <>
      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      Loading...
    </>
  ) : (
    <>
      <UserPlus className="w-5 h-5" />
      {profile?.isFollowing ? 'Following' : 'Follow'}
    </>
  )}
</button>
```

### 4. تفعيل رفع الصور

#### في ProfileHeader.jsx - تحديث handleCoverUpload و handleProfileUpload:

```javascript
// أضف في أعلى الملف
import { useUploadProfilePicture, useUploadCoverImage } from '@hooks/mutations/useUserProfile';
import { useAuthStore } from '@store/auth';

// في الـ Component
const uploadProfileMutation = useUploadProfilePicture();
const uploadCoverMutation = useUploadCoverImage();
const setUser = useAuthStore((state) => state.setUser);
const currentUser = useAuthStore((state) => state.user);

const handleProfileUpload = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // التحقق من حجم الملف (مثلاً 5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('File size must be less than 5MB');
    return;
  }

  // التحقق من نوع الملف
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file');
    return;
  }

  try {
    const result = await uploadProfileMutation.mutateAsync(file);
    
    // تحديث الـ auth store بالصورة الجديدة
    if (result.data?.user) {
      setUser(result.data.user);
    }
    
    alert('Profile picture updated successfully!');
  } catch (error) {
    console.error('Upload failed:', error);
    alert('Failed to upload profile picture');
  }
};

const handleCoverUpload = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert('File size must be less than 5MB');
    return;
  }

  if (!file.type.startsWith('image/')) {
    alert('Please select an image file');
    return;
  }

  try {
    await uploadCoverMutation.mutateAsync(file);
    alert('Cover image updated successfully!');
  } catch (error) {
    console.error('Upload failed:', error);
    alert('Failed to upload cover image');
  }
};

// إظهار Loading أثناء الرفع
{uploadProfileMutation.isPending && (
  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
  </div>
)}
```

### 5. تفعيل البوستات

#### في ProfilePosts.jsx - استبدل:

```javascript
// احذف هذا
const [isLoading] = useState(false);
const posts = [];

// استبدله بهذا
import { useGetUserPosts } from '@hooks/mutations/useUserProfile';

const { data: postsData, isLoading } = useGetUserPosts(username);
const posts = postsData?.data?.posts || [];
```

---

## ✅ Checklist للتفعيل الكامل

- [ ] تأكد من وجود React Query في App
- [ ] تأكد من عمل Backend على المنفذ الصحيح
- [ ] تأكد من عمل Authentication
- [ ] فعّل الـ Hooks في Profile.jsx
- [ ] فعّل Follow/Block في ProfileHeader.jsx
- [ ] فعّل رفع الصور في ProfileHeader.jsx
- [ ] فعّل البوستات في ProfilePosts.jsx
- [ ] اختبر جميع الوظائف

---

## 🔥 React Query Setup (إذا لم يكن موجود)

```javascript
// في main.jsx أو App.jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

<QueryClientProvider client={queryClient}>
  <App />
  {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
</QueryClientProvider>
```

---

## 📱 مثال استخدام كامل

```javascript
// في أي Component (مثلاً Navbar أو Sidebar)
import { Link } from 'react-router-dom';
import { useAuthStore } from '@store/auth';

function UserMenu() {
  const user = useAuthStore((state) => state.user);

  return (
    <div>
      <Link 
        to={`/profile/${user.username}`}
        className="flex items-center gap-2 p-2 hover:bg-neutral-100 rounded-lg"
      >
        <img 
          src={user.profilePicture || '/default-avatar.png'} 
          alt={user.fullName}
          className="w-10 h-10 rounded-full"
        />
        <div>
          <p className="font-medium">{user.fullName}</p>
          <p className="text-sm text-neutral-600">View Profile</p>
        </div>
      </Link>
    </div>
  );
}
```

---

## 🎯 اختبار سريع

1. شغّل الـ Backend:
```bash
cd server
npm run dev
```

2. شغّل الـ Frontend:
```bash
cd client
npm run dev
```

3. افتح المتصفح:
```
http://localhost:5173/profile/alex_rivera
```

4. جرّب:
- [ ] عرض البروفايل
- [ ] Follow/Unfollow
- [ ] Block/Unblock
- [ ] رفع صورة البروفايل (إذا كان بروفايلك)
- [ ] رفع صورة الغلاف (إذا كان بروفايلك)

---

## 🐛 إذا واجهت مشاكل

1. **CORS Error:**
```javascript
// في server/app.js
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

2. **401 Unauthorized:**
- تأكد من تسجيل الدخول
- تحقق من Token في localStorage
- راجع الـ Auth middleware

3. **404 Not Found:**
- تأكد من صحة Username
- تحقق من Backend routes
- راجع Network tab في DevTools

4. **Images not uploading:**
- تحقق من Cloudinary config
- تحقق من file size limits
- راجع server logs

---

**الآن الصفحة جاهزة للاستخدام! 🎉**

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocale } from 'react-intlayer';
import api from '@lib/api';

const topics = ['Technology', 'Education', 'Science', 'Arts', 'Sports', 'Gaming', 'Music', 'Movies', 'Books', 'Food', 'Travel', 'Health', 'Fitness', 'Business', 'Career', 'Fashion', 'Photography', 'Nature', 'Politics', 'Hobbies'];

export default function CreateCommunity() {
  const { locale } = useLocale();
  const ar = locale === 'ar';
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', tags: [] });
  const cache = useQueryClient();
  const navigate = useNavigate();
  const create = useMutation({
    mutationFn: async () => (await api.post('/communities', { ...form, name: form.name.trim(), description: form.description.trim() })).data,
    onSuccess: (result) => {
      cache.invalidateQueries({ queryKey: ['communities'] });
      cache.invalidateQueries({ queryKey: ['user', 'communities'] });
      navigate(`/community/${result.data.community._id}`);
    },
  });
  const field = 'w-full rounded-xl border border-outline bg-surface px-4 py-3 text-neutral-900';
  return <div className="mt-5">
    <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="rounded-xl bg-primary-600 px-5 py-3 font-semibold text-white">{open ? (ar ? 'إلغاء' : 'Cancel') : (ar ? 'إنشاء مجتمع' : 'Create community')}</button>
    {open && <form className="mt-4 space-y-5 rounded-2xl border border-outline bg-surface p-6" onSubmit={e => { e.preventDefault(); create.mutate(); }}>
      <p className="text-neutral-500">{ar ? 'ابدأ مجتمعك، وراجع طلبات الانضمام بصفتك المالك.' : 'Start your community and review membership requests as its owner.'}</p>
      <label className="block space-y-2"><span>{ar ? 'اسم المجتمع' : 'Community name'}</span><input required className={field} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
      <label className="block space-y-2"><span>{ar ? 'الوصف' : 'Description'}</span><textarea required rows={3} className={field} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
      <fieldset><legend className="mb-3">{ar ? 'اختر من موضوع إلى ٣ موضوعات' : 'Choose 1–3 topics'}</legend><div className="flex flex-wrap gap-2">{topics.map(topic => <label key={topic} className="flex items-center gap-2 rounded-lg border border-outline px-3 py-2 text-sm"><input type="checkbox" checked={form.tags.includes(topic)} disabled={!form.tags.includes(topic) && form.tags.length === 3} onChange={e => setForm({ ...form, tags: e.target.checked ? [...form.tags, topic] : form.tags.filter(t => t !== topic) })} />{topic}</label>)}</div></fieldset>
      {create.isError && <p role="alert" className="text-red-600">{create.error?.response?.data?.error?.message || (ar ? 'تعذر إنشاء المجتمع. حاول مرة أخرى.' : 'Could not create the community. Please retry.')}</p>}
      <button disabled={create.isPending || !form.name.trim() || !form.description.trim() || !form.tags.length} className="rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white disabled:opacity-50">{create.isPending ? (ar ? 'جارٍ الإنشاء…' : 'Creating…') : (ar ? 'إنشاء المجتمع' : 'Create community')}</button>
    </form>}
  </div>;
}

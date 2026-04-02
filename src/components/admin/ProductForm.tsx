'use client';
import ProductOptions from '@/components/admin/ProductOptions';
import type { ProductOptionsData } from '@/components/admin/ProductOptions';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Save, Loader2, Upload, X, GripVertical, Star,
  Trash2, ImagePlus, Eye, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn, CATEGORY_LABELS, generateSlug, getStorageUrl } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Product, GroupBuy } from '@/lib/database.types';

const DETAIL_TAB_FIELDS: Record<string, { key: string; label: string; placeholder: string; type?: 'text' | 'textarea' }[]> = {
  beauty: [
    { key: 'brand', label: '브랜드', placeholder: '예: 이니스프리' },
    { key: 'volume', label: '용량', placeholder: '예: 50ml' },
    { key: 'ingredients', label: '주요 성분', placeholder: '나이아신아마이드, 히알루론산..', type: 'textarea' },
    { key: 'how_to_use', label: '사용법', placeholder: '세안 후 적당량을 덜어...', type: 'textarea' },
    { key: 'skin_type', label: '피부 타입', placeholder: '모든 피부 / 건성 / 지성' },
    { key: 'expiry', label: '유통기한', placeholder: '제조일로부터 24개월' },
  ],
  fashion: [
    { key: 'brand', label: '브랜드', placeholder: '예: 무신사 스탠다드' },
    { key: 'materials', label: '소재', placeholder: '면 95%, 스판 5%' },
    { key: 'care_instructions', label: '세탁 방법', placeholder: '손세탁 권장, 드라이클리닝 가능', type: 'textarea' },
    { key: 'fit', label: '핏', placeholder: '레귤러 / 오버핏 / 슬림' },
  ],
  food: [
    { key: 'origin', label: '원산지', placeholder: '대한민국' },
    { key: 'weight', label: '중량/용량', placeholder: '500g / 1kg' },
    { key: 'expiry', label: '유통기한', placeholder: '제조일로부터 12개월' },
    { key: 'storage', label: '보관 방법', placeholder: '직사광선을 피해 서늘한 곳에 보관' },
    { key: 'allergens', label: '알레르기 정보', placeholder: '대두, 밀 포함', type: 'textarea' },
    { key: 'nutrition', label: '영양정보', placeholder: '열량 250kcal, 단백질 10g...', type: 'textarea' },
  ],
  health: [
    { key: 'brand', label: '브랜드', placeholder: '예: 종근당' },
    { key: 'dosage', label: '용법/용량', placeholder: '1일 1회, 1회 2정' },
    { key: 'ingredients', label: '주요 성분', placeholder: '비타민C 500mg...', type: 'textarea' },
    { key: 'caution', label: '주의사항', placeholder: '임산부, 수유부는 섭취 전 의사와 상담', type: 'textarea' },
    { key: 'expiry', label: '유통기한', placeholder: '제조일로부터 24개월' },
  ],
  kitchen: [
    { key: 'brand', label: '브랜드', placeholder: '예: 락앤락' },
    { key: 'material', label: '소재', placeholder: '스테인리스 / 실리콘 / 세라믹' },
    { key: 'size_spec', label: '사이즈/규격', placeholder: '28cm / 3.5L' },
    { key: 'care_instructions', label: '관리법', placeholder: '식기세척기 사용 가능', type: 'textarea' },
  ],
  kids: [
    { key: 'brand', label: '브랜드', placeholder: '' },
    { key: 'age_range', label: '대상 연령', placeholder: '0-12개월 / 3-5세' },
    { key: 'materials', label: '소재/재질', placeholder: '유기농 면 100%' },
    { key: 'safety_cert', label: '안전인증', placeholder: 'KC인증' },
  ],
  living: [
    { key: 'brand', label: '브랜드', placeholder: '' },
    { key: 'material', label: '소재', placeholder: '' },
    { key: 'size_spec', label: '사이즈/규격', placeholder: '' },
    { key: 'care_instructions', label: '관리법', placeholder: '', type: 'textarea' },
  ],
  etc: [
    { key: 'brand', label: '브랜드', placeholder: '' },
    { key: 'spec', label: '상세 스펙', placeholder: '', type: 'textarea' },
  ],
};

interface ProductFormProps {
  product?: Product | null;
  groupBuys?: GroupBuy[];
}

interface ImageItem {
  id: string;
  url: string;
  storagePath?: string;
  file?: File;
  isNew: boolean;
}

export default function ProductForm({ product, groupBuys = [] }: ProductFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = !!product;

  const [name, setName] = useState(product?.name || '');
  const [nameKo, setNameKo] = useState(product?.name_ko || '');
  const [slug, setSlug] = useState(product?.slug || '');
  const [description, setDescription] = useState(product?.description || '');
  const [descriptionKo, setDescriptionKo] = useState(product?.description_ko || '');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [originalPrice, setOriginalPrice] = useState(product?.original_price?.toString() || '');
  const [costPrice, setCostPrice] = useState(product?.cost_price?.toString() || '');
  const [productType, setProductType] = useState<'preorder' | 'instock'>(product?.product_type || 'preorder');
  const [category, setCategory] = useState(product?.category || 'beauty');
  const [status, setStatus] = useState(product?.status || 'draft');
  const [totalSlots, setTotalSlots] = useState(product?.total_slots?.toString() || '150');
  const [isFeatured, setIsFeatured] = useState(product?.is_featured || false);
  const [tags, setTags] = useState(product?.tags?.join(', ') || '');
  const [groupBuyId, setGroupBuyId] = useState(product?.group_buy_id || '');
  const [detailTabs, setDetailTabs] = useState<Record<string, string>>(
    (product?.detail_tabs as Record<string, string>) || {}
  );

  const [productOptions, setProductOptions] = useState<ProductOptionsData>(() => {
    const tabs = (product?.detail_tabs as any) || {};
    return {
      colors: tabs.colors || [],
      packages: tabs.packages || [],
      sizes: tabs.sizes || [],
      sizeType: tabs.sizeType || 'letter',
    };
  });

  const [images, setImages] = useState<ImageItem[]>(() => {
    if (!product?.images?.length) return [];
    return product.images.map((path, idx) => ({
      id: `existing-${idx}`,
      url: getStorageUrl(path, 'products'),
      storagePath: path,
      isNew: false,
    }));
  });
  const [thumbnailIdx, setThumbnailIdx] = useState(() => {
    if (!product?.thumbnail || !product?.images?.length) return 0;
    const idx = product.images.indexOf(product.thumbnail);
    return idx >= 0 ? idx : 0;
  });
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [autoSlug, setAutoSlug] = useState(!isEdit);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  useEffect(() => { if (autoSlug && name) setSlug(generateSlug(name)); }, [name, autoSlug]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const maxTotal = 10;
    const allowed = maxTotal - images.length;
    const toAdd = files.slice(0, allowed);
    if (toAdd.length < files.length) toast.error(`최대 ${maxTotal}장까지 업로드 가능합니다`);
    const newImages: ImageItem[] = toAdd.map((file) => ({
      id: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      url: URL.createObjectURL(file), file, isNew: true,
    }));
    setImages((prev) => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [images.length]);

  const removeImage = (idx: number) => {
    setImages((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      if (thumbnailIdx === idx) setThumbnailIdx(0);
      else if (thumbnailIdx > idx) setThumbnailIdx((t) => t - 1);
      return updated;
    });
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setImages((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIdx, 1);
      updated.splice(idx, 0, moved);
      if (thumbnailIdx === dragIdx) setThumbnailIdx(idx);
      else if (dragIdx < thumbnailIdx && idx >= thumbnailIdx) setThumbnailIdx((t) => t - 1);
      else if (dragIdx > thumbnailIdx && idx <= thumbnailIdx) setThumbnailIdx((t) => t + 1);
      return updated;
    });
    setDragIdx(idx);
  };
  const handleDragEnd = () => setDragIdx(null);
  const updateDetailTab = (key: string, value: string) => setDetailTabs((prev) => ({ ...prev, [key]: value }));

  const uploadImages = async (): Promise<string[]> => {
    const paths: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (img.isNew && img.file) {
        setUploadProgress(`이미지 업로드 중... (${i + 1}/${images.length})`);
        const ext = img.file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const storagePath = `${slug}/${fileName}`;
        const { error } = await supabase.storage.from('products').upload(storagePath, img.file, { cacheControl: '3600', upsert: false });
        if (error) { console.error('Upload error:', error); toast.error(`이미지 업로드 실패: ${img.file.name}`); continue; }
        paths.push(storagePath);
      } else if (img.storagePath) { paths.push(img.storagePath); }
    }
    setUploadProgress(null);
    return paths;
  };

  const handleSave = async (saveStatus?: string) => {
    if (!name.trim()) { toast.error('상품명을 입력해주세요'); return; }
    if (!slug.trim()) { toast.error('슬러그를 입력해주세요'); return; }
    if (!price || parseFloat(price) <= 0) { toast.error('가격을 입력해주세요'); return; }
    setSaving(true);
    try {
      const imagePaths = await uploadImages();
      const thumbnailPath = imagePaths[thumbnailIdx] || imagePaths[0] || null;
      const cleanTabs: Record<string, any> = {};
      Object.entries(detailTabs).forEach(([k, v]) => { if (v && typeof v === 'string' && v.trim()) cleanTabs[k] = v.trim(); });
      if (productOptions.colors.length > 0) cleanTabs.colors = productOptions.colors;
      if (productOptions.packages.length > 0) cleanTabs.packages = productOptions.packages;
      if (productOptions.sizes.length > 0) { cleanTabs.sizes = productOptions.sizes; cleanTabs.sizeType = productOptions.sizeType; }
      const productData = {
        name: name.trim(), name_ko: nameKo.trim() || null, slug: slug.trim(),
        description: description.trim() || null, description_ko: descriptionKo.trim() || null,
        price: parseFloat(price), original_price: originalPrice ? parseFloat(originalPrice) : null,
        cost_price: costPrice ? parseFloat(costPrice) : null, product_type: productType, category,
        status: (saveStatus || status) as any, total_slots: parseInt(totalSlots) || 150,
        is_featured: isFeatured, tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        images: imagePaths, thumbnail: thumbnailPath, detail_tabs: cleanTabs, group_buy_id: groupBuyId || null,
      };
      let result;
      if (isEdit && product) { result = await supabase.from('products').update(productData).eq('id', product.id).select().single(); }
      else { result = await supabase.from('products').insert(productData).select().single(); }
      if (result.error) {
        if (result.error.code === '23505') toast.error('이미 사용중인 슬러그입니다.');
        else toast.error('저장 실패: ' + result.error.message);
        return;
      }
      toast.success(isEdit ? '상품이 수정되었습니다!' : '상품이 등록되었습니다!');
      router.push('/admin/products'); router.refresh();
    } catch (err) { console.error('Save error:', err); toast.error('저장 중 오류가 발생했습니다'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!product) return;
    setDeleting(true);
    try {
      if (product.images?.length) await supabase.storage.from('products').remove(product.images);
      const { error } = await supabase.from('products').delete().eq('id', product.id);
      if (error) { toast.error('삭제 실패: ' + error.message); return; }
      toast.success('상품이 삭제되었습니다'); router.push('/admin/products'); router.refresh();
    } catch { toast.error('삭제 중 오류가 발생했습니다'); }
    finally { setDeleting(false); }
  };

  const currentDetailFields = DETAIL_TAB_FIELDS[category] || DETAIL_TAB_FIELDS.etc;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/products" className="p-2 rounded-lg hover:bg-slate-100 transition-colors"><ArrowLeft className="w-5 h-5 text-slate-500" /></Link>
          <h1 className="text-2xl font-bold text-slate-900">{isEdit ? '상품 수정' : '상품 등록'}</h1>
        </div>
        <div className="flex items-center gap-2">
          {isEdit && (<Link href={`/${productType === 'preorder' ? 'preorder' : 'shop'}/${slug}`} target="_blank" className="btn-ghost text-sm"><Eye className="w-4 h-4 mr-1" />미리보기</Link>)}
          <button onClick={() => handleSave('draft')} disabled={saving} className="btn-ghost text-sm">초안 저장</button>
          <button onClick={() => handleSave('active')} disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {uploadProgress || (saving ? '저장 중...' : '저장 및 게시')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">기본 정보</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-slate-700 mb-1 block">상품명 (영문) *</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Product Name" className="input-base" /></div>
                <div><label className="text-sm font-medium text-slate-700 mb-1 block">상품명 (한국어)</label><input type="text" value={nameKo} onChange={(e) => setNameKo(e.target.value)} placeholder="한국어 상품명" className="input-base" /></div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 flex items-center justify-between">
                  <span>슬러그 (URL) *</span>
                  {!isEdit && (<button type="button" onClick={() => setAutoSlug(!autoSlug)} className="text-xs text-brand-500 hover:underline">{autoSlug ? '수동 입력' : '자동 생성'}</button>)}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400 flex-shrink-0">/{productType === 'preorder' ? 'preorder' : 'shop'}/</span>
                  <input type="text" value={slug} onChange={(e) => { setAutoSlug(false); setSlug(e.target.value); }} placeholder="product-slug" className="input-base" disabled={autoSlug} />
                </div>
              </div>
              <div><label className="text-sm font-medium text-slate-700 mb-1 block">상품 설명 (한국어)</label><textarea value={descriptionKo} onChange={(e) => setDescriptionKo(e.target.value)} className="input-base h-32 resize-y" placeholder="고객에게 보여지는 상세 설명... (HTML 가능)" /></div>
              <div><label className="text-sm font-medium text-slate-700 mb-1 block">상품 설명 (영문)</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-base h-20 resize-y" placeholder="English description (optional)" /></div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">상품 이미지 <span className="text-sm font-normal text-slate-400 ml-2">({images.length}/10)</span></h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {images.map((img, idx) => (
                <div key={img.id} draggable onDragStart={() => handleDragStart(idx)} onDragOver={(e) => handleDragOver(e, idx)} onDragEnd={handleDragEnd}
                  className={cn('relative group aspect-square rounded-xl overflow-hidden border-2 cursor-grab active:cursor-grabbing transition-all',
                    thumbnailIdx === idx ? 'border-brand-500 ring-2 ring-brand-200' : 'border-slate-200 hover:border-slate-300', dragIdx === idx && 'opacity-50 scale-95')}>
                  <img src={img.url} alt="" className="w-full h-full object-cover" draggable={false} />
                  {thumbnailIdx === idx && <div className="absolute top-1.5 left-1.5 bg-brand-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">대표</div>}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                    <button type="button" onClick={() => setThumbnailIdx(idx)} className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors" title="대표 이미지로 설정"><Star className={cn('w-4 h-4', thumbnailIdx === idx ? 'text-brand-500 fill-brand-500' : 'text-slate-600')} /></button>
                    <button type="button" onClick={() => removeImage(idx)} className="p-1.5 bg-white/90 rounded-lg hover:bg-red-50 transition-colors" title="삭제"><Trash2 className="w-4 h-4 text-red-500" /></button>
                  </div>
                  <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity"><GripVertical className="w-4 h-4 text-white drop-shadow" /></div>
                  {img.isNew && <div className="absolute bottom-1.5 left-1.5 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">NEW</div>}
                </div>
              ))}
              {images.length < 10 && (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-brand-400 hover:bg-brand-50/50 transition-all flex flex-col items-center justify-center gap-1">
                  <ImagePlus className="w-6 h-6 text-slate-400" /><span className="text-[11px] text-slate-400">추가</span>
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
            <p className="text-xs text-slate-400 mt-3">JPG, PNG, WebP · 최대 5MB · 권장 1:1 비율</p>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">카테고리 상세정보</h2>
            <p className="text-sm text-slate-400 mb-4">{CATEGORY_LABELS[category]} 카테고리 전용 필드</p>
            <div className="space-y-4">
              {currentDetailFields.map((field) => (
                <div key={field.key}>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea value={detailTabs[field.key] || ''} onChange={(e) => updateDetailTab(field.key, e.target.value)} placeholder={field.placeholder} className="input-base h-20 resize-y" />
                  ) : (
                    <input type="text" value={detailTabs[field.key] || ''} onChange={(e) => updateDetailTab(field.key, e.target.value)} placeholder={field.placeholder} className="input-base" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <ProductOptions data={productOptions} onChange={setProductOptions} category={category} />
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">분류</h2>
            <div className="space-y-4">
              <div><label className="text-sm font-medium text-slate-700 mb-1 block">상태</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="input-base">
                  <option value="draft">초안</option><option value="active">활성 (판매중)</option><option value="soldout">품절</option><option value="archived">보관</option>
                </select>
              </div>
              <div><label className="text-sm font-medium text-slate-700 mb-2 block">상품 타입</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['preorder', 'instock'] as const).map((type) => (
                    <button key={type} type="button" onClick={() => setProductType(type)} className={cn('px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all', productType === type ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-200 text-slate-500 hover:border-slate-300')}>
                      {type === 'preorder' ? '프리오더 공구' : '바로구매'}
                    </button>
                  ))}
                </div>
              </div>
              <div><label className="text-sm font-medium text-slate-700 mb-1 block">카테고리</label>
                <select value={category} onChange={(e) => { setCategory(e.target.value as any); setDetailTabs({}); }} className="input-base">
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="rounded border-slate-300 text-brand-500 focus:ring-brand-400" />
                <span className="text-sm font-medium text-slate-700">⭐ 추천 상품 (홈에 표시)</span>
              </label>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">가격</h2>
            <div className="space-y-4">
              <div><label className="text-sm font-medium text-slate-700 mb-1 block">판매가 ($) *</label><input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className="input-base" /></div>
              <div><label className="text-sm font-medium text-slate-700 mb-1 block">정가 ($) <span className="text-xs text-slate-400 ml-1">취소선 표시</span></label><input type="number" step="0.01" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} placeholder="할인 전 가격" className="input-base" /></div>
              {originalPrice && price && parseFloat(originalPrice) > parseFloat(price) && (
                <div className="text-sm text-brand-500 font-medium p-2 rounded-lg bg-brand-50">할인율: {Math.round(((parseFloat(originalPrice) - parseFloat(price)) / parseFloat(originalPrice)) * 100)}% OFF</div>
              )}
              <div><label className="text-sm font-medium text-slate-700 mb-1 block">원가 ($) <span className="text-xs text-slate-400 ml-1">관리자 전용</span></label><input type="number" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="원가 (비공개)" className="input-base" /></div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">재고 & 공구</h2>
            <div className="space-y-4">
              <div><label className="text-sm font-medium text-slate-700 mb-1 block">총 슬롯 수</label><input type="number" value={totalSlots} onChange={(e) => setTotalSlots(e.target.value)} className="input-base" />
                {isEdit && product && <p className="text-xs text-slate-400 mt-1">현재 판매: {product.sold_count}개</p>}
              </div>
              {productType === 'preorder' && groupBuys.length > 0 && (
                <div><label className="text-sm font-medium text-slate-700 mb-1 block">공구 라운드 연결</label>
                  <select value={groupBuyId} onChange={(e) => setGroupBuyId(e.target.value)} className="input-base">
                    <option value="">연결 안함</option>
                    {groupBuys.map((gb) => (<option key={gb.id} value={gb.id}>{gb.title_ko || gb.title} ({gb.status})</option>))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">태그</h2>
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="태그1, 태그2, 태그3" className="input-base" />
            <p className="text-xs text-slate-400 mt-1">쉼표로 구분</p>
          </div>

          {isEdit && (
            <div className="card p-6 border-red-200">
              {!showDeleteConfirm ? (
                <button type="button" onClick={() => setShowDeleteConfirm(true)} className="w-full text-sm text-red-500 font-medium hover:text-red-600 transition-colors py-2">상품 삭제</button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-red-600 font-medium text-center">정말 삭제하시겠습니까?<br /><span className="text-xs text-red-400">이 작업은 되돌릴 수 없습니다</span></p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowDeleteConfirm(false)} className="btn-ghost flex-1 text-sm">취소</button>
                    <button type="button" onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50">
                      {deleting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : '삭제 확인'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

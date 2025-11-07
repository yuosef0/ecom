import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - جلب التقييمات (مع إمكانية الفلترة حسب المنتج)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');
    const includeUnapproved = searchParams.get('includeUnapproved') === 'true';

    let query = supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    // فلترة حسب المنتج
    if (productId) {
      query = query.eq('product_id', productId);
    }

    // فقط التقييمات المعتمدة افتراضياً
    if (!includeUnapproved) {
      query = query.eq('is_approved', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في جلب التقييمات' },
      { status: 500 }
    );
  }
}

// POST - إضافة تقييم جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product_id, customer_name, customer_email, rating, title, comment } = body;

    // التحقق من البيانات المطلوبة
    if (!product_id || !customer_name || !customer_email || !rating) {
      return NextResponse.json(
        { error: 'المنتج والاسم والبريد الإلكتروني والتقييم مطلوبة' },
        { status: 400 }
      );
    }

    // التحقق من صحة التقييم (1-5)
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'التقييم يجب أن يكون بين 1 و 5' },
        { status: 400 }
      );
    }

    const reviewData = {
      product_id,
      customer_name,
      customer_email,
      rating: parseInt(rating),
      title: title || null,
      comment: comment || null,
      is_approved: true, // افتراضياً معتمد (يمكن تغييره لاحقاً)
      is_verified_purchase: false,
    };

    const { data, error } = await supabase
      .from('reviews')
      .insert([reviewData])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في إضافة التقييم' },
      { status: 500 }
    );
  }
}

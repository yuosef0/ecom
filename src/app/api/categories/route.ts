import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - جلب جميع الفئات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    let query = supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    // فقط الفئات النشطة افتراضياً
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في جلب الفئات' },
      { status: 500 }
    );
  }
}

// POST - إضافة فئة جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, parent_id, image_url, display_order, is_active } = body;

    // التحقق من البيانات المطلوبة
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'الاسم والـ slug مطلوبان' },
        { status: 400 }
      );
    }

    const categoryData: any = {
      name,
      slug,
      description: description || null,
      parent_id: parent_id || null,
      image_url: image_url || null,
      display_order: display_order || 0,
      is_active: is_active !== undefined ? is_active : true,
    };

    const { data, error } = await supabase
      .from('categories')
      .insert([categoryData])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'الـ slug موجود مسبقاً' },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في إضافة الفئة' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - جلب جميع الكوبونات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    let query = supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    // فقط الكوبونات النشطة افتراضياً
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في جلب الكوبونات' },
      { status: 500 }
    );
  }
}

// POST - إضافة كوبون جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_purchase_amount,
      max_discount_amount,
      usage_limit,
      valid_from,
      valid_until,
      is_active
    } = body;

    // التحقق من البيانات المطلوبة
    if (!code || !discount_type || !discount_value) {
      return NextResponse.json(
        { error: 'الكود ونوع الخصم وقيمة الخصم مطلوبة' },
        { status: 400 }
      );
    }

    // التحقق من نوع الخصم
    if (!['percentage', 'fixed'].includes(discount_type)) {
      return NextResponse.json(
        { error: 'نوع الخصم يجب أن يكون percentage أو fixed' },
        { status: 400 }
      );
    }

    // التحقق من قيمة الخصم
    if (parseFloat(discount_value) <= 0) {
      return NextResponse.json(
        { error: 'قيمة الخصم يجب أن تكون أكبر من صفر' },
        { status: 400 }
      );
    }

    const couponData: any = {
      code: code.toUpperCase(),
      description: description || null,
      discount_type,
      discount_value: parseFloat(discount_value),
      min_purchase_amount: min_purchase_amount ? parseFloat(min_purchase_amount) : 0,
      max_discount_amount: max_discount_amount ? parseFloat(max_discount_amount) : null,
      usage_limit: usage_limit ? parseInt(usage_limit) : null,
      valid_from: valid_from || new Date().toISOString(),
      valid_until: valid_until || null,
      is_active: is_active !== undefined ? is_active : true,
      used_count: 0,
    };

    const { data, error } = await supabase
      .from('coupons')
      .insert([couponData])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'كود الكوبون موجود مسبقاً' },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في إضافة الكوبون' },
      { status: 500 }
    );
  }
}

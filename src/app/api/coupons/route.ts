import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '../../../lib/supabaseServer';

// GET - جلب جميع الكوبونات
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
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
    const supabase = await createServerClient();

    // Debug: Check session
    const { data: { session } } = await supabase.auth.getSession();
    console.log('🔍 API Route - Session check:', {
      hasSession: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
    });

    // Debug: Check if user is admin
    if (session) {
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('role, is_active')
        .eq('user_id', session.user.id)
        .single();

      console.log('🔍 API Route - Admin check:', {
        isAdmin: !!adminData,
        role: adminData?.role,
        isActive: adminData?.is_active,
        error: adminError?.message,
      });
    } else {
      console.error('❌ No session found in API route!');
    }

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

    console.log('🔍 Attempting to insert coupon:', couponData.code);

    const { data, error } = await supabase
      .from('coupons')
      .insert([couponData])
      .select()
      .single();

    if (error) {
      console.error('❌ Insert error:', error);
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'كود الكوبون موجود مسبقاً' },
          { status: 400 }
        );
      }
      throw error;
    }

    console.log('✅ Coupon inserted successfully:', data.code);

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في إضافة الكوبون' },
      { status: 500 }
    );
  }
}

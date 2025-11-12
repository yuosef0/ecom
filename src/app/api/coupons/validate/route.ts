import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST - التحقق من صلاحية الكوبون وحساب الخصم
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, total } = body;

    if (!code || !total) {
      return NextResponse.json(
        { error: 'كود الكوبون والمبلغ الإجمالي مطلوبان' },
        { status: 400 }
      );
    }

    const orderTotal = parseFloat(total);

    // البحث عن الكوبون في قاعدة البيانات
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !coupon) {
      return NextResponse.json(
        {
          valid: false,
          message: 'كود الكوبون غير صحيح',
          discount: 0
        },
        { status: 200 }
      );
    }

    // التحقق من أن الكوبون نشط
    if (!coupon.is_active) {
      return NextResponse.json(
        {
          valid: false,
          message: 'هذا الكوبون غير نشط',
          discount: 0
        },
        { status: 200 }
      );
    }

    // التحقق من تاريخ الصلاحية
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      return NextResponse.json(
        {
          valid: false,
          message: 'هذا الكوبون منتهي الصلاحية',
          discount: 0
        },
        { status: 200 }
      );
    }

    // التحقق من عدد مرات الاستخدام
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return NextResponse.json(
        {
          valid: false,
          message: 'تم استخدام هذا الكوبون بالكامل',
          discount: 0
        },
        { status: 200 }
      );
    }

    // التحقق من الحد الأدنى للشراء
    if (orderTotal < coupon.min_purchase_amount) {
      return NextResponse.json(
        {
          valid: false,
          message: `الحد الأدنى للشراء ${coupon.min_purchase_amount} جنيه`,
          discount: 0
        },
        { status: 200 }
      );
    }

    // حساب الخصم
    let discountAmount = 0;

    if (coupon.discount_type === 'percentage') {
      discountAmount = (orderTotal * coupon.discount_value) / 100;

      // التحقق من الحد الأقصى للخصم
      if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
        discountAmount = coupon.max_discount_amount;
      }
    } else {
      // fixed discount
      discountAmount = coupon.discount_value;
    }

    // التأكد من أن الخصم لا يتجاوز المبلغ الإجمالي
    if (discountAmount > orderTotal) {
      discountAmount = orderTotal;
    }

    const finalTotal = orderTotal - discountAmount;

    return NextResponse.json({
      valid: true,
      message: 'تم تطبيق الكوبون بنجاح',
      discount: discountAmount,
      final_total: finalTotal,
      coupon_id: coupon.id,
      coupon_code: coupon.code
    });

  } catch (error: any) {
    console.error('خطأ في التحقق من الكوبون:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في التحقق من الكوبون' },
      { status: 500 }
    );
  }
}

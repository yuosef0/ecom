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

    // استخدام الـ Function المخصصة من Supabase
    const { data, error } = await supabase
      .rpc('is_coupon_valid', {
        coupon_code_input: code.toUpperCase(),
        order_total: parseFloat(total)
      });

    if (error) {
      console.error('خطأ في التحقق من الكوبون:', error);
      return NextResponse.json(
        { error: 'حدث خطأ في التحقق من الكوبون' },
        { status: 500 }
      );
    }

    // البيانات المرجعة من Function
    const result = data[0];

    if (!result.is_valid) {
      return NextResponse.json(
        {
          valid: false,
          message: result.message,
          discount: 0
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      valid: true,
      message: result.message,
      discount: result.discount_amount,
      final_total: parseFloat(total) - result.discount_amount
    });

  } catch (error: any) {
    console.error('خطأ في التحقق من الكوبون:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في التحقق من الكوبون' },
      { status: 500 }
    );
  }
}

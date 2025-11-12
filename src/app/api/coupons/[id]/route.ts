import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

// GET - جلب كوبون واحد
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'الكوبون غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في جلب الكوبون' },
      { status: 500 }
    );
  }
}

// PUT - تحديث كوبون
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
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

    const updateData: any = {};

    if (code !== undefined) updateData.code = code.toUpperCase();
    if (description !== undefined) updateData.description = description;
    if (discount_type !== undefined) {
      if (!['percentage', 'fixed'].includes(discount_type)) {
        return NextResponse.json(
          { error: 'نوع الخصم يجب أن يكون percentage أو fixed' },
          { status: 400 }
        );
      }
      updateData.discount_type = discount_type;
    }
    if (discount_value !== undefined) {
      if (parseFloat(discount_value) <= 0) {
        return NextResponse.json(
          { error: 'قيمة الخصم يجب أن تكون أكبر من صفر' },
          { status: 400 }
        );
      }
      updateData.discount_value = parseFloat(discount_value);
    }
    if (min_purchase_amount !== undefined) updateData.min_purchase_amount = parseFloat(min_purchase_amount);
    if (max_discount_amount !== undefined) updateData.max_discount_amount = max_discount_amount ? parseFloat(max_discount_amount) : null;
    if (usage_limit !== undefined) updateData.usage_limit = usage_limit ? parseInt(usage_limit) : null;
    if (valid_from !== undefined) updateData.valid_from = valid_from;
    if (valid_until !== undefined) updateData.valid_until = valid_until;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('coupons')
      .update(updateData)
      .eq('id', params.id)
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

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في تحديث الكوبون' },
      { status: 500 }
    );
  }
}

// DELETE - حذف كوبون
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('خطأ في حذف الكوبون:', error);
      return NextResponse.json(
        { error: 'فشل في حذف الكوبون' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'تم حذف الكوبون بنجاح' });
  } catch (error: any) {
    console.error('خطأ في حذف الكوبون:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في حذف الكوبون' },
      { status: 500 }
    );
  }
}

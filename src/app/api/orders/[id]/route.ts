import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - جلب طلب واحد
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'الطلب غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في جلب الطلب' },
      { status: 500 }
    );
  }
}

// PATCH - تحديث حالة الطلب
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { order_status, payment_status } = body;

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (order_status) {
      // التحقق من الحالات المسموحة
      const allowedOrderStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
      if (!allowedOrderStatuses.includes(order_status)) {
        return NextResponse.json(
          { error: 'حالة الطلب غير صحيحة' },
          { status: 400 }
        );
      }
      updateData.order_status = order_status;
    }

    if (payment_status) {
      // التحقق من الحالات المسموحة
      const allowedPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
      if (!allowedPaymentStatuses.includes(payment_status)) {
        return NextResponse.json(
          { error: 'حالة الدفع غير صحيحة' },
          { status: 400 }
        );
      }
      updateData.payment_status = payment_status;
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('خطأ في تحديث الطلب:', error);
      return NextResponse.json(
        { error: 'فشل في تحديث الطلب' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('خطأ في تحديث الطلب:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في تحديث الطلب' },
      { status: 500 }
    );
  }
}

// DELETE - حذف طلب (اختياري - قد لا ترغب في السماح بحذف الطلبات)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('خطأ في حذف الطلب:', error);
      return NextResponse.json(
        { error: 'فشل في حذف الطلب' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'تم حذف الطلب بنجاح' });
  } catch (error: any) {
    console.error('خطأ في حذف الطلب:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في حذف الطلب' },
      { status: 500 }
    );
  }
}

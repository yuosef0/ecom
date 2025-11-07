import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - جلب تقييم واحد
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'التقييم غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في جلب التقييم' },
      { status: 500 }
    );
  }
}

// PATCH - تحديث تقييم (للموافقة أو التعديل)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { is_approved, is_verified_purchase, helpful_count, title, comment, rating } = body;

    const updateData: any = {};

    if (is_approved !== undefined) updateData.is_approved = is_approved;
    if (is_verified_purchase !== undefined) updateData.is_verified_purchase = is_verified_purchase;
    if (helpful_count !== undefined) updateData.helpful_count = helpful_count;
    if (title !== undefined) updateData.title = title;
    if (comment !== undefined) updateData.comment = comment;
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return NextResponse.json(
          { error: 'التقييم يجب أن يكون بين 1 و 5' },
          { status: 400 }
        );
      }
      updateData.rating = parseInt(rating);
    }

    const { data, error } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في تحديث التقييم' },
      { status: 500 }
    );
  }
}

// DELETE - حذف تقييم
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('خطأ في حذف التقييم:', error);
      return NextResponse.json(
        { error: 'فشل في حذف التقييم' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'تم حذف التقييم بنجاح' });
  } catch (error: any) {
    console.error('خطأ في حذف التقييم:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في حذف التقييم' },
      { status: 500 }
    );
  }
}

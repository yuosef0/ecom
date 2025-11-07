import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - جلب قائمة المفضلة لمستخدم معين
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const customerEmail = searchParams.get('customer_email');

    if (!sessionId && !customerEmail) {
      return NextResponse.json(
        { error: 'session_id أو customer_email مطلوب' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('wishlists')
      .select(`
        *,
        products:product_id (
          id,
          title,
          slug,
          price,
          compare_at_price,
          image_url,
          stock,
          is_active
        )
      `)
      .order('created_at', { ascending: false });

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    } else if (customerEmail) {
      query = query.eq('customer_email', customerEmail);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في جلب المفضلة' },
      { status: 500 }
    );
  }
}

// POST - إضافة منتج للمفضلة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, product_id, customer_email } = body;

    // التحقق من البيانات المطلوبة
    if (!session_id || !product_id) {
      return NextResponse.json(
        { error: 'session_id و product_id مطلوبان' },
        { status: 400 }
      );
    }

    const wishlistData = {
      session_id,
      product_id,
      customer_email: customer_email || null,
    };

    const { data, error } = await supabase
      .from('wishlists')
      .insert([wishlistData])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'المنتج موجود بالفعل في المفضلة' },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في إضافة المنتج للمفضلة' },
      { status: 500 }
    );
  }
}

// DELETE - حذف منتج من المفضلة (باستخدام query parameters)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const productId = searchParams.get('product_id');

    if (!sessionId || !productId) {
      return NextResponse.json(
        { error: 'session_id و product_id مطلوبان' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('session_id', sessionId)
      .eq('product_id', productId);

    if (error) {
      console.error('خطأ في حذف المنتج من المفضلة:', error);
      return NextResponse.json(
        { error: 'فشل في حذف المنتج من المفضلة' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'تم حذف المنتج من المفضلة بنجاح' });
  } catch (error: any) {
    console.error('خطأ في حذف المنتج من المفضلة:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في حذف المنتج من المفضلة' },
      { status: 500 }
    );
  }
}

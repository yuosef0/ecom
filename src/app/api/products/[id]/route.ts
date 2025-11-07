import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - جلب منتج واحد بالـ ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'المنتج غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في جلب المنتج' },
      { status: 500 }
    );
  }
}

// PUT - تحديث منتج
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, slug, description, price, image_url, stock } = body;

    // التحقق من البيانات المطلوبة
    if (!title || !slug || price === undefined) {
      return NextResponse.json(
        { error: 'الحقول المطلوبة: العنوان، الرابط، السعر' },
        { status: 400 }
      );
    }

    // التحقق من أن السعر رقم صحيح
    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      return NextResponse.json(
        { error: 'السعر يجب أن يكون رقماً موجباً' },
        { status: 400 }
      );
    }

    // التحقق من أن المخزون رقم صحيح
    if (stock !== undefined && (isNaN(parseInt(stock)) || parseInt(stock) < 0)) {
      return NextResponse.json(
        { error: 'المخزون يجب أن يكون رقماً موجباً' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('products')
      .update({
        title,
        slug,
        description: description || null,
        price: parseFloat(price),
        image_url: image_url || null,
        stock: stock !== undefined ? parseInt(stock) : 10,
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('خطأ في تحديث المنتج:', error);
      return NextResponse.json(
        { error: 'فشل في تحديث المنتج' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('خطأ في تحديث المنتج:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في تحديث المنتج' },
      { status: 500 }
    );
  }
}

// DELETE - حذف منتج
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // أولاً، جلب معلومات المنتج للحصول على رابط الصورة
    const { data: product } = await supabase
      .from('products')
      .select('image_url')
      .eq('id', params.id)
      .single();

    // حذف المنتج من قاعدة البيانات
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('خطأ في حذف المنتج:', error);
      return NextResponse.json(
        { error: 'فشل في حذف المنتج' },
        { status: 500 }
      );
    }

    // إذا كان للمنتج صورة في Supabase Storage، يمكن حذفها (اختياري)
    if (product?.image_url && product.image_url.includes('supabase')) {
      try {
        const fileName = product.image_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('products-imges')
            .remove([fileName]);
        }
      } catch (storageError) {
        console.error('خطأ في حذف الصورة:', storageError);
        // نستمر حتى لو فشل حذف الصورة
      }
    }

    return NextResponse.json({ message: 'تم حذف المنتج بنجاح' });
  } catch (error: any) {
    console.error('خطأ في حذف المنتج:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في حذف المنتج' },
      { status: 500 }
    );
  }
}

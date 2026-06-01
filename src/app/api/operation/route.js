import { NextResponse } from 'next/server';
import { supabase } from '../../supabase';

export async function POST(request) {
  try {
    // Arkadaşının cihazdan veya simülatörden göndereceği JSON verisini oku
    const body = await request.json();
    
    // Delta PLC'den süzülecek temel verileri değişkenlere atıyoruz
    const { p_order_id, type, start_counter, asset_id } = body;

    // Gelen bu veriyi anında Supabase'deki ilgili tabloya yazıyoruz
    const { data, error } = await supabase
      .from('production_order_operations') // Supabase'deki tablo adınız
      .insert([
        { 
          p_order_id: p_order_id, 
          type: type, 
          start_counter: start_counter,
          asset_id: asset_id
        }
      ])
      .select();

    // Eğer Supabase tarafında bir hata oluşursa (Örn: Tablo yoksa veya kolonlar uyuşmuyorsa)
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Her şey başarılıysa cihaza "Aldım, buluta işledim" mesajı dön
    return NextResponse.json({ success: true, message: "Veri buluta işlendi", data }, { status: 201 });

  } catch (err) {
    // Eğer arkadaşın yanlış veya bozuk bir JSON gönderirse burası yakalar
    return NextResponse.json({ success: false, error: "Geçersiz JSON formatı" }, { status: 500 });
  }
}
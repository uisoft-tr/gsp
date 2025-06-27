# Generated manually for data migration

from django.db import migrations


def verileri_yeni_yapiya_tasi(apps, schema_editor):
    """Mevcut YillikGenelSuTuketimi verilerini YillikUrunDetay tablosuna taşı"""
    YillikGenelSuTuketimi = apps.get_model('sulama', 'YillikGenelSuTuketimi')
    YillikUrunDetay = apps.get_model('sulama', 'YillikUrunDetay')
    
    # Mevcut tüm kayıtları al
    eski_kayitlar = YillikGenelSuTuketimi.objects.all()
    
    for eski_kayit in eski_kayitlar:
        # YillikUrunDetay kaydı oluştur
        try:
            # Alan değerini kontrol et - eğer m² cinsindeyse ha'ya çevir
            alan_ha = eski_kayit.alan
            if alan_ha > 1000:  # Büyük ihtimalle m² cinsinden
                alan_ha = alan_ha / 10000  # m²'den ha'ya çevir
            
            YillikUrunDetay.objects.create(
                yillik_tuketim=eski_kayit,
                urun=eski_kayit.urun,
                alan=alan_ha,
                ekim_orani=100,  # Varsayılan değer
                su_tuketimi=eski_kayit.su_tuketimi
            )
            print(f"Taşındı: {eski_kayit.yil} - {eski_kayit.urun.isim} - {alan_ha} ha")
            
        except Exception as e:
            print(f"Hata: {eski_kayit.id} kaydı taşınamadı - {str(e)}")


def geri_al_veri_tasima(apps, schema_editor):
    """YillikUrunDetay kayıtlarını sil"""
    YillikUrunDetay = apps.get_model('sulama', 'YillikUrunDetay')
    YillikUrunDetay.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('sulama', '0004_yillik_urun_detay'),
    ]

    operations = [
        migrations.RunPython(verileri_yeni_yapiya_tasi, geri_al_veri_tasima),
    ] 
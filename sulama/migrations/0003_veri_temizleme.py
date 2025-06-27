# Generated manually for data cleanup

from django.db import migrations, models
from django.db.models import Count, Sum, Avg


def temizle_yillik_tuketim_verileri(apps, schema_editor):
    """Mevcut YillikGenelSuTuketimi verilerini yeni yapıya uygun hale getir"""
    YillikGenelSuTuketimi = apps.get_model('sulama', 'YillikGenelSuTuketimi')
    
    # Duplicate kayıtları bul (aynı yıl + sulama)
    duplicates = YillikGenelSuTuketimi.objects.values('yil', 'sulama').annotate(
        count=Count('id'),
        ids=models.F('id')
    ).filter(count__gt=1)
    
    for duplicate_group in duplicates:
        yil = duplicate_group['yil']
        sulama_id = duplicate_group['sulama']
        
        # Bu grup için tüm kayıtları al
        kayitlar = YillikGenelSuTuketimi.objects.filter(
            yil=yil, 
            sulama_id=sulama_id
        ).order_by('id')
        
        if kayitlar.count() > 1:
            # İlk kaydı koru, diğerlerini sil
            ilk_kayit = kayitlar.first()
            
            # Ortalama randıman değerlerini hesapla
            ortalama_ciftlik = kayitlar.aggregate(avg=Avg('ciftlik_randi'))['avg'] or 80
            ortalama_iletim = kayitlar.aggregate(avg=Avg('iletim_randi'))['avg'] or 85
            
            # İlk kaydı güncelle
            ilk_kayit.ciftlik_randi = ortalama_ciftlik
            ilk_kayit.iletim_randi = ortalama_iletim
            ilk_kayit.save()
            
            # Diğer kayıtları sil
            kayitlar.exclude(id=ilk_kayit.id).delete()
            
            print(f"Temizlendi: {yil} yılı, sulama {sulama_id} - {kayitlar.count()-1} duplicate kayıt silindi")


def geri_al_veri_temizleme(apps, schema_editor):
    """Bu işlem geri alınamaz"""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('sulama', '0002_alter_urun_agustos_alter_urun_aralik_alter_urun_ekim_and_more'),
    ]

    operations = [
        migrations.RunPython(temizle_yillik_tuketim_verileri, geri_al_veri_temizleme),
    ] 
from rest_framework import serializers
from .models import (
    Bolge, Sulama, DepolamaTesisi, Kanal, 
    GunlukSebekeyeAlinanSuMiktari, GunlukDepolamaTesisiSuMiktari,
    UrunKategorisi, Urun, YillikGenelSuTuketimi, YillikUrunDetay
)


class BolgeSerializer(serializers.ModelSerializer):
    """Bölge serializer"""
    sulama_sayisi = serializers.SerializerMethodField()
    
    class Meta:
        model = Bolge
        fields = ['id', 'isim', 'aciklama', 'bolge_iletisim', 'yonetici', 'adres', 'olusturma_tarihi', 'sulama_sayisi']
        read_only_fields = ['olusturma_tarihi']
    
    def get_sulama_sayisi(self, obj):
        return obj.sulamalar.count()


class SulamaSerializer(serializers.ModelSerializer):
    """Sulama sistemi serializer"""
    bolge_isim = serializers.CharField(source='bolge.isim', read_only=True)
    depolama_tesisi_sayisi = serializers.SerializerMethodField()
    urun_sayisi = serializers.SerializerMethodField()
    
    class Meta:
        model = Sulama
        fields = [
            'id', 'isim', 'bolge', 'bolge_isim', 'aciklama', 
            'olusturma_tarihi', 'depolama_tesisi_sayisi', 'urun_sayisi'
        ]
        read_only_fields = ['olusturma_tarihi']
    
    def get_depolama_tesisi_sayisi(self, obj):
        return obj.depolama_tesisleri.count()
    
    def get_urun_sayisi(self, obj):
        return obj.urunler.count()


class DepolamaTesisiSerializer(serializers.ModelSerializer):
    """Depolama tesisi serializer"""
    sulama_isim = serializers.CharField(source='sulama.isim', read_only=True)
    bolge_isim = serializers.CharField(source='sulama.bolge.isim', read_only=True)
    kanal_sayisi = serializers.SerializerMethodField()
    
    class Meta:
        model = DepolamaTesisi
        fields = [
            'id', 'isim', 'sulama', 'sulama_isim', 'bolge_isim', 'aciklama',
            'kret_kotu', 'maksimum_su_kot', 'minimum_su_kot', 
            'maksimum_hacim', 'minimum_hacim', 'kanal_sayisi', 'olusturma_tarihi'
        ]
        read_only_fields = ['olusturma_tarihi']
    
    def get_kanal_sayisi(self, obj):
        return obj.kanallar.count()


class KanalSerializer(serializers.ModelSerializer):
    """Kanal serializer"""
    depolama_tesisi_isim = serializers.CharField(source='depolama_tesisi.isim', read_only=True)
    sulama_isim = serializers.CharField(source='depolama_tesisi.sulama.isim', read_only=True)
    gunluk_veri_sayisi = serializers.SerializerMethodField()
    
    class Meta:
        model = Kanal
        fields = [
            'id', 'isim', 'depolama_tesisi', 'depolama_tesisi_isim', 
            'sulama_isim', 'aciklama', 'kanal_kodu', 'olusturma_tarihi', 'gunluk_veri_sayisi'
        ]
        read_only_fields = ['kanal_kodu', 'olusturma_tarihi']
    
    def get_gunluk_veri_sayisi(self, obj):
        return obj.gunluk_su_miktarlari.count()


class GunlukSebekeyeAlinanSuMiktariSerializer(serializers.ModelSerializer):
    """Günlük şebekeye alınan su miktarı serializer"""
    kanal_isim = serializers.CharField(source='kanal.isim', read_only=True)
    depolama_tesisi_isim = serializers.CharField(source='kanal.depolama_tesisi.isim', read_only=True)
    sulama_isim = serializers.CharField(source='kanal.depolama_tesisi.sulama.isim', read_only=True)
    sure_dakika = serializers.SerializerMethodField()
    hesaplanan_su_miktari = serializers.SerializerMethodField()
    
    class Meta:
        model = GunlukSebekeyeAlinanSuMiktari
        fields = [
            'id', 'kanal', 'kanal_isim', 'depolama_tesisi_isim', 'sulama_isim',
            'tarih', 'baslangic_saati', 'bitis_saati', 'yukseklik', 'su_miktari', 
            'sure_dakika', 'hesaplanan_su_miktari'
        ]
    
    def get_sure_dakika(self, obj):
        if obj.baslangic_saati and obj.bitis_saati:
            delta = obj.bitis_saati - obj.baslangic_saati
            return round(delta.total_seconds() / 60, 2)
        return None
    
    def get_hesaplanan_su_miktari(self, obj):
        """Yükseklik değerine göre hesaplanan su miktarını döndür"""
        return obj.hesapla_su_miktari()
    
    def validate(self, attrs):
        if attrs.get('baslangic_saati') and attrs.get('bitis_saati'):
            if attrs['baslangic_saati'] >= attrs['bitis_saati']:
                raise serializers.ValidationError("Başlangıç saati bitiş saatinden önce olmalıdır.")
        
        # Yükseklik kontrolü - abakta var mı?
        if attrs.get('yukseklik') and attrs.get('kanal'):
            from .models import KanalAbak
            try:
                KanalAbak.objects.get(kanal=attrs['kanal'], yukseklik=attrs['yukseklik'])
            except KanalAbak.DoesNotExist:
                raise serializers.ValidationError({
                    'yukseklik': f"Bu kanal için {attrs['yukseklik']} m yükseklik değeri abakta bulunamadı."
                })
        
        return attrs
    
    def create(self, validated_data):
        # Frontend'den gelen su_miktari değerini kullan - otomatik hesaplama yapma
        # Model'de de manuel_su_miktari=True ile kaydet
        instance = GunlukSebekeyeAlinanSuMiktari(**validated_data)
        instance.save(manuel_su_miktari=True)
        return instance
    
    def update(self, instance, validated_data):
        # Frontend'den gelen su_miktari değerini kullan - otomatik hesaplama yapma
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save(manuel_su_miktari=True)
        return instance


class GunlukDepolamaTesisiSuMiktariSerializer(serializers.ModelSerializer):
    """Günlük depolama tesisi su miktarı serializer"""
    depolama_tesisi_isim = serializers.CharField(source='depolama_tesisi.isim', read_only=True)
    sulama_isim = serializers.CharField(source='depolama_tesisi.sulama.isim', read_only=True)
    doluluk_orani = serializers.SerializerMethodField()
    
    class Meta:
        model = GunlukDepolamaTesisiSuMiktari
        fields = [
            'id', 'depolama_tesisi', 'depolama_tesisi_isim', 'sulama_isim',
            'tarih', 'kot', 'su_miktari', 'doluluk_orani'
        ]
    
    def get_doluluk_orani(self, obj):
        if obj.depolama_tesisi.maksimum_hacim and obj.su_miktari:
            return round((obj.su_miktari / obj.depolama_tesisi.maksimum_hacim) * 100, 2)
        return None


class UrunKategorisiSerializer(serializers.ModelSerializer):
    """Ürün kategorisi serializer"""
    urun_sayisi = serializers.SerializerMethodField()
    
    class Meta:
        model = UrunKategorisi
        fields = ['id', 'isim', 'aciklama', 'olusturma_tarihi', 'urun_sayisi']
        read_only_fields = ['olusturma_tarihi']
    
    def get_urun_sayisi(self, obj):
        return obj.urunler.count()


class UrunSerializer(serializers.ModelSerializer):
    """Ürün serializer"""
    sulama_isim = serializers.CharField(source='sulama.isim', read_only=True)
    bolge_isim = serializers.CharField(source='sulama.bolge.isim', read_only=True)
    sulama_display = serializers.SerializerMethodField()
    kategori_isimleri = serializers.SerializerMethodField()
    yillik_tuketim_sayisi = serializers.SerializerMethodField()
    aylik_katsayilar = serializers.SerializerMethodField()
    
    class Meta:
        model = Urun
        fields = [
            'id', 'isim', 'sulama', 'sulama_isim', 'bolge_isim', 'sulama_display',
            'kategori', 'kategori_isimleri', 'baslangic_tarihi', 'bitis_tarihi', 'kar_orani',
            'ocak', 'subat', 'mart', 'nisan', 'mayis', 'haziran', 'temmuz', 'agustos', 
            'eylul', 'ekim', 'kasim', 'aralik', 'aylik_katsayilar',
            'olusturma_tarihi', 'yillik_tuketim_sayisi'
        ]
        read_only_fields = ['olusturma_tarihi']
    
    def get_sulama_display(self, obj):
        return f"{obj.sulama.bolge.isim} - {obj.sulama.isim}"
    
    def get_kategori_isimleri(self, obj):
        return [k.isim for k in obj.kategori.all()]
    
    def get_yillik_tuketim_sayisi(self, obj):
        return obj.yillik_urun_detaylari.count()
    
    def get_aylik_katsayilar(self, obj):
        aylar = [
            {'ay': 'Ocak', 'deger': obj.ocak, 'kisa': 'Oca'},
            {'ay': 'Şubat', 'deger': obj.subat, 'kisa': 'Şub'},
            {'ay': 'Mart', 'deger': obj.mart, 'kisa': 'Mar'},
            {'ay': 'Nisan', 'deger': obj.nisan, 'kisa': 'Nis'},
            {'ay': 'Mayıs', 'deger': obj.mayis, 'kisa': 'May'},
            {'ay': 'Haziran', 'deger': obj.haziran, 'kisa': 'Haz'},
            {'ay': 'Temmuz', 'deger': obj.temmuz, 'kisa': 'Tem'},
            {'ay': 'Ağustos', 'deger': obj.agustos, 'kisa': 'Ağu'},
            {'ay': 'Eylül', 'deger': obj.eylul, 'kisa': 'Eyl'},
            {'ay': 'Ekim', 'deger': obj.ekim, 'kisa': 'Eki'},
            {'ay': 'Kasım', 'deger': obj.kasim, 'kisa': 'Kas'},
            {'ay': 'Aralık', 'deger': obj.aralik, 'kisa': 'Ara'}
        ]
        return [ay for ay in aylar if ay['deger'] is not None]


# UrunDetaySerializer artık gerekli değil - UrunSerializer'da aylik_katsayilar mevcut


class YillikUrunDetaySerializer(serializers.ModelSerializer):
    """Yıllık ürün detay serializer"""
    urun_isim = serializers.CharField(source='urun.isim', read_only=True)
    birim_su_tuketimi = serializers.SerializerMethodField()
    net_su_ihtiyaci = serializers.SerializerMethodField()
    ur_toplami = serializers.SerializerMethodField()
    aylik_ur_degerleri = serializers.SerializerMethodField()
    
    class Meta:
        model = YillikUrunDetay
        fields = [
            'id', 'urun', 'urun_isim', 'alan', 'ekim_orani', 'su_tuketimi',
            'birim_su_tuketimi', 'net_su_ihtiyaci', 'ur_toplami', 'aylik_ur_degerleri',
            'olusturma_tarihi'
        ]
        read_only_fields = ['olusturma_tarihi']
    
    def get_birim_su_tuketimi(self, obj):
        return round(obj.get_birim_su_tuketimi(), 4)
    
    def get_net_su_ihtiyaci(self, obj):
        return round(obj.get_net_su_ihtiyaci(), 6)
    
    def get_ur_toplami(self, obj):
        return obj.get_ur_toplami()
    
    def get_aylik_ur_degerleri(self, obj):
        """Ürünün aylık UR değerlerini döndür"""
        if obj.urun:
            return {
                'ocak': obj.urun.ocak,
                'subat': obj.urun.subat,
                'mart': obj.urun.mart,
                'nisan': obj.urun.nisan,
                'mayis': obj.urun.mayis,
                'haziran': obj.urun.haziran,
                'temmuz': obj.urun.temmuz,
                'agustos': obj.urun.agustos,
                'eylul': obj.urun.eylul,
                'ekim': obj.urun.ekim,
                'kasim': obj.urun.kasim,
                'aralik': obj.urun.aralik
            }
        return None


class YillikGenelSuTuketimiSerializer(serializers.ModelSerializer):
    """Yıllık genel su tüketimi serializer"""
    sulama_isim = serializers.CharField(source='sulama.isim', read_only=True)
    bolge_isim = serializers.CharField(source='sulama.bolge.isim', read_only=True)
    kurumAdi = serializers.CharField(source='sulama.isim', read_only=True)  # Frontend uyumluluğu için
    # Ürün bilgileri artık ayrı tabloda
    urun_detaylari = serializers.SerializerMethodField()
    toplam_randi = serializers.SerializerMethodField()
    net_su_ihtiyaci = serializers.SerializerMethodField()
    birim_su_tuketimi = serializers.SerializerMethodField()
    
    class Meta:
        model = YillikGenelSuTuketimi
        fields = [
            'id', 'yil', 'sulama', 'sulama_isim', 'bolge_isim', 'kurumAdi',
            'ciftlik_randi', 'iletim_randi', 'toplam_randi',
            'net_su_ihtiyaci', 'birim_su_tuketimi', 'urun_detaylari', 
            'olusturma_tarihi'
        ]
        read_only_fields = ['olusturma_tarihi']
    
    def get_toplam_randi(self, obj):
        return round(obj.get_toplam_randi(), 2)
    
    def get_net_su_ihtiyaci(self, obj):
        return round(obj.get_net_su_ihtiyaci(), 2)
    
    def get_birim_su_tuketimi(self, obj):
        toplam_alan = obj.get_toplam_alan()
        if toplam_alan > 0:
            return round(obj.get_toplam_su_tuketimi() / toplam_alan, 4)
        return None
    
    def get_urun_detaylari(self, obj):
        """Bu yıla ait tüm ürün detaylarını döndür"""
        detaylar = obj.urun_detaylari.all().select_related('urun')
        return YillikUrunDetaySerializer(detaylar, many=True).data


# Özet serializer'lar
class SulamaOzetSerializer(serializers.ModelSerializer):
    """Sulama özet serializer - liste görünümü için"""
    bolge_isim = serializers.CharField(source='bolge.isim', read_only=True)
    
    class Meta:
        model = Sulama
        fields = ['id', 'isim', 'bolge_isim', 'olusturma_tarihi']


class KanalOzetSerializer(serializers.ModelSerializer):
    """Kanal özet serializer"""
    depolama_tesisi_isim = serializers.CharField(source='depolama_tesisi.isim', read_only=True)
    
    class Meta:
        model = Kanal
        fields = ['id', 'isim', 'depolama_tesisi_isim', 'kanal_kodu']


class UrunOzetSerializer(serializers.ModelSerializer):
    """Ürün özet serializer"""
    sulama_isim = serializers.CharField(source='sulama.isim', read_only=True)
    
    class Meta:
        model = Urun
        fields = ['id', 'isim', 'sulama_isim'] 
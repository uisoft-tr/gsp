# DOĞRU HESAPLAMA MANTİĞİ - Django Backend

def standart_tablo_duzeltilmis(request):
    # ... diğer kodlar aynı ...
    
    # 12 AYLIK SİSTEM
    aylar_str = ["ocak", "subat", "mart", "nisan", "mayis", "haziran", 
                 "temmuz", "agustos", "eylul", "ekim", "kasim", "aralik"]
    aylar_goster = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
                    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]
    
    ay_sayisi = 12  # 7 değil, 12 olmalı
    
    # ... ürün işleme kodları aynı ...
    
    for i in range(16):
        # ... ürün seçimi kodları aynı ...
        
        # 12 AYLIK UR DEĞERLERİ
        ur = [0] * 12  # 7 değil, 12
        
        if urun_obj:
            ur = [(getattr(urun_obj, ay, 0) or 0) for ay in aylar_str]
        
        tablo.append({
            "urun_adi": urun_adi,
            "alan": alan,
            "ur": ur,
            "oran": 0,
            "ur_carpan": [0] * 12,  # 7 değil, 12
            "toplam_ur": sum(ur),
            "toplam_ur_carpan": 0
        })

    # ORAN VE ÇARPIMLAR (DOĞRU)
    for row in tablo:
        try:
            alan_f = float(row["alan"]) if row["alan"] else 0
        except ValueError:
            alan_f = 0
        oran = round((alan_f / toplam_alan * 100), 2) if toplam_alan > 0 else 0
        row["oran"] = oran
        # UR × Oran hesaplaması (doğru)
        row["ur_carpan"] = [round(val * oran / 100, 2) for val in row["ur"]]
        row["toplam_ur"] = round(sum(row["ur"]), 2)
        row["toplam_ur_carpan"] = round(sum(row["ur_carpan"]), 2)

    # AYLIK TOPLAMLAR (DOĞRU MANTİK)
    ay_toplamlari = [0] * 12
    for row in tablo:
        for j in range(12):
            ay_toplamlari[j] += row["ur_carpan"][j]
    
    # NET SU İHTİYACI (DİREKT m³, sonra hm³'e çevir)
    net_su_m3 = ay_toplamlari  # Direkt UR×Oran toplamları
    net_su_hm3 = [val / 1000 for val in net_su_m3]  # hm³'e çevir
    net_su_toplam = sum(net_su_hm3)
    
    # ÇİFTLİK SU İHTİYACI (DOĞRU FORMÜL)
    ciftlik_su_hm3 = [(val * 100) / ciftlik_randi for val in net_su_hm3]
    ciftlik_su_toplam = sum(ciftlik_su_hm3)
    
    # BRÜT SU İHTİYACI (DOĞRU FORMÜL)
    brut_su_hm3 = [(val * 100) / iletim_randi for val in ciftlik_su_hm3]
    brut_su_toplam = sum(brut_su_hm3)

    context = {
        # ... diğer veriler ...
        "ay_toplamlari": ay_toplamlari,  # UR×Oran toplamları
        "net_su": net_su_hm3,           # hm³ cinsinden
        "ciftlik_su": ciftlik_su_hm3,   # hm³ cinsinden  
        "brut_su": brut_su_hm3,         # hm³ cinsinden
        "net_su_toplam": net_su_toplam,
        "ciftlik_su_toplam": ciftlik_su_toplam,
        "brut_su_toplam": brut_su_toplam,
        "genel_toplam": sum(ay_toplamlari),  # UR×Oran genel toplam
        "toplam_alanlar": toplam_alan,
        "toplam_oran": sum(row["oran"] for row in tablo)
    }
    
    return render(request, "gsp/standart_tablo.html", context)

# EXCEL EXPORT DÜZELTMESİ
def export_standart_excel_duzeltilmis(request):
    # ... template yükleme aynı ...
    
    ay_sayisi = 12  # 7 değil!
    
    # ... ürün ve alan işleme aynı ...
    
    # HESAPLAMA DÜZELTMESİ
    ay_toplamlari_carpan = [0] * 12
    
    for i in range(16):
        alan = float(alanlar[i]) if alanlar[i] not in [None, ''] else 0
        oran = float(oranlar[i]) if oranlar[i] not in [None, ''] else 0
        ur_listesi = ur_degerleri[i]
        
        for j in range(12):  # 7 değil, 12!
            try:
                ur_val = float(ur_listesi[j]) if j < len(ur_listesi) and ur_listesi[j] not in [None, ''] else 0
            except Exception:
                ur_val = 0
            # UR × Oran hesaplaması
            ay_toplamlari_carpan[j] += ur_val * oran / 100

    # NET SU İHTİYACI (DOĞRU FORMÜL)
    net_su = [val / 1000 for val in ay_toplamlari_carpan]  # Direkt hm³'e çevir
    
    # ÇİFTLİK SU İHTİYACI (DOĞRU FORMÜL)
    ciftlik_su = [(val * 100) / ciftlik_randi for val in net_su]
    
    # BRÜT SU İHTİYACI (DOĞRU FORMÜL)  
    brut_su = [(val * 100) / iletim_randi for val in ciftlik_su]
    
    # ... Excel yazma işlemleri aynı ... 
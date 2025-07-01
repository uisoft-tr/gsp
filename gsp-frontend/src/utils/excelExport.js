import ExcelJS from 'exceljs';

// Helper: Ay kolonları (Nisan-Ekim örnek!)
const UR_COLUMNS = ['D', 'E', 'F', 'G', 'H', 'I', 'J']; // Gerekirse ay sayısına göre arttır
const UR_MONTH_INDEXES = [3,4,5,6,7,8,9]; // Nisan=3, Mayıs=4 ... Ekim=9 (örnek)

export const exportToExcelWithTemplate = async (data) => {
  // 1. Şablon dosyayı fetch et
  const response = await fetch('/Kitap1.xlsx'); // public klasöründe olmalı
  const arrayBuffer = await response.arrayBuffer();

  // 2. Workbook’u yükle
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  // 3. Çalışma sayfası
  const ws = workbook.worksheets[0];

  // 4. Değerleri uygun hücrelere yaz
  ws.getCell('B2').value = data.formData.sulama || '';         // Sadece id var, ismini çekmek istiyorsan ayrıca çek!
  ws.getCell('G2').value = data.formData.kurumAdi || '';
  ws.getCell('K2').value = data.formData.yil || '';

  // Ürünleri ekle (örnek: A7, A9, A11 ...)
  let excelRow = 7;

  // **Gelen tablo datasının yapısına göre düzelt!**
  data.tableData.forEach((row, idx) => {
    // Ürün adı (id'den label'ı bulmak için urunler listesinden çekebilirsin)
    let urunAdi = row.urun;
    if (data.urunler) {
      const urunObj = data.urunler.find(u => String(u.id) === String(row.urun));
      if (urunObj) urunAdi = urunObj.isim;
    }
    ws.getCell(`A${excelRow}`).value = urunAdi || '';
    ws.getCell(`B${excelRow}`).value = row.ekim_alani || '';
    ws.getCell(`C${excelRow}`).value = row.ekim_orani || '';

    // U-R değerleri Nisan-Ekim için
    if (Array.isArray(row.ur_values)) {
      UR_COLUMNS.forEach((col, i) => {
        // D:E:F:G:H:I:J (Nisan-Ekim)
        const urVal = row.ur_values[UR_MONTH_INDEXES[i]] || 0;
        ws.getCell(`${col}${excelRow}`).value = urVal;
        // Çarpan satırı (alt satır)
        ws.getCell(`${col}${excelRow + 1}`).value = (
          (parseFloat(urVal) || 0) * (parseFloat(row.ekim_orani) || 0) / 100
        ).toFixed(2);
      });
      // Toplam UR (üst satır) K sütunu
      const toplam_ur = row.ur_values
        .slice(UR_MONTH_INDEXES[0], UR_MONTH_INDEXES[UR_MONTH_INDEXES.length-1]+1)
        .reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
      ws.getCell(`K${excelRow}`).value = toplam_ur.toFixed(2);
      // Toplam UR x Oran (alt satır)
      ws.getCell(`K${excelRow+1}`).value = ((toplam_ur * (parseFloat(row.ekim_orani) || 0)) / 100).toFixed(2);
    }

    excelRow += 2; // Her ürün 2 satır
  });

  // Diğer alanlar örnek
  ws.getCell('B38').value = data.results.toplam_alan?.toFixed(2) || '';
  ws.getCell('C38').value = data.results.toplam_oran?.toFixed(2) || '';
  // ... diğer sonuçlar

  // 5. Dosyayı indir
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.formData.sulama || 'Rapor'}_${data.formData.yil}_Genel_Sulama_Planlaması.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

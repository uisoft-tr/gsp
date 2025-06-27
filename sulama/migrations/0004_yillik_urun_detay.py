# Generated manually for YillikUrunDetay model

from django.db import migrations, models
import django.db.models.deletion
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ('sulama', '0003_veri_temizleme'),
    ]

    operations = [
        migrations.CreateModel(
            name='YillikUrunDetay',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('alan', models.FloatField(validators=[django.core.validators.MinValueValidator(0)], verbose_name='Alan (ha)')),
                ('ekim_orani', models.FloatField(default=100, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)], verbose_name='Ekim Oranı (%)')),
                ('su_tuketimi', models.FloatField(validators=[django.core.validators.MinValueValidator(0)], verbose_name='Su Tüketimi (m³)')),
                ('olusturma_tarihi', models.DateTimeField(auto_now_add=True, verbose_name='Oluşturma Tarihi')),
                ('urun', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='yillik_urun_detaylari', to='sulama.urun', verbose_name='Ürün')),
                ('yillik_tuketim', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='urun_detaylari', to='sulama.yillikgenelsutuketimi', verbose_name='Yıllık Tüketim')),
            ],
            options={
                'verbose_name': 'Yıllık Ürün Detayı',
                'verbose_name_plural': 'Yıllık Ürün Detayları',
                'ordering': ['yillik_tuketim__yil', 'urun__isim'],
            },
        ),
        migrations.AlterUniqueTogether(
            name='yillikurundetay',
            unique_together={('yillik_tuketim', 'urun')},
        ),
    ] 
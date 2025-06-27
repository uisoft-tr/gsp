# Generated manually for unique constraint

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('sulama', '0006_temizlik'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='yillikgenelsutuketimi',
            options={'ordering': ['-yil', 'sulama__bolge__isim', 'sulama__isim'], 'verbose_name': 'Yıllık Genel Su Tüketimi', 'verbose_name_plural': 'Yıllık Genel Su Tüketimi'},
        ),
        migrations.RunSQL(
            "CREATE UNIQUE INDEX IF NOT EXISTS sulama_yillikgenelsutuketimi_yil_sulama_uniq ON sulama_yillikgenelsutuketimi (yil, sulama_id);",
            reverse_sql="DROP INDEX IF EXISTS sulama_yillikgenelsutuketimi_yil_sulama_uniq;"
        ),
    ] 
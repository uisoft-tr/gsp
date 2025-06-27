# Generated manually for cleanup

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('sulama', '0005_veri_tasima'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='yillikgenelsutuketimi',
            name='urun',
        ),
        migrations.RemoveField(
            model_name='yillikgenelsutuketimi',
            name='alan',
        ),
        migrations.RemoveField(
            model_name='yillikgenelsutuketimi',
            name='su_tuketimi',
        ),
    ] 
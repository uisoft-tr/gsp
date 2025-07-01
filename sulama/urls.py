from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import export_to_excel_with_template
from .views import (
    BolgeViewSet, SulamaViewSet, DepolamaTesisiViewSet, KanalViewSet,
    GunlukSebekeyeAlinanSuMiktariViewSet, GunlukDepolamaTesisiSuMiktariViewSet,
    UrunKategorisiViewSet, UrunViewSet, YillikGenelSuTuketimiViewSet, 
    YillikUrunDetayViewSet, DashboardViewSet
)

router = DefaultRouter()
#router.register(r'bolgeler', BolgeViewSet)
router.register(r'sulamalar', SulamaViewSet)
router.register(r'depolama-tesisleri', DepolamaTesisiViewSet)
router.register(r'kanallar', KanalViewSet)
router.register(r'gunluk-sebeke-su', GunlukSebekeyeAlinanSuMiktariViewSet)
router.register(r'gunluk-depolama-su', GunlukDepolamaTesisiSuMiktariViewSet)
router.register(r'urun-kategorileri', UrunKategorisiViewSet)
router.register(r'urunler', UrunViewSet)
router.register(r'yillik-tuketim', YillikGenelSuTuketimiViewSet)
router.register(r'yillik-urun-detay', YillikUrunDetayViewSet)
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    path("api/excel-export/", export_to_excel_with_template, name="excel_export_with_template"),
    path('', include(router.urls)),
]
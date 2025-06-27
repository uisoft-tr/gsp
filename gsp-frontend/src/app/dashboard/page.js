'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { sulamaAPI } from '@/utils/api';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

export default function DashboardPage() {
    const { token } = useAuth();
    const { success: showSuccessToast, error: showErrorToast } = useToast();
    
  const [loading, setLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(false);
    const [dashboardData, setDashboardData] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // Mevcut ay
    
    const currentYear = new Date().getFullYear();
    
    // Aylar listesi
    const months = [
        { no: 1, name: 'Ocak', short: 'Oca' },
        { no: 2, name: 'Şubat', short: 'Şub' },
        { no: 3, name: 'Mart', short: 'Mar' },
        { no: 4, name: 'Nisan', short: 'Nis' },
        { no: 5, name: 'Mayıs', short: 'May' },
        { no: 6, name: 'Haziran', short: 'Haz' },
        { no: 7, name: 'Temmuz', short: 'Tem' },
        { no: 8, name: 'Ağustos', short: 'Ağu' },
        { no: 9, name: 'Eylül', short: 'Eyl' },
        { no: 10, name: 'Ekim', short: 'Eki' },
        { no: 11, name: 'Kasım', short: 'Kas' },
        { no: 12, name: 'Aralık', short: 'Ara' }
    ];

    // Dashboard verilerini yükle
    const loadDashboardData = async () => {
        setDataLoading(true);
        try {
            const params = { yil: currentYear };
            
            const data = await sulamaAPI.getDashboardData(params);
            setDashboardData(data);
            console.log('Dashboard data:', data);
      } catch (error) {
            console.error('Dashboard verileri yüklenirken hata:', error);
            showErrorToast('Dashboard verileri yüklenemedi: ' + error.message);
            setDashboardData(null);
      } finally {
            setDataLoading(false);
        setLoading(false);
      }
    };

    useEffect(() => {
        if (token) {
            loadDashboardData();
        }
    }, [token]);

    // Su miktarını formatla
    const formatSuMiktari = (miktar) => {
        if (!miktar || miktar === 0) return '0';
        
        if (miktar >= 1000000) {
            return (miktar / 1000000).toFixed(2) + 'M m³';
        } else if (miktar >= 1000) {
            return (miktar / 1000).toFixed(1) + 'K m³';
        }
        return miktar.toFixed(0) + ' m³';
    };

    // Recharts için veri formatı
    const getChartData = () => {
        if (!dashboardData?.aylik_veriler) return [];
        
        return dashboardData.aylik_veriler.map(veri => ({
            ay: veri.ay.substring(0, 3),
            ay_no: veri.ay_no,
            'Şebekeye Verilen Su': veri.sebeke_su,
            'Depolama Tesisi Kapasitesi': veri.depolama_su,
            'Planlanan Su İhtiyacı': veri.tuketim_su, // Backend'den zaten m³ cinsinden geliyor
            sebeke_kayit: veri.sebeke_kayit_sayisi,
            depolama_kayit: veri.depolama_kayit_sayisi,
            tuketim_kayit: veri.tuketim_kayit_sayisi
        }));
    };

    // Custom tooltip için
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                    <p className="font-semibold text-gray-900 mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center text-sm">
                            <div 
                                className="w-3 h-3 rounded mr-2" 
                                style={{ backgroundColor: entry.color }}
                            ></div>
                            <span className="text-gray-700">
                                {entry.name}: {formatSuMiktari(entry.value)}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Bar tıklama eventi
    const handleBarClick = (data) => {
        if (data?.ay_no) {
            setSelectedMonth(data.ay_no);
        }
    };

    // Seçili ayın verilerini getir
    const getSelectedMonthData = () => {
        if (!dashboardData?.aylik_veriler) return null;
        return dashboardData.aylik_veriler.find(veri => veri.ay_no === selectedMonth);
  };

  if (loading) {
    return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-2xl shadow-2xl">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                    <h3 className="mt-6 text-xl font-semibold text-blue-900">Dashboard Yükleniyor...</h3>
                    <p className="mt-2 text-blue-600">Su kullanım verileri hazırlanıyor</p>
                </div>
      </div>
    );
  }

    const selectedMonthData = getSelectedMonthData();

  return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">


                {/* Ay Seçim Butonları */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
                    <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Ay Seçimi - {currentYear}</h2>
              </div>
                    
                    <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
                        {months.map((month) => (
                            <button
                                key={month.no}
                                onClick={() => setSelectedMonth(month.no)}
                                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                    selectedMonth === month.no
                                        ? 'bg-indigo-600 text-white shadow-md transform scale-105'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102'
                                }`}
                            >
                                {month.short}
                            </button>
                        ))}
              </div>
            </div>
            
                {/* Seçili Ay İstatistikleri */}
                {selectedMonthData && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Şebeke Su */}
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm font-medium">
                                        {months.find(m => m.no === selectedMonth)?.name} - Şebekeye Verilen Su
                                    </p>
                                    <p className="text-3xl font-bold mt-2">
                                        {formatSuMiktari(selectedMonthData.sebeke_su)}
                                    </p>
                                    <p className="text-blue-100 text-sm mt-1">
                                        {selectedMonthData.sebeke_kayit_sayisi} kayıt
                                    </p>
              </div>
                                <div className="w-16 h-16 bg-blue-400 rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                    </svg>
            </div>
          </div>
        </div>

                        {/* Depolama Tesisi */}
                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-sm font-medium">
                                        {months.find(m => m.no === selectedMonth)?.name} - Depolama Tesisi Kapasitesi
                                    </p>
                                    <p className="text-3xl font-bold mt-2">
                                        {formatSuMiktari(selectedMonthData.depolama_su)}
                                    </p>
                                    <p className="text-green-100 text-sm mt-1">
                                        {selectedMonthData.depolama_kayit_sayisi} kayıt
          </p>
        </div>
                                <div className="w-16 h-16 bg-green-400 rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                    </svg>
                                </div>
                  </div>
                </div>

                        {/* Tüketim Su */}
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm font-medium">
                                        {months.find(m => m.no === selectedMonth)?.name} - Planlanan Su İhtiyacı
                                    </p>
                                    <p className="text-3xl font-bold mt-2">
                                        {formatSuMiktari(selectedMonthData.tuketim_su)}
                                    </p>
                                    <p className="text-purple-100 text-sm mt-1">
                                        {selectedMonthData.tuketim_kayit_sayisi} kayıt
                                    </p>
                                </div>
                                <div className="w-16 h-16 bg-purple-400 rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                  </div>
                </div>
              </div>
                )}

                {/* Yıllık Grafik */}
                {dashboardData && (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
                        <div className="flex items-center mb-6">
                            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mr-4">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Yıllık Su Kullanım Karşılaştırması</h2>
        </div>

                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={getChartData()}
                                    margin={{
                                        top: 20,
                                        right: 30,
                                        left: 20,
                                        bottom: 5,
                                    }}
                                    onClick={handleBarClick}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis 
                                        dataKey="ay" 
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#6b7280' }}
                                    />
                                    <YAxis 
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#6b7280' }}
                                        tickFormatter={formatSuMiktari}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend 
                                        wrapperStyle={{ paddingTop: '20px' }}
                                        iconType="rect"
                                    />
                                    <Bar 
                                        dataKey="Şebekeye Verilen Su" 
                                        fill="#3b82f6"
                                        radius={[4, 4, 0, 0]}
                                        cursor="pointer"
                                    />
                                    <Bar 
                                        dataKey="Depolama Tesisi Kapasitesi" 
                                        fill="#10b981"
                                        radius={[4, 4, 0, 0]}
                                        cursor="pointer"
                                    />
                                    <Bar 
                                        dataKey="Planlanan Su İhtiyacı" 
                                        fill="#8b5cf6"
                                        radius={[4, 4, 0, 0]}
                                        cursor="pointer"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Su Yeterlilik Analizi */}
                {dashboardData?.istatistikler && (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
                        <div className="flex items-center mb-6">
                            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mr-4">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Su Yeterlilik Analizi</h2>
                            <div className="ml-auto">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    dashboardData.istatistikler.yeterlilik_durumu === 'Yeterli' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {dashboardData.istatistikler.yeterlilik_durumu}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {/* Güncel Depo Durumu */}
                            <div className="bg-blue-50 rounded-lg p-4">
                                <div className="flex items-center mb-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                                    <span className="text-sm font-medium text-gray-700">
                                        Güncel Depo Miktarı ({months.find(m => m.no === dashboardData.istatistikler.guncel_ay)?.name})
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-blue-600">
                                    {formatSuMiktari(dashboardData.istatistikler.guncel_depo_miktari)}
                                </p>
                            </div>

                            {/* Gelecek İhtiyaç */}
                            <div className="bg-orange-50 rounded-lg p-4">
                                <div className="flex items-center mb-2">
                                    <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                                    <span className="text-sm font-medium text-gray-700">Kalan Aylardaki İhtiyaç</span>
                                </div>
                                <p className="text-2xl font-bold text-orange-600">
                                    {formatSuMiktari(dashboardData.istatistikler.gelecek_ihtiyac)}
                                </p>
                            </div>

                            {/* Yeterlilik Oranı */}
                            <div className="bg-purple-50 rounded-lg p-4">
                                <div className="flex items-center mb-2">
                                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                                    <span className="text-sm font-medium text-gray-700">Yeterlilik Oranı</span>
                                </div>
                                <p className="text-2xl font-bold text-purple-600">
                                    %{dashboardData.istatistikler.yeterlilik_orani}
                                </p>
                            </div>

                            {/* Durum Göstergesi */}
                            <div className={`rounded-lg p-4 ${
                                dashboardData.istatistikler.yeterlilik_durumu === 'Yeterli' 
                                    ? 'bg-green-50' : 'bg-red-50'
                            }`}>
                                <div className="flex items-center mb-2">
                                    <div className={`w-3 h-3 rounded-full mr-2 ${
                                        dashboardData.istatistikler.yeterlilik_durumu === 'Yeterli' 
                                            ? 'bg-green-500' : 'bg-red-500'
                                    }`}></div>
                                    <span className="text-sm font-medium text-gray-700">Durum</span>
                                </div>
                                <p className={`text-lg font-bold ${
                                    dashboardData.istatistikler.yeterlilik_durumu === 'Yeterli' 
                                        ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {dashboardData.istatistikler.yeterlilik_durumu === 'Yeterli' 
                                        ? '✅ Yeterli' : '⚠️ Yetersiz'}
                                </p>
                            </div>
                        </div>

                        {/* Açıklama */}
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">
                                <strong>Analiz:</strong> Güncel ay ({months.find(m => m.no === dashboardData.istatistikler.guncel_ay)?.name}) 
                                depo miktarı ile kalan aylardaki planlanan su ihtiyacı karşılaştırılmıştır.
                                {dashboardData.istatistikler.yeterlilik_durumu === 'Yetersiz' && 
                                    ' Ek su kaynağı planlaması yapılması önerilir.'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Toplam İstatistikler */}
                {dashboardData && (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                        <div className="flex items-center mb-6">
                            <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center mr-4">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">{currentYear} Yılı Toplam İstatistikler</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-blue-50 rounded-lg p-4">
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                                    <span className="text-sm font-medium text-gray-700">Toplam Şebekeye Verilen Su</span>
                                </div>
                                <p className="text-2xl font-bold text-blue-600 mt-2">
                                    {formatSuMiktari(dashboardData.istatistikler?.toplam_sebeke_su || 0)}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {dashboardData.istatistikler?.toplam_sebeke_kayit || 0} kayıt
                                </p>
                            </div>

                            <div className="bg-green-50 rounded-lg p-4">
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                                    <span className="text-sm font-medium text-gray-700">Toplam Depolama Tesisi Kapasitesi</span>
                                </div>
                                <p className="text-2xl font-bold text-green-600 mt-2">
                                    {formatSuMiktari(dashboardData.istatistikler?.toplam_depolama_su || 0)}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {dashboardData.istatistikler?.toplam_depolama_kayit || 0} kayıt
                                </p>
              </div>

                            <div className="bg-purple-50 rounded-lg p-4">
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                                    <span className="text-sm font-medium text-gray-700">Toplam Planlanan Su İhtiyacı</span>
                                </div>
                                <p className="text-2xl font-bold text-purple-600 mt-2">
                                    {formatSuMiktari(dashboardData.istatistikler?.toplam_tuketim_su || 0)}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {dashboardData.istatistikler?.toplam_tuketim_kayit || 0} kayıt
                                </p>
                            </div>
                      </div>
                    </div>
                )}

                {/* Veri Bulunamadı */}
                {!dataLoading && !dashboardData && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-yellow-800 mb-2">Veri Bulunamadı</h3>
                        <p className="text-yellow-700">
                            {currentYear} yılına ait su kullanım verisi bulunamadı. 
                            Lütfen veri girişi yapın veya sistem yöneticisi ile iletişime geçin.
                        </p>
                    </div>
                )}
              </div>
    </div>
  );
} 
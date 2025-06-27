'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export default function ProfilePage() {
  const { user, updateUser, isAuthenticated } = useAuth();
  const toast = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginHistory, setLoginHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    username: user?.username || '',
  });

  // Şifre değiştirme formu
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Giriş geçmişini yükle
  useEffect(() => {
    if (isAuthenticated) {
      fetchLoginHistory();
    }
  }, [isAuthenticated]);

  const fetchLoginHistory = async () => {
    try {
      setLoadingHistory(true);
      
      const response = await fetch('http://localhost:8001/api/auth/login-history/', {
        method: 'GET',
        headers: {
          'Authorization': `Token ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLoginHistory(data.history || []);
      } else {
        console.error('Login history fetch failed');
      }
    } catch (error) {
      console.error('Login history error:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Yetkilendirme kontrol ediliyor...</h1>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);

      // API'ye profil güncelleme isteği
      const response = await fetch('http://localhost:8001/api/auth/profile/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Context'i güncelle
        updateUser(data.user);
        setIsEditing(false);
        toast.success('Profil başarıyla güncellendi');
      } else {
        throw new Error(data.message || 'Profil güncellenemedi');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Profil güncellenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Yeni şifreler eşleşmiyor');
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast.error('Yeni şifre en az 6 karakter olmalıdır');
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch('http://localhost:8001/api/auth/change-password/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: '',
        });
        setShowPasswordForm(false);
        toast.success('Şifre başarıyla değiştirildi');
      } else {
        throw new Error(data.message || 'Şifre değiştirilemedi');
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error(error.message || 'Şifre değiştirilirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      username: user?.username || '',
    });
    setIsEditing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Bilinmiyor';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Geçersiz tarih';
    }
  };

  const getStatusIcon = (success) => {
    if (success) {
      return (
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
      );
    } else {
      return (
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
      );
    }
  };

  return (
    <div className="py-6 bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
              Profil
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Hesap bilgilerinizi görüntüleyin ve düzenleyin.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol Kolon - Profil ve Şifre */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Info Card */}
            <Card padding="lg" shadow="md" className="bg-white">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {user?.first_name && user?.last_name 
                        ? `${user.first_name} ${user.last_name}`
                        : user?.first_name || user?.username || 'Kullanıcı'}
                    </h2>
                    <p className="text-gray-600">
                      {user?.is_superuser ? 'Süper Kullanıcı' : user?.is_staff ? 'Personel' : 'Kullanıcı'}
                    </p>
                  </div>
                </div>
                
                {!isEditing && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    className="border-primary-600 text-primary-600 hover:bg-primary-50"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Düzenle
                  </Button>
                )}
              </div>

              {/* Profile Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ad
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="Adınızı girin"
                    />
                  ) : (
                    <p className="text-gray-900 py-2 font-medium">{user?.first_name || 'Belirtilmemiş'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Soyad
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="Soyadınızı girin"
                    />
                  ) : (
                    <p className="text-gray-900 py-2 font-medium">{user?.last_name || 'Belirtilmemiş'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kullanıcı Adı
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="Kullanıcı adınızı girin"
                    />
                  ) : (
                    <p className="text-gray-900 py-2 font-medium">{user?.username || 'Belirtilmemiş'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-posta
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="E-posta adresinizi girin"
                    />
                  ) : (
                    <p className="text-gray-900 py-2 font-medium">{user?.email || 'Belirtilmemiş'}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isLoading}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    İptal
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    loading={isLoading}
                    disabled={isLoading}
                    className="bg-primary-600 hover:bg-primary-700 text-white"
                  >
                    Kaydet
                  </Button>
                </div>
              )}
            </Card>

            {/* Password Change Card */}
            <Card padding="lg" shadow="md" className="bg-white">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Şifre Değiştir</h3>
                  <p className="text-sm text-gray-600">Hesabınızın güvenliği için düzenli olarak şifrenizi değiştirin</p>
                </div>
                
                {!showPasswordForm && (
                  <Button
                    onClick={() => setShowPasswordForm(true)}
                    variant="outline"
                    className="border-primary-600 text-primary-600 hover:bg-primary-50"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Şifre Değiştir
                  </Button>
                )}
              </div>

              {showPasswordForm && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mevcut Şifre
                    </label>
                    <input
                      type="password"
                      name="current_password"
                      value={passwordData.current_password}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="Mevcut şifrenizi girin"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Yeni Şifre
                      </label>
                      <input
                        type="password"
                        name="new_password"
                        value={passwordData.new_password}
                        onChange={handlePasswordChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="Yeni şifrenizi girin"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Yeni Şifre (Tekrar)
                      </label>
                      <input
                        type="password"
                        name="confirm_password"
                        value={passwordData.confirm_password}
                        onChange={handlePasswordChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="Yeni şifrenizi tekrar girin"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordData({
                          current_password: '',
                          new_password: '',
                          confirm_password: '',
                        });
                      }}
                      disabled={isLoading}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      İptal
                    </Button>
                    <Button
                      onClick={handleChangePassword}
                      loading={isLoading}
                      disabled={isLoading}
                      className="bg-primary-600 hover:bg-primary-700 text-white"
                    >
                      Şifreyi Değiştir
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Sağ Kolon - Hesap Bilgileri ve Giriş Geçmişi */}
          <div className="space-y-6">
            {/* Account Info Card */}
            <Card padding="lg" shadow="md" className="bg-white">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hesap Bilgileri</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Kayıt Tarihi:</span>
                  <p className="text-gray-900 font-medium">
                    {formatDate(user?.date_joined)}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Son Giriş:</span>
                  <p className="text-gray-900 font-medium">
                    {formatDate(user?.last_login)}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Hesap Durumu:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-2">
                    Aktif
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Yetki Seviyesi:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 ml-2">
                    {user?.is_superuser ? 'Süper Kullanıcı' : user?.is_staff ? 'Personel' : 'Kullanıcı'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Login History Card */}
            <Card padding="lg" shadow="md" className="bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Giriş Geçmişi</h3>
                <Button
                  onClick={fetchLoginHistory}
                  variant="outline"
                  size="sm"
                  disabled={loadingHistory}
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Yenile
                </Button>
              </div>

              {loadingHistory ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Yükleniyor...</p>
                </div>
              ) : loginHistory.length > 0 ? (
                                 <div className="space-y-3">
                   {loginHistory.slice(0, 5).map((entry, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(entry.basarili)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(entry.tarih)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {entry.ip_adresi || 'Bilinmiyor'}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        entry.basarili 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {entry.basarili ? 'Başarılı' : 'Başarısız'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm text-gray-500">Henüz giriş geçmişi bulunmuyor</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Alert } from '../components/ui';
import { useTranslation } from '../i18n/index.jsx';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const ChangePassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError(t('changePassword.min'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('changePassword.mismatch'));
      return;
    }

    setSaving(true);
    try {
      const response = await api.post('/change-password', {
        currentPassword,
        newPassword
      });

      if (response?.data?.data) {
        localStorage.setItem('user', JSON.stringify(response.data.data));
      }
      localStorage.setItem('mustChangePassword', '0');
      window.dispatchEvent(new Event('pzwebadmin-auth-changed'));
      toast.success(t('changePassword.success'));
      navigate('/');
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-8">
      <Card>
        <h1 className="text-2xl font-bold mb-2">{t('changePassword.title')}</h1>
        <p className="text-muted mb-4">{t('changePassword.subtitle')}</p>

        {error && (
          <Alert variant="error" className="mb-4" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-semibold">{t('changePassword.current')}</label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-semibold">{t('changePassword.next')}</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-semibold">{t('changePassword.confirm')}</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <Button type="submit" variant="primary" disabled={saving || !currentPassword || !newPassword || !confirmPassword}>
            {t('changePassword.submit')}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default ChangePassword;

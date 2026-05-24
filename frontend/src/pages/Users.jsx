import { useEffect, useMemo, useState } from 'react';
import { Card, Button, Input, Alert } from '../components/ui';
import { useTranslation } from '../i18n/index.jsx';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const emptyCreate = {
  username: '',
  email: '',
  displayName: '',
  password: '',
  isAdmin: false,
  mustChangePassword: true
};

const Users = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  }, []);

  const isAdmin = Boolean(currentUser?.isAdmin);

  const fetchUsers = async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/users');
      setUsers(response.data?.data || []);
    } catch (requestError) {
      setError(requestError.response?.data?.error || t('users.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  const createUser = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await api.post('/users', createForm);
      toast.success(t('users.created'));
      setCreateForm(emptyCreate);
      await fetchUsers();
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message);
    }
  };

  const updateUserField = async (userId, field, value) => {
    const target = users.find((userItem) => userItem.id === userId);
    if (!target) return;

    const payload = {
      username: target.username,
      email: target.email || '',
      displayName: target.displayName || '',
      isAdmin: Boolean(target.isAdmin),
      mustChangePassword: Boolean(target.mustChangePassword),
      [field]: value
    };

    setError('');
    try {
      await api.put(`/users/${userId}`, payload);
      toast.success(t('users.updated'));
      await fetchUsers();
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message);
    }
  };

  const resetPassword = async (userId) => {
    const newPassword = window.prompt(t('users.askPass'));
    if (!newPassword) return;

    try {
      await api.post(`/users/${userId}/password`, {
        newPassword,
        mustChangePassword: true
      });
      toast.success(t('users.passUpdated'));
      await fetchUsers();
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <Card>
          <h1 className="text-2xl font-bold mb-2">{t('users.title')}</h1>
          <p className="text-muted">{t('users.noAccess')}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-3xl font-bold mb-1">{t('users.title')}</h1>
        <p className="text-muted">{t('users.subtitle')}</p>
      </Card>

      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card>
        <h2 className="text-xl font-bold mb-4">{t('users.createTitle')}</h2>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={createUser}>
          <Input
            value={createForm.username}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, username: event.target.value }))}
            placeholder={t('users.user')}
            required
          />
          <Input
            type="email"
            value={createForm.email}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder={t('users.email')}
            required
          />
          <Input
            value={createForm.displayName}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, displayName: event.target.value }))}
            placeholder={t('users.name')}
          />
          <Input
            type="password"
            value={createForm.password}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
            placeholder={t('users.password')}
            required
          />

          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={createForm.isAdmin}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, isAdmin: event.target.checked }))}
            />
            {t('users.admin')}
          </label>

          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={createForm.mustChangePassword}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, mustChangePassword: event.target.checked }))}
            />
            {t('users.mustChange')}
          </label>

          <div className="md:col-span-2">
            <Button type="submit" variant="primary" disabled={loading}>
              {t('users.create')}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="text-xl font-bold mb-4">{t('users.listTitle')}</h2>
        <div className="space-y-3">
          {users.map((userItem) => (
            <div key={userItem.id} className="border border-border rounded p-3 grid grid-cols-1 md:grid-cols-6 gap-2 items-center">
              <Input
                value={userItem.username}
                onChange={(event) => {
                  const value = event.target.value;
                  setUsers((prev) => prev.map((item) => item.id === userItem.id ? { ...item, username: value } : item));
                }}
                onBlur={(event) => updateUserField(userItem.id, 'username', event.target.value)}
              />
              <Input
                value={userItem.displayName || ''}
                onChange={(event) => {
                  const value = event.target.value;
                  setUsers((prev) => prev.map((item) => item.id === userItem.id ? { ...item, displayName: value } : item));
                }}
                onBlur={(event) => updateUserField(userItem.id, 'displayName', event.target.value)}
              />
              <Input
                type="email"
                value={userItem.email || ''}
                onChange={(event) => {
                  const value = event.target.value;
                  setUsers((prev) => prev.map((item) => item.id === userItem.id ? { ...item, email: value } : item));
                }}
                onBlur={(event) => updateUserField(userItem.id, 'email', event.target.value)}
              />

              <label className="inline-flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={Boolean(userItem.isAdmin)}
                  onChange={(event) => updateUserField(userItem.id, 'isAdmin', event.target.checked)}
                />
                {t('users.admin')}
              </label>

              <label className="inline-flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={Boolean(userItem.mustChangePassword)}
                  onChange={(event) => updateUserField(userItem.id, 'mustChangePassword', event.target.checked)}
                />
                {t('users.mustChange')}
              </label>

              <Button type="button" variant="secondary" onClick={() => resetPassword(userItem.id)}>
                {t('users.resetPass')}
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Users;

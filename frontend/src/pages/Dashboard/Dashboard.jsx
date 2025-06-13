import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../../services/auth';

import Layout from '../../components/Layout/Layout';
import Logs from './modules/Logs';
import IniEditor from './modules/IniEditor';
import Actions from './modules/Actions';
import ServerStatus from './modules/ServerStatus';
import Players from './modules/Players';
import Broadcast from './modules/Broadcast';

export default function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/');
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      window.location.href = '/';
    }
  }, []);

  return (
    <Layout>
      <ServerStatus />
      <Actions />
      <Broadcast />
      <Players />
      <Logs />
      <IniEditor />
    </Layout>
  );
}

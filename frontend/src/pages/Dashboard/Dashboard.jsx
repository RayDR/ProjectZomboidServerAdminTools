import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../../services/auth';

import Layout from '../../components/Layout/Layout';
import Logs from './modules/Logs';
import IniEditor from './modules/IniEditor';
import Actions from './modules/Actions';
import ServerStatus from './modules/ServerStatus';
import Players from './modules/Players';

export default function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/');
    }
  }, []);

  return (
    <Layout>
      <ServerStatus />
      <Actions />
      <Players />
      <Logs />
      <IniEditor />
    </Layout>
  );
}

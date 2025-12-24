#!/bin/bash
###############################################################################
# Script de compilación completo para PZWebAdmin
# Compila backend (TypeScript) y frontend (React/Vite)
###############################################################################

set -e

echo "🚀 Compilando PZWebAdmin..."
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 1. Compilar Backend
echo -e "${GREEN}[1/2] Compilando Backend (TypeScript)...${NC}"
cd /opt/pzwebadmin/backend
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend compilado exitosamente${NC}"
    # Copiar archivos de configuración JSON a dist/
    echo -e "${YELLOW}  → Copiando archivos de configuración...${NC}"
    mkdir -p dist/config
    cp -f src/config/instances.json dist/config/ 2>/dev/null || true
    echo -e "${GREEN}  ✓ Configuración copiada${NC}"
else
    echo -e "${RED}✗ Error compilando backend${NC}"
    exit 1
fi

echo ""

# 2. Compilar Frontend
echo -e "${GREEN}[2/2] Compilando Frontend (Vite/React)...${NC}"
cd /opt/pzwebadmin/frontend
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend compilado exitosamente${NC}"
else
    echo -e "${RED}✗ Error compilando frontend${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}   ✓ Compilación completada con éxito${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${YELLOW}Archivos generados:${NC}"
echo "  Backend:  /opt/pzwebadmin/backend/dist/"
echo "  Frontend: /opt/pzwebadmin/frontend/dist/"
echo ""
echo -e "${YELLOW}Para iniciar con PM2:${NC}"
echo "  pm2 start ecosystem.config.js"
echo "  pm2 save"
echo ""
